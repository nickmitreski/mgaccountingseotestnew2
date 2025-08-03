const CACHE_NAME = 'mg-accounting-v1.1';
const urlsToCache = [
  '/',
  '/css/style.css',
  '/css/bootstrap.min.css',
  '/js/jquery-3.2.1.js',
  '/images/logo-blue-white.png',
  '/images/cover2.jpg',
  '/images/favicon.png'
];

// Cache strategy: Network first, then cache
const networkFirstStrategy = async (request) => {
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse;
  }
};

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Use network first strategy for critical resources
  if (event.request.url.includes('/css/') || event.request.url.includes('/js/') || event.request.url.includes('/images/')) {
    event.respondWith(networkFirstStrategy(event.request));
  } else {
    // Cache first for other resources
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            return response;
          }
          return fetch(event.request);
        })
    );
  }
}); 