/* All paths resolve against the service worker scope, including GitHub Pages subdirectories. */
const CACHE_PREFIX = 'block-play-offline-' + encodeURIComponent(new URL(self.registration.scope).pathname) + '-';
const CACHE_NAME = CACHE_PREFIX + '20261008-v6';
const CORE = [
  './', './index.html', './style.css', './app.js', './patterns.js', './pwa.js',
  './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png',
  './icons/icon-maskable-512.png', './icons/apple-touch-icon.png'
].map(path => new URL(path, self.registration.scope).href);
const CORE_URLS = new Set(CORE);

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(CORE.map(url => new Request(url, { cache: 'reload' })));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    await Promise.all((await caches.keys())
      .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  const scope = new URL(self.registration.scope);
  if (request.method !== 'GET' || url.origin !== scope.origin || !url.href.startsWith(scope.href)) return;
  const cleanURL = new URL(url);
  cleanURL.search = '';
  const isNavigation = request.mode === 'navigate';
  if (!isNavigation && !CORE_URLS.has(cleanURL.href)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      const response = await fetch(request);
      if (response.ok && response.type !== 'opaque') {
        // Only cache this app's known files; route navigation has a single fallback.
        if (CORE_URLS.has(cleanURL.href)) await cache.put(cleanURL.href, response.clone());
        return response;
      }
      const saved = await cache.match(isNavigation ? new URL('./index.html', scope).href : cleanURL.href);
      return saved || response;
    } catch (error) {
      const saved = await cache.match(isNavigation ? new URL('./index.html', scope).href : cleanURL.href);
      return saved || new Response('暂时离线，请联网后再试。', {
        status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type !== 'CHECK_OFFLINE' || !event.ports[0]) return;
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const matches = await Promise.all(CORE.map(url => cache.match(url)));
    event.ports[0].postMessage({ version: '20261008-v6', offlineReady: matches.every(Boolean) });
  })());
});
