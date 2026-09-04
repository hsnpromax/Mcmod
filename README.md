# Netherite Full Set — Bedrock Dünya Düzenlemesi

Minecraft Bedrock (`1.26.45`) dünyasındaki oyuncunun envanterine, tüm büyüleri
**seviye 255** olan netherite zırh seti ve araçlar eklenmiştir.

## Hedef oyuncu

Dünyada tek bir oyuncu kaydı var:

| Anahtar | Değer |
| --- | --- |
| LevelDB anahtarı | `player_server_1613dc63-e694-42aa-849c-ad239f71c0f1` |
| MSA eşlemesi | `player_22b76885-4006-3286-927f-f114fc34b92d` |

Bedrock dünya dosyaları oyuncu adını (`DreadFlipper308`) saklamaz; scoreboard da
boş olduğu için ad ile eşleme yapılamıyor. Dünyadaki tek oyuncu kaydı bu
olduğundan itemler bu kayda yazıldı. Envanter işlemden önce tamamen boştu.

## Eklenen itemler

Hepsi hotbar'a (slot 0-6), `Count: 1`, `Damage: 0` olarak yerleştirildi.

| Slot | Item | Büyü sayısı |
| --- | --- | --- |
| 0 | `minecraft:netherite_helmet` | 9 |
| 1 | `minecraft:netherite_chestplate` | 7 |
| 2 | `minecraft:netherite_leggings` | 8 |
| 3 | `minecraft:netherite_boots` | 11 |
| 4 | `minecraft:netherite_sword` | 8 |
| 5 | `minecraft:netherite_pickaxe` | 4 |
| 6 | `minecraft:netherite_axe` | 7 |

Toplam 54 büyü, hepsi seviye 255.

### Büyü dağılımı

- **Kask** — Protection, Fire Protection, Blast Protection, Projectile
  Protection, Thorns, Respiration, Aqua Affinity, Unbreaking, Mending
- **Göğüslük** — Protection, Fire Protection, Blast Protection, Projectile
  Protection, Thorns, Unbreaking, Mending
- **Pantolon** — Protection, Fire Protection, Blast Protection, Projectile
  Protection, Thorns, Swift Sneak, Unbreaking, Mending
- **Bot** — Protection, Fire Protection, Feather Falling, Blast Protection,
  Projectile Protection, Thorns, Depth Strider, Frost Walker, Soul Speed,
  Unbreaking, Mending
- **Kılıç** — Sharpness, Smite, Bane of Arthropods, Knockback, Fire Aspect,
  Looting, Unbreaking, Mending
- **Kazma** — Efficiency, Fortune, Unbreaking, Mending
- **Balta** — Efficiency, Fortune, Sharpness, Smite, Bane of Arthropods,
  Unbreaking, Mending

### Kapsam kararları

- **Silk Touch hiçbir itemde yok.** Kazma ve baltada istek üzerine çıkarıldı;
  kılıca zaten uygulanamıyor.
- **Lanetler eklenmedi.** Curse of Binding ve Curse of Vanishing teknik olarak
  "büyü" sayılsa da zırhı çıkarılamaz yapar ve ölümde itemleri yok eder, yani
  setin amacına ters düşer. İstenirse `give_items.py` içindeki listelere
  `curse_of_binding` / `curse_of_vanishing` eklenerek basılabilir.
- Birbiriyle çakışan büyüler (Protection ailesi, Sharpness/Smite/Bane,
  Depth Strider/Frost Walker) aynı item üzerinde birlikte duruyor — normal
  oyunda mümkün değil ama NBT düzeyinde çalışıyor.

## Çıktılar

- `output/DreadFlipper308-netherite.mcworld` — doğrudan içe aktarılabilir dünya
- `output/world.zip` — yüklenen arşivle aynı klasör yapısında (`world/...`)

## Araçlar

```bash
python3 -m venv venv
./venv/bin/pip install amulet-leveldb amulet-nbt

./venv/bin/python tools/give_items.py        # itemleri yazar
./venv/bin/python tools/verify_inventory.py  # sonucu doğrular
```

Her iki script de dünyayı `world/world/db` yolunda arar.
