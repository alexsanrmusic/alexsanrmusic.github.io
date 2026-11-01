#!/usr/bin/env python3
"""Маленькие обложки для списков альбомов: images/thumbs/<имя>.jpg (176 px) и <имя>-360.jpg (360 px).

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
SIZES = (176, 360)  # 176: список альбомов (88 px, ретина); 360: плитки на главной (до ~190 px, ретина)
QUALITY = 82
OUT = ROOT / "images" / "thumbs"
MANIFEST = OUT / "manifest.json"


def thumb_path(cover: str, size: int = SIZES[0]) -> pathlib.Path:
    """176 -> <имя>.jpg (как раньше), остальные размеры -> <имя>-<размер>.jpg."""
    stem = pathlib.Path(cover).stem
    return OUT / (stem + ".jpg" if size == SIZES[0] else f"{stem}-{size}.jpg")


def fingerprint(src: pathlib.Path, size: int) -> str:
    """Хэш содержимого исходника + параметры миниатюры (поменяли размер/качество - пересоздадим)."""
    h = hashlib.sha256(src.read_bytes())
    h.update(f"|{size}|{QUALITY}".encode())
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
        src = ROOT / cover
        if not src.exists():
            print("нет файла:", cover, file=sys.stderr)
            continue
        im = None
        for size in SIZES:
            dst = thumb_path(cover, size)
            fp = fingerprint(src, size)
            if dst.exists() and manifest.get(dst.name) == fp:
                continue
            if im is None:
                im = Image.open(src).convert("RGB")
                w, h = im.size
                side = min(w, h)  # центральный квадрат, как object-fit: cover
                im = im.crop(((w - side) // 2, (h - side) // 2, (w + side) // 2, (h + side) // 2))
            im.resize((size, size), Image.LANCZOS).save(dst, "JPEG", quality=QUALITY, optimize=True, progressive=True)
            manifest[dst.name] = fp
            made += 1
            print(f"{cover} -> {dst.relative_to(ROOT)} ({dst.stat().st_size // 1024} KB)")
    new = json.dumps(manifest, ensure_ascii=False, indent=1, sort_keys=True) + "\n"
    if not MANIFEST.exists() or MANIFEST.read_text(encoding="utf-8") != new:
        MANIFEST.write_text(new, encoding="utf-8")
    print("Готово, создано:", made)


if __name__ == "__main__":
    main()
