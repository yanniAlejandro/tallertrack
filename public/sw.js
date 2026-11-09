/*
 * Service worker de TallerTrack (sin dependencias).
 * - Estáticos de Next (/_next/static, iconos): cache-first (son inmutables).
 * - Navegación: network-first; si no hay red, la última copia o /offline.
 * - Nunca se cachean llamadas a Supabase, acciones (POST) ni el PDF del ticket.
 */
const VERSION = 'tallertrack-v1';
const OFFLINE = '/offline';

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches
      .open(VERSION)
      .then((c) => c.add(OFFLINE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((claves) =>
        Promise.all(claves.filter((k) => k !== VERSION).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (evento) => {
  const { request } = evento;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icon')) {
    evento.respondWith(
      caches.match(request).then(
        (guardada) =>
          guardada ||
          fetch(request).then((resp) => {
            const copia = resp.clone();
            caches.open(VERSION).then((c) => c.put(request, copia));
            return resp;
          }),
      ),
    );
    return;
  }

  if (request.mode === 'navigate') {
    evento.respondWith(
      fetch(request)
        .then((resp) => {
          if (resp.ok && !resp.redirected) {
            const copia = resp.clone();
            caches.open(VERSION).then((c) => c.put(request, copia));
          }
          return resp;
        })
        .catch(() => caches.match(request).then((g) => g || caches.match(OFFLINE))),
    );
  }
});
