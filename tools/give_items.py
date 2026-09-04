"""Bedrock dunyasindaki oyuncunun envanterine tam buyulu netherite set + araclar ekler.

Kullanim:
    python give_items.py <db_yolu> [player_server_anahtari]

Anahtar verilmezse veritabanindaki tek `player_server_*` kaydi kullanilir.
"""
import sys
from leveldb import LevelDB
from amulet_nbt import (
    load, utf8_escape_decoder, utf8_escape_encoder,
    CompoundTag, ListTag, ByteTag, ShortTag, StringTag, IntTag,
)

LVL = 255

# --- Bedrock enchantment ID tablosu (Enchantment::Type) ---
E = {
    "protection": 0, "fire_protection": 1, "feather_falling": 2, "blast_protection": 3,
    "projectile_protection": 4, "thorns": 5, "respiration": 6, "depth_strider": 7,
    "aqua_affinity": 8, "sharpness": 9, "smite": 10, "bane_of_arthropods": 11,
    "knockback": 12, "fire_aspect": 13, "looting": 14, "efficiency": 15,
    "silk_touch": 16, "unbreaking": 17, "fortune": 18, "power": 19, "punch": 20,
    "flame": 21, "infinity": 22, "luck_of_the_sea": 23, "lure": 24, "frost_walker": 25,
    "mending": 26, "curse_of_binding": 27, "curse_of_vanishing": 28, "impaling": 29,
    "riptide": 30, "loyalty": 31, "channeling": 32, "multishot": 33, "piercing": 34,
    "quick_charge": 35, "soul_speed": 36, "swift_sneak": 37, "wind_burst": 38,
    "density": 39, "breach": 40,
}

# Her item icin uygulanabilen tum buyuler. Lanetler (binding/vanishing) haric.
# Kilic/kazma/balta icin silk_touch kullanicinin istegi uzerine haric tutuldu.
ITEMS = [
    ("minecraft:netherite_helmet", [
        "protection", "fire_protection", "blast_protection", "projectile_protection",
        "thorns", "respiration", "aqua_affinity", "unbreaking", "mending",
    ]),
    ("minecraft:netherite_chestplate", [
        "protection", "fire_protection", "blast_protection", "projectile_protection",
        "thorns", "unbreaking", "mending",
    ]),
    ("minecraft:netherite_leggings", [
        "protection", "fire_protection", "blast_protection", "projectile_protection",
        "thorns", "swift_sneak", "unbreaking", "mending",
    ]),
    ("minecraft:netherite_boots", [
        "protection", "fire_protection", "feather_falling", "blast_protection",
        "projectile_protection", "thorns", "depth_strider", "frost_walker",
        "soul_speed", "unbreaking", "mending",
    ]),
    ("minecraft:netherite_sword", [
        "sharpness", "smite", "bane_of_arthropods", "knockback", "fire_aspect",
        "looting", "unbreaking", "mending",
    ]),
    ("minecraft:netherite_pickaxe", [
        "efficiency", "fortune", "unbreaking", "mending",   # silk_touch YOK
    ]),
    ("minecraft:netherite_axe", [
        "efficiency", "fortune", "sharpness", "smite", "bane_of_arthropods",
        "unbreaking", "mending",                             # silk_touch YOK
    ]),
]


def make_item(name, enchants, slot):
    ench = ListTag([
        CompoundTag({"id": ShortTag(E[e]), "lvl": ShortTag(LVL)}) for e in enchants
    ])
    return CompoundTag({
        "Count": ByteTag(1),
        "Damage": ShortTag(0),
        "Name": StringTag(name),
        "Slot": ByteTag(slot),
        "WasPickedUp": ByteTag(0),
        "tag": CompoundTag({"ench": ench, "RepairCost": IntTag(0)}),
    })


def find_player_key(db):
    keys = [k for k in db.keys() if k.startswith(b"player_server_")]
    if len(keys) != 1:
        raise SystemExit(
            f"Tek bir oyuncu kaydi bekleniyordu, {len(keys)} bulundu: "
            + ", ".join(k.decode() for k in keys)
        )
    return keys[0]


def main():
    db_path = sys.argv[1] if len(sys.argv) > 1 else "world/world/db"
    db = LevelDB(db_path, create_if_missing=False)
    key = sys.argv[2].encode() if len(sys.argv) > 2 else find_player_key(db)
    print("oyuncu:", key.decode())

    raw = db.get(key)
    named = load(raw, compressed=False, little_endian=True,
                 string_decoder=utf8_escape_decoder)
    inv = named.compound["Inventory"]

    for slot, (name, enchants) in enumerate(ITEMS):
        inv[slot] = make_item(name, enchants, slot)
        print(f"slot {slot}: {name}  ({len(enchants)} buyu x lvl {LVL})")

    out = named.to_nbt(compressed=False, little_endian=True,
                       string_encoder=utf8_escape_encoder)
    db.put(key, out)
    db.close()
    print(f"\nYazildi: {len(raw)} -> {len(out)} bayt")


if __name__ == "__main__":
    main()
