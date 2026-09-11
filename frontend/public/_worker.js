export default {
  async fetch(request) {
    const incomingUrl = new URL(request.url);

    const workerUrl = new URL(
      "https://agroassist-4sv.saswataghatak70-06a.workers.dev"
    );

    workerUrl.pathname = incomingUrl.pathname;
    workerUrl.search = incomingUrl.search;

    const proxyRequest = new Request(workerUrl.toString(), request);

    return fetch(proxyRequest);
  },
};