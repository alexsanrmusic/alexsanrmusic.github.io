#!/usr/bin/env python3
"""Постинг в Telegram-канал с кнопками под постом (inline-кнопки).

Env: TG_BOT_TOKEN (токен от @BotFather), TG_CHANNEL (@username канала или -100...).
Бот должен быть админом канала с правом публикации.

  python3 telegram_post.py welcome            # приветственный пост с кнопками (потом закрепить)
  python3 telegram_post.py album tihi-momenty # пост про альбом из albums.json
  python3 telegram_post.py new-videos         # новые видео из videos.json/shorts.json/international.json
  python3 telegram_post.py ... --dry-run      # только показать, что отправится
"""
import json, os, sys, html, urllib.request, urllib.parse

SITE = "https://alexsanrmusic.github.io"
REF = "?ref=telegram"   # мітка: сайт розпізнає перехід із Telegram, а GoatCounter показує джерело
YT = "https://www.youtube.com/@alexsanrmusic"
IG = "https://www.instagram.com/alexsanrmusic"
TH = "https://www.threads.com/@alexsanrmusic"
FB = "https://www.facebook.com/share/1EBAjdqdBt/"
CHAT = "https://t.me/alexsanrmusic_group"
TT = "https://www.tiktok.com/@alexsanrmusic"
APP = "https://t.me/AlexSanrMusic_bot/music"
YTM = "https://music.youtube.com/@Alexsanrmusic"
STATE = "tg_sent.json"
DRY = "--dry-run" in sys.argv


def btn(text, url):
    return {"text": text, "url": url}


def api(method, payload):
    if DRY:
        print(method, json.dumps(payload, ensure_ascii=False, indent=1))
        return {"ok": True}
    token = os.environ["TG_BOT_TOKEN"]
    req = urllib.request.Request(
        f"https://api.telegram.org/bot{token}/{method}",
        data=json.dumps(payload).encode(), headers={"Content-Type": "application/json"})
    try:
        return json.load(urllib.request.urlopen(req, timeout=30))
    except urllib.error.HTTPError as e:
        sys.exit(f"Telegram error {e.code}: {e.read().decode()}")


def chat():
    return os.environ.get("TG_CHANNEL", "@alexsanrmusic")


def send_photo(photo, caption, rows):
    return api("sendPhoto", {"chat_id": chat(), "photo": photo, "caption": caption,
                             "parse_mode": "HTML", "reply_markup": {"inline_keyboard": rows}})


def send_text(text, rows):
    return api("sendMessage", {"chat_id": chat(), "text": text, "parse_mode": "HTML",
                               "link_preview_options": {"is_disabled": True},
                               "reply_markup": {"inline_keyboard": rows}})


def welcome():
    cap = ("👋 <b>Вітаю на каналі Alex Sanr!</b>\n\n"
           "Тут я ділюся піснями, текстами й тим, що стоїть за кожною піснею. "
           "Тексти та ідеї мої, звучання створюю разом зі штучним інтелектом.\n\n"
           "🎧 Почни з «Повернення з небуття»\n\n"
           "<i>Це Alex Sanr. Моє життя. Мої почуття. Моя музика.</i>")
    rows = [
        [btn("🚀 Відкрити додаток", APP)],
        [btn("🎧 Слухати на YouTube", YT)],
        [btn("💿 Альбоми", SITE + "/albums.html" + REF), btn("📝 Тексти", SITE + "/lyrics.html" + REF)],
        [btn("🎵 YouTube Music", YTM), btn("📱 TikTok", TT)],
        [btn("📸 Instagram", IG), btn("🧵 Threads", TH), btn("👍 Facebook", FB)],
        [btn("💬 Чат", CHAT), btn("🌐 Сайт", SITE + "/" + REF)],
    ]
    r = send_photo(SITE + "/images/tg-cover.png", cap, rows)
    mid = (r.get("result") or {}).get("message_id")
    if mid:  # закріпити без сповіщення (боту потрібне право закріплювати/редагувати повідомлення)
        api("pinChatMessage", {"chat_id": chat(), "message_id": mid, "disable_notification": True})


def album(aid):
    d = json.load(open("albums.json", encoding="utf-8"))["albums"]
    a = next((x for x in d if x["id"] == aid), None)
    if not a:
        sys.exit("Альбом не знайдено: " + aid)
    names = [t["title"] for t in a["tracks"]]
    cap = (f"💿 <b>{html.escape(a['title'])}</b>\n"
           f"{len(names)} треків · {a['year']}\n\n"
           + "\n".join(f"{i}. {html.escape(n)}" for i, n in enumerate(names, 1))
           + "\n\n<i>Alex Sanr</i>")
    rows = [[btn("▶️ Слухати", f"{SITE}/albums.html?album={aid}&ref=telegram"), btn("📝 Тексти", f"{SITE}/lyrics.html{REF}#{aid}")],
            [btn("🚀 Відкрити додаток", APP), btn("🎧 YouTube", YT)]]
    send_photo(f"{SITE}/{a['cover']}", cap, rows)


def new_videos():
    sources = [("videos.json", "🎬 Нове відео", YT + "/videos"),
               ("shorts.json", "⚡ Новий Short", YT + "/shorts"),
               ("international.json", "🌍 New video (EN)", "https://www.youtube.com/@Alexsanrinternational")]
    items = []
    for f, label, more in sources:
        try:
            for v in json.load(open(f, encoding="utf-8")):
                items.append((v["published"], v, label, more, "shorts" if f == "shorts.json" else "watch"))
        except FileNotFoundError:
            pass
    first_run = not os.path.exists(STATE)
    sent = set() if first_run else set(json.load(open(STATE)))
    if first_run and not DRY:  # не спамити старим: просто запам'ятати наявне
        json.dump([v["id"] for _, v, *_ in items], open(STATE, "w"))
        print("Перший запуск: наявні відео позначено як надіслані.")
        return
    for _, v, label, more, kind in sorted(items, key=lambda x: x[0]):
        if v["id"] in sent:
            continue
        url = (f"https://www.youtube.com/shorts/{v['id']}" if kind == "shorts"
               else f"https://www.youtube.com/watch?v={v['id']}")
        cap = f"{label}\n\n<b>{html.escape(v['title'].strip())}</b>"
        rows = [[btn("▶️ Дивитись", url)], [btn("🌐 Усі пісні й тексти", SITE + "/" + REF), btn("➕ Ще", more)]]
        send_photo(f"https://i.ytimg.com/vi/{v['id']}/hqdefault.jpg", cap, rows)
        sent.add(v["id"])
    if not DRY:
        json.dump(sorted(sent), open(STATE, "w"))


if __name__ == "__main__":
    args = [a.strip().lower() if i == 0 else a.strip() for i, a in enumerate(a for a in sys.argv[1:] if not a.startswith("--"))]
    if not args:
        sys.exit(__doc__)
    {"welcome": welcome, "new-videos": new_videos}.get(args[0], lambda: album(args[1]) if args[0] == "album" and len(args) > 1 else sys.exit(__doc__))()
