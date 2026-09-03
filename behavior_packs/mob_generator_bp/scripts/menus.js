/**
 * menus.js - Oyuncunun onunde acilan tum ekranlar.
 * Her menu async'tir ve isi bitince cagiran menuye geri doner.
 */
import { ItemStack } from "@minecraft/server";
import {
  actionForm,
  button,
  canEnchant,
  dropdown,
  enchantType,
  modalForm,
  show,
  slider,
  textField,
  toggle,
} from "./compat.js";
import {
  ALL_ITEMS,
  ALL_MOBS,
  ENCHANTMENTS,
  EQUIP_SLOTS,
  ITEM_CATEGORIES,
  MOB_CATEGORIES,
  enchantName,
  itemName,
  mobName,
  roman,
} from "./data.js";
import {
  colorize,
  describeSlot,
  giveToPlayer,
  isValidItem,
  isValidMob,
  normalizeId,
  readHeldItem,
  spawnConfigured,
} from "./actions.js";
import { deletePreset, getConfig, getPresets, newSlotItem, resetConfig, savePreset, saveConfig } from "./state.js";
import { features } from "./runtime.js";

const ICON = {
  spawn: "textures/ui/confirm",
  mob: "textures/items/egg",
  gear: "textures/items/diamond_chestplate",
  settings: "textures/items/name_tag",
  give: "textures/items/diamond_sword",
  presets: "textures/items/book_enchanted",
  reset: "textures/ui/trash",
  help: "textures/ui/magnifyingGlass",
  search: "textures/ui/magnifyingGlass",
  write: "textures/ui/book_edit_default",
  hand: "textures/items/stick",
  back: "textures/ui/cancel",
};

/** Turkce harfleri sadelestirerek arama yapar (İ/ı/ş/ğ/ü/ö/ç). */
function fold(text) {
  return String(text ?? "")
    .replace(/İ/g, "I")
    .replace(/ı/g, "i")
    .replace(/[şŞ]/g, "s")
    .replace(/[ğĞ]/g, "g")
    .replace(/[üÜ]/g, "u")
    .replace(/[öÖ]/g, "o")
    .replace(/[çÇ]/g, "c")
    .toLowerCase();
}

/**
 * Buton listesi + geri cagirim eslesmesini tek yerde tutar,
 * boylece indeks kaymasi kaynakli hatalar olusmaz.
 */
function menu(title, body) {
  const form = actionForm(title, body);
  const handlers = [];
  return {
    add(text, icon, fn) {
      button(form, text, icon);
      handlers.push(fn);
      return this;
    },
    async run(player) {
      const res = await show(player, form);
      if (!res || res.canceled) return undefined;
      const fn = handlers[res.selection];
      return fn ? await fn() : undefined;
    },
  };
}

function tell(player, lines) {
  for (const line of [].concat(lines)) player.sendMessage(line);
}

/* ------------------------------------------------------------------ */
/* ANA MENU                                                            */
/* ------------------------------------------------------------------ */

function summary(cfg) {
  const gear = EQUIP_SLOTS.filter((s) => cfg.slots[s.key])
    .map((s) => `§7${s.name}: ${describeSlot(cfg.slots[s.key])}`)
    .join("\n");
  return [
    `§7Mob: §a${mobName(cfg.mob)} §8(${cfg.mob})`,
    `§7Adet: §a${cfg.count}§7  Mesafe: §a${cfg.distance}§7  Yavru: §a${cfg.baby ? "evet" : "hayır"}`,
    cfg.nameTag ? `§7İsim: §f${colorize(cfg.nameTag)}` : "",
    "",
    gear || "§8Henüz eşya seçilmedi.",
    "",
  ]
    .filter((l) => l !== "")
    .join("\n");
}

export async function openMainMenu(player) {
  const cfg = getConfig(player);
  const equipped = EQUIP_SLOTS.filter((s) => cfg.slots[s.key]).length;

  await menu("§l§bMob Üretici", summary(cfg))
    .add("§a§lMOBU OLUŞTUR\n§r§7Ayarladığın mobu önüne çıkar", ICON.spawn, async () => {
      const res = spawnConfigured(player, cfg);
      if (res.error) tell(player, res.error);
      if (res.spawned > 0) {
        tell(player, `§a${res.spawned}x §f${mobName(cfg.mob)} §aoluşturuldu.`);
        try {
          player.playSound("random.orb");
        } catch {
          /* ses onemli degil */
        }
      }
      tell(player, res.warnings);
    })
    .add(`§e§lMob Seç\n§r§7Şu an: ${mobName(cfg.mob)}`, ICON.mob, async () => {
      const id = await pickMob(player);
      if (id) {
        cfg.mob = id;
        saveConfig(player, cfg);
        tell(player, `§aMob seçildi: §f${mobName(id)}`);
      }
      await openMainMenu(player);
    })
    .add(`§b§lEşya ve Büyüler\n§r§7${equipped}/6 slot dolu`, ICON.gear, async () => {
      await gearMenu(player);
    })
    .add("§d§lMob Ayarları\n§r§7İsim, adet, mesafe, yavru", ICON.settings, async () => {
      await settingsMenu(player);
    })
    .add("§6§lEşyayı Bana Ver\n§r§7Ayarlanan eşyayı envanterine al", ICON.give, async () => {
      await giveMenu(player);
    })
    .add("§9§lŞablonlar\n§r§7Ayarlarını kaydet / yükle", ICON.presets, async () => {
      await presetsMenu(player);
    })
    .add("§c§lSıfırla\n§r§7Tüm ayarları varsayılana döndür", ICON.reset, async () => {
      resetConfig(player);
      tell(player, "§aAyarlar sıfırlandı.");
      await openMainMenu(player);
    })
    .add("§7Yardım", ICON.help, async () => {
      await helpMenu(player);
    })
    .run(player);
}

/* ------------------------------------------------------------------ */
/* MOB SECIMI                                                          */
/* ------------------------------------------------------------------ */

/** @returns {Promise<string|undefined>} secilen mobun kimligi */
async function pickMob(player) {
  const m = menu("§l§eMob Seç", "§7Bir kategori seç ya da ara.");
  for (const cat of MOB_CATEGORIES) {
    m.add(`${cat.name}\n§r§7${cat.entries.length} mob`, cat.icon, async () => {
      const sub = menu(cat.name, "§7Doğurmak istediğin mobu seç.");
      for (const [id, name] of cat.entries) {
        sub.add(`§f${name}\n§8${id.replace("minecraft:", "")}`, undefined, async () => id);
      }
      sub.add("§7« Geri", ICON.back, async () => await pickMob(player));
      return await sub.run(player);
    });
  }
  m.add("§b§lAra\n§r§7İsimle veya kimlikle ara", ICON.search, async () => {
    const hit = await searchPick(player, ALL_MOBS, "§l§bMob Ara", "örn: zombi, enderman, wolf");
    return hit ?? (await pickMob(player));
  });
  m.add("§6§lManuel Giriş\n§r§7Kimlik yaz (add-on mobları dahil)", ICON.write, async () => {
    const form = modalForm("§l§6Mob Kimliği");
    textField(form, "§7Varlık kimliği\n§8Örnek: minecraft:zombie veya zombie", "minecraft:zombie", "");
    const res = await show(player, form);
    if (!res || res.canceled) return await pickMob(player);
    const id = normalizeId(res.formValues[0]);
    if (!id) return await pickMob(player);
    if (!isValidMob(id)) {
      tell(player, `§cBöyle bir mob bulunamadı: §f${id}`);
      return await pickMob(player);
    }
    return id;
  });
  m.add("§7« Geri", ICON.back, async () => undefined);
  return await m.run(player);
}

/** Ortak arama ekrani: listeden eslesenleri gosterir, secileni dondurur. */
async function searchPick(player, list, title, placeholder) {
  const form = modalForm(title);
  textField(form, "§7Aranacak kelime", placeholder, "");
  const res = await show(player, form);
  if (!res || res.canceled) return undefined;
  const q = fold(res.formValues[0]).trim();
  if (!q) return undefined;
  const hits = list.filter((x) => fold(x.name).includes(q) || fold(x.id).includes(q)).slice(0, 60);
  if (!hits.length) {
    tell(player, `§cSonuç bulunamadı: §f${res.formValues[0]}`);
    return undefined;
  }
  const m = menu(title, `§7"${res.formValues[0]}" için ${hits.length} sonuç.`);
  for (const hit of hits) {
    m.add(`§f${hit.name}\n§8${hit.id.replace("minecraft:", "")}`, undefined, async () => hit.id);
  }
  m.add("§7« Geri", ICON.back, async () => undefined);
  return await m.run(player);
}

/* ------------------------------------------------------------------ */
/* EKIPMAN VE BUYULER                                                  */
/* ------------------------------------------------------------------ */

async function gearMenu(player) {
  const cfg = getConfig(player);
  const m = menu("§l§bEşya ve Büyüler", "§7Mobun hangi slotuna ne verileceğini seç.");
  for (const slotDef of EQUIP_SLOTS) {
    m.add(`§f${slotDef.name}\n§r${describeSlot(cfg.slots[slotDef.key])}`, slotDef.icon, async () => {
      await slotMenu(player, slotDef);
    });
  }
  m.add("§c§lTüm Slotları Temizle", ICON.reset, async () => {
    for (const s of EQUIP_SLOTS) cfg.slots[s.key] = null;
    saveConfig(player, cfg);
    tell(player, "§aTüm eşya slotları temizlendi.");
    await gearMenu(player);
  });
  m.add("§7« Ana Menü", ICON.back, async () => {
    await openMainMenu(player);
  });
  await m.run(player);
}

async function slotMenu(player, slotDef) {
  const cfg = getConfig(player);
  const current = cfg.slots[slotDef.key];
  const body = current
    ? `§7Slot: §f${slotDef.name}\n§7Eşya: ${describeSlot(current)}\n§7Büyü sayısı: §a${current.enchants.length}`
    : `§7Slot: §f${slotDef.name}\n§8Bu slot boş.`;

  const m = menu(`§l§b${slotDef.name}`, body);
  m.add(current ? "§e§lEşyayı Değiştir" : "§a§lEşya Seç", ICON.gear, async () => {
    const picked = await pickItem(player);
    if (picked) {
      cfg.slots[slotDef.key] = picked;
      saveConfig(player, cfg);
      tell(player, `§a${slotDef.name} slotuna §f${itemName(picked.id)} §akondu.`);
    }
    await slotMenu(player, slotDef);
  });

  if (current) {
    m.add("§d§lBüyü Ekle\n§r§7İstediğin büyü ve seviye", ICON.presets, async () => {
      await addEnchantMenu(player, slotDef);
    });
    m.add(`§b§lBüyüleri Yönet\n§r§7${current.enchants.length} büyü ekli`, ICON.write, async () => {
      await enchantListMenu(player, slotDef);
    });
    m.add(`§6§lEşya Adı\n§r§7Şu an: ${current.name ? colorize(current.name) : "§8yok"}`, ICON.settings, async () => {
      const form = modalForm("§l§6Eşya Adı");
      textField(form, "§7Görünecek ad (&a ile renk verebilirsin)\n§8Boş bırakırsan varsayılan ad kullanılır", "&bEfsanevi Kılıç", current.name);
      const res = await show(player, form);
      if (res && !res.canceled) {
        current.name = String(res.formValues[0] ?? "").slice(0, 64);
        saveConfig(player, cfg);
      }
      await slotMenu(player, slotDef);
    });
    m.add(`§e§lAdet\n§r§7Şu an: ${current.amount}`, undefined, async () => {
      const form = modalForm("§l§eEşya Adedi");
      slider(form, "§7Adet", 1, 64, 1, current.amount);
      const res = await show(player, form);
      if (res && !res.canceled) {
        current.amount = Math.max(1, Math.min(64, Math.floor(res.formValues[0])));
        saveConfig(player, cfg);
      }
      await slotMenu(player, slotDef);
    });
    m.add("§c§lSlotu Temizle", ICON.reset, async () => {
      cfg.slots[slotDef.key] = null;
      saveConfig(player, cfg);
      tell(player, `§a${slotDef.name} slotu temizlendi.`);
      await gearMenu(player);
    });
  }

  m.add("§7« Geri", ICON.back, async () => {
    await gearMenu(player);
  });
  await m.run(player);
}

/** @returns {Promise<object|undefined>} secilen esyanin slot verisi */
async function pickItem(player) {
  const m = menu("§l§aEşya Seç", "§7Bir kategori seç, ara ya da elindekini kullan.");
  for (const cat of ITEM_CATEGORIES) {
    m.add(`${cat.name}\n§r§7${cat.entries.length} eşya`, cat.icon, async () => {
      const sub = menu(cat.name, "§7Eşyayı seç.");
      for (const [id, name] of cat.entries) {
        sub.add(`§f${name}\n§8${id.replace("minecraft:", "")}`, undefined, async () => {
          // Bazi esyalar yalnizca yeni surumlerde var; kullaniciyi burada uyar.
          if (!isValidItem(id)) {
            tell(player, `§c${name} bu Minecraft sürümünde yok (§f${id}§c).`);
            return await pickItem(player);
          }
          return newSlotItem(id);
        });
      }
      sub.add("§7« Geri", ICON.back, async () => await pickItem(player));
      return await sub.run(player);
    });
  }
  m.add("§b§lAra\n§r§7İsimle veya kimlikle ara", ICON.search, async () => {
    const id = await searchPick(player, ALL_ITEMS, "§l§bEşya Ara", "örn: kılıç, diamond, helmet");
    return id ? newSlotItem(id) : await pickItem(player);
  });
  m.add("§6§lElimdeki Eşyayı Kullan\n§r§7Büyüleriyle birlikte kopyalar", ICON.hand, async () => {
    const held = readHeldItem(player);
    if (!held) {
      tell(player, "§cElinde bir eşya yok.");
      return await pickItem(player);
    }
    return held;
  });
  m.add("§6§lManuel Giriş\n§r§7Kimlik yaz (add-on eşyaları dahil)", ICON.write, async () => {
    const form = modalForm("§l§6Eşya Kimliği");
    textField(form, "§7Eşya kimliği\n§8Örnek: minecraft:diamond_sword", "minecraft:diamond_sword", "");
    const res = await show(player, form);
    if (!res || res.canceled) return await pickItem(player);
    const id = normalizeId(res.formValues[0]);
    if (!id) return await pickItem(player);
    if (!isValidItem(id)) {
      tell(player, `§cBöyle bir eşya bulunamadı: §f${id}`);
      return await pickItem(player);
    }
    return newSlotItem(id);
  });
  m.add("§7« Geri", ICON.back, async () => undefined);
  return await m.run(player);
}

/** Oyunda gercekten var olan buyuleri, maksimum seviyeleriyle birlikte listeler. */
function availableEnchantments(slotItem, showAll) {
  let probe;
  try {
    probe = new ItemStack(slotItem.id, 1);
  } catch {
    probe = undefined;
  }
  const out = [];
  for (const [id, name] of ENCHANTMENTS) {
    const type = enchantType(id);
    if (!type) continue; // bu oyun surumunde yok
    const fits = !probe || showAll || canEnchant(probe, id);
    if (fits) out.push({ id, name, max: type.maxLevel });
  }
  return out;
}

async function addEnchantMenu(player, slotDef, showAll = false) {
  const cfg = getConfig(player);
  const slotItem = cfg.slots[slotDef.key];
  if (!slotItem) return await slotMenu(player, slotDef);

  const list = availableEnchantments(slotItem, showAll);
  if (!list.length) {
    tell(player, "§cBu eşyaya uygun büyü bulunamadı. 'Tüm büyüleri göster' seçeneğini dene.");
    return await addEnchantMenu(player, slotDef, true);
  }

  const form = modalForm("§l§dBüyü Ekle");
  dropdown(
    form,
    `§7Büyü §8(${itemName(slotItem.id)})`,
    list.map((e) => `${e.name} §7(maks ${e.max})`),
    0
  );
  slider(form, "§7Seviye §8(oyunun kabul etmediği seviye otomatik düşürülür)", 1, 255, 1, 1);
  toggle(form, "§7Uygun olmayan büyüleri de göster", showAll);

  const res = await show(player, form);
  if (!res || res.canceled) return await slotMenu(player, slotDef);

  const [index, level, wantAll] = res.formValues;
  if (wantAll !== showAll) return await addEnchantMenu(player, slotDef, wantAll === true);

  const chosen = list[index];
  if (!chosen) return await slotMenu(player, slotDef);

  slotItem.enchants = slotItem.enchants.filter((e) => e.id !== chosen.id);
  slotItem.enchants.push({ id: chosen.id, level: Math.max(1, Math.min(255, Math.floor(level))) });
  saveConfig(player, cfg);
  tell(player, `§a${chosen.name} ${roman(Math.floor(level))} §7eklendi §8(${slotDef.name})`);

  // Ust uste birden fazla buyu eklemek yaygin oldugu icin ekranda kaliyoruz.
  await addEnchantMenu(player, slotDef, showAll);
}

async function enchantListMenu(player, slotDef) {
  const cfg = getConfig(player);
  const slotItem = cfg.slots[slotDef.key];
  if (!slotItem) return await slotMenu(player, slotDef);

  const m = menu("§l§bBüyüleri Yönet", `§7${itemName(slotItem.id)} üzerindeki büyüler.\n§8Silmek için üzerine dokun.`);
  if (!slotItem.enchants.length) m.add("§8(büyü yok)", undefined, async () => await enchantListMenu(player, slotDef));
  for (const ench of [...slotItem.enchants]) {
    m.add(`§f${enchantName(ench.id)} ${roman(ench.level)}\n§8seviye ${ench.level} · sil`, undefined, async () => {
      slotItem.enchants = slotItem.enchants.filter((e) => e.id !== ench.id);
      saveConfig(player, cfg);
      tell(player, `§7${enchantName(ench.id)} kaldırıldı.`);
      await enchantListMenu(player, slotDef);
    });
  }
  if (slotItem.enchants.length) {
    m.add("§c§lHepsini Sil", ICON.reset, async () => {
      slotItem.enchants = [];
      saveConfig(player, cfg);
      await enchantListMenu(player, slotDef);
    });
  }
  m.add("§7« Geri", ICON.back, async () => await slotMenu(player, slotDef));
  await m.run(player);
}

/* ------------------------------------------------------------------ */
/* MOB AYARLARI / VERME / SABLONLAR / YARDIM                           */
/* ------------------------------------------------------------------ */

async function settingsMenu(player) {
  const cfg = getConfig(player);
  const form = modalForm("§l§dMob Ayarları");
  textField(form, "§7Mobun ismi §8(&a ile renk verebilirsin)", "&cPatron Zombi", cfg.nameTag);
  slider(form, "§7Kaç tane doğsun", 1, 50, 1, cfg.count);
  slider(form, "§7Kaç blok ötede doğsun", 1, 30, 1, cfg.distance);
  toggle(form, "§7Yavru (bebek) olarak doğsun", cfg.baby);

  const res = await show(player, form);
  if (res && !res.canceled) {
    const [name, count, distance, baby] = res.formValues;
    cfg.nameTag = String(name ?? "").slice(0, 64);
    cfg.count = Math.max(1, Math.min(50, Math.floor(count)));
    cfg.distance = Math.max(1, Math.min(30, Math.floor(distance)));
    cfg.baby = baby === true;
    saveConfig(player, cfg);
    tell(player, "§aMob ayarları kaydedildi.");
  }
  await openMainMenu(player);
}

async function giveMenu(player) {
  const cfg = getConfig(player);
  const filled = EQUIP_SLOTS.filter((s) => cfg.slots[s.key]);
  const m = menu("§l§6Eşyayı Bana Ver", filled.length ? "§7Hangi slottaki eşya envanterine gelsin?" : "§8Önce eşya ayarlamalısın.");
  for (const slotDef of filled) {
    m.add(`§f${slotDef.name}\n§r${describeSlot(cfg.slots[slotDef.key])}`, slotDef.icon, async () => {
      const res = giveToPlayer(player, cfg.slots[slotDef.key]);
      if (res.error) tell(player, res.error);
      else tell(player, `§a${itemName(cfg.slots[slotDef.key].id)} envanterine eklendi.`);
      tell(player, res.warnings);
      await giveMenu(player);
    });
  }
  if (filled.length > 1) {
    m.add("§a§lHepsini Ver", ICON.give, async () => {
      for (const slotDef of filled) {
        const res = giveToPlayer(player, cfg.slots[slotDef.key]);
        if (res.error) tell(player, res.error);
        tell(player, res.warnings);
      }
      tell(player, `§a${filled.length} eşya envanterine eklendi.`);
      await giveMenu(player);
    });
  }
  m.add("§7« Ana Menü", ICON.back, async () => await openMainMenu(player));
  await m.run(player);
}

async function presetsMenu(player) {
  const cfg = getConfig(player);
  const presets = getPresets();
  const m = menu("§l§9Şablonlar", `§7Kayıtlı şablon: §a${presets.length}\n§8Şablonlar dünyadaki herkes tarafından kullanılabilir.`);

  m.add("§a§lMevcut Ayarı Kaydet", ICON.write, async () => {
    const form = modalForm("§l§aŞablon Kaydet");
    textField(form, "§7Şablon adı", `${mobName(cfg.mob)} seti`, "");
    const res = await show(player, form);
    if (res && !res.canceled) {
      const out = savePreset(String(res.formValues[0] ?? ""), cfg);
      tell(player, out.ok ? "§aŞablon kaydedildi." : `§c${out.reason}`);
    }
    await presetsMenu(player);
  });

  for (const preset of presets) {
    m.add(`§f${preset.name}\n§8${mobName(preset.config.mob)} · ${EQUIP_SLOTS.filter((s) => preset.config.slots[s.key]).length} eşya`, ICON.presets, async () => {
      await menu(`§l§9${preset.name}`, summary(preset.config))
        .add("§a§lYükle", ICON.spawn, async () => {
          saveConfig(player, preset.config);
          tell(player, `§a"${preset.name}" şablonu yüklendi.`);
          await openMainMenu(player);
        })
        .add("§c§lSil", ICON.reset, async () => {
          deletePreset(preset.name);
          tell(player, `§7"${preset.name}" silindi.`);
          await presetsMenu(player);
        })
        .add("§7« Geri", ICON.back, async () => await presetsMenu(player))
        .run(player);
    });
  }

  m.add("§7« Ana Menü", ICON.back, async () => await openMainMenu(player));
  await m.run(player);
}

async function helpMenu(player) {
  const body = [
    "§bMob Üretici §7nasıl kullanılır?",
    "",
    "§e1.§f Mob Seç §7— doğacak mobu belirle.",
    "§e2.§f Eşya ve Büyüler §7— 6 slottan birini seç, eşyayı ve büyülerini ayarla.",
    "§e3.§f Mob Ayarları §7— isim, adet, mesafe, yavru.",
    "§e4.§f MOBU OLUŞTUR §7— hepsi birden önüne çıkar.",
    "",
    "§7Menüyü açmak için asayı elinde tutup §fkullan§7 tuşuna bas.",
    features.chat
      ? "§7Sohbete §f!mob §7yazarak da açabilirsin; asa için §f!asa§7."
      : "§7Komutla da açılır: §f/scriptevent mobgen:menu",
    features.chat ? "" : "§7Yeni asa için: §f/scriptevent mobgen:wand",
    "",
    "§7Seviye sınırı: oyun bazı büyülerde üst sınır uygular.",
    "§7İstediğin seviye kabul edilmezse en yükseğine düşürülür",
    "§7ve sohbette bildirilir.",
    "",
    "§7Renk kodu: isim alanlarında §f&a §7yazarak renk verebilirsin.",
  ]
    .filter((line, index, all) => line !== "" || all[index - 1] !== "")
    .join("\n");
  await menu("§l§7Yardım", body)
    .add("§7« Ana Menü", ICON.back, async () => await openMainMenu(player))
    .run(player);
}
