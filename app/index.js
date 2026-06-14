const API_URL = "http://localhost:3000";

async function fetchAPI(signal) {
  const response = await fetch(API_URL, {
    signal,
  });

  let counter = 0;
  const reader = response.body
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(parseNDJSON());
  // .pipeTo(new WritableStream({
  //     write(chunk) {
  //         console.log(++counter, 'chunk', chunk)
  //     }
  // }))
  return reader;
}

const appendToHTML = (element) => {
  return new WritableStream({
    write({ title, description, url_anime }) {
      const card = `
        <article class="bg-white border border-zinc-200 hover:border-zinc-300 transition-colors">

            <div class="p-5">

                <div class="flex items-center justify-between mb-4">

                    <span class="text-xs uppercase tracking-wide text-zinc-500">
                        Anime
                    </span>

                    <span class="text-xs text-zinc-400">
                        Novo
                    </span>

                </div>

                <h3 class="text-lg font-medium mb-2 line-clamp-2">
                    ${title}
                </h3>

                <p class="text-sm leading-6 text-zinc-600 mb-4 line-clamp-4">
                    ${description}
                </p>

                <a
                    href="${url_anime}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-sm font-medium text-zinc-900 hover:text-zinc-600">
                    Ver detalhes →
                </a>

            </div>

        </article>
    `;
      element.innerHTML += card;
    },
  });
};

const parseNDJSON = () => {
  let ndjsonBuffer = "";
  return new TransformStream({
    transform(chunk, controller) {
      ndjsonBuffer += chunk;
      const items = ndjsonBuffer.split("\n");
      items
        .slice(0, -1)
        .forEach((item) => controller.enqueue(JSON.parse(item)));

      ndjsonBuffer = items[items.length - 1];
    },
    flush(controller) {
      if (!ndjsonBuffer) return;
      controller.enqueue(JSON.parse(ndjsonBuffer));
    },
  });
};

const [start, stop, cards] = ["start", "stop", "cards"].map((item) =>
  document.getElementById(item),
);

let abortController = new AbortController();
start.addEventListener("click", async () => {
  const readable = await fetchAPI(abortController.signal);
  readable.pipeTo(appendToHTML(cards));
});

stop.addEventListener("click", () => {
  abortController.abort();
  console.log("aborting...");
  abortController = new AbortController();
});
