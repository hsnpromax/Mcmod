/**
 * state.js - Oyuncu basina yapilandirma ve kayitli sablonlar.
 * Yapilandirma oyuncunun dinamik ozelliginde JSON olarak saklanir; boylece
 * dunyadan cikip girince ayarlar kaybolmaz.
 */
import { world } from "@minecraft/server";

const CONFIG_KEY = "mobgen:config";
const PRESET_KEY = "mobgen:presets";
const MAX_PRESETS = 20;

/** @returns {{mob: string, count: number, distance: number, nameTag: string, baby: boolean, slots: object}} */
export function defaultConfig() {
  return {
    mob: "minecraft:zombie",
    count: 1,
    distance: 3,
    nameTag: "",
    baby: false,
    slots: {
      Mainhand: null,
      Offhand: null,
      Head: null,
      Chest: null,
      Legs: null,
      Feet: null,
    },
  };
}

/** @returns {{id: string, amount: number, name: string, enchants: {id: string, level: number}[]}} */
export function newSlotItem(id) {
  return { id, amount: 1, name: "", enchants: [] };
}

function sanitize(raw) {
  const def = defaultConfig();
  if (!raw || typeof raw !== "object") return def;
  const cfg = defaultConfig();
  if (typeof raw.mob === "string" && raw.mob) cfg.mob = raw.mob;
  if (Number.isFinite(raw.count)) cfg.count = Math.max(1, Math.min(50, Math.floor(raw.count)));
  if (Number.isFinite(raw.distance)) cfg.distance = Math.max(1, Math.min(30, Math.floor(raw.distance)));
  if (typeof raw.nameTag === "string") cfg.nameTag = raw.nameTag.slice(0, 64);
  cfg.baby = raw.baby === true;
  if (raw.slots && typeof raw.slots === "object") {
    for (const key of Object.keys(cfg.slots)) {
      const s = raw.slots[key];
      if (!s || typeof s.id !== "string" || !s.id) continue;
      cfg.slots[key] = {
        id: s.id,
        amount: Number.isFinite(s.amount) ? Math.max(1, Math.min(64, Math.floor(s.amount))) : 1,
        name: typeof s.name === "string" ? s.name.slice(0, 64) : "",
        enchants: Array.isArray(s.enchants)
          ? s.enchants
              .filter((e) => e && typeof e.id === "string" && Number.isFinite(e.level))
              .map((e) => ({ id: e.id, level: Math.max(1, Math.min(255, Math.floor(e.level))) }))
              .slice(0, 40)
          : [],
      };
    }
  }
  return cfg;
}

export function getConfig(player) {
  try {
    const raw = player.getDynamicProperty(CONFIG_KEY);
    if (typeof raw === "string") return sanitize(JSON.parse(raw));
  } catch (e) {
    console.warn(`[mobgen] yapilandirma okunamadi: ${e}`);
  }
  return defaultConfig();
}

export function saveConfig(player, cfg) {
  try {
    player.setDynamicProperty(CONFIG_KEY, JSON.stringify(cfg));
  } catch (e) {
    console.warn(`[mobgen] yapilandirma kaydedilemedi: ${e}`);
  }
}

export function resetConfig(player) {
  const cfg = defaultConfig();
  saveConfig(player, cfg);
  return cfg;
}

/* ------------------------------------------------------------------ */
/* Sablonlar (dunya genelinde saklanir)                                */
/* ------------------------------------------------------------------ */

/** @returns {{name: string, config: object}[]} */
export function getPresets() {
  try {
    const raw = world.getDynamicProperty(PRESET_KEY);
    if (typeof raw === "string") {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return arr
          .filter((p) => p && typeof p.name === "string" && p.config)
          .map((p) => ({ name: p.name, config: sanitize(p.config) }));
      }
    }
  } catch (e) {
    console.warn(`[mobgen] sablonlar okunamadi: ${e}`);
  }
  return [];
}

function writePresets(list) {
  try {
    world.setDynamicProperty(PRESET_KEY, JSON.stringify(list.slice(0, MAX_PRESETS)));
    return true;
  } catch (e) {
    console.warn(`[mobgen] sablonlar kaydedilemedi: ${e}`);
    return false;
  }
}

/** @returns {{ok: boolean, reason?: string}} */
export function savePreset(name, config) {
  const clean = name.trim().slice(0, 32);
  if (!clean) return { ok: false, reason: "Şablon adı boş olamaz." };
  const list = getPresets().filter((p) => p.name !== clean);
  list.unshift({ name: clean, config });
  if (list.length > MAX_PRESETS) return { ok: false, reason: `En fazla ${MAX_PRESETS} şablon saklanabilir.` };
  return writePresets(list) ? { ok: true } : { ok: false, reason: "Kaydedilemedi." };
}

export function deletePreset(name) {
  writePresets(getPresets().filter((p) => p.name !== name));
}
