import json, os, sys, time, urllib.error, urllib.parse, urllib.request
import xml.etree.ElementTree as ET

CHANNEL_ID = "UCcxWasE5LwVCysRA5Dlv5IQ"
# 1) playlist of long videos (no Shorts); 2) fallback: whole channel feed, Shorts are filtered out
FEEDS = [
    "https://www.youtube.com/feeds/videos.xml?playlist_id=UULF" + CHANNEL_ID[2:],
    "https://www.youtube.com/feeds/videos.xml?channel_id=" + CHANNEL_ID,
]
LIMIT = 4
A = "{http://www.w3.org/2005/Atom}"
YT = "{http://www.youtube.com/xml/schemas/2015}"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
    "Accept": "application/atom+xml, application/xml, text/xml, */*",
    "Accept-Language": "uk,en;q=0.8",
}


def parse(xml_bytes, limit=LIMIT):
    root = ET.fromstring(xml_bytes)
    out = []
    for e in root.findall(A + "entry")[:limit]:
        out.append({
            "id": e.find(YT + "videoId").text,
            "title": e.find(A + "title").text,
            "published": e.find(A + "published").text,
        })
    return out


def fetch(url):
    for attempt, pause in enumerate((0, 3, 8), start=1):
        if pause:
            time.sleep(pause)
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            return urllib.request.urlopen(req, timeout=30).read()
        except Exception as exc:
            print(f"Attempt {attempt} failed for {url}: {exc}")
    return None


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None


def is_short(video_id):
    """YouTube answers 200 on /shorts/ID for Shorts and redirects for normal videos."""
    opener = urllib.request.build_opener(_NoRedirect)
    req = urllib.request.Request(
        "https://www.youtube.com/shorts/" + video_id, headers=HEADERS, method="HEAD")
    try:
        return opener.open(req, timeout=15).status == 200
    except Exception:
        return False


API_URL = "https://www.googleapis.com/youtube/v3/playlistItems"


def api_playlist(playlist_id, key, max_results):
    query = urllib.parse.urlencode({
        "part": "snippet,contentDetails",
        "playlistId": playlist_id,
        "maxResults": max_results,
        "key": key,
    })
    req = urllib.request.Request(API_URL + "?" + query, headers=HEADERS)
    data = json.loads(urllib.request.urlopen(req, timeout=30).read().decode("utf-8"))
    out = []
    for item in data.get("items", []):
        cd = item.get("contentDetails", {})
        sn = item.get("snippet", {})
        vid = cd.get("videoId")
        if not vid or sn.get("title") in ("Private video", "Deleted video"):
            continue
        out.append({
            "id": vid,
            "title": sn.get("title", ""),
            "published": cd.get("videoPublishedAt") or sn.get("publishedAt", ""),
        })
    return out


def latest_from_api(key):
    """Official API: first the long-video playlist (UULF), then all uploads (UU) without Shorts."""
    try:
        videos = api_playlist("UULF" + CHANNEL_ID[2:], key, LIMIT)
        if videos:
            return videos
    except Exception as exc:
        print(f"API playlist UULF failed: {exc}")
    try:
        videos = api_playlist("UU" + CHANNEL_ID[2:], key, 15)
        return [v for v in videos if not is_short(v["id"])][:LIMIT]
    except Exception as exc:
        print(f"API uploads playlist failed: {exc}")
    return []


def latest_videos():
    key = os.environ.get("YT_API_KEY", "").strip()
    if key:
        videos = latest_from_api(key)
        if videos:
            return videos
        print("API gave nothing, trying RSS feeds")
    for url in FEEDS:
        data = fetch(url)
        if data is None:
            continue
        try:
            if "channel_id=" in url:
                videos = [v for v in parse(data, 15) if not is_short(v["id"])][:LIMIT]
            else:
                videos = parse(data)
        except Exception as exc:
            print(f"Could not read feed {url}: {exc}")
            continue
        if videos:
            return videos
    return []


if __name__ == "__main__":
    videos = latest_videos()
    if not videos:
        # keep the previous videos.json, do not fail the workflow
        print("::warning::Could not update videos, keeping the old list")
        sys.exit(0)
    with open("videos.json", "w", encoding="utf-8") as f:
        json.dump(videos, f, ensure_ascii=False, indent=2)
    print(f"Saved {len(videos)} videos")
