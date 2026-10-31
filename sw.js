/* Alex Sanr — мінімальний service worker.
   Спочатку мережа (завжди свіжий сайт), кеш лише як запасний варіант без інтернету.
   Чужі запити (YouTube, Google Drive, шрифти) не чіпає. */
const CACHE = 'alexsanr-v6';
const SHELL = ['./', 'index.html', 'albums.html', 'lyrics.html', 'albums.json', 'lyrics.json', 'videos.json', 'shorts.json', 'international.json', 'favicon.png', 'icons/icon-192.png', 'site.css', 'i18n.js', 'miniplayer.js', 'search.js', 'fonts/fonts.css', 'images/hero.jpg'];

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
  const isPage = req.mode === 'navigate' || req.destination === 'document';
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(async () => {
        // Сторінка: показуємо збережену (мітки на кшталт ?ref=telegram не заважають),
        // а якщо її немає, то збережену головну.
        if (isPage) {
          return (await caches.match(req, { ignoreSearch: true }))
            || (await caches.match('index.html'))
            || Response.error();
        }
        // JS, CSS, JSON, зображення тощо: тільки збережений саме цей файл.
        // Підміняти відсутній ресурс HTML-сторінкою не можна: JSON.parse або <script> отримають сміття.
        return (await caches.match(req)) || Response.error();
      })
  );
});
