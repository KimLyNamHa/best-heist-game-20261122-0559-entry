# Magpie — The Aldermere Heist

Built for the [make.fun](https://make.fun/bounty/best-heist-game-20261122-0559) bounty
"Make the best heist game".

An original top-down heist game that plays offline in a desktop browser
from static files — no network requests, no libraries, keyboard and mouse.
You are Magpie, a thief in a top hat robbing the Aldermere Museum of
Curiosities after dark: three rooms, three prizes, and an alarm that never
forgets. All art is drawn as original vector art in code, and all sound is
WebAudio tones, so there are no asset files at all.

## How it plays

- **Move** with WASD or the arrow keys. Hold **Shift** to sneak: slower,
  but silent and half as easy to spot.
- **Guards** patrol fixed routes with yellow vision cones. Stand inside a
  cone in line of sight and the alarm fills — faster up close, slower while
  you sneak or stand on carpet. Over 35 a guard stares at you, over 70 it
  gives chase, at 100 the alarm screams and the room starts over.
- **Cameras** are fixed to the walls and sweep red cones back and forth.
  A camera that spots you sends the nearest guard to look.
- **Lasers** blink on and off. Crossing a live beam trips the alarm at
  once — cross on the dark beat.
- **Smoke pellets (Q)**: two per room. Throw one and no cone can see you
  for three seconds. Use them to slip out of a pin.
- **Running makes noise**: guards nearby turn toward the sound. On the
  Vault Floor a hound hears running and barks, alerting every guard.
- **Cover**: display cases and walls block sight, potted palms hide you
  completely while you stand behind one, dark carpet halves detection.
- **The job**: every room has one big prize — the Sun Opal, the Gilded
  Ibis, the Aldermere Crown — and the service door stays locked until it
  is in your pocket. Three small jewels per room are optional loot.
- **Rooms**: 1. The Gallery (2 guards, 1 camera), 2. The Vault Floor
  (4 guards, 2 cameras, a hound, 2 laser lines), 3. The Grand Vault
  (6 guards, 3 cameras, 1 laser wall).

## Files

- `game/index.html` + `game/style.css` — the page.
- `game/src/config.js` — every tuning number.
- `game/src/levels.js` — the three rooms.
- `game/src/world.js` — the simulation (guards, cameras, lasers, alarm).
- `game/src/render.js` — everything the player sees.
- `game/src/input.js` — keyboard and mouse.
- `game/src/audio.js` — WebAudio bleeps.
- `game/src/shots.js` — the screenshot scenes and the autopilot playtest.
- `game/src/main.js` — boot, the fixed-step loop, the screens.

## Screenshots

Real renders of the game's own code in headless Chrome (`?shot=` stages
each scene): the three rooms mid-play and the getaway screen after the
autopilot wins all three rooms (116.0 s, 11/12 pieces).
