#!/usr/bin/env python3
"""Скачивает шрифты Onest и Unbounded с Google Fonts в папку fonts/ и пишет fonts/fonts.css.

Нужны только подмножества latin и cyrillic (в cyrillic есть украинские і ї є ґ).
Запускается GitHub Action'ом "Fetch fonts" (Actions -> Fetch fonts -> Run workflow),
у него есть доступ в интернет. Можно и вручную: python3 tools/fetch_fonts.py
"""
import hashlib
import re
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "fonts"
CSS_URL = ("https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600"
           "&family=Unbounded:wght@500;800&display=swap")
# Google отдаёт woff2 только современным браузерам
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
KEEP = {"latin", "cyrillic"}


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def parse(css):
    """[{subset, family, style, weight, url, range}, ...] из ответа Google Fonts."""
    out = []
    for m in re.finditer(r"/\*\s*([\w-]+)\s*\*/\s*@font-face\s*\{(.*?)\}", css, re.S):
        subset, body = m.group(1), m.group(2)
        if subset not in KEEP:
            continue

        def field(name):
            f = re.search(name + r"\s*:\s*([^;]+);", body)
            return f.group(1).strip() if f else None

        url = re.search(r"url\(([^)]+)\)", body)
        if not url:
            continue
        out.append({
            "subset": subset,
            "family": field("font-family").strip("'\""),
            "style": field("font-style") or "normal",
            "weight": field("font-weight"),
            "url": url.group(1).strip("'\""),
            "range": field("unicode-range"),
        })
    return out


def render(faces, names):
    blocks = []
    for f in faces:
        blocks.append(
            "@font-face {\n"
            f"  font-family: '{f['family']}';\n"
            f"  font-style: {f['style']};\n"
            f"  font-weight: {f['weight']};\n"
            "  font-display: swap;\n"
            f"  src: url({names[f['url']]}) format('woff2');\n"
            + (f"  unicode-range: {f['range']};\n" if f["range"] else "")
            + "}\n"
        )
    return "/* Создано tools/fetch_fonts.py: шрифты Onest и Unbounded (SIL OFL), latin + cyrillic */\n" + "\n".join(blocks)


def main():
    faces = parse(get(CSS_URL).decode("utf-8"))
    if not faces:
        sys.exit("В ответе Google Fonts не нашлось нужных @font-face")
    OUT.mkdir(exist_ok=True)
    for old in OUT.glob("*.woff2"):
        old.unlink()
    names = {}
    for f in faces:
        if f["url"] in names:
            continue
        name = f"{f['family'].lower()}-{f['subset']}-{hashlib.sha1(f['url'].encode()).hexdigest()[:6]}.woff2"
        (OUT / name).write_bytes(get(f["url"]))
        names[f["url"]] = name
    (OUT / "fonts.css").write_text(render(faces, names), encoding="utf-8")
    print(f"Готово: {len(names)} файлов шрифтов, {len(faces)} описаний @font-face")


if __name__ == "__main__":
    main()
