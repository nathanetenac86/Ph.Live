// Caches only the app itself (page, icons, hls.js). Streams, playlists and logos always go to the network.
const V = 'livetv-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
const HLS = 'https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.5.13/hls.min.js';

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(V)
      .then(c => Promise.allSettled([...SHELL.map(u => c.add(u)), c.add(new Request(HLS, { mode: 'no-cors' }))]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const own = new URL(r.url).origin === self.location.origin;
  if (!own && r.url !== HLS) return;
  // network first so updates show right away; cache is the offline fallback
  e.respondWith(
    fetch(r).then(res => {
      if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(V).then(c => c.put(r, copy)); }
      return res;
    }).catch(() => caches.match(r).then(m => m || caches.match('./index.html')))
  );
});
