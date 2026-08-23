const CACHE_NAME = 'singa-pen-public-v1';
const PUBLIC_ASSETS = ['/', '/manifest.webmanifest', '/icon.svg'];
const PUBLIC_API_ALLOWLIST = [
  '/api/v1/safety/guides',
  '/api/v1/safety/resources',
  '/api/v1/safety/official-resources',
  '/api/v1/public/site-content',
  '/api/v1/public/statistics'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PUBLIC_ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/uploads') || url.pathname.includes('/auth') || url.pathname.includes('/wellbeing') || url.pathname.includes('/icc') || url.pathname.includes('/admin') || url.pathname.includes('/students') || url.pathname.includes('/faculty')) return;

  const cacheableApi = PUBLIC_API_ALLOWLIST.some((path) => url.pathname.startsWith(path));
  const cacheableAsset = request.destination === 'document' || request.destination === 'script' || request.destination === 'style' || request.destination === 'font' || request.destination === 'image';
  if (!cacheableApi && !cacheableAsset) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
  );
});
