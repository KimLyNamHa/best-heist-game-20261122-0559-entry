// Magpie — The Aldermere Heist: the screenshot scenes behind
// ?shot=gallery|vaultfloor|grandvault|getaway|title. Each one plays the real
// rules forward from a fresh world for a fixed number of steps, steered by a
// simple autopilot, so the frame is what a short game really looks like and
// the same scene always gives the same frame. The getaway scene plays all
// three rooms through, which is also the playtest: it only shows the win
// screen when the autopilot really wins.

import { STEP, DOG } from './config.js';
import { createWorld, stepWorld, dangerAt, coneDangerAt, laserDangerAt, watcherSets, stepPosition, currentTarget } from './world.js';
import { SCREEN_TITLE, SCREEN_PLAY, SCREEN_WIN } from './render.js';

const DIRS = [
  { mx: 0, my: 0 },
  { mx: 1, my: 0 },
  { mx: -1, my: 0 },
  { mx: 0, my: 1 },
  { mx: 0, my: -1 },
  { mx: 1, my: 1 },
  { mx: 1, my: -1 },
  { mx: -1, my: 1 },
  { mx: -1, my: -1 },
];

function inPalmAt(state, x, y) {
  return state.def.palms.some((b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h);
}

function inCarpetAt(state, x, y) {
  return state.def.carpets.some((s) => x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h);
}

/**
 * The route the pilot walks through each room, in order: the jewels and the
 * prize in the order a careful player takes them, plus the detour points
 * that keep it out of a guard's turning circle. The game itself knows
 * nothing of this; it is the test driver's route, not a rule.
 */
const ROUTES = [
  [
    { x: 120, y: 90 },
    { x: 640, y: 120 },
    { x: 640, y: 380 },
    { x: 1150, y: 120 },
    { x: 1150, y: 90 },
  ],
  [
    { x: 90, y: 90 },
    { x: 640, y: 60 },
    { x: 640, y: 250 },
    { x: 1190, y: 90 },
    { x: 640, y: 520 },
    { x: 1200, y: 400 },
    { x: 1200, y: 150 },
  ],
  [
    { x: 90, y: 90 },
    { x: 250, y: 250 },
    { x: 640, y: 250 },
    { x: 1000, y: 250 },
    { x: 1200, y: 250 },
    { x: 1190, y: 630 },
    { x: 1200, y: 400 },
    { x: 1200, y: 150 },
  ],
];

/**
 * The autopilot: a planner, not a guesser. Every half second it runs A* over
 * a coarse grid of the room, where each cell costs more the more a vision
 * cone covers it now or in the next few seconds, and a cell a cone sees is
 * blocked. A live laser blocks its cells too, so the pilot crosses only on
 * the dark beat. The pilot then walks the planned path, replanning as the
 * patrols move. When the alarm climbs it drops the plan and flees to the
 * safest palm.
 */
const CELL = 40;
const GRID_W = Math.ceil(1280 / CELL);
const GRID_H = Math.ceil(720 / CELL);

function cellWalkable(state, cx, cy) {
  const x = cx * CELL + CELL / 2;
  const y = cy * CELL + CELL / 2;
  for (const s of state.solids) {
    if (x > s.x - 12 && x < s.x + s.w + 12 && y > s.y - 12 && y < s.y + s.h + 12) return false;
  }
  return true;
}

/** A* from the player to (tx, ty) through low-danger cells. Null when no route is open. */
function planPath(state, sets, tx, ty) {
  const danger = new Float32Array(GRID_W * GRID_H);
  for (let cy = 0; cy < GRID_H; cy += 1) {
    for (let cx = 0; cx < GRID_W; cx += 1) {
      const i = cy * GRID_W + cx;
      if (!cellWalkable(state, cx, cy)) { danger[i] = 1; continue; }
      const x = cx * CELL + CELL / 2;
      const y = cy * CELL + CELL / 2;
      const coneNow = state.smokeTime > 0 ? 0 : coneDangerAt(state, x, y, sets.slice(0, 1));
      const coneSoon = state.smokeTime > 0 ? 0 : coneDangerAt(state, x, y, sets.slice(1));
      const laserNow = laserDangerAt(state, x, y, state.time);
      const laserSoon = laserDangerAt(state, x, y, state.time + 1.5);
      danger[i] = Math.max(coneNow, coneSoon * 0.5, laserNow, laserSoon * 0.5);
    }
  }
  const start = { cx: Math.floor(state.player.x / CELL), cy: Math.floor(state.player.y / CELL) };
  let goal = { cx: Math.floor(tx / CELL), cy: Math.floor(ty / CELL) };
  const goalIndex = goal.cy * GRID_W + goal.cx;
  if (danger[goalIndex] >= 1) {
    // The target square itself is watched: aim for the nearest open cell to it.
    let best = null;
    let bestD = Infinity;
    for (let cy = 0; cy < GRID_H; cy += 1) {
      for (let cx = 0; cx < GRID_W; cx += 1) {
        if (danger[cy * GRID_W + cx] >= 1) continue;
        const d = Math.hypot(cx - goal.cx, cy - goal.cy);
        if (d < bestD) { bestD = d; best = { cx, cy }; }
      }
    }
    if (best === null) return null;
    goal = best;
  }
  const key = (cx, cy) => cy * GRID_W + cx;
  const g = new Float32Array(GRID_W * GRID_H).fill(Infinity);
  const came = new Int32Array(GRID_W * GRID_H).fill(-1);
  const closed = new Uint8Array(GRID_W * GRID_H);
  const open = [key(start.cx, start.cy)];
  g[key(start.cx, start.cy)] = 0;
  const heuristic = (cx, cy) => Math.hypot(cx - goal.cx, cy - goal.cy);
  while (open.length > 0) {
    let bestPos = 0;
    for (let i = 1; i < open.length; i += 1) {
      if (g[open[i]] + heuristic(open[i] % GRID_W, Math.floor(open[i] / GRID_W)) < g[open[bestPos]] + heuristic(open[bestPos] % GRID_W, Math.floor(open[bestPos] / GRID_W))) bestPos = i;
    }
    const current = open.splice(bestPos, 1)[0];
    const ccx = current % GRID_W;
    const ccy = Math.floor(current / GRID_W);
    if (current === key(goal.cx, goal.cy)) {
      const path = [];
      let node = current;
      while (node !== -1) {
        path.push({ x: (node % GRID_W) * CELL + CELL / 2, y: Math.floor(node / GRID_W) * CELL + CELL / 2 });
        node = came[node];
      }
      path.reverse();
      const last = path[path.length - 1];
      if (Math.hypot(tx - last.x, ty - last.y) > 5) path.push({ x: tx, y: ty });
      return path;
    }
    closed[current] = 1;
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        if (dx === 0 && dy === 0) continue;
        const nx = ccx + dx;
        const ny = ccy + dy;
        if (nx < 0 || ny < 0 || nx >= GRID_W || ny >= GRID_H) continue;
        const ni = key(nx, ny);
        if (closed[ni] || danger[ni] >= 1) continue;
        // No cutting corners through walls.
        if (dx !== 0 && dy !== 0 && (danger[key(ccx + dx, ccy)] >= 1 || danger[key(ccx, ccy + dy)] >= 1)) continue;
        // Nearness to a cone costs a little, so the plan prefers open ground
        // but does not take absurd detours around merely watchful squares.
        const stepCost = (dx === 0 || dy === 0 ? 1 : 1.414) * (1 + danger[ni] * 6);
        const next = g[current] + stepCost;
        if (next < g[ni]) {
          g[ni] = next;
          came[ni] = current;
          if (!open.includes(ni)) open.push(ni);
        }
      }
    }
  }
  return null;
}

class Pilot {
  constructor() {
    this.reset(null);
  }

  reset(state) {
    this.state = state;
    this.fleeing = false;
    this.routeIndex = 0;
    this.routeTimer = 0;
    this.path = null;
    this.pathTarget = null;
    this.replanTimer = 0;
  }

  /** The next route point, or the prize, or the nearest jewel, or the door. */
  currentTarget(state) {
    const route = ROUTES[state.levelIndex];
    while (this.routeIndex < route.length) {
      const point = route[this.routeIndex];
      if (Math.hypot(point.x - state.player.x, point.y - state.player.y) < 20) {
        this.routeIndex += 1;
        this.routeTimer = 0;
        continue;
      }
      return point;
    }
    return currentTarget(state);
  }

  next(state) {
    if (this.state !== state) this.reset(state);
    const p = state.player;
    const sets = watcherSets(state);

    // Flee: the alarm is climbing, so break line of sight in the safest palm.
    if (state.detection > 25) this.fleeing = true;
    if (this.fleeing) {
      if (inPalmAt(state, p.x, p.y) || state.detection < 15) {
        this.fleeing = false;
        this.path = null;
      } else {
        let palm = null;
        let palmScore = -Infinity;
        for (const b of state.def.palms) {
          const cx = b.x + b.w / 2;
          const cy = b.y + b.h / 2;
          const score = -Math.hypot(cx - p.x, cy - p.y) - dangerAt(state, cx, cy, sets) * 200;
          if (score > palmScore) { palmScore = score; palm = { x: cx, y: cy }; }
        }
        const dir = this.steerToward(state, palm.x, palm.y, false, sets);
        if (dir === null) {
          // Pinned inside a cone with nowhere safe to step: throw smoke and
          // walk out of it invisible instead of standing there getting seen.
          if (state.smokeLeft > 0 && state.smokeTime <= 0) return { mx: 0, my: 0, sneak: true, smoke: true };
          return { mx: 0, my: 0, sneak: true, smoke: false };
        }
        return { mx: dir.mx, my: dir.my, sneak: false, smoke: false };
      }
    }

    const target = this.currentTarget(state);
    // A route point that will not come: skip it rather than stall on it.
    if (this.routeIndex < ROUTES[state.levelIndex].length) {
      this.routeTimer += STEP;
      if (this.routeTimer > 90) {
        this.routeIndex += 1;
        this.routeTimer = 0;
        this.path = null;
      }
    }

    this.replanTimer -= STEP;
    const targetMoved = this.pathTarget === null || Math.hypot(target.x - this.pathTarget.x, target.y - this.pathTarget.y) > 60;
    if (this.path === null || targetMoved || this.replanTimer <= 0) {
      this.path = planPath(state, sets, target.x, target.y);
      this.pathTarget = { x: target.x, y: target.y };
      this.replanTimer = 0.5;
    }
    if (this.path === null || this.path.length === 0) {
      // No open route right now: hold still and let the patrols move on —
      // unless you are standing on a live beam, in which case step off it,
      // or you are pinned inside a cone, in which case throw smoke.
      if (laserDangerAt(state, p.x, p.y, state.time) >= 1) {
        const dir = this.steerToward(state, target.x, target.y, true, sets);
        if (dir !== null) return { mx: dir.mx, my: dir.my, sneak: true, smoke: false };
      }
      if (state.smokeLeft > 0 && state.smokeTime <= 0 && state.detection > 0) {
        return { mx: 0, my: 0, sneak: true, smoke: true };
      }
      return { mx: 0, my: 0, sneak: true, smoke: false };
    }
    while (this.path.length > 1 && Math.hypot(this.path[0].x - p.x, this.path[0].y - p.y) < 15) {
      this.path.shift();
    }
    const next = this.path[0];
    const dangerHere = dangerAt(state, p.x, p.y, sets);
    const dogNear = !!(state.dog && Math.hypot(state.dog.x - p.x, state.dog.y - p.y) < DOG.hearRange + 40);
    const sneak = dangerHere > 0.15 || dogNear;
    const dir = this.steerToward(state, next.x, next.y, sneak, sets);
    if (dir === null) {
      if (state.smokeLeft > 0 && state.smokeTime <= 0) return { mx: 0, my: 0, sneak: true, smoke: true };
      return { mx: 0, my: 0, sneak: true, smoke: false };
    }
    return { mx: dir.mx, my: dir.my, sneak, smoke: false };
  }

  /** The best of the nine directions for a point target, or staying put.
   * A cone in the way blocks a direction outright; a live laser only makes
   * it costly, so the pilot never freezes on a beam. */
  steerToward(state, tx, ty, sneak, sets) {
    const p = state.player;
    let best = DIRS[0];
    let bestScore = -Infinity;
    for (const d of DIRS) {
      const len = Math.hypot(d.mx, d.my) || 1;
      const speed = sneak ? 85 : 150;
      // Score where the move really lands: a wall stops a push into a corner,
      // so that move must not look better than one that actually moves.
      const landed = stepPosition(state, p.x, p.y, p.radius, (d.mx / len) * speed * STEP, (d.my / len) * speed * STEP);
      const nx = landed.x;
      const ny = landed.y;
      // Judge the step by the cones as they are now: a cone arriving in
      // seconds is not a wall, and treating it as one herds the pilot
      // into a corner. The planner, replanned twice a second, keeps the
      // route fresh, and the flee branch handles a real alarm. Inside
      // smoke no cone can see you, so the cone danger is zero there.
      const coneDanger = state.smokeTime > 0 ? 0 : coneDangerAt(state, nx, ny, sets.slice(0, 1));
      if (coneDanger >= 1) continue;
      const laserDanger = laserDangerAt(state, nx, ny, state.time);
      const dist = Math.hypot(tx - nx, ty - ny);
      let score = -dist * 5 - coneDanger * 60 - laserDanger * 80;
      if (inPalmAt(state, nx, ny)) score += 2;
      if (inCarpetAt(state, nx, ny)) score += 1;
      if (score > bestScore) { bestScore = score; best = d; }
    }
    return bestScore === -Infinity ? null : best;
  }
}

const pilot = new Pilot();

/** One autopilot move for the given world. The `stuck` argument is ignored: the pilot tracks its own progress. */
export function autopilot(state, _stuck) {
  return pilot.next(state);
}

/** The pilot's mode, for debugging. */
export function pilotState() {
  return { fleeing: pilot.fleeing, routeIndex: pilot.routeIndex, pathLen: pilot.path ? pilot.path.length : -1, path0: pilot.path && pilot.path[0] ? `(${pilot.path[0].x},${pilot.path[0].y})` : '-' };
}

/** Run one level with the autopilot. Returns 'won', 'caught' or 'time'. */
function playLevel(levelIndex, budgetSeconds) {
  const state = createWorld(levelIndex);
  let steps = 0;
  const maxSteps = Math.floor(budgetSeconds / STEP);
  while (steps < maxSteps) {
    if (state.won) return { result: 'won', state, time: state.time };
    if (state.caught) return { result: 'caught', state, time: state.time };
    stepWorld(state, autopilot(state), STEP);
    steps += 1;
  }
  return { result: 'time', state, time: state.time };
}

/** Run a level for a fixed time without needing to win it, for a play frame. */
function playFrame(levelIndex, seconds) {
  let state = createWorld(levelIndex);
  const maxSteps = Math.floor(seconds / STEP);
  // Count simulated time across attempts: resetting the step count on a
  // win or a catch made this loop forever once the pilot could win a level.
  let done = 0;
  while (done < maxSteps) {
    if (state.won || state.caught) {
      // A fresh attempt still shows real play.
      state = createWorld(levelIndex);
    }
    stepWorld(state, autopilot(state), STEP);
    done += 1;
  }
  return { state, time: state.time };
}

/**
 * Set up the named scene and return the view to render plus a one-line result
 * the page title reports (the screenshot driver prints the title).
 */
export function stageShot(name) {
  if (name === 'title') {
    const state = createWorld(0);
    for (let i = 0; i < 4 / STEP; i += 1) stepWorld(state, { mx: 0, my: 0, sneak: false, smoke: false }, STEP);
    return { view: { state, screen: SCREEN_TITLE, levelTime: 0, totalTime: 0, lootTotal: 0, best: null, now: 0, caughtTime: 0, muted: false }, result: 'title' };
  }
  if (name === 'gallery' || name === 'vaultfloor' || name === 'grandvault') {
    const levelIndex = name === 'gallery' ? 0 : name === 'vaultfloor' ? 1 : 2;
    const { state, time } = playFrame(levelIndex, 24);
    return { view: { state, screen: SCREEN_PLAY, levelTime: time, totalTime: time, lootTotal: state.lootGot + (state.prizeGot ? 1 : 0), best: null, now: 0, caughtTime: 0, muted: false }, result: `play loot ${state.lootGot}/3 prize ${state.prizeGot ? 'yes' : 'no'} time ${time.toFixed(1)}s` };
  }
  if (name === 'getaway') {
    let totalTime = 0;
    let lootTotal = 0;
    for (let levelIndex = 0; levelIndex < 3; levelIndex += 1) {
      let won = false;
      for (let attempt = 0; attempt < 3 && !won; attempt += 1) {
        const run = playLevel(levelIndex, 240);
        if (run.result === 'won') {
          won = true;
          totalTime += run.time;
          lootTotal += run.state.lootGot + (run.state.prizeGot ? 1 : 0);
        }
      }
      if (!won) {
        const state = createWorld(levelIndex);
        return { view: { state, screen: SCREEN_PLAY, levelTime: 0, totalTime, lootTotal, best: null, now: 0, caughtTime: 0, muted: false }, result: `stuck level ${levelIndex + 1}` };
      }
    }
    const state = createWorld(2);
    state.won = true;
    return { view: { state, screen: SCREEN_WIN, levelTime: 0, totalTime, lootTotal, best: null, now: 0, caughtTime: 0, muted: false }, result: `win total ${totalTime.toFixed(1)}s loot ${lootTotal}/12` };
  }
  return stageShot('title');
}
