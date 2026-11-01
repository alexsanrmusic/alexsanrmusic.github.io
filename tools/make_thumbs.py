#!/usr/bin/env python3
"""Маленькие обложки (176x176) для списков альбомов: images/thumbs/<имя>.jpg.

В списках обложка показывается размером 64-88 px, а исходники весят 140-370 КБ.
Берёт обложки из albums.json. Нужно ли пересоздавать миниатюру, решает по хэшу СОДЕРЖИМОГО
исходника (images/thumbs/manifest.json), а не по времени файла: после чистого checkout в
GitHub Actions у всех файлов одинаковое время, и по mtime изменение обложки не заметить.
Нужен Pillow:  pip install pillow
Запуск из корня репозитория:  python3 tools/make_thumbs.py
"""
import hashlib
import json
import pathlib
import sys

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
SIZE = 176  # 2x для 88 px (ретина)
QUALITY = 82
OUT = ROOT / "images" / "thumbs"
MANIFEST = OUT / "manifest.json"


def thumb_path(cover: str) -> pathlib.Path:
    return OUT / (pathlib.Path(cover).stem + ".jpg")


def fingerprint(src: pathlib.Path) -> str:
    """Хэш содержимого исходника + параметры миниатюры (поменяли SIZE/QUALITY - пересоздадим всё)."""
    h = hashlib.sha256(src.read_bytes())
    h.update(f"|{SIZE}|{QUALITY}".encode())
    return h.hexdigest()


def main():
    albums = json.loads((ROOT / "albums.json").read_text(encoding="utf-8"))["albums"]
    OUT.mkdir(parents=True, exist_ok=True)
    try:
        manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        manifest = {}
    made = 0
    for cover in sorted({a["cover"] for a in albums if a.get("cover")}):
        src, dst = ROOT / cover, thumb_path(cover)
        if not src.exists():
            print("нет файла:", cover, file=sys.stderr)
            continue
        fp = fingerprint(src)
        if dst.exists() and manifest.get(dst.name) == fp:
            continue
        im = Image.open(src).convert("RGB")
        w, h = im.size
        side = min(w, h)  # центральный квадрат, как object-fit: cover
        im = im.crop(((w - side) // 2, (h - side) // 2, (w + side) // 2, (h + side) // 2))
        im.resize((SIZE, SIZE), Image.LANCZOS).save(dst, "JPEG", quality=QUALITY, optimize=True, progressive=True)
        manifest[dst.name] = fp
        made += 1
        print(f"{cover} -> {dst.relative_to(ROOT)} ({dst.stat().st_size // 1024} KB)")
    new = json.dumps(manifest, ensure_ascii=False, indent=1, sort_keys=True) + "\n"
    if not MANIFEST.exists() or MANIFEST.read_text(encoding="utf-8") != new:
        MANIFEST.write_text(new, encoding="utf-8")
    print("Готово, создано:", made)


if __name__ == "__main__":
    main()
