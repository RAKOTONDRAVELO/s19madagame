const CACHE_NAME = 's19-cache-v1';
const ASSETS = [
  '/', '/index.html', '/style.css', '/script.js', '/manifest.json'
];
self.addEventListener('install', evt=>{
  evt.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', evt=>{
  evt.waitUntil(clients.claim());
});
self.addEventListener('fetch', evt=>{
  evt.respondWith(caches.match(evt.request).then(r=> r || fetch(evt.request)));
});
