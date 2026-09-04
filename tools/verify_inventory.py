from leveldb import LevelDB
from amulet_nbt import load, utf8_escape_decoder

NAMES = {0:"Protection",1:"Fire Protection",2:"Feather Falling",3:"Blast Protection",
4:"Projectile Protection",5:"Thorns",6:"Respiration",7:"Depth Strider",8:"Aqua Affinity",
9:"Sharpness",10:"Smite",11:"Bane of Arthropods",12:"Knockback",13:"Fire Aspect",
14:"Looting",15:"Efficiency",16:"Silk Touch",17:"Unbreaking",18:"Fortune",19:"Power",
20:"Punch",21:"Flame",22:"Infinity",23:"Luck of the Sea",24:"Lure",25:"Frost Walker",
26:"Mending",27:"Curse of Binding",28:"Curse of Vanishing",29:"Impaling",30:"Riptide",
31:"Loyalty",32:"Channeling",33:"Multishot",34:"Piercing",35:"Quick Charge",
36:"Soul Speed",37:"Swift Sneak",38:"Wind Burst",39:"Density",40:"Breach"}

db = LevelDB("world/world/db", create_if_missing=False)
c = load(db.get(b'player_server_1613dc63-e694-42aa-849c-ad239f71c0f1'),
         compressed=False, little_endian=True, string_decoder=utf8_escape_decoder).compound
total = 0
for i, it in enumerate(c["Inventory"]):
    if not len(it) or str(it["Name"].py_str) == "":
        continue
    ench = it["tag"]["ench"]
    total += len(ench)
    print(f"[slot {int(it['Slot'])}] {it['Name'].py_str}  x{int(it['Count'])}  Damage={int(it['Damage'])}")
    for e in ench:
        print(f"        - {NAMES[int(e['id'])]:<22} lvl {int(e['lvl'])}")
print(f"\nToplam {total} buyu. Silk Touch var mi? ",
      any(int(e['id'])==16 for it in c["Inventory"] if len(it) and it['Name'].py_str
          for e in it.get('tag', {}).get('ench', [])))
db.close()
