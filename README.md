# Mob Üretici — Minecraft Bedrock Eklentisi

İstediğin **mobu**, istediğin **eşyayla**, istediğin **büyüyle**, istediğin **seviyede** oluşturmanı
sağlayan bir Bedrock (Minecraft PE / Windows / konsol) eklentisi.

Elindeki asanın **kullan** tuşuna bastığında önünde bir menü açılır; oradan mobu, eşyayı,
büyüyü ve seviyeyi seçip **MOBU OLUŞTUR** dediğinde mob tam istediğin donanımla önüne çıkar.

---

## Hızlı kurulum

1. `dist/MobUretici.mcaddon` dosyasını indir.
2. Dosyaya çift tıkla (Windows) veya Dosyalar uygulamasından aç (Android / iOS).
   Minecraft açılır ve iki paketi de içe aktarır.
3. Bir dünya oluştur/düzenle → **Davranış Paketleri** → *Mob Üretici* → **Etkinleştir**.
   Kaynak paketi otomatik olarak birlikte gelir.
4. Dünyaya gir. Asa envanterine otomatik eklenir.

> Deneysel (experimental) ayarları açmana **gerek yok**; eklenti kararlı Script API kullanıyor.

### Elle kurulum (klasör kopyalayarak)

| İşletim sistemi | Klasör |
|---|---|
| Windows | `%localappdata%\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState\games\com.mojang\` |
| Android | `Android/data/com.mojang.minecraftpe/files/games/com.mojang/` |
| iOS | Dosyalar → Minecraft → `games/com.mojang/` |

- `behavior_packs/mob_generator_bp` → `com.mojang/development_behavior_packs/`
- `resource_packs/mob_generator_rp` → `com.mojang/development_resource_packs/`

---

## Kullanım

Menüyü açmanın 3 yolu var:

| Yol | Nasıl |
|---|---|
| **Asa** | *Mob Üretici Asası*'nı eline al, **kullan** tuşuna bas (mobilde ekrandaki tuş, PC'de sağ tık) |
| **Sohbet** | Sohbete `!mob` yaz |
| **Komut** | `/scriptevent mobgen:menu` |

Asayı kaybedersen sohbete `!asa` yaz ya da `/scriptevent mobgen:wand` komutunu çalıştır.
(Yaratıcı modda envanterin "Ekipman" sekmesinde de bulabilirsin.)

> Sohbet komutları, sohbet olayını desteklemeyen Minecraft sürümlerinde çalışmayabilir.
> Eklenti bunu açılışta kendisi anlar ve sana hangi yöntemin geçerli olduğunu yazar;
> asa ve `/scriptevent` her sürümde çalışır.

### Menü haritası

```
Mob Üretici
├── MOBU OLUŞTUR .............. ayarladığın mobu önüne çıkarır
├── Mob Seç
│   ├── Düşman / Evcil / Su / Nether-End / Boss  (100+ hazır mob)
│   ├── Ara ................... "zombi", "wolf" gibi ara
│   └── Manuel Giriş .......... başka eklentilerin moblarını da yazabilirsin
├── Eşya ve Büyüler
│   └── Sağ El · Sol El · Kafa · Gövde · Bacak · Ayak
│       ├── Eşya Seç .......... kategori / arama / manuel kimlik
│       │                       veya "Elimdeki Eşyayı Kullan"
│       ├── Büyü Ekle ......... büyü + seviye (1–255)
│       ├── Büyüleri Yönet .... tek tek sil, hepsini sil
│       ├── Eşya Adı .......... "&cAlev Kılıcı" gibi renkli ad
│       └── Adet
├── Mob Ayarları .............. isim, adet (1–50), mesafe, yavru
├── Eşyayı Bana Ver ........... ayarladığın eşyayı envanterine al
├── Şablonlar ................. ayarlarını kaydet / yükle / sil
├── Sıfırla
└── Yardım
```

### Örnek: elinde büyülü kılıç olan bir Ravager

1. **Mob Seç** → *Düşman Moblar* → **Ravager**
2. **Eşya ve Büyüler** → *Sağ El* → **Eşya Seç** → *Kılıçlar* → **Netherit Kılıç**
3. **Büyü Ekle** → *Keskinlik*, seviye **5** → tekrar **Büyü Ekle** → *Ateş Etkisi*, seviye **2**
4. **Eşya Adı** → `&4Kıyamet` → geri → **Mob Ayarları** → isim `&cPatron`, adet `3`
5. **MOBU OLUŞTUR**

---

## Özellikler

- **6 ekipman slotu**: sağ el, sol el, kask, göğüslük, pantolon, bot.
- **Sınırsız büyü kombinasyonu**: bir eşyaya istediğin kadar büyü ekleyebilirsin.
- **Seviye seçimi 1–255** kaydırıcıyla.
- **Elindeki eşyayı kopyalama**: mevcut büyüleriyle birlikte slota alır.
- **Manuel kimlik girişi**: listede olmayan (başka eklentilerden gelen) mob ve eşyalar da çalışır.
- **Türkçe arama**: "kılıç", "zombi", "kask" yazarak bulabilirsin (büyük/küçük ve Türkçe harf farkı önemsiz).
- **Şablonlar**: sık kullandığın kurulumu kaydet, tek tıkla yükle. Şablonlar dünya genelinde paylaşılır.
- **Ayarlar kalıcı**: oyundan çıkıp girsen de her oyuncunun kendi ayarı korunur.
- **Renk kodu desteği**: isim alanlarında `&a`, `&c` gibi kısayollar `§` renk koduna çevrilir.
- **Çok oyunculu / Realms**: paket yüklü olan herkes kendi menüsünü kullanabilir.

### Büyü seviyesi sınırı hakkında

Kaydırıcıdan 255'e kadar seviye seçebilirsin, ancak **Minecraft'ın kendi motoru** bazı büyülerde
üst sınır uygular (örneğin Keskinlik en fazla V). Bedrock'ta script API'siyle bu sınırın üstüne
çıkmanın desteklenen bir yolu yok.

Eklenti bu durumda sessiz kalmaz: istediğin seviye kabul edilmezse **kabul edilen en yüksek
seviyeye düşürür** ve sohbette şunu yazar:

```
Keskinlik 100 yerine 5 seviyesinde eklendi (oyun sınırı).
```

Aynı şekilde bir büyü o eşyaya uymuyorsa (örneğin kaska Keskinlik) bunu da bildirir.
Menüde varsayılan olarak sadece o eşyaya **uyan** büyüler listelenir; "Uygun olmayan büyüleri de
göster" anahtarıyla tüm listeyi açabilirsin.

---

## Sürüm uyumluluğu

Varsayılan olarak **Minecraft Bedrock 1.21.80 ve üzeri** hedeflenir
(`@minecraft/server 2.0.0` + `@minecraft/server-ui 2.0.0`).

Daha eski bir sürüm kullanıyorsan `behavior_packs/mob_generator_bp/manifest.json` içinde iki yeri değiştir:

```jsonc
"min_engine_version": [1, 21, 80],   // kendi sürümüne çek
...
{ "module_name": "@minecraft/server",    "version": "2.0.0" },   // örn. "1.17.0"
{ "module_name": "@minecraft/server-ui", "version": "2.0.0" }    // örn. "1.3.0"
```

Kod her iki API kuşağını da destekleyecek şekilde yazıldı (`scripts/compat.js`), bu yüzden
sadece manifest'i değiştirmen yeterli. Hangi sürüm numarasının geçerli olduğunu bilmiyorsan
paketi yükle ve **content log** ekranına bak — Minecraft geçerli sürümleri orada listeler
(Ayarlar → Yaratıcı → "Content Log GUI" açık olmalı).

---

## Geliştirici notları

```
behavior_packs/mob_generator_bp/
├── manifest.json
├── items/mob_wand.json          özel asa eşyası
└── scripts/
    ├── main.js                  olay bağlantıları (asa, sohbet, /scriptevent, ilk giriş)
    ├── menus.js                 tüm ekranlar
    ├── actions.js               mob doğurma, ekipman giydirme, eşya üretme
    ├── data.js                  mob / eşya / büyü listeleri
    ├── state.js                 oyuncu ayarları ve şablonlar (dinamik özellikler)
    └── compat.js                API sürüm farklarını gizleyen katman
resource_packs/mob_generator_rp/
├── textures/items/mobgen_mob_wand.png
└── textures/item_texture.json
tools/
├── build.py                     .mcaddon paketler
├── make_textures.py             PNG dokuları üretir
└── test/run.sh                  oyunsuz test
```

### Test

Eklenti mantığı, sahte bir `@minecraft/server` modülüyle Minecraft açmadan test edilebilir:

```bash
./tools/test/run.sh
```

Menü akışlarını uçtan uca yürütür (mob seçimi, eşya, büyü, doğurma, şablonlar) ve hem güncel
hem eski API sürümüyle çalıştırır. Yeni Node.js (18+) gerekir.

### Paketleme

```bash
python3 tools/build.py     # -> dist/MobUretici.mcaddon
```

---

## Sorun giderme

| Sorun | Çözüm |
|---|---|
| Menü açılmıyor | Dünyada **davranış paketi** etkin mi? Dünya ayarlarında paketi tekrar ekle. |
| Asa yok | Sohbete `!asa` yaz. |
| Asa mor/siyah kare görünüyor | Kaynak paketi etkin değil; dünya ayarlarından *Mob Üretici - Kaynak Paketi*'ni ekle. |
| Paket "sürüm uyumsuz" diyor | Yukarıdaki **Sürüm uyumluluğu** bölümüne bak. |
| Mob doğmuyor | Önünde blok olabilir; boş bir alana bak veya "mesafe" ayarını düşür. |
| Mob eşyayı tutmuyor | Bazı moblar (creeper, slime, balıklar…) eşya taşıyamaz; eklenti bunu sohbette bildirir. |
| Büyü eklenmedi | O büyü o eşyaya uymuyordur; sohbetteki uyarıya bak. |

---

## Lisans

MIT
