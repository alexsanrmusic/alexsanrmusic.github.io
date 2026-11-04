# Alex Sanr - сайт alexsanrmusic.github.io

Сайт на GitHub Pages. Страницы песен, альбомов, жанров и карта сайта собираются автоматически (GitHub Actions) - руками их не правят.

## Что где

| Файл / папка | Для чего |
|---|---|
| `albums.json` | список альбомов и треков (главный файл) |
| `genres.json` | жанры сайта и жанры каждого альбома и трека |
| `lyrics/<id альбома>/<название трека>.txt` | тексты песен |
| `images/` | обложки (миниатюры создаются сами в `images/thumbs/`) |
| `index.html`, `albums.html`, `links.html`, `install.html` | страницы, которые правятся вручную |
| `i18n.js` | переводы интерфейса (UA / RU / EN) |
| `songs/`, `albums/`, `genres/`, `lyrics.html`, `lyrics.json`, `genres-map.json`, `site.css`, `sitemap.xml` | **создаёт сборка, руками не править** |
| `videos.json`, `shorts.json`, `international.json`, `tg_*.json`, `line.json` | создают и обновляют боты |

## Добавить альбом

1. Положи обложку в `images/`, например `images/my-album.jpg`.
2. Добавь запись в конец списка `albums` в `albums.json`:
   ```json
   {
     "id": "my-album",
     "title": "My Album",
     "lang": "en",
     "year": 2026,
     "cover": "images/my-album.jpg",
     "tracks": [
       { "title": "Track one", "drive": "ID_файла_на_Google_Drive" }
     ]
   }
   ```
   - `id` - латиницей, без пробелов (станет адресом страницы).
   - `lang` - `uk`, `ru` или `en`.
   - `drive` - ID из ссылки на файл (между `/d/` и `/view`).
   - **Инструментальный альбом:** добавь `"instrumental": true`.
   - **Перевод того же альбома на другой язык:** у обоих альбомов одинаковое поле `"group"`.
3. Добавь альбом в `genres.json`, в блок `albums`:
   ```json
   "my-album": { "all": "Pop Rock, Indie Pop" }
   ```
   `all` - жанры всех треков. Если у отдельного трека другие жанры, добавь рядом `"tracks": { "Название трека": "Hip-Hop" }`. Для инструментального альбома: `{ "all": "Instrumental" }`.
4. Тексты (если есть): файлы `lyrics/my-album/<название трека>.txt`. Имя файла = название трека. Для инструментального альбома тексты не нужны.
5. Загрузи файлы в репозиторий. Сборка **Build lyrics pages** запустится сама (миниатюры, страницы, карта сайта, жанры).
6. Анонс в канал: Actions -> **Telegram** -> Run workflow -> режим `album`, поле id: `my-album`.

## Жанры

Жанры сайта перечислены в `genres.json`, в списке `genres` (порядок = порядок показа). В полях `all` и `tracks` пишутся обычные теги (`Pop Rock, Indie Pop`), сборка сама сводит их к жанрам сайта.

**Убрать жанр:**
1. Удали его блок из списка `genres` в `genres.json`.
2. Удали его тег (`<li>... genres/<id>.html ...</li>`) в `index.html` в блоке «Що на каналі».
3. Запусти **Build lyrics pages**.

**Переименовать жанр:** поменяй название и в `genres.json`, и в `i18n.js` (ключ `genre.<id>`), иначе на разных языках названия разойдутся.

## Что делают боты (GitHub Actions)

| Workflow | Когда | Что делает |
|---|---|---|
| Build lyrics pages | при изменении `albums.json`, `genres.json`, текстов, картинок | собирает страницы, миниатюры, карту сайта |
| Update videos | каждые 6 часов | обновляет `videos.json`, `shorts.json`, `international.json` |
| Telegram | каждые 6 часов и утром | постит новые видео и Shorts; «Рядок дня» утром (09:03 по Киеву зимой) |
| Fetch fonts | вручную | скачивает шрифты в `fonts/` |

Расписание GitHub иногда опаздывает. Если что-то не пришло, запусти нужный workflow вручную: **Actions -> выбрать workflow -> Run workflow**.

Секреты (Settings -> Secrets and variables -> Actions): `TG_BOT_TOKEN`, `TG_CHANNEL` (Telegram), `YT_API_KEY` (YouTube).

## Правила

- Не запускай `build_lyrics.py` у себя на компьютере и не загружай результат: сборке нужна история git, иначе пропадут даты в карте сайта. Всё собирается в Actions.
- После изменения списка файлов в `sw.js` (`SHELL`) увеличь номер `CACHE`.
- Плеер (`miniplayer.js` и блок плеера в `albums.html`) без необходимости не менять.
