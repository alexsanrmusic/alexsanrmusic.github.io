/* Alex Sanr — мінімальний service worker.
   Спочатку мережа (завжди свіжий сайт), кеш лише як запасний варіант без інтернету.
   Чужі запити (YouTube, Google Drive, шрифти) не чіпає. */
const CACHE = 'alexsanr-v4';
const SHELL = ['./', 'index.html', 'albums.html', 'lyrics.html', 'albums.json', 'lyrics.json', 'favicon.png', 'icons/icon-192.png', 'site.css', 'i18n.js', 'search.js', 'fonts/fonts.css', 'images/hero.jpg'];

self.addEventListener('install', (e) => {
  // каждый файл отдельно: если одного нет, остальные всё равно кэшируются
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(SHELL.map((u) => c.add(u).catch(() => {})))));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match('index.html')))
  );
});
