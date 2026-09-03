/**
 * Mob Uretici (Mob Generator)
 * Minecraft Bedrock - Script API eklentisi
 *
 * Asayi kullandiginda oyuncunun onunde bir menu acilir; oradan istedigi mobu,
 * istedigi esyayi, istedigi buyuyu ve seviyeyi secip mobu olusturabilir.
 */
import { ItemStack, system, world } from "@minecraft/server";
import { openMainMenu } from "./menus.js";
import { features } from "./runtime.js";

export const WAND_ID = "mobgen:mob_wand";
const WAND_GIVEN_KEY = "mobgen:wand_given";
const CHAT_PREFIX = ["!mob", "!menu", ".mob"];
const WAND_COMMANDS = ["!asa", "!wand", "!mobasa"];

/** Ayni anda birden fazla menu acilmasini ve cift tetiklenmeyi engeller. */
const busy = new Set();

async function openMenu(player) {
  if (busy.has(player.id)) return;
  busy.add(player.id);
  try {
    await openMainMenu(player);
  } catch (e) {
    console.warn(`[mobgen] menu hatasi: ${e}\n${e?.stack ?? ""}`);
    try {
      player.sendMessage(`§cMenü açılırken bir hata oluştu: §7${e}`);
    } catch {
      /* oyuncu ayrilmis olabilir */
    }
  } finally {
    busy.delete(player.id);
  }
}

function requestMenu(player) {
  if (!player || busy.has(player.id)) return;
  system.run(() => {
    openMenu(player);
  });
}

function giveWand(player, silent = false) {
  try {
    const inv = player.getComponent("minecraft:inventory")?.container;
    if (!inv) return false;
    const wand = new ItemStack(WAND_ID, 1);
    if (inv.emptySlotsCount > 0) inv.addItem(wand);
    else player.dimension.spawnItem(wand, player.location);
    if (!silent) player.sendMessage("§aMob Üretici Asası envanterine eklendi.");
    return true;
  } catch (e) {
    console.warn(`[mobgen] asa verilemedi: ${e}`);
    if (!silent) player.sendMessage("§cAsa verilemedi. Kaynak paketi etkin mi?");
    return false;
  }
}

function hasWand(player) {
  try {
    const container = player.getComponent("minecraft:inventory")?.container;
    if (!container) return false;
    for (let i = 0; i < container.size; i++) {
      if (container.getItem(i)?.typeId === WAND_ID) return true;
    }
  } catch {
    /* yok say */
  }
  return false;
}

function welcome(player) {
  player.sendMessage("§8§m                              ");
  player.sendMessage("§b§lMob Üretici §ryüklendi!");
  player.sendMessage("§7Asayı elinde tutup §fkullan§7 tuşuna basarak menüyü aç.");
  if (features.chat) {
    player.sendMessage("§7Sohbete §f!mob §7yazarak da açabilirsin. Asa kaybolursa §f!asa§7.");
  } else {
    player.sendMessage("§7Asa kaybolursa: §f/scriptevent mobgen:wand");
  }
  player.sendMessage("§8§m                              ");
}

/* ------------------------------------------------------------------ */
/* Olay baglantilari                                                   */
/* ------------------------------------------------------------------ */

// 1) Asayi havaya kullanma
world.afterEvents.itemUse.subscribe((ev) => {
  if (ev.itemStack?.typeId === WAND_ID) requestMenu(ev.source);
});

// 2) Asayi bir bloga dogru kullanma (bazi surumlerde itemUse yerine bu tetiklenir)
try {
  world.afterEvents.playerInteractWithBlock?.subscribe((ev) => {
    if (ev.itemStack?.typeId === WAND_ID) requestMenu(ev.player);
  });
} catch (e) {
  console.warn(`[mobgen] playerInteractWithBlock kullanilamiyor: ${e}`);
}

// 3) Sohbet komutlari: !mob / !asa
try {
  if (!world.beforeEvents.chatSend) throw new Error("chatSend olayi yok");
  world.beforeEvents.chatSend.subscribe((ev) => {
    const msg = ev.message.trim().toLowerCase();
    if (CHAT_PREFIX.includes(msg)) {
      ev.cancel = true;
      requestMenu(ev.sender);
    } else if (WAND_COMMANDS.includes(msg)) {
      ev.cancel = true;
      const player = ev.sender;
      system.run(() => giveWand(player));
    }
  });
  features.chat = true;
} catch (e) {
  console.warn(`[mobgen] sohbet komutlari kullanilamiyor: ${e}`);
}

// 4) Komut blogu / operator komutu: /scriptevent mobgen:menu  |  mobgen:wand
system.afterEvents.scriptEventReceive.subscribe((ev) => {
  const player = ev.sourceEntity;
  if (!player || player.typeId !== "minecraft:player") return;
  if (ev.id === "mobgen:menu") requestMenu(player);
  else if (ev.id === "mobgen:wand") giveWand(player);
});

// 5) Ilk girişte asayi hediye et
world.afterEvents.playerSpawn.subscribe((ev) => {
  if (!ev.initialSpawn) return;
  const player = ev.player;
  system.runTimeout(() => {
    try {
      if (!player.isValid) return;
      if (!player.getDynamicProperty(WAND_GIVEN_KEY)) {
        player.setDynamicProperty(WAND_GIVEN_KEY, true);
        if (!hasWand(player)) giveWand(player, true);
        welcome(player);
      }
    } catch (e) {
      console.warn(`[mobgen] giris islemi basarisiz: ${e}`);
    }
  }, 40);
});

console.warn("[mobgen] Mob Uretici yuklendi.");
