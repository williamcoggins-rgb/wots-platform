// Self-destruct service worker: unregisters itself and purges all caches.
// Deployed to replace the old caching SW so existing users get a clean slate.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Delete every cache
      caches.keys().then((names) =>
        Promise.all(names.map((name) => caches.delete(name)))
      ),
      // Unregister this service worker
      self.registration.unregister(),
    ])
  );
  self.clients.claim();
});
