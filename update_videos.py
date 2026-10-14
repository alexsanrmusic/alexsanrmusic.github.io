import json, sys, time, urllib.request
import xml.etree.ElementTree as ET

URL = "https://www.youtube.com/feeds/videos.xml?playlist_id=UULFcxWasE5LwVCysRA5Dlv5IQ"
A = "{http://www.w3.org/2005/Atom}"
YT = "{http://www.youtube.com/xml/schemas/2015}"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
    "Accept": "application/atom+xml, application/xml, text/xml, */*",
    "Accept-Language": "uk,en;q=0.8",
}


def parse(xml_bytes, limit=4):
    root = ET.fromstring(xml_bytes)
    out = []
    for e in root.findall(A + "entry")[:limit]:
        out.append({
            "id": e.find(YT + "videoId").text,
            "title": e.find(A + "title").text,
            "published": e.find(A + "published").text,
        })
    return out


def fetch():
    last = None
    for attempt, pause in enumerate((0, 5, 15), start=1):
        if pause:
            time.sleep(pause)
        try:
            req = urllib.request.Request(URL, headers=HEADERS)
            return urllib.request.urlopen(req, timeout=30).read()
        except Exception as exc:
            last = exc
            print(f"Attempt {attempt} failed: {exc}")
    raise last


if __name__ == "__main__":
    try:
        if len(sys.argv) > 2:
            data = open(sys.argv[1], "rb").read()
        else:
            data = fetch()
        videos = parse(data)
        if not videos:
            raise ValueError("feed has no videos")
    except Exception as exc:
        # keep the previous videos.json, do not fail the workflow
        print(f"::warning::Could not update videos, keeping the old list: {exc}")
        sys.exit(0)
    with open("videos.json", "w", encoding="utf-8") as f:
        json.dump(videos, f, ensure_ascii=False, indent=2)
    print(f"Saved {len(videos)} videos")
