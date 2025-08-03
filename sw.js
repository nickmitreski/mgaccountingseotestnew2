const CACHE_NAME = 'mg-accounting-v1.0';
const urlsToCache = [
  '/',
  '/css/style.css',
  '/css/bootstrap.min.css',
  '/js/jquery-3.2.1.js',
  '/js/bootstrap.min.js',
  '/images/logo-blue-white.png',
  '/images/cover2.jpg',
  '/images/favicon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
}); 