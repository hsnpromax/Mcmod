/**
 * actions.js - Yapilandirmayi oyun icinde gerceklestiren islemler:
 * esya olusturma, buyuleme, mob dogurma ve ekipman giydirme.
 */
import { EntityTypes, ItemStack } from "@minecraft/server";
import { SLOT, applyEnchantment, readEnchantments } from "./compat.js";
import { EQUIP_SLOTS, enchantName, itemName, mobName, roman } from "./data.js";

/** Mobilde § yazmak zor; "&a" gibi kisayollari renk koduna cevirir. */
export function colorize(text) {
  return String(text ?? "").replace(/&([0-9a-fk-or])/gi, "§$1");
}

export function normalizeId(raw) {
  const id = String(raw ?? "").trim().toLowerCase().replace(/\s+/g, "_");
  if (!id) return "";
  return id.includes(":") ? id : `minecraft:${id}`;
}

export function isValidItem(id) {
  try {
    new ItemStack(id, 1);
    return true;
  } catch {
    return false;
  }
}

/**
 * Yapilandirmadaki slot verisinden gercek bir ItemStack uretir.
 * @returns {{item?: ItemStack, warnings: string[], error?: string}}
 */
export function buildItem(slotItem) {
  const warnings = [];
  let item;
  try {
    item = new ItemStack(slotItem.id, Math.max(1, Math.min(64, slotItem.amount || 1)));
  } catch {
    return { warnings, error: `§cGeçersiz eşya kimliği: §f${slotItem.id}` };
  }

  if (slotItem.name) {
    try {
      item.nameTag = colorize(slotItem.name);
    } catch {
      warnings.push(`§eEşya adı ayarlanamadı.`);
    }
  }

  for (const ench of slotItem.enchants ?? []) {
    const res = applyEnchantment(item, ench.id, ench.level);
    if (!res.ok) {
      warnings.push(`§e${enchantName(ench.id)} §7eklenemedi (${res.reason ?? "uyumsuz"}).`);
    } else if (res.capped) {
      warnings.push(
        `§e${enchantName(ench.id)} §7${ench.level} yerine §f${res.level}§7 seviyesinde eklendi (oyun sınırı).`
      );
    }
  }
  return { item, warnings };
}

/** Bir slot verisinin okunabilir ozeti: "Elmas Kılıç - Keskinlik V, Ateş Etkisi II" */
export function describeSlot(slotItem) {
  if (!slotItem) return "§8boş";
  const base = itemName(slotItem.id) + (slotItem.amount > 1 ? ` x${slotItem.amount}` : "");
  if (!slotItem.enchants?.length) return `§f${base}`;
  const list = slotItem.enchants.map((e) => `${enchantName(e.id)} ${roman(e.level)}`).join(", ");
  return `§f${base} §7[§b${list}§7]`;
}

/** Oyuncunun baktigi yonde, belirtilen mesafede bir konum uretir. */
function frontOf(player, distance, spread = 0) {
  const loc = player.location;
  const dir = player.getViewDirection();
  const len = Math.hypot(dir.x, dir.z) || 1;
  const jitterX = spread ? (Math.random() - 0.5) * spread : 0;
  const jitterZ = spread ? (Math.random() - 0.5) * spread : 0;
  return {
    x: loc.x + (dir.x / len) * distance + jitterX,
    y: loc.y + 0.5,
    z: loc.z + (dir.z / len) * distance + jitterZ,
  };
}

function makeBaby(entity) {
  for (const ev of ["minecraft:as_baby", "minecraft:entity_born", "minecraft:baby", "minecraft:spawn_baby"]) {
    try {
      entity.triggerEvent(ev);
      return true;
    } catch {
      /* bu mobda bu olay yok, sonrakini dene */
    }
  }
  return false;
}

/**
 * Yapilandirilmis mobu dogurur ve ekipmanini giydirir.
 * @returns {{spawned: number, warnings: string[], error?: string}}
 */
export function spawnConfigured(player, cfg) {
  const warnings = new Set();
  const dimension = player.dimension;

  // Ekipmani bir kez hazirla, her mob icin klonla.
  const prepared = [];
  for (const { key, name } of EQUIP_SLOTS) {
    const slotItem = cfg.slots[key];
    if (!slotItem) continue;
    const built = buildItem(slotItem);
    if (built.error) {
      warnings.add(`${name}: ${built.error}`);
      continue;
    }
    built.warnings.forEach((w) => warnings.add(`${name}: ${w}`));
    prepared.push({ key, name, item: built.item });
  }

  let spawned = 0;
  let equipFailed = false;
  const count = Math.max(1, Math.min(50, cfg.count || 1));

  for (let i = 0; i < count; i++) {
    let entity;
    const spread = count > 1 ? Math.min(6, 1 + count * 0.2) : 0;
    try {
      entity = dimension.spawnEntity(cfg.mob, frontOf(player, cfg.distance, spread));
    } catch {
      try {
        // Onu kapaliysa oyuncunun uzerinde dogurmayi dene.
        entity = dimension.spawnEntity(cfg.mob, {
          x: player.location.x,
          y: player.location.y + 1,
          z: player.location.z,
        });
      } catch (e2) {
        return {
          spawned,
          warnings: [...warnings],
          error: `§cMob doğurulamadı: §f${cfg.mob}§c. Kimliği kontrol et veya başka bir yere bak. (${e2})`,
        };
      }
    }

    spawned++;
    entity.addTag("mobgen");

    if (cfg.nameTag) {
      try {
        entity.nameTag = colorize(cfg.nameTag);
      } catch {
        warnings.add("§eİsim etiketi ayarlanamadı.");
      }
    }
    if (cfg.baby && !makeBaby(entity)) {
      warnings.add("§eBu mobun yavru hâli yok.");
    }

    if (prepared.length) {
      const equippable = entity.getComponent("minecraft:equippable");
      if (!equippable) {
        equipFailed = true;
      } else {
        for (const p of prepared) {
          try {
            equippable.setEquipment(SLOT[p.key], p.item.clone());
          } catch (e) {
            warnings.add(`§e${p.name} slotu bu moba giydirilemedi.`);
          }
        }
      }
    }
  }

  if (equipFailed) {
    warnings.add(`§e${mobName(cfg.mob)} eşya taşıyamıyor, sadece doğuruldu.`);
  }
  return { spawned, warnings: [...warnings] };
}

/** Yapilandirilmis esyayi oyuncunun envanterine verir. */
export function giveToPlayer(player, slotItem) {
  const built = buildItem(slotItem);
  if (built.error) return { ok: false, warnings: built.warnings, error: built.error };
  try {
    const inv = player.getComponent("minecraft:inventory");
    if (inv?.container && inv.container.emptySlotsCount > 0) {
      inv.container.addItem(built.item);
    } else {
      player.dimension.spawnItem(built.item, player.location);
      built.warnings.push("§eEnvanter dolu olduğu için eşya yere düştü.");
    }
    return { ok: true, warnings: built.warnings };
  } catch (e) {
    return { ok: false, warnings: built.warnings, error: `§cEşya verilemedi: ${e}` };
  }
}

/** Oyuncunun elindeki esyayi slot verisine cevirir (buyuleri dahil). */
export function readHeldItem(player) {
  try {
    const inv = player.getComponent("minecraft:inventory");
    const slotIndex = player.selectedSlotIndex ?? player.selectedSlot ?? 0;
    const item = inv?.container?.getItem(slotIndex);
    if (!item) return undefined;
    return {
      id: item.typeId,
      amount: item.amount ?? 1,
      name: item.nameTag ?? "",
      enchants: readEnchantments(item),
    };
  } catch {
    return undefined;
  }
}

/** Verilen kimlikte bir varlik turu var mi? */
export function isValidMob(id) {
  try {
    return EntityTypes.get(id) !== undefined;
  } catch {
    return false;
  }
}
