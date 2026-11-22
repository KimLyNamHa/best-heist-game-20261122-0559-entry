// Magpie — The Aldermere Heist
//
// A top-down 2D heist game: Magpie robs the Aldermere Museum across 3 rooms —
// The Gallery, The Vault Floor, The Grand Vault. Guards patrol with vision
// cones, cameras sweep, lasers guard the loot, and the alarm meter rises when
// Magpie is spotted. Grab the loot, reach the exit, get away clean.
//
// This driver copies game/ and screenshots/ into the output dir and writes
// dossier.json describing the build for the make.fun gate.
//
// Local run: mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-game.ts";

const root = join(fileURLToPath(import.meta.url), "..");
const out = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

mkdirSync(out, { recursive: true });
cpSync(join(root, "game"), join(out, "game"), { recursive: true });
cpSync(join(root, "screenshots"), join(out, "screenshots"), { recursive: true });

if (!existsSync(join(out, "game", "index.html"))) {
  throw new Error("game/index.html is missing from the output");
}

const shots = readdirSync(join(out, "screenshots"));
if (shots.length < 3 || shots.length > 4) {
  throw new Error(`expected 3-4 screenshots, found ${shots.length}`);
}
for (const shot of shots) {
  const size = statSync(join(out, "screenshots", shot)).size;
  if (size > 262144) {
    throw new Error(`screenshot ${shot} is ${size} bytes, over the 262144 byte limit`);
  }
}

writeFileSync(
  join(out, "dossier.json"),
  JSON.stringify(
    buildDossier(out, {
      text_max_bytes: 163840,
      screenshots: { max: 4, max_bytes: 262144 },
      game_max_files: 993,
      game_max_bytes: 50331648,
      game_path_max_bytes: 1000,
    }),
  ),
);

// Write-integrity check: the dossier must exist, be non-empty, and parse as JSON.
const dossierText = readFileSync(join(out, "dossier.json"), "utf8");
if (dossierText.length === 0) {
  throw new Error("dossier.json is empty after writing");
}
JSON.parse(dossierText);
