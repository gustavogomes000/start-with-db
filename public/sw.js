self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.keys().then((cacheNames) => Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName))))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)))),
      self.clients.claim(),
    ]).then(() =>
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        clients.forEach((client) => {
          const url = new URL(client.url);
          const validRoutes = ['/', '/login', '/admin', '/meu-painel'];
          if (!validRoutes.includes(url.pathname)) {
            client.navigate('/?__sw_cleanup=' + Date.now());
          } else if (!url.searchParams.has('__sw_cleanup')) {
            url.searchParams.set('__sw_cleanup', Date.now().toString());
            client.navigate(url.toString());
          }
        });
      })
    )
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
