#!/usr/bin/env python3
"""
Behavior + resource paketini tek bir .mcaddon dosyasinda toplar.
Kullanim:  python3 tools/build.py
Cikti:     dist/MobUretici.mcaddon
"""
import json
import os
import sys
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PACKS = [
    ("behavior_packs/mob_generator_bp", "mob_generator_bp"),
    ("resource_packs/mob_generator_rp", "mob_generator_rp"),
]
OUT = os.path.join(ROOT, "dist", "MobUretici.mcaddon")
SKIP_NAMES = {".DS_Store", "Thumbs.db"}


def check_json():
    """Paketlemeden once tum JSON dosyalarini dogrula."""
    bad = []
    for src, _ in PACKS:
        for base, _dirs, files in os.walk(os.path.join(ROOT, src)):
            for name in files:
                if not name.endswith(".json"):
                    continue
                path = os.path.join(base, name)
                try:
                    with open(path, encoding="utf-8") as fh:
                        json.load(fh)
                except Exception as exc:  # noqa: BLE001
                    bad.append(f"{os.path.relpath(path, ROOT)}: {exc}")
    return bad


def main():
    errors = check_json()
    if errors:
        print("JSON hatasi:")
        for e in errors:
            print("  -", e)
        return 1

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    total = 0
    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as zf:
        for src, dest in PACKS:
            root = os.path.join(ROOT, src)
            if not os.path.isdir(root):
                print(f"eksik klasor: {src}")
                return 1
            for base, _dirs, files in os.walk(root):
                for name in sorted(files):
                    if name in SKIP_NAMES:
                        continue
                    path = os.path.join(base, name)
                    arc = os.path.join(dest, os.path.relpath(path, root)).replace(os.sep, "/")
                    zf.write(path, arc)
                    total += 1

    size = os.path.getsize(OUT) / 1024
    print(f"olusturuldu: {os.path.relpath(OUT, ROOT)}  ({total} dosya, {size:.1f} KB)")
    print("Dosyaya cift tiklayarak (veya Dosyalar uygulamasindan acarak) Minecraft'a aktarabilirsin.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
