/**
 * data.js - Menude gosterilen hazir mob, esya ve buyu listeleri.
 * Listede olmayan her sey "Manuel Giris" secenegiyle kimlik yazilarak kullanilabilir.
 */

/* ------------------------------------------------------------------ */
/* MOBLAR                                                              */
/* ------------------------------------------------------------------ */

export const MOB_CATEGORIES = [
  {
    name: "§cDüşman Moblar",
    icon: "textures/items/rotten_flesh",
    entries: [
      ["minecraft:zombie", "Zombi"],
      ["minecraft:husk", "Çöl Zombisi (Husk)"],
      ["minecraft:drowned", "Boğulmuş (Drowned)"],
      ["minecraft:zombie_villager_v2", "Zombi Köylü"],
      ["minecraft:skeleton", "İskelet"],
      ["minecraft:stray", "Donmuş İskelet (Stray)"],
      ["minecraft:bogged", "Bataklık İskeleti (Bogged)"],
      ["minecraft:wither_skeleton", "Wither İskeleti"],
      ["minecraft:creeper", "Creeper"],
      ["minecraft:spider", "Örümcek"],
      ["minecraft:cave_spider", "Mağara Örümceği"],
      ["minecraft:silverfish", "Gümüş Balığı"],
      ["minecraft:endermite", "Endermit"],
      ["minecraft:enderman", "Enderman"],
      ["minecraft:witch", "Cadı"],
      ["minecraft:slime", "Slime"],
      ["minecraft:phantom", "Phantom"],
      ["minecraft:vex", "Vex"],
      ["minecraft:evocation_illager", "Evoker"],
      ["minecraft:vindicator", "Vindicator"],
      ["minecraft:pillager", "Yağmacı (Pillager)"],
      ["minecraft:ravager", "Ravager"],
      ["minecraft:illusioner", "İllüzyonist"],
      ["minecraft:creaking", "Creaking"],
      ["minecraft:breeze", "Breeze"],
    ],
  },
  {
    name: "§aEvcil ve Pasif Moblar",
    icon: "textures/items/wheat",
    entries: [
      ["minecraft:pig", "Domuz"],
      ["minecraft:cow", "İnek"],
      ["minecraft:mooshroom", "Mantar İnek"],
      ["minecraft:sheep", "Koyun"],
      ["minecraft:chicken", "Tavuk"],
      ["minecraft:rabbit", "Tavşan"],
      ["minecraft:horse", "At"],
      ["minecraft:donkey", "Eşek"],
      ["minecraft:mule", "Katır"],
      ["minecraft:skeleton_horse", "İskelet At"],
      ["minecraft:zombie_horse", "Zombi At"],
      ["minecraft:llama", "Lama"],
      ["minecraft:trader_llama", "Tüccar Laması"],
      ["minecraft:wolf", "Kurt"],
      ["minecraft:cat", "Kedi"],
      ["minecraft:ocelot", "Ocelot"],
      ["minecraft:fox", "Tilki"],
      ["minecraft:panda", "Panda"],
      ["minecraft:polar_bear", "Kutup Ayısı"],
      ["minecraft:bee", "Arı"],
      ["minecraft:turtle", "Kaplumbağa"],
      ["minecraft:parrot", "Papağan"],
      ["minecraft:axolotl", "Aksolotl"],
      ["minecraft:goat", "Keçi"],
      ["minecraft:frog", "Kurbağa"],
      ["minecraft:tadpole", "İribaş"],
      ["minecraft:allay", "Allay"],
      ["minecraft:camel", "Deve"],
      ["minecraft:sniffer", "Sniffer"],
      ["minecraft:armadillo", "Armadillo"],
      ["minecraft:villager_v2", "Köylü"],
      ["minecraft:wandering_trader", "Gezgin Tüccar"],
      ["minecraft:iron_golem", "Demir Golem"],
      ["minecraft:snow_golem", "Kar Golemi"],
      ["minecraft:happy_ghast", "Mutlu Ghast"],
    ],
  },
  {
    name: "§9Su Mobları",
    icon: "textures/items/fish_raw",
    entries: [
      ["minecraft:cod", "Morina"],
      ["minecraft:salmon", "Somon"],
      ["minecraft:tropicalfish", "Tropikal Balık"],
      ["minecraft:pufferfish", "Balon Balığı"],
      ["minecraft:squid", "Mürekkep Balığı"],
      ["minecraft:glow_squid", "Parlayan Mürekkep Balığı"],
      ["minecraft:dolphin", "Yunus"],
      ["minecraft:guardian", "Muhafız"],
      ["minecraft:elder_guardian", "Yaşlı Muhafız"],
    ],
  },
  {
    name: "§6Nether ve End",
    icon: "textures/items/blaze_rod",
    entries: [
      ["minecraft:blaze", "Blaze"],
      ["minecraft:ghast", "Ghast"],
      ["minecraft:magma_cube", "Magma Küpü"],
      ["minecraft:zombie_pigman", "Zombi Piglin"],
      ["minecraft:piglin", "Piglin"],
      ["minecraft:piglin_brute", "Piglin Vahşisi"],
      ["minecraft:hoglin", "Hoglin"],
      ["minecraft:zoglin", "Zoglin"],
      ["minecraft:strider", "Strider"],
      ["minecraft:shulker", "Shulker"],
      ["minecraft:enderman", "Enderman"],
    ],
  },
  {
    name: "§5Boss ve Nadir",
    icon: "textures/items/nether_star",
    entries: [
      ["minecraft:wither", "Wither"],
      ["minecraft:ender_dragon", "Ender Ejderi"],
      ["minecraft:warden", "Warden"],
      ["minecraft:elder_guardian", "Yaşlı Muhafız"],
      ["minecraft:ravager", "Ravager"],
      ["minecraft:iron_golem", "Demir Golem"],
    ],
  },
];

/** Arama icin duzlestirilmis liste. */
export const ALL_MOBS = (() => {
  const seen = new Map();
  for (const cat of MOB_CATEGORIES) {
    for (const [id, name] of cat.entries) if (!seen.has(id)) seen.set(id, name);
  }
  return [...seen.entries()].map(([id, name]) => ({ id, name }));
})();

export function mobName(id) {
  const hit = ALL_MOBS.find((m) => m.id === id);
  if (hit) return hit.name;
  return String(id).replace("minecraft:", "").replace(/_/g, " ");
}

/* ------------------------------------------------------------------ */
/* ESYALAR                                                             */
/* ------------------------------------------------------------------ */

const TIERS = [
  ["wooden", "Tahta"],
  ["stone", "Taş"],
  ["iron", "Demir"],
  ["golden", "Altın"],
  ["diamond", "Elmas"],
  ["netherite", "Netherit"],
];

function tierTools(suffix, label) {
  return TIERS.map(([t, tr]) => [`minecraft:${t}_${suffix}`, `${tr} ${label}`]);
}

const ARMOR_TIERS = [
  ["leather", "Deri"],
  ["chainmail", "Zincir"],
  ["iron", "Demir"],
  ["golden", "Altın"],
  ["diamond", "Elmas"],
  ["netherite", "Netherit"],
];

function armorPieces(suffix, label) {
  return ARMOR_TIERS.map(([t, tr]) => [`minecraft:${t}_${suffix}`, `${tr} ${label}`]);
}

export const ITEM_CATEGORIES = [
  {
    name: "§cKılıçlar",
    icon: "textures/items/diamond_sword",
    entries: [...tierTools("sword", "Kılıç"), ["minecraft:mace", "Topuz (Mace)"], ["minecraft:trident", "Trident"]],
  },
  { name: "§6Baltalar", icon: "textures/items/diamond_axe", entries: tierTools("axe", "Balta") },
  { name: "§eKazmalar", icon: "textures/items/diamond_pickaxe", entries: tierTools("pickaxe", "Kazma") },
  { name: "§7Kürekler", icon: "textures/items/diamond_shovel", entries: tierTools("shovel", "Kürek") },
  { name: "§2Çapalar", icon: "textures/items/diamond_hoe", entries: tierTools("hoe", "Çapa") },
  {
    name: "§bKask (Kafa)",
    icon: "textures/items/diamond_helmet",
    entries: [
      ...armorPieces("helmet", "Kask"),
      ["minecraft:turtle_helmet", "Kaplumbağa Kabuğu"],
      ["minecraft:carved_pumpkin", "Oyulmuş Balkabağı"],
      ["minecraft:skeleton_skull", "İskelet Kafatası"],
      ["minecraft:zombie_head", "Zombi Kafası"],
      ["minecraft:creeper_head", "Creeper Kafası"],
      ["minecraft:dragon_head", "Ejder Kafası"],
      ["minecraft:wither_skeleton_skull", "Wither İskelet Kafatası"],
    ],
  },
  {
    name: "§bGöğüslük",
    icon: "textures/items/diamond_chestplate",
    entries: [...armorPieces("chestplate", "Göğüslük"), ["minecraft:elytra", "Elytra"]],
  },
  { name: "§bPantolon", icon: "textures/items/diamond_leggings", entries: armorPieces("leggings", "Pantolon") },
  { name: "§bBotlar", icon: "textures/items/diamond_boots", entries: armorPieces("boots", "Bot") },
  {
    name: "§dMenzilli ve Özel",
    icon: "textures/items/bow_standby",
    entries: [
      ["minecraft:bow", "Yay"],
      ["minecraft:crossbow", "Tatar Yayı"],
      ["minecraft:arrow", "Ok"],
      ["minecraft:shield", "Kalkan"],
      ["minecraft:totem_of_undying", "Ölümsüzlük Totemi"],
      ["minecraft:fishing_rod", "Olta"],
      ["minecraft:shears", "Makas"],
      ["minecraft:flint_and_steel", "Çakmaktaşı"],
      ["minecraft:carrot_on_a_stick", "Sopada Havuç"],
      ["minecraft:warped_fungus_on_a_stick", "Sopada Mantar"],
      ["minecraft:brush", "Fırça"],
      ["minecraft:enchanted_book", "Büyü Kitabı"],
      ["minecraft:wind_charge", "Rüzgar Yükü"],
    ],
  },
  {
    name: "§aYiyecek ve Diğer",
    icon: "textures/items/apple_golden",
    entries: [
      ["minecraft:golden_apple", "Altın Elma"],
      ["minecraft:enchanted_golden_apple", "Büyülü Altın Elma"],
      ["minecraft:cooked_beef", "Pişmiş Biftek"],
      ["minecraft:bread", "Ekmek"],
      ["minecraft:diamond", "Elmas"],
      ["minecraft:netherite_ingot", "Netherit Külçe"],
      ["minecraft:emerald", "Zümrüt"],
      ["minecraft:ender_pearl", "Ender İncisi"],
      ["minecraft:nether_star", "Nether Yıldızı"],
      ["minecraft:tnt", "TNT"],
      ["minecraft:torch", "Meşale"],
      ["minecraft:saddle", "Eyer"],
      ["minecraft:name_tag", "İsim Etiketi"],
    ],
  },
];

export const ALL_ITEMS = (() => {
  const seen = new Map();
  for (const cat of ITEM_CATEGORIES) {
    for (const [id, name] of cat.entries) if (!seen.has(id)) seen.set(id, name);
  }
  return [...seen.entries()].map(([id, name]) => ({ id, name }));
})();

export function itemName(id) {
  const hit = ALL_ITEMS.find((i) => i.id === id);
  if (hit) return hit.name;
  return String(id).replace("minecraft:", "").replace(/_/g, " ");
}

/* ------------------------------------------------------------------ */
/* BUYULER                                                             */
/* ------------------------------------------------------------------ */

/** [bedrock kimligi, Turkce ad] - oyunda bulunmayanlar calisma aninda elenir. */
export const ENCHANTMENTS = [
  ["sharpness", "Keskinlik"],
  ["smite", "Kutsal Darbe"],
  ["bane_of_arthropods", "Böcek Belası"],
  ["knockback", "Geri İtme"],
  ["fire_aspect", "Ateş Etkisi"],
  ["looting", "Yağmalama"],
  ["efficiency", "Verimlilik"],
  ["silk_touch", "İpeksi Dokunuş"],
  ["unbreaking", "Dayanıklılık"],
  ["fortune", "Şans"],
  ["mending", "Onarım"],
  ["power", "Güç"],
  ["punch", "Yumruk"],
  ["flame", "Alev"],
  ["infinity", "Sonsuzluk"],
  ["multishot", "Çoklu Atış"],
  ["piercing", "Delme"],
  ["quick_charge", "Hızlı Şarj"],
  ["impaling", "Şişleme"],
  ["riptide", "Akıntı"],
  ["loyalty", "Sadakat"],
  ["channeling", "Yıldırım Çekme"],
  ["density", "Yoğunluk"],
  ["breach", "Delip Geçme"],
  ["wind_burst", "Rüzgar Patlaması"],
  ["protection", "Koruma"],
  ["fire_protection", "Ateş Koruması"],
  ["blast_protection", "Patlama Koruması"],
  ["projectile_protection", "Mermi Koruması"],
  ["feather_falling", "Tüy Düşüşü"],
  ["thorns", "Dikenler"],
  ["respiration", "Solunum"],
  ["aqua_affinity", "Su Uyumu"],
  ["depth_strider", "Derinlik Yürüyüşü"],
  ["frost_walker", "Buz Yürüyüşü"],
  ["soul_speed", "Ruh Hızı"],
  ["swift_sneak", "Hızlı Sinsi"],
  ["luck_of_the_sea", "Deniz Şansı"],
  ["lure", "Yem"],
  ["binding", "Bağlanma Laneti"],
  ["vanishing", "Yok Olma Laneti"],
];

export function enchantName(id) {
  const hit = ENCHANTMENTS.find((e) => e[0] === id);
  return hit ? hit[1] : String(id).replace(/_/g, " ");
}

/** Roma rakami - buyu seviyelerini guzel gostermek icin (1-10 arasi, sonrasi sayi). */
export function roman(n) {
  const map = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"],
    [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  if (n <= 0 || n > 3999) return String(n);
  let out = "";
  let rest = n;
  for (const [v, s] of map) {
    while (rest >= v) {
      out += s;
      rest -= v;
    }
  }
  return out;
}

export const EQUIP_SLOTS = [
  { key: "Mainhand", name: "Sağ El (Silah)", icon: "textures/items/diamond_sword" },
  { key: "Offhand", name: "Sol El" },
  { key: "Head", name: "Kafa", icon: "textures/items/diamond_helmet" },
  { key: "Chest", name: "Gövde", icon: "textures/items/diamond_chestplate" },
  { key: "Legs", name: "Bacak", icon: "textures/items/diamond_leggings" },
  { key: "Feet", name: "Ayak", icon: "textures/items/diamond_boots" },
];
