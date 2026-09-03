#!/usr/bin/env python3
"""Mob Uretici eklentisi icin PNG dokularini uretir (harici kutuphane gerektirmez)."""
import os
import struct
import zlib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def write_png(path, width, height, pixels):
    """pixels: [(r, g, b, a), ...] satir satir, uzunluk width*height."""
    raw = bytearray()
    for y in range(height):
        raw.append(0)  # filter type 0
        for x in range(width):
            raw.extend(pixels[y * width + x])

    def chunk(tag, data):
        out = struct.pack(">I", len(data)) + tag + data
        return out + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    png += chunk(b"IEND", b"")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as fh:
        fh.write(png)
    print("olusturuldu:", os.path.relpath(path, ROOT))


class Canvas:
    def __init__(self, w, h):
        self.w = w
        self.h = h
        self.px = [(0, 0, 0, 0)] * (w * h)

    def set(self, x, y, color):
        if 0 <= x < self.w and 0 <= y < self.h:
            self.px[y * self.w + x] = color

    def rect(self, x0, y0, x1, y1, color):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                self.set(x, y, color)

    def disc(self, cx, cy, r, color):
        for y in range(int(cy - r), int(cy + r) + 1):
            for x in range(int(cx - r), int(cx + r) + 1):
                if (x - cx) ** 2 + (y - cy) ** 2 <= r * r:
                    self.set(x, y, color)


# --- 16x16 asa dokusu ---------------------------------------------------
WOOD_D = (58, 38, 21, 255)
WOOD_M = (99, 66, 36, 255)
WOOD_L = (140, 98, 56, 255)
GEM_D = (14, 96, 122, 255)
GEM_M = (46, 182, 212, 255)
GEM_L = (150, 244, 255, 255)
SPARK = (255, 246, 180, 255)

wand = Canvas(16, 16)
# sap: sol alttan sag uste dogru
for i in range(9):
    x = 2 + i
    y = 14 - i
    wand.set(x, y, WOOD_M)
    wand.set(x + 1, y, WOOD_D)
    wand.set(x, y - 1, WOOD_L)
# sapin ucundaki bilezik
wand.set(10, 6, (196, 160, 66, 255))
wand.set(11, 6, (150, 118, 44, 255))
wand.set(10, 5, (222, 190, 92, 255))
# kristal
for (x, y, c) in [
    (11, 4, GEM_M), (12, 4, GEM_M), (10, 4, GEM_D),
    (10, 3, GEM_M), (11, 3, GEM_L), (12, 3, GEM_M), (13, 3, GEM_D),
    (10, 2, GEM_M), (11, 2, GEM_L), (12, 2, GEM_M), (13, 2, GEM_D),
    (11, 1, GEM_M), (12, 1, GEM_M), (13, 1, GEM_D),
    (12, 0, GEM_D),
]:
    wand.set(x, y, c)
# parlamalar
wand.set(8, 2, SPARK)
wand.set(9, 0, SPARK)
wand.set(14, 5, SPARK)
wand.set(6, 6, SPARK)
write_png(os.path.join(ROOT, "resource_packs", "mob_generator_rp", "textures",
                       "items", "mobgen_mob_wand.png"), 16, 16, wand.px)


# --- 128x128 paket ikonu ------------------------------------------------
def make_icon():
    size = 128
    c = Canvas(size, size)
    for y in range(size):
        t = y / (size - 1)
        col = (int(22 + 18 * t), int(28 + 30 * t), int(46 + 52 * t), 255)
        for x in range(size):
            c.set(x, y, col)
    # cerceve
    c.rect(0, 0, size - 1, 3, (46, 182, 212, 255))
    c.rect(0, size - 4, size - 1, size - 1, (46, 182, 212, 255))
    c.rect(0, 0, 3, size - 1, (46, 182, 212, 255))
    c.rect(size - 4, 0, size - 1, size - 1, (46, 182, 212, 255))
    # asa (16x16 dokusunun 6x buyutulmusu, ortalanmis)
    scale = 6
    off = (size - 16 * scale) // 2
    for y in range(16):
        for x in range(16):
            p = wand.px[y * 16 + x]
            if p[3]:
                c.rect(off + x * scale, off + y * scale,
                       off + x * scale + scale - 1, off + y * scale + scale - 1, p)
    # kristal parlamasi
    c.disc(96, 26, 4, (255, 255, 255, 255))
    c.disc(30, 96, 3, (255, 246, 180, 255))
    return c


icon = make_icon()
for pack in ("behavior_packs/mob_generator_bp", "resource_packs/mob_generator_rp"):
    write_png(os.path.join(ROOT, pack, "pack_icon.png"), 128, 128, icon.px)
