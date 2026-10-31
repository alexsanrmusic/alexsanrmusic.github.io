#!/usr/bin/env python3
"""Маленькие обложки (176x176) для списков альбомов: images/thumbs/<имя>.jpg.

В списках обложка показывается размером 64-88 px, а исходники весят 140-370 КБ.
Берёт обложки из albums.json; уже готовые не пересоздаёт (если исходник не новее).
Нужен Pillow:  pip install pillow
Запуск из корня репозитория:  python3 tools/make_thumbs.py
"""
import json
import pathlib
import sys

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
SIZE = 176  # 2x для 88 px (ретина)
OUT = ROOT / "images" / "thumbs"


def thumb_path(cover: str) -> pathlib.Path:
    return OUT / (pathlib.Path(cover).stem + ".jpg")


def main():
    albums = json.loads((ROOT / "albums.json").read_text(encoding="utf-8"))["albums"]
    OUT.mkdir(parents=True, exist_ok=True)
    made = 0
    for cover in sorted({a["cover"] for a in albums if a.get("cover")}):
        src, dst = ROOT / cover, thumb_path(cover)
        if not src.exists():
            print("нет файла:", cover, file=sys.stderr)
            continue
        if dst.exists() and dst.stat().st_mtime >= src.stat().st_mtime:
            continue
        im = Image.open(src).convert("RGB")
        w, h = im.size
        side = min(w, h)  # центральный квадрат, как object-fit: cover
        im = im.crop(((w - side) // 2, (h - side) // 2, (w + side) // 2, (h + side) // 2))
        im.resize((SIZE, SIZE), Image.LANCZOS).save(dst, "JPEG", quality=82, optimize=True, progressive=True)
        made += 1
        print(f"{cover} -> {dst.relative_to(ROOT)} ({dst.stat().st_size // 1024} KB)")
    print("Готово, создано:", made)


if __name__ == "__main__":
    main()
