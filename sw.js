/* Pete's Notes service worker: keeps the app itself available offline. Notes live in IndexedDB and Supabase. */
const VERSION = 'petes-notes-v7';
const SHELL = ['./', 'index.html', 'styles.css?v=7', 'app.js?v=7', 'manifest.webmanifest', 'vendor/supabase.js', 'vendor/purify.min.js', 'vendor/jszip.min.js', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  // network first so updates arrive quickly, cache as the offline fallback
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: false }).then(r => r || caches.match('index.html'))));
});
