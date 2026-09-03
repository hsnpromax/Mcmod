/**
 * compat.js - Farkli @minecraft/server ve @minecraft/server-ui surumleri arasindaki
 * imza farklarini tek yerde toplar. Boylece menu kodu tek bir API konusur.
 */
import * as mc from "@minecraft/server";
import * as ui from "@minecraft/server-ui";

/** server-ui 2.x, secenekleri nesne olarak alir (dropdown(l, i, { defaultValueIndex })). */
export const UI_V2 =
  typeof ui.ModalFormData.prototype.header === "function" ||
  typeof ui.ModalFormData.prototype.divider === "function" ||
  typeof ui.ActionFormData.prototype.divider === "function" ||
  typeof ui.ActionFormData.prototype.header === "function";

/** EquipmentSlot uyeleri surumlere gore PascalCase ya da camelCase olabiliyor. */
function slotOf(pascal, camel) {
  const e = mc.EquipmentSlot ?? {};
  return e[pascal] ?? e[camel] ?? pascal;
}

export const SLOT = {
  Mainhand: slotOf("Mainhand", "mainhand"),
  Offhand: slotOf("Offhand", "offhand"),
  Head: slotOf("Head", "head"),
  Chest: slotOf("Chest", "chest"),
  Legs: slotOf("Legs", "legs"),
  Feet: slotOf("Feet", "feet"),
};

/* ------------------------------------------------------------------ */
/* Form olusturucular                                                  */
/* ------------------------------------------------------------------ */

export function actionForm(title, body) {
  const f = new ui.ActionFormData().title(title);
  if (body) f.body(body);
  return f;
}

export function modalForm(title) {
  return new ui.ModalFormData().title(title);
}

export function button(form, text, icon) {
  if (icon) form.button(text, icon);
  else form.button(text);
  return form;
}

/**
 * Once tespit edilen imzayi dener, hata alirsa digerine duser.
 * Boylece surum tahmini yanlis olsa bile form dogru olusur.
 */
function eitherSignature(v2, v1) {
  const [first, second] = UI_V2 ? [v2, v1] : [v1, v2];
  try {
    first();
  } catch {
    second();
  }
}

export function dropdown(form, label, items, defaultIndex = 0) {
  const i = Math.max(0, Math.min(items.length - 1, defaultIndex | 0));
  eitherSignature(
    () => form.dropdown(label, items, { defaultValueIndex: i }),
    () => form.dropdown(label, items, i)
  );
  return form;
}

export function slider(form, label, min, max, step, defaultValue) {
  eitherSignature(
    () => form.slider(label, min, max, { valueStep: step, defaultValue }),
    () => form.slider(label, min, max, step, defaultValue)
  );
  return form;
}

export function textField(form, label, placeholder, defaultValue = "") {
  eitherSignature(
    () => form.textField(label, placeholder, { defaultValue }),
    () => form.textField(label, placeholder, defaultValue)
  );
  return form;
}

export function toggle(form, label, defaultValue = false) {
  eitherSignature(
    () => form.toggle(label, { defaultValue }),
    () => form.toggle(label, defaultValue)
  );
  return form;
}

/* ------------------------------------------------------------------ */
/* Form gosterimi                                                      */
/* ------------------------------------------------------------------ */

const BUSY = [
  ui.FormCancelationReason?.UserBusy,
  ui.FormCancelationReason?.userBusy,
  "UserBusy",
].filter(Boolean);

export function waitTicks(ticks) {
  if (typeof mc.system.waitTicks === "function") return mc.system.waitTicks(ticks);
  return new Promise((resolve) => mc.system.runTimeout(resolve, ticks));
}

/**
 * Oyuncu bir ekranin icindeyken (ornegin esya kullanma animasyonu) form acilmaz.
 * Bu yuzden "mesgul" cevabi gelirse kisa araliklarla tekrar deniyoruz.
 */
export async function show(player, form, attempts = 60) {
  for (let i = 0; i < attempts; i++) {
    let res;
    try {
      res = await form.show(player);
    } catch (e) {
      console.warn(`[mobgen] form gosterilemedi: ${e}`);
      return undefined;
    }
    if (res.canceled && BUSY.includes(res.cancelationReason)) {
      await waitTicks(10);
      continue;
    }
    return res;
  }
  return undefined;
}

/* ------------------------------------------------------------------ */
/* Buyu (enchantment) katmani                                          */
/* ------------------------------------------------------------------ */

/** @returns {{id: string, maxLevel: number, raw: any} | undefined} */
export function enchantType(id) {
  const types = mc.EnchantmentTypes;
  if (!types || typeof types.get !== "function") return undefined;
  let raw;
  try {
    raw = types.get(id) ?? types.get(`minecraft:${id}`);
  } catch {
    return undefined;
  }
  if (!raw) return undefined;
  return { id, maxLevel: raw.maxLevel ?? 5, raw };
}

function enchantable(item) {
  try {
    return item.getComponent("minecraft:enchantable");
  } catch {
    return undefined;
  }
}

/** Bir buyunun bu esyaya (herhangi bir seviyede) uygulanabilir olup olmadigi. */
export function canEnchant(item, id) {
  const type = enchantType(id);
  if (!type) return false;
  const comp = enchantable(item);
  if (!comp) return true; // eski API: denemeden bilemeyiz
  try {
    return comp.canAddEnchantment({ type: type.raw, level: 1 });
  } catch {
    return false;
  }
}

/**
 * Buyuyu uygular. Oyun istenen seviyeyi kabul etmezse kademeli olarak duserek
 * uygulanabilen en yuksek seviyeyi verir.
 * @returns {{ok: boolean, level: number, capped: boolean, reason?: string}}
 */
export function applyEnchantment(item, id, level) {
  const type = enchantType(id);
  if (!type) return { ok: false, level: 0, capped: false, reason: "bilinmeyen buyu" };

  const comp = enchantable(item);
  if (comp) {
    let lvl = Math.max(1, Math.floor(level));
    let guard = 0;
    while (lvl >= 1 && guard++ < 300) {
      try {
        comp.addEnchantment({ type: type.raw, level: lvl });
        return { ok: true, level: lvl, capped: lvl < level };
      } catch {
        lvl = lvl > type.maxLevel ? type.maxLevel : lvl - 1;
      }
    }
    return { ok: false, level: 0, capped: false, reason: "bu esyaya uygulanamiyor" };
  }

  // Eski API yolu (@minecraft/server 1.x): minecraft:enchantments bileseni
  try {
    const legacy = item.getComponent("minecraft:enchantments");
    if (legacy && mc.Enchantment) {
      const list = legacy.enchantments;
      let lvl = Math.max(1, Math.floor(level));
      let guard = 0;
      while (lvl >= 1 && guard++ < 300) {
        if (list.addEnchantment(new mc.Enchantment(type.raw, lvl))) {
          legacy.enchantments = list;
          return { ok: true, level: lvl, capped: lvl < level };
        }
        lvl = lvl > type.maxLevel ? type.maxLevel : lvl - 1;
      }
    }
  } catch (e) {
    return { ok: false, level: 0, capped: false, reason: String(e) };
  }
  return { ok: false, level: 0, capped: false, reason: "bu esyaya uygulanamiyor" };
}

/** Esyanin uzerindeki buyuleri [{id, level}] olarak dondurur. */
export function readEnchantments(item) {
  const out = [];
  const comp = enchantable(item);
  try {
    if (comp) {
      for (const e of comp.getEnchantments()) {
        out.push({ id: String(e.type?.id ?? e.type).replace("minecraft:", ""), level: e.level });
      }
      return out;
    }
    const legacy = item.getComponent("minecraft:enchantments");
    if (legacy) {
      for (const e of legacy.enchantments) {
        out.push({ id: String(e.type?.id ?? e.type).replace("minecraft:", ""), level: e.level });
      }
    }
  } catch {
    /* yok say */
  }
  return out;
}
