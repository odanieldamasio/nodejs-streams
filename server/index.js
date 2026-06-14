import { createReadStream } from 'node:fs';
import { createServer } from 'node:http';
import { Readable, Transform } from 'node:stream';
import { WritableStream, TransformStream } from 'node:stream/web';
import { setTimeout } from 'node:timers/promises'
import csvtojson from 'csvtojson';
const PORT = 3000;

createServer(async (request, response) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': '*'
    };

    request.once('close', _ => console.log(`connection was closed! ${itemsCount}`))
    let itemsCount = 0;
    Readable.toWeb(createReadStream('./animeflv.csv'))
        .pipeThrough(Transform.toWeb(csvtojson()))
        .pipeThrough( new TransformStream({
            transform(chunk, controller) {
                const data = JSON.parse(Buffer.from(chunk))
                const mappedData = {
                    title: data.title,
                    description: data.description,
                    url_anime: data.url_anime
                };
                controller.enqueue(JSON.stringify(mappedData).concat('\n'))
            }
        }))
        .pipeTo(new WritableStream({
            async write(chunk) {
                await setTimeout(1000);
                itemsCount ++;
                response.write(chunk);
            },
            close() {
                response.end(`Foram lidos um total de ${itemsCount} chunks`);
            }
        }));
    response.writeHead(200, headers);
})
.listen(PORT)
.on('listening', _ => console.log(`server is running at localhost:${PORT}`));