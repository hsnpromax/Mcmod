import { log, Player, registerMobs } from "@minecraft/server";
import { script } from "@minecraft/server-ui";
import { ALL_MOBS } from "./scripts/data.js";
import { openMainMenu } from "./scripts/menus.js";

registerMobs(ALL_MOBS.map((m) => m.id));
registerMobs(["minecraft:custom_boss"]); // manuel giris testi icin

let failures = 0;
function check(label, cond, extra = "") {
  console.log(`${cond ? "  ✓" : "  ✗"} ${label}${cond ? "" : "  <-- " + extra}`);
  if (!cond) failures++;
}
function reset() {
  log.spawns.length = 0; log.equips.length = 0; log.messages.length = 0;
  log.sounds.length = 0; log.items.length = 0; script.trace.length = 0;
}
async function scenario(name, steps, player) {
  console.log(`\n=== ${name} ===`);
  reset();
  script.steps = steps.slice();
  await openMainMenu(player);
  if (script.steps.length) {
    console.log(`  ! senaryo bitmeden ${script.steps.length} adim kaldi (menu erken kapandi)`);
    failures++;
  }
  return { msgs: log.messages.join("\n") };
}

const p1 = new Player("p1");

/* --- 1. Tam akis: mob + esya + buyu + olustur ---------------------- */
await scenario("Zombiye buyulu elmas kilic ver", [
  "Mob Seç", "Düşman", "Zombi",
  "Eşya ve Büyüler", "Sağ El", "Eşya Seç", "Kılıçlar", "Elmas Kılıç",
  "Büyü Ekle", [0, 100, false],      // Keskinlik 100 -> oyun 5'e dusurmeli
  [4, 2, false],                      // Ates Etkisi II
  { cancel: true },                   // buyu ekranindan cik
  "Geri", "Ana Menü",
  "MOBU OLUŞTUR",
], p1);

check("1 mob doguruldu", log.spawns.length === 1, `spawns=${log.spawns.length}`);
check("dogan mob zombi", log.spawns[0]?.typeId === "minecraft:zombie", log.spawns[0]?.typeId);
check("sag ele esya giydirildi", log.equips[0]?.slot === "Mainhand", JSON.stringify(log.equips[0]?.slot));
check("esya elmas kilic", log.equips[0]?.item?.typeId === "minecraft:diamond_sword", log.equips[0]?.item?.typeId);
const ench = log.equips[0]?.item?.getComponent("minecraft:enchantable")?.getEnchantments() ?? [];
check("keskinlik 5'e dusuruldu", ench.some((e) => e.type.id === "sharpness" && e.level === 5), JSON.stringify(ench.map((e) => `${e.type.id}:${e.level}`)));
check("ates etkisi 2 uygulandi", ench.some((e) => e.type.id === "fire_aspect" && e.level === 2), JSON.stringify(ench.map((e) => `${e.type.id}:${e.level}`)));
check("seviye dusurme bildirildi", log.messages.some((m) => m.includes("oyun sınırı")), log.messages.join(" | "));

/* --- 2. Arama + ayarlar + coklu dogum ------------------------------ */
await scenario("Arama ile mob sec, 5 adet yavru, isimli", [
  "Mob Seç", "Ara", ["kurt"], "Kurt",
  "Mob Ayarları", ["&cAlfa", 5, 6, true],
  "MOBU OLUŞTUR",
], p1);
check("5 kurt doguruldu", log.spawns.length === 5 && log.spawns.every((s) => s.typeId === "minecraft:wolf"), `${log.spawns.length} / ${log.spawns[0]?.typeId}`);
check("isim etiketi renk koduna cevrildi", log.spawns[0]?.entity.nameTag === "§cAlfa", log.spawns[0]?.entity.nameTag);
check("mesafe uygulandi (z ~6)", Math.abs((log.spawns[0]?.location.z ?? 0) - 6) < 4, String(log.spawns[0]?.location.z));

/* --- 3. Ekipmani olmayan mob -------------------------------------- */
const p2 = new Player("p2");
await scenario("Creeper esya tasiyamaz uyarisi", [
  "Mob Seç", "Düşman", "Creeper",
  "Eşya ve Büyüler", "Kafa", "Eşya Seç", "Kask", "Elmas Kask",
  "Geri", "Ana Menü",
  "MOBU OLUŞTUR",
], p2);
check("creeper doguruldu", log.spawns[0]?.typeId === "minecraft:creeper", log.spawns[0]?.typeId);
check("esya tasiyamaz uyarisi verildi", log.messages.some((m) => m.includes("eşya taşıyamıyor")), log.messages.join(" | "));

/* --- 4. Manuel kimlik girisi + gecersiz kimlik --------------------- */
const p3 = new Player("p3");
await scenario("Manuel mob kimligi", [
  "Mob Seç", "Manuel", ["yok_boyle_bir_mob"],   // gecersiz -> menuye doner
  "Manuel", ["custom_boss"],                     // gecerli
  "MOBU OLUŞTUR",
], p3);
check("gecersiz kimlik reddedildi", log.messages.some((m) => m.includes("Böyle bir mob bulunamadı")), log.messages.join(" | "));
check("gecerli manuel kimlik kullanildi", log.spawns[0]?.typeId === "minecraft:custom_boss", log.spawns[0]?.typeId);

/* --- 5. Esyayi bana ver ------------------------------------------- */
const p4 = new Player("p4");
await scenario("Buyulu yayi envantere al", [
  "Eşya ve Büyüler", "Sağ El", "Eşya Seç", "Menzilli", "Yay",
  "Büyü Ekle", [2, 5, false],       // (yay listesinde 2 = Guc) Guc V
  { cancel: true },
  "Geri", "Ana Menü",
  "Eşyayı Bana Ver", "Sağ El", "Ana Menü",
  { cancel: true },
], p4);
const given = p4.getComponent("minecraft:inventory").container.getItem(0);
check("yay envantere eklendi", given?.typeId === "minecraft:bow", given?.typeId);
const gEnch = given?.getComponent("minecraft:enchantable")?.getEnchantments() ?? [];
check("yaya guc V uygulandi", gEnch.some((e) => e.type.id === "power" && e.level === 5), JSON.stringify(gEnch.map((e) => `${e.type.id}:${e.level}`)));

/* --- 6. Sablon kaydet / yukle -------------------------------------- */
const p5 = new Player("p5");
await scenario("Sablon kaydet", [
  "Mob Seç", "Düşman", "Ravager",
  "Şablonlar", "Mevcut Ayarı Kaydet", ["Ravager seti"],
  "Ana Menü",
], p5);
const p6 = new Player("p6");
await scenario("Sablonu baska oyuncu yukler", [
  "Şablonlar", "Ravager seti", "Yükle",
  "MOBU OLUŞTUR",
], p6);
check("sablon yuklendi ve ravager doguruldu", log.spawns[0]?.typeId === "minecraft:ravager", log.spawns[0]?.typeId);

/* --- 7. Ayarlarin kalicilgi ---------------------------------------- */
await scenario("Ayarlar oyuncuda saklaniyor", ["MOBU OLUŞTUR"], p6);
check("secim hatirlandi", log.spawns[0]?.typeId === "minecraft:ravager", log.spawns[0]?.typeId);

/* --- 8. Sifirlama --------------------------------------------------- */
await scenario("Sifirla", ["Sıfırla", "MOBU OLUŞTUR"], p6);
check("sifirlanip varsayilan zombiye dondu", log.spawns[0]?.typeId === "minecraft:zombie", log.spawns[0]?.typeId);

console.log(`\n${failures === 0 ? "TUM TESTLER GECTI" : failures + " TEST BASARISIZ"}`);
process.exit(failures ? 1 : 0);
