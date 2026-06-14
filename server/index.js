import { createReadStream } from "node:fs";
import { createServer } from "node:http";
import { Readable, Transform } from "node:stream";
import { WritableStream, TransformStream } from "node:stream/web";
import { setTimeout } from "node:timers/promises";
import csvtojson from "csvtojson";
import { once } from "node:events";
const PORT = 3000;

createServer(async (request, response) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "*",
  };

  request.once("close", (_) =>
    console.log(`connection was closed! ${itemsCount}`),
  );
  let itemsCount = 0;

  response.writeHead(200, headers);

  try {
    await Readable.toWeb(createReadStream("./animeflv.csv"))
      .pipeThrough(Transform.toWeb(csvtojson()))
      .pipeThrough(
        new TransformStream({
          transform(chunk, controller) {
            const data = JSON.parse(Buffer.from(chunk));
            const mappedData = {
              title: data.title,
              description: data.description,
              url_anime: data.url_anime,
            };
            controller.enqueue(JSON.stringify(mappedData).concat("\n"));
          },
        }),
      )
      .pipeTo(
        new WritableStream({
          async write(chunk) {
            await setTimeout(100);
            itemsCount++;
            const canContinue = response.write(chunk);

            if (!canContinue) {
              await once(response, "drain");
            }
          },
          close() {
            response.end(`Foram lidos um total de ${itemsCount} chunks`);
          },
        }),
      );
  } catch (err) {
    console.error(err);
    response.destroy(err);
  }
})
  .listen(PORT)
  .on("listening", (_) =>
    console.log(`server is running at localhost:${PORT}`),
  );
