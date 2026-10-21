#!/usr/bin/env python3
"""Генерация страниц с текстами песен для alexsanrmusic.github.io.

Что читает:
  albums.json            список альбомов и треков
  lyrics/<папка>/*.txt   тексты (имя файла = название трека)
  albums.html            из его <style> берётся оформление

Папка с текстами: поле "lyrics_dir" альбома, а если его нет, то "id" альбома.

Что создаёт (всё перезаписывается при каждом запуске):
  songs/<id альбома>/<название-латиницей>.html   страница каждой песни
  lyrics.html                                     список всех текстов
  lyrics.json                                     тексты для блока под плеером
  site.css                                        общее оформление новых страниц
  favicon.png                                     иконка
  sitemap.xml                                     карта сайта

Запуск: python3 build_lyrics.py
"""
import base64
import html
import json
import re
import shutil
import subprocess
import unicodedata
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SITE = "https://alexsanrmusic.github.io"
OG_IMAGE = SITE + "/images/logo_and_name.jpg"
ARTIST = "Alex Sanr"

FLAGS = {"uk": "🇺🇦", "en": "🇬🇧", "ru": "🇷🇺"}
CODES = {"uk": "UA", "en": "EN", "ru": "RU"}
LANG_NAMES = {"uk": "Українська", "ru": "Російська", "en": "Англійська"}
LYRICS_WORD = {"uk": "текст пісні", "ru": "текст песни", "en": "lyrics"}


def e(s):
    return html.escape(str(s), quote=True)


def plural(n, one, few, many):
    """Українська множина: 1 текст, 2 тексти, 5 текстів."""
    if n % 10 == 1 and n % 100 != 11:
        return one
    if 2 <= n % 10 <= 4 and not 12 <= n % 100 <= 14:
        return few
    return many


# ---------- транслітерація для адрес ----------
COMMON = {
    "а": "a", "б": "b", "в": "v", "д": "d", "е": "e", "ё": "yo", "ж": "zh",
    "з": "z", "к": "k", "л": "l", "м": "m", "н": "n", "о": "o", "п": "p",
    "р": "r", "с": "s", "т": "t", "у": "u", "ф": "f", "х": "kh", "ц": "ts",
    "ч": "ch", "ш": "sh", "щ": "shch", "ю": "yu", "я": "ya", "э": "e",
    "і": "i", "ї": "yi", "є": "ye", "ґ": "g", "ы": "y",
}
BY_LANG = {
    "uk": {"г": "h", "и": "y", "й": "i"},
    "ru": {"г": "g", "и": "i", "й": "y"},
}
SKIP = set("'’ʼ`ьъ")


def slugify(title, lang):
    table = dict(COMMON)
    table.update(BY_LANG.get(lang, BY_LANG["ru"]))
    out = []
    for ch in title.lower():
        if ch in SKIP:
            continue
        out.append(table.get(ch, ch))
    s = re.sub(r"[^a-z0-9]+", "-", "".join(out)).strip("-")
    return s


def norm(s):
    s = unicodedata.normalize("NFC", s).lower()
    s = s.replace("’", "'").replace("ʼ", "'")
    return re.sub(r"[^\w]+", " ", s).strip()


def read_text(path):
    t = path.read_text(encoding="utf-8-sig")
    t = t.replace("\r\n", "\n").replace("\r", "\n")
    t = "\n".join(line.rstrip() for line in t.split("\n")).strip("\n")
    return re.sub(r"\n{3,}", "\n\n", t)


# ---------- общее оформление ----------
EXTRA_CSS = """
/* ===== Страницы текстов (создано build_lyrics.py) ===== */
.album { scroll-margin-top: 84px; }
.lib-list { list-style: none; margin: 0; padding: 0; border-top: 1px solid var(--line); }
.lib-album-actions { margin: 14px 0 12px; }
.lib-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; column-gap: 14px; padding: 6px 0; border-bottom: 1px solid var(--line); }
.lib-toggle { display: flex; align-items: center; gap: 12px; min-width: 0; padding: 8px 0; background: none; border: 0; color: inherit; font: inherit; text-align: left; cursor: pointer; }
.lib-toggle .num { flex: none; min-width: 2.4ch; color: var(--muted); }
.lib-title { flex: 1 1 auto; min-width: 0; overflow-wrap: anywhere; }
.lib-row.open .lib-title { color: var(--c1); }
.album.open .lib-toggle .chev { flex: none; width: 9px; height: 9px; margin-right: 4px; transform: rotate(45deg); }
.album.open .lib-row.open .lib-toggle .chev { transform: rotate(-135deg); }
.lib-actions { justify-self: end; }
.lib-row .pill-play, .lib-album-actions .pill-play { text-decoration: none; white-space: nowrap; }
a.pill-play:hover { background: var(--bg); border-color: var(--fg); }
.lib-text { grid-column: 1 / -1; padding: 4px 0 18px; }
.lib-text[hidden] { display: none; }
.lib-text .lyrics { margin: 0; padding: 0; border: 0; border-radius: 0; background: none; animation: none; }
.lib-text .lyrics-label { display: none; }
.lib-links { margin: 14px 0 0; font-size: 14px; }
.lib-links a { color: var(--muted); text-decoration: none; }
.lib-links a:hover { color: var(--fg); text-decoration: underline; text-underline-offset: 3px; }
.lib-nojs { color: var(--muted); }

.crumbs { display: flex; flex-wrap: wrap; gap: 6px 10px; color: var(--muted); font-size: 14px; margin-bottom: 18px; }
.crumbs a { text-decoration: none; }
.crumbs a:hover { color: var(--fg); }
.song-card { --c1: var(--accent); --c2: #ff8a5c; position: relative; padding: 28px 28px 32px; border: 1px solid color-mix(in srgb, var(--c1) 40%, var(--line)); border-radius: 22px; background: linear-gradient(135deg, color-mix(in srgb, var(--c1) 9%, var(--surface)), var(--surface) 55%); box-shadow: 0 18px 50px -26px var(--c1); animation: rise .55s cubic-bezier(.2,.7,.2,1) both; }
.song-card[data-lang="uk"] { --c1: #ffc83d; --c2: #5b8cff; }
.song-card[data-lang="en"] { --c1: #7fb2ff; --c2: #8a6bff; }
.song-card[data-lang="ru"] { --c1: #ff8a5c; --c2: #e8477a; }
.song-card h1 { margin-bottom: 14px; overflow-wrap: anywhere; }
.pill-share { background: transparent; color: var(--fg); border: 1.5px solid var(--muted); font: inherit; font-size: 14px; font-weight: 600; cursor: pointer; }
.pill-share:hover { border-color: var(--fg); }
.song-actions { display: flex; flex-wrap: wrap; gap: 10px; margin: 20px 0 6px; }
.song-card .lyrics { margin-top: 22px; animation: none; }
.song-card .lyrics-text { white-space: normal; font-size: 18px; line-height: 1.8; }
.song-card .lyrics-text p { margin: 0 0 1.2em; }
.song-card .lyrics-text p:last-child { margin-bottom: 0; }
.song-nav { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 20px 0 8px; }
.song-link { display: block; padding: 14px 16px; border: 1px solid var(--line); border-radius: 14px; background: var(--surface); text-decoration: none; transition: border-color .2s ease; }
.song-link:hover { border-color: var(--muted); }
.song-link small { display: block; color: var(--muted); font-size: 13px; }
.song-link.next { text-align: right; }
.song-more { color: var(--muted); font-size: 15px; }
.song-more a { color: var(--fg); }
@media (max-width: 600px) {
  .song-card { padding: 20px 18px 24px; }
  .song-card .lyrics-text { font-size: 17px; }
  .song-nav { grid-template-columns: 1fr; }
  .song-link.next { text-align: left; }
}
@media (prefers-reduced-motion: reduce) {
  .song-card { animation: none; }
}
"""


def build_css():
    src = (ROOT / "albums.html").read_text(encoding="utf-8")
    m = re.search(r"<style>(.*?)</style>", src, re.S)
    if not m:
        raise SystemExit("В albums.html не найден блок <style>")
    (ROOT / "site.css").write_text(m.group(1).strip() + "\n" + EXTRA_CSS, encoding="utf-8")
    f = re.search(r'<link rel="icon"[^>]*href="data:image/png;base64,([^"]+)"', src)
    if f:
        (ROOT / "favicon.png").write_bytes(base64.b64decode(f.group(1)))


# ---------- общие куски страниц ----------
def nav_html(rel, current):
    items = [("index.html", "Головна", "", "nav.home"), ("albums.html", "Альбоми", "albums", "nav.albums"), ("lyrics.html", "Тексти", "lyrics", "nav.lyrics")]
    links = []
    for href, label, key, i18n in items:
        cur = ' aria-current="page"' if key and key == current else ""
        links.append(f'      <a href="{rel}{href}"{cur} data-i18n="{i18n}">{label}</a>')
    return (
        "  <header>\n"
        f'    <a class="brand" href="{rel}index.html">ALEX SANR</a>\n'
        "    <nav>\n" + "\n".join(links) + "\n    </nav>\n  </header>\n"
    )


FOOTER = (
    "  <footer>\n"
    '    <span>© <span id="year">2026</span> Alex Sanr</span>\n'
    '    <a href="https://www.youtube.com/@alexsanrmusic" target="_blank" rel="noopener">youtube.com/@alexsanrmusic</a>\n'
    "  </footer>\n"
)
YEAR_JS = "<script>document.getElementById('year').textContent = new Date().getFullYear();</script>"


def page(rel, title, desc, path, body, extra_head="", extra_script="", og_image=None, html_attrs=""):
    url = SITE + "/" + path
    og_square = bool(og_image)
    og_image = og_image or OG_IMAGE
    og_size = '<meta property="og:image:width" content="600">\n<meta property="og:image:height" content="600">' if og_square else '<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">'
    tw_card = "summary" if og_square else "summary_large_image"
    return f"""<!doctype html>
<html lang="uk"{html_attrs}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script src="{rel}i18n.js"></script>
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<meta name="theme-color" content="#0b0f1f">
<link rel="canonical" href="{e(url)}">
<link rel="icon" type="image/png" href="{rel}favicon.png">
<meta property="og:type" content="website">
<meta property="og:site_name" content="{ARTIST}">
<meta property="og:locale" content="uk_UA">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:url" content="{e(url)}">
<meta property="og:image" content="{e(og_image)}">
{og_size}
<meta property="og:image:alt" content="{ARTIST} — AI-музичний проєкт з України">
<meta name="twitter:card" content="{tw_card}">
<meta name="twitter:image" content="{e(og_image)}">
<link rel="stylesheet" href="{rel}fonts/fonts.css">
<link rel="stylesheet" href="{rel}site.css">
<link rel="manifest" href="{rel}manifest.webmanifest">
<link rel="apple-touch-icon" href="{rel}icons/apple-touch-icon.png">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Alex Sanr">
<script src="{rel}pwa.js" defer></script>
{extra_head}</head>
<body>
<div class="wrap">
{body}
{FOOTER}</div>
{YEAR_JS}
{extra_script}</body>
</html>
"""


def badges(lang, extra=()):
    flag = FLAGS.get(lang, "")
    parts = [f'<span class="badge badge-lang">{flag + " " if flag else ""}<span data-i18n="lang.{e(lang)}">{e(LANG_NAMES.get(lang, lang))}</span></span>']
    parts += [x if str(x).startswith("<span") else f'<span class="badge">{e(x)}</span>' for x in extra]
    return '<span class="badges">' + "".join(parts) + "</span>"


def lyrics_paragraphs(text):
    paras = []
    for block in text.split("\n\n"):
        lines = [e(x) for x in block.split("\n")]
        paras.append("<p>" + "<br>\n".join(lines) + "</p>")
    return "\n".join(paras)


def listen_url(album, n):
    return f"albums.html?album={album['id']}&amp;track={n}"


# ---------- переводы одной песни (hreflang) ----------
def alternates_for(album, tr, built):
    """Те же песни на других языках: альбомы с одинаковым полем "group" в albums.json,
    трек сопоставляется по номеру в альбоме. Возвращает [(язык, адрес), ...] включая саму страницу."""
    group = album.get("group")
    if not group:
        return []
    res, langs = [], set()
    for a, found in built:
        if a.get("group") != group or a["lang"] in langs:
            continue
        for t in found:
            if t["n"] == tr["n"]:
                langs.add(a["lang"])
                res.append((a["lang"], f"{SITE}/songs/{a['id']}/{t['slug']}.html"))
                break
    return res if len(res) > 1 else []


# ---------- страница песни ----------
SHARE_JS = """<script>
(function () {
  var b = document.getElementById('share');
  if (!b) return;
  function done() { var label = b.textContent; b.textContent = I18N.t('song.copied'); setTimeout(function () { b.textContent = label; }, 2000); }
  b.addEventListener('click', function () {
    var data = { title: document.title, url: location.href.split('#')[0] };
    if (navigator.share) { navigator.share(data).catch(function () {}); return; }
    try { navigator.clipboard.writeText(data.url).then(done, function () { window.prompt('', data.url); }); }
    catch (e) { window.prompt('', data.url); }
  });
})();
</script>"""

def song_page(album, tr, prev, nxt, alternates=()):
    lang = album["lang"]
    word = LYRICS_WORD.get(lang, "lyrics")
    title = f"{tr['title']} — {word} | {ARTIST}"
    if lang == "ru":
        desc = f"Текст песни «{tr['title']}» — {ARTIST}, альбом «{album['title']}». Слушайте на сайте."
    elif lang == "en":
        desc = f"Lyrics of “{tr['title']}” by {ARTIST}, album “{album['title']}”. Listen on the site."
    else:
        desc = f"Текст пісні «{tr['title']}» — {ARTIST}, альбом «{album['title']}». Слухайте на сайті."
    path = f"songs/{album['id']}/{tr['slug']}.html"
    rel = "../../"
    cover = SITE + "/" + album["cover"] if album.get("cover") else None

    ld = {
        "@context": "https://schema.org",
        "@type": "MusicRecording",
        "name": tr["title"],
        "url": SITE + "/" + path,
        "inLanguage": lang,
        "image": cover or OG_IMAGE,
        "byArtist": {"@type": "MusicGroup", "name": ARTIST, "url": SITE + "/"},
        "inAlbum": {"@type": "MusicAlbum", "name": album["title"], "byArtist": {"@type": "MusicGroup", "name": ARTIST}},
        "recordingOf": {
            "@type": "MusicComposition",
            "name": tr["title"],
            "lyricist": {"@type": "Person", "name": ARTIST},
            "lyrics": {"@type": "CreativeWork", "inLanguage": lang, "text": tr["text"]},
        },
    }
    ld_json = json.dumps(ld, ensure_ascii=False).replace("</", "<\\/")
    extra_head = f'<script type="application/ld+json">{ld_json}</script>\n'
    if len(alternates) > 1:
        extra_head += "".join(f'<link rel="alternate" hreflang="{l}" href="{e(u)}">\n' for l, u in alternates)

    actions = f'<a class="pill pill-dl" href="{rel}{listen_url(album, tr["n"])}" data-i18n="track.play">♪ Слухати</a>'
    if tr.get("clip"):
        actions += f'\n      <a class="pill pill-clip" href="{e(tr["clip"])}" target="_blank" rel="noopener" data-i18n="track.clip">▶ Дивитись кліп</a>'

    actions += '\n      <button class="pill pill-share" type="button" id="share" data-i18n="song.share">↗ Поділитися</button>'

    nav_cards = ""
    if prev:
        nav_cards += f'<a class="song-link prev" href="{prev["slug"]}.html"><small data-i18n="song.prev">← Попередня пісня</small>{e(prev["title"])}</a>'
    else:
        nav_cards += "<span></span>"
    if nxt:
        nav_cards += f'<a class="song-link next" href="{nxt["slug"]}.html"><small data-i18n="song.next">Наступна пісня →</small>{e(nxt["title"])}</a>'

    body = nav_html(rel, "lyrics") + f"""
  <main>
    <nav class="crumbs" aria-label="Навігація" data-i18n-attr="aria-label:song.crumbs">
      <a href="{rel}lyrics.html" data-i18n="nav.lyrics">Тексти</a><span>/</span>
      <a href="{rel}lyrics.html#{e(album['id'])}">{e(album['title'])}</a>
    </nav>
    <article class="song-card" data-lang="{e(lang)}">
      <h1>{e(tr['title'])}</h1>
      {badges(lang, [album['title'], album.get('year', '')])}
      <div class="song-actions">
      {actions}
      </div>
      <section class="lyrics" aria-label="Текст пісні" data-i18n-attr="aria-label:lyrics.label">
        <span class="lyrics-label" data-i18n="lyrics.label">Текст пісні</span>
        <div class="lyrics-text" lang="{e(lang)}">
{lyrics_paragraphs(tr['text'])}
        </div>
      </section>
    </article>
    <div class="song-nav">{nav_cards}</div>
    <p class="song-more"><a href="{rel}lyrics.html" data-i18n="song.allLyrics">Усі тексти</a> · <a href="{rel}albums.html?album={e(album['id'])}" data-i18n="song.album" data-vars="{e(json.dumps({'a': album['title']}, ensure_ascii=False))}">Альбом «{e(album['title'])}»</a></p>
  </main>
"""
    return page(rel, title, desc, path, body, extra_head, SHARE_JS, cover)


# ---------- страница «Тексти» ----------
LIB_JS = """<script>
(function () {
  var lib = document.getElementById('lib');
  var chips = document.querySelectorAll('#filters .chip');
  var cards = lib.querySelectorAll('.album');
  var lyricsPromise = null;

  function getLyrics() {
    if (!lyricsPromise) {
      lyricsPromise = fetch('lyrics.json')
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .catch(function () { return {}; });
    }
    return lyricsPromise;
  }

  function setAlbum(card, open) {
    card.classList.toggle('open', open);
    card.querySelector('.album-head').setAttribute('aria-expanded', String(open));
    card.querySelector('.album-body').hidden = !open;
  }
  function openAlbum(card) {
    Array.prototype.forEach.call(lib.querySelectorAll('.album.open'), function (c) { if (c !== card) setAlbum(c, false); });
    setAlbum(card, true);
  }
  function setRow(row, open) {
    row.classList.toggle('open', open);
    row.querySelector('.lib-toggle').setAttribute('aria-expanded', String(open));
    var panel = row.querySelector('.lib-text');
    panel.hidden = !open;
    if (!open) return;
    var body = panel.querySelector('.lyrics-text');
    if (body.textContent) return;
    body.textContent = I18N.t('albums.loading');
    getLyrics().then(function (all) {
      var album = all[row.closest('.album').dataset.id];
      var text = album && album[row.dataset.key];
      if (text) { body.textContent = text; } else { body.textContent = ''; panel.querySelector('.lyrics').hidden = true; }
    });
  }

  Array.prototype.forEach.call(cards, function (card) {
    card.querySelector('.album-head').addEventListener('click', function () {
      if (card.classList.contains('open')) { setAlbum(card, false); return; }
      openAlbum(card);
      setTimeout(function () { card.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 30);
    });
    Array.prototype.forEach.call(card.querySelectorAll('.lib-row'), function (row) {
      row.querySelector('.lib-toggle').addEventListener('click', function () {
        setRow(row, !row.classList.contains('open'));
      });
    });
  });

  function applyLang(l) {
    Array.prototype.forEach.call(cards, function (c) { c.hidden = !(l === 'all' || c.dataset.lang === l); });
    Array.prototype.forEach.call(chips, function (x) { x.setAttribute('aria-pressed', String(x.dataset.lang === l)); });
  }
  Array.prototype.forEach.call(chips, function (b) { b.addEventListener('click', function () { applyLang(b.dataset.lang); }); });
  var q = new URLSearchParams(location.search).get('lang');
  if (q && document.querySelector('#filters .chip[data-lang="' + q.replace(/[^a-z]/g, '') + '"]')) applyLang(q);

  var h = decodeURIComponent(location.hash.slice(1));
  var target = h ? document.getElementById(h) : null;
  var card = target && target.closest('.album');
  if (card) {
    card.hidden = false;
    openAlbum(card);
    if (target.classList.contains('lib-row')) setRow(target, true);
    setTimeout(function () { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 80);
  }
})();
</script>
"""


def lyrics_page(lib):
    total = sum(len(a["tracks"]) for a in lib)
    langs = []
    for a in lib:
        if a["lang"] not in langs:
            langs.append(a["lang"])
    order = ["uk", "en", "ru"]
    langs.sort(key=lambda l: order.index(l) if l in order else len(order))

    filters = ""
    if len(langs) > 1:
        chips = ['<button type="button" class="chip" data-lang="all" aria-pressed="true">ALL</button>']
        for l in langs:
            chips.append(f'<button type="button" class="chip" data-lang="{l}" aria-pressed="false">{FLAGS.get(l, "")} {CODES.get(l, l.upper())}</button>')
        filters = (
            '    <div class="filters" id="filters" role="group" aria-label="Мова" data-i18n-attr="aria-label:filters.aria">\n'
            '      <span class="filters-label" data-i18n="filters.label">Мова пісень:</span>\n      ' + "\n      ".join(chips) + "\n    </div>\n"
        )

    cards, nojs = [], []
    for i, a in enumerate(lib):
        aid, lang = e(a["id"]), e(a["lang"])
        code = CODES.get(a["lang"], a["lang"].upper())
        if a.get("cover"):
            cover = f'<img src="{e(a["cover"])}" alt="" width="128" height="128" loading="lazy" onerror="this.replaceWith(document.createTextNode(\'{code}\'))">'
        else:
            cover = code
        rows = []
        for tr in a["tracks"]:
            song_url = f'songs/{aid}/{tr["slug"]}.html'
            rid = f'{aid}--{tr["slug"]}'
            nojs.append(f'<li><a href="{song_url}">{e(tr["title"])}</a> ({e(a["title"])})</li>')
            rows.append(f"""            <li class="lib-row" id="{rid}" data-key="{e(tr['title'])}">
              <button type="button" class="lib-toggle" aria-expanded="false" aria-controls="t-{rid}"><span class="num">{tr['n']}.</span><span class="lib-title" lang="{lang}">{e(tr['title'])}</span><span class="chev" aria-hidden="true"></span></button>
              <div class="lib-actions"><a class="pill pill-play" href="{listen_url(a, tr['n'])}" aria-label="Слухати: {e(tr['title'])}" data-i18n-attr="aria-label:track.playAria" data-vars="{e(json.dumps({'t': tr['title']}, ensure_ascii=False))}" data-i18n="track.play">♪ Слухати</a></div>
              <div class="lib-text" id="t-{rid}" hidden>
                <div class="lyrics"><span class="lyrics-label" data-i18n="lyrics.label">Текст пісні</span><p class="lyrics-text" lang="{lang}"></p><p class="lib-links"><a href="{song_url}" data-i18n="lyrics.songPage">Окрема сторінка пісні →</a></p></div>
              </div>
            </li>""")
        cards.append(f"""      <article class="album" id="{aid}" data-id="{aid}" data-lang="{lang}" style="--i:{i}">
        <button type="button" class="album-head" aria-expanded="false" aria-controls="b-{aid}">
          <span class="cover">{cover}</span>
          <span class="album-info">
            <span class="album-title">{e(a['title'])}</span>
            {badges(a['lang'], [a.get('year', ''), f'<span class="badge" data-i18n-count="texts" data-n="{len(a["tracks"])}">{len(a["tracks"])} {plural(len(a["tracks"]), "текст", "тексти", "текстів")}</span>'])}
          </span>
          <span class="chev" aria-hidden="true"></span>
        </button>
        <div class="album-body" id="b-{aid}" hidden>
          <div class="lib-album-actions"><a class="pill pill-play" href="albums.html?album={aid}" data-i18n="lyrics.listenAlbum">♪ Слухати альбом</a></div>
          <ol class="lib-list">
{chr(10).join(rows)}
          </ol>
        </div>
      </article>""")

    body = nav_html("", "lyrics") + f"""
  <main>
    <h1 data-i18n="lyrics.h1">Тексти</h1>
    <p class="lead" data-i18n="lyrics.lead">Тексти пісень Alex Sanr. Відкрийте альбом, а потім пісню, щоб прочитати текст, або одразу слухайте її на сторінці альбому.</p>
    <div class="stats"><span class="stat"><b>{total}</b> <span data-i18n-plural="texts" data-n="{total}">{plural(total, 'текст', 'тексти', 'текстів')}</span></span><span class="stat"><b>{len(lib)}</b> <span data-i18n-plural="albums" data-n="{len(lib)}">{plural(len(lib), 'альбом', 'альбоми', 'альбомів')}</span></span></div>
{filters}    <div id="lib">
{chr(10).join(cards)}
    </div>
    <noscript><p class="note" data-i18n="lyrics.noscript">Для читання текстів у списку потрібен JavaScript. Тексти є на окремих сторінках пісень:</p><ul class="lib-nojs">{''.join(nojs)}</ul></noscript>
  </main>
"""
    desc = "Тексти пісень Alex Sanr українською, англійською та російською. Читайте онлайн і слухайте пісні на сайті."
    return page("", "Тексти пісень — Alex Sanr", desc, "lyrics.html", body, "", LIB_JS, html_attrs=' data-i18n-title="lyrics.title" data-i18n-desc="lyrics.desc"')


# ---------- карта сайту ----------
def lastmod(url):
    """Дата последнего изменения файла из git (YYYY-MM-DD).
    Файл изменён, но ещё не закоммичен, или новый: сегодняшняя дата.
    Нет git или истории: дату не указываем."""
    rel = url[len(SITE):].lstrip("/") or "index.html"
    if not (ROOT / rel).exists():
        return None
    try:
        dirty = subprocess.run(["git", "status", "--porcelain", "--", rel], cwd=ROOT,
                               capture_output=True, text=True, check=True).stdout.strip()
        if dirty:
            return date.today().isoformat()
        out = subprocess.run(["git", "log", "-1", "--format=%cs", "--", rel], cwd=ROOT,
                             capture_output=True, text=True, check=True).stdout.strip()
        return out or None
    except (OSError, subprocess.CalledProcessError):
        return None


def sitemap(urls):
    rows = []
    for u in urls:
        lm = lastmod(u)
        tag = f"\n    <lastmod>{lm}</lastmod>" if lm else ""
        rows.append(f"  <url>\n    <loc>{e(u)}</loc>{tag}\n  </url>")
    return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "\n".join(rows) + "\n</urlset>\n"


def main():
    data = json.loads((ROOT / "albums.json").read_text(encoding="utf-8"))
    build_css()

    songs_dir = ROOT / "songs"
    if songs_dir.exists():
        shutil.rmtree(songs_dir)

    report, lib, lyrics_json, urls = [], [], {}, [SITE + "/", SITE + "/albums.html", SITE + "/lyrics.html", SITE + "/install.html"]
    lyric_dirs = {p.name for p in (ROOT / "lyrics").iterdir() if p.is_dir()} if (ROOT / "lyrics").is_dir() else set()
    used_dirs = set()
    built = []

    for a in data["albums"]:
        folder = a.get("lyrics_dir") or a["id"]
        d = ROOT / "lyrics" / folder
        files = {}
        if d.is_dir():
            used_dirs.add(folder)
            for f in sorted(d.glob("*.txt")):
                files[norm(f.stem)] = f
        found, slugs, matched_keys, missing = [], set(), set(), []
        for n, t in enumerate(a["tracks"], 1):
            key = norm(t["title"])
            f = files.get(key)
            text = read_text(f) if f else ""
            if not text:
                missing.append(t["title"])
                continue
            matched_keys.add(key)
            slug = slugify(t["title"], a["lang"]) or f"track-{n}"
            base, k = slug, 2
            while slug in slugs:
                slug, k = f"{base}-{k}", k + 1
            slugs.add(slug)
            found.append({"n": n, "title": t["title"], "slug": slug, "text": text, "clip": t.get("clip")})
        for key, f in files.items():
            if key not in matched_keys and key not in {norm(t["title"]) for t in a["tracks"]}:
                report.append(f"  файл без трека: lyrics/{folder}/{f.name}")
        if not d.is_dir():
            report.append(f"  {a['id']}: папки lyrics/{folder} пока нет (0 из {len(a['tracks'])} текстов)")
        elif missing:
            report.append(f"  {a['id']}: нет текста у {len(missing)} из {len(a['tracks'])}: " + "; ".join(missing))
        if not found:
            continue
        lib.append({**a, "tracks": found})
        lyrics_json[a["id"]] = {t["title"]: t["text"] for t in found}
        built.append((a, found))

    # страницы песен пишем после обхода всех альбомов: для hreflang нужны адреса переводов
    for a, found in built:
        for idx, tr in enumerate(found):
            prev = found[idx - 1] if idx > 0 else None
            nxt = found[idx + 1] if idx + 1 < len(found) else None
            out = songs_dir / a["id"] / f"{tr['slug']}.html"
            out.parent.mkdir(parents=True, exist_ok=True)
            out.write_text(song_page(a, tr, prev, nxt, alternates_for(a, tr, built)), encoding="utf-8")
            urls.append(f"{SITE}/songs/{a['id']}/{tr['slug']}.html")

    for name in sorted(lyric_dirs - used_dirs):
        report.append(f"  папка lyrics/{name} не привязана ни к одному альбому (проверьте id или lyrics_dir)")

    (ROOT / "lyrics.html").write_text(lyrics_page(lib), encoding="utf-8")
    (ROOT / "lyrics.json").write_text(json.dumps(lyrics_json, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    (ROOT / "sitemap.xml").write_text(sitemap(urls), encoding="utf-8")

    n_songs = sum(len(a["tracks"]) for a in lib)
    print(f"Готово: {n_songs} страниц песен, {len(lib)} альбомов с текстами.")
    if report:
        print("Замечания:")
        print("\n".join(report))


if __name__ == "__main__":
    main()
