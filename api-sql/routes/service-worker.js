const CACHE_NAME = "pwa-cache-v1";
const urlsToCache = [
  "/",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css",
  "https://ajax.googleapis.com/ajax/libs/jquery/3.6.4/jquery.min.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return new Response('Offline o error en la red', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      });
    })
  );
});
