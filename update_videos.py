import json, sys, time, urllib.error, urllib.request
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


def latest_videos():
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
