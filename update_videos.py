import json, sys, urllib.request
import xml.etree.ElementTree as ET

URL = "https://www.youtube.com/feeds/videos.xml?playlist_id=UULFcxWasE5LwVCysRA5Dlv5IQ"
A = "{http://www.w3.org/2005/Atom}"
YT = "{http://www.youtube.com/xml/schemas/2015}"

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

if __name__ == "__main__":
    if len(sys.argv) > 2:
        data = open(sys.argv[1], "rb").read()
    else:
        req = urllib.request.Request(URL, headers={"User-Agent": "Mozilla/5.0"})
        data = urllib.request.urlopen(req, timeout=30).read()
    videos = parse(data)
    if not videos:
        sys.exit("No videos found, keeping old file")
    with open("videos.json", "w", encoding="utf-8") as f:
        json.dump(videos, f, ensure_ascii=False, indent=2)
