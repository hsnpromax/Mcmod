// Test icin sahte @minecraft/server modulu (davranisi oyuna yakin tutulmustur).
export const log = { spawns: [], equips: [], messages: [], sounds: [], items: [] };

const VALID_ITEMS = new Set();
for (const t of ["wooden","stone","iron","golden","diamond","netherite"])
  for (const s of ["sword","axe","pickaxe","shovel","hoe"]) VALID_ITEMS.add(`minecraft:${t}_${s}`);
for (const t of ["leather","chainmail","iron","golden","diamond","netherite"])
  for (const s of ["helmet","chestplate","leggings","boots"]) VALID_ITEMS.add(`minecraft:${t}_${s}`);
for (const i of ["bow","crossbow","arrow","shield","trident","mace","elytra","turtle_helmet",
  "totem_of_undying","fishing_rod","shears","flint_and_steel","carrot_on_a_stick","enchanted_book",
  "golden_apple","enchanted_golden_apple","diamond","emerald","stick","name_tag","tnt","torch","saddle",
  "wind_charge","brush","warped_fungus_on_a_stick","cooked_beef","bread","netherite_ingot","ender_pearl",
  "nether_star","carved_pumpkin","skeleton_skull","zombie_head","creeper_head","dragon_head",
  "wither_skeleton_skull"]) VALID_ITEMS.add(`minecraft:${i}`);
VALID_ITEMS.add("mobgen:mob_wand");

// id -> maks seviye (vanilya degerleri)
const ENCHANTS = {
  sharpness:5, smite:5, bane_of_arthropods:5, knockback:2, fire_aspect:2, looting:3, efficiency:5,
  silk_touch:1, unbreaking:3, fortune:3, mending:1, power:5, punch:2, flame:1, infinity:1, multishot:1,
  piercing:4, quick_charge:3, impaling:5, riptide:3, loyalty:3, channeling:1, density:5, breach:4,
  wind_burst:3, protection:4, fire_protection:4, blast_protection:4, projectile_protection:4,
  feather_falling:4, thorns:3, respiration:3, aqua_affinity:1, depth_strider:3, frost_walker:2,
  soul_speed:3, swift_sneak:3, luck_of_the_sea:3, lure:3, binding:1, vanishing:1,
};
// hangi buyu hangi esya turune uyar (kabaca)
function applicable(itemId, ench) {
  const id = itemId.replace("minecraft:", "");
  const sword = id.endsWith("_sword"), tool = /_(axe|pickaxe|shovel|hoe)$/.test(id);
  const armor = /_(helmet|chestplate|leggings|boots)$/.test(id) || id === "turtle_helmet";
  const helmet = id.endsWith("_helmet") || id === "turtle_helmet";
  const boots = id.endsWith("_boots");
  const bow = id === "bow", cb = id === "crossbow", tri = id === "trident", mace = id === "mace";
  const book = id === "enchanted_book";
  if (book) return true;
  switch (ench) {
    case "sharpness": case "smite": case "bane_of_arthropods": return sword || (tool && /_axe$/.test(id));
    case "knockback": case "fire_aspect": case "looting": return sword;
    case "efficiency": case "silk_touch": case "fortune": return tool;
    case "unbreaking": case "mending": return sword || tool || armor || bow || cb || tri || mace || id === "shield" || id === "elytra" || id === "fishing_rod";
    case "power": case "punch": case "flame": case "infinity": return bow;
    case "multishot": case "piercing": case "quick_charge": return cb;
    case "impaling": case "riptide": case "loyalty": case "channeling": return tri;
    case "density": case "breach": case "wind_burst": return mace;
    case "protection": case "fire_protection": case "blast_protection": case "projectile_protection": case "thorns": return armor;
    case "feather_falling": case "depth_strider": case "frost_walker": case "soul_speed": return boots;
    case "respiration": case "aqua_affinity": return helmet;
    case "swift_sneak": return id.endsWith("_leggings");
    case "luck_of_the_sea": case "lure": return id === "fishing_rod";
    case "binding": return armor || id === "elytra";
    case "vanishing": return true;
    default: return false;
  }
}

export class EnchantmentType {
  constructor(id, maxLevel) { this.id = id; this.maxLevel = maxLevel; }
}
export const EnchantmentTypes = {
  get(id) {
    const key = String(id).replace("minecraft:", "");
    return ENCHANTS[key] !== undefined ? new EnchantmentType(key, ENCHANTS[key]) : undefined;
  },
};

class Enchantable {
  constructor(item) { this.item = item; this.list = []; }
  canAddEnchantment({ type, level }) {
    return applicable(this.item.typeId, type.id) && level >= 1 && level <= type.maxLevel;
  }
  addEnchantment({ type, level }) {
    if (!this.canAddEnchantment({ type, level })) throw new Error("EnchantmentLevelOutOfBoundsError");
    this.list.push({ type, level });
  }
  getEnchantments() { return this.list.slice(); }
}

export class ItemStack {
  constructor(typeId, amount = 1) {
    if (!VALID_ITEMS.has(typeId)) throw new Error(`invalid item ${typeId}`);
    this.typeId = typeId; this.amount = amount; this.nameTag = undefined;
    this._ench = new Enchantable(this);
  }
  getComponent(id) {
    if (id === "minecraft:enchantable") {
      const enchantableItem = /_(sword|axe|pickaxe|shovel|hoe|helmet|chestplate|leggings|boots)$/.test(this.typeId)
        || ["minecraft:bow","minecraft:crossbow","minecraft:trident","minecraft:mace","minecraft:shield",
            "minecraft:elytra","minecraft:turtle_helmet","minecraft:fishing_rod","minecraft:enchanted_book"].includes(this.typeId);
      return enchantableItem ? this._ench : undefined;
    }
    return undefined;
  }
  clone() {
    const c = new ItemStack(this.typeId, this.amount);
    c.nameTag = this.nameTag;
    c._ench.list = this._ench.list.slice();
    return c;
  }
}

const VALID_MOBS = new Set();
export function registerMobs(ids) { for (const i of ids) VALID_MOBS.add(i); }
export const EntityTypes = { get: (id) => (VALID_MOBS.has(id) ? { id } : undefined) };

export const EquipmentSlot = {
  Head: "Head", Chest: "Chest", Legs: "Legs", Feet: "Feet", Mainhand: "Mainhand", Offhand: "Offhand",
};

class Entity {
  constructor(typeId) { this.typeId = typeId; this.tags = []; this.nameTag = undefined; this.equipment = {}; }
  addTag(t) { this.tags.push(t); }
  triggerEvent(ev) { if (ev !== "minecraft:as_baby") throw new Error("no event"); this.baby = true; }
  getComponent(id) {
    if (id === "minecraft:equippable" && this.typeId !== "minecraft:creeper") {
      return { setEquipment: (slot, item) => { this.equipment[slot] = item; log.equips.push({ entity: this, slot, item }); } };
    }
    return undefined;
  }
}

class Container {
  constructor(size = 36) { this.size = size; this.slots = new Array(size).fill(undefined); }
  get emptySlotsCount() { return this.slots.filter((s) => !s).length; }
  addItem(item) { const i = this.slots.findIndex((s) => !s); if (i < 0) throw new Error("full"); this.slots[i] = item; log.items.push(item); }
  getItem(i) { return this.slots[i]; }
  setItem(i, item) { this.slots[i] = item; }
}

class Dimension {
  spawnEntity(typeId, location) {
    if (!VALID_MOBS.has(typeId)) throw new Error(`invalid entity ${typeId}`);
    const e = new Entity(typeId);
    log.spawns.push({ typeId, location, entity: e });
    return e;
  }
  spawnItem(item, location) { log.items.push(item); }
}

export class Player {
  constructor(id = "p1") {
    this.id = id; this.typeId = "minecraft:player"; this.isValid = true;
    this.location = { x: 0, y: 64, z: 0 };
    this.dimension = new Dimension();
    this.selectedSlotIndex = 0;
    this._props = new Map();
    this._inv = new Container();
  }
  getViewDirection() { return { x: 0, y: 0, z: 1 }; }
  getComponent(id) { return id === "minecraft:inventory" ? { container: this._inv } : undefined; }
  sendMessage(m) { log.messages.push(typeof m === "string" ? m : JSON.stringify(m)); }
  playSound(s) { log.sounds.push(s); }
  getDynamicProperty(k) { return this._props.get(k); }
  setDynamicProperty(k, v) { this._props.set(k, v); }
}

const worldProps = new Map();
function eventHub() {
  return new Proxy({}, { get: () => ({ subscribe: () => {} }) });
}
export const world = {
  afterEvents: eventHub(),
  beforeEvents: eventHub(),
  getDynamicProperty: (k) => worldProps.get(k),
  setDynamicProperty: (k, v) => worldProps.set(k, v),
};
export const system = {
  run: (fn) => fn(),
  runTimeout: (fn) => fn(),
  waitTicks: () => Promise.resolve(),
  afterEvents: eventHub(),
  beforeEvents: eventHub(),
};
