export async function onRequest(context) {
  const workerUrl = "https://frontend.saswataghatak70-06a.workers.dev";

  const incomingUrl = new URL(context.request.url);
  const targetUrl = new URL(workerUrl);

  targetUrl.pathname = incomingUrl.pathname;
  targetUrl.search = incomingUrl.search;

  const request = new Request(targetUrl.toString(), context.request);

  return fetch(request);
}