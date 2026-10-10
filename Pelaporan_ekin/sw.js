const CACHE = 'pelaporan-v2';
const FILES = ['./', 'index.html', 'config.js', 'standalone.js', 'backup.js', 'manifest.webmanifest', 'vendor/jspdf.umd.min.js', 'vendor/docx.umd.js', 'icons/icon-192.png', 'icons/icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
// Jaringan dulu (supaya pembaruan langsung terlihat), cache bila offline.
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if(e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.endsWith('backup.php')) return;
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request)));
});
