// Keep this at the old SW URL so cached preview installations can retire too.
self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const scope = new URL(self.registration.scope);
    const prefix = 'block-play-offline-' + encodeURIComponent(scope.pathname) + '-';
    await Promise.all((await caches.keys()).filter(key => key.startsWith(prefix)).map(key => caches.delete(key)));
    await self.clients.claim();
    const clients = await self.clients.matchAll({ type: 'window' });
    await self.registration.unregister();
    await Promise.all(clients.filter(client => client.url.startsWith(scope.href))
      .map(client => client.navigate(new URL('../block-play/', scope).href)));
  })());
});
