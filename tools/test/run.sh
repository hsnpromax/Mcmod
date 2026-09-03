#!/usr/bin/env bash
# Eklenti mantigini Minecraft olmadan calistirir.
# Sahte @minecraft/server ve @minecraft/server-ui modulleriyle menu akislarini test eder.
set -euo pipefail
cd "$(dirname "$0")"

rm -rf node_modules scripts
mkdir -p node_modules
cp -r mcstub/@minecraft node_modules/
mkdir -p scripts
cp ../../behavior_packs/mob_generator_bp/scripts/*.js scripts/

echo "### @minecraft/server-ui 2.x (guncel surum) ###"
node run.mjs

echo
echo "### @minecraft/server-ui 1.x (eski surum uyumlulugu) ###"
UI_V1=1 node run.mjs

echo
echo "### surum tespiti yanilirsa yedek imza yolu ###"
UI_MIXED=1 node run.mjs

echo
echo "### main.js yukleme kontrolu ###"
node --input-type=module -e 'const m = await import("./scripts/main.js"); console.log("main.js yuklendi:", m.WAND_ID);'
