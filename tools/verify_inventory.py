"""Bir Bedrock dunyasindaki oyuncu envanterini okunabilir sekilde dokumler.

Kullanim:
    python verify_inventory.py <db_yolu> [player_server_anahtari]
"""
import sys
from leveldb import LevelDB
from amulet_nbt import load, utf8_escape_decoder

NAMES = {
    0: "Protection", 1: "Fire Protection", 2: "Feather Falling", 3: "Blast Protection",
    4: "Projectile Protection", 5: "Thorns", 6: "Respiration", 7: "Depth Strider",
    8: "Aqua Affinity", 9: "Sharpness", 10: "Smite", 11: "Bane of Arthropods",
    12: "Knockback", 13: "Fire Aspect", 14: "Looting", 15: "Efficiency",
    16: "Silk Touch", 17: "Unbreaking", 18: "Fortune", 19: "Power", 20: "Punch",
    21: "Flame", 22: "Infinity", 23: "Luck of the Sea", 24: "Lure", 25: "Frost Walker",
    26: "Mending", 27: "Curse of Binding", 28: "Curse of Vanishing", 29: "Impaling",
    30: "Riptide", 31: "Loyalty", 32: "Channeling", 33: "Multishot", 34: "Piercing",
    35: "Quick Charge", 36: "Soul Speed", 37: "Swift Sneak", 38: "Wind Burst",
    39: "Density", 40: "Breach",
}


def main():
    db_path = sys.argv[1] if len(sys.argv) > 1 else "world/world/db"
    db = LevelDB(db_path, create_if_missing=False)
    if len(sys.argv) > 2:
        key = sys.argv[2].encode()
    else:
        keys = [k for k in db.keys() if k.startswith(b"player_server_")]
        assert len(keys) == 1, keys
        key = keys[0]
    print("oyuncu:", key.decode())

    c = load(db.get(key), compressed=False, little_endian=True,
             string_decoder=utf8_escape_decoder).compound

    total = silk = 0
    for item in c["Inventory"]:
        if not len(item) or item["Name"].py_str == "":
            continue
        ench = item.get("tag", {}).get("ench", [])
        total += len(ench)
        silk += sum(1 for e in ench if int(e["id"]) == 16)
        print(f"[slot {int(item['Slot'])}] {item['Name'].py_str}  "
              f"x{int(item['Count'])}  Damage={int(item['Damage'])}")
        for e in ench:
            print(f"        - {NAMES[int(e['id'])]:<22} lvl {int(e['lvl'])}")

    print(f"\nToplam {total} buyu, Silk Touch sayisi: {silk}")
    db.close()


if __name__ == "__main__":
    main()
