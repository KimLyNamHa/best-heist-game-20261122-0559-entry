// Magpie — The Aldermere Heist: every tuning number in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales it to
// the window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

export const PLAYER = {
  radius: 12,
  walkSpeed: 150,
  sneakSpeed: 85,
  /** Seconds standing in the service door before the level completes. */
  exitChannel: 0.8,
  /** Smoke pellets per level: Q throws one, and cones cannot see you inside it. */
  smokePellets: 2,
  smokeTime: 3,
};

export const GUARD = {
  radius: 13,
  patrolSpeed: 55,
  alertSpeed: 98,
  /** Radians per second a guard can turn its head. */
  turnRate: 3.0,
  /** Seconds a guard waits at each patrol waypoint. */
  waypointPause: 1.2,
  /** Vision cone: how far it sees and how wide the cone is (half-angle). */
  coneRange: 190,
  coneHalfAngle: 0.61,
  /** The alarm rises this fast at point blank and this fast at max range. */
  detectNear: 62,
  detectFar: 20,
  /** How fast the alarm fades when nobody is seen. */
  decay: 25,
  /** Alarm above this: the guard stops and stares at where it saw you. */
  suspiciousAt: 35,
  /** Alarm above this: the guard runs to your last seen spot. */
  alertAt: 70,
  /** Seconds a suspicious guard stares before giving up. */
  stareTime: 1.2,
  /** Seconds an alert guard hunts before returning to patrol. */
  huntTime: 3.0,
};

export const DOG = {
  radius: 11,
  patrolSpeed: 82,
  /** Running inside this radius makes the dog bark. */
  hearRange: 260,
  /** Barking adds this much to the alarm at once. */
  barkSpike: 30,
  /** Seconds before the dog can bark again. */
  barkCooldown: 2.5,
};

/** A wall camera: fixed to a wall, sweeping its red cone back and forth. */
export const CAMERA = {
  radius: 10,
  coneRange: 235,
  coneHalfAngle: 0.42,
  /** Radians per second the camera sweeps. */
  sweepSpeed: 0.55,
  detectNear: 55,
  detectFar: 18,
};

/** A laser beam: on for onTime, off for offTime, then on again. Crossing a
 * live beam trips the alarm at once, so you cross on the dark beat. */
export const LASER = {
  onTime: 2.2,
  offTime: 1.4,
  /** How close to the beam counts as crossing it. */
  tripWidth: 12,
  /** Alarm added when a live beam is crossed. */
  spike: 25,
  /** Seconds before the same beam can trip again. */
  cooldown: 0.8,
};

/** Running makes noise: a pulse every interval, heard this far away. */
export const NOISE = { interval: 0.4, range: 170, spike: 15 };

/** A potted palm hides you completely while you stand behind it. */
export const PALM = { hide: true };

/**
 * The rooms, in order. The index of a room in LEVELS is the index of its
 * palette key here, so validate.js can check a room wears its own palette.
 */
export const ROOM_PALETTES = ['gallery', 'vaultFloor', 'grandVault'];

/**
 * The canonical room palettes — the exact colours levels.js paints each
 * room with, named here so a reader (and the validator) can see what a
 * room is meant to look like without digging through the data tables.
 * These are the source of truth for the palettes; levels.js holds the
 * working copies, and validate.js reports any value that drifts from
 * the canonical one. Do not edit one without the other.
 */
export const PALETTES = {
  // The Gallery: warm marble underfoot, dark wood, brass trim, deep red
  // carpet — a grand room that still feels like a museum, not a vault.
  gallery: {
    floor: '#3a2e20',
    floorAlt: '#453824',
    wall: '#5d4630',
    wallTop: '#8a6a45',
    case: '#33414d',
    caseTop: '#d9a441',
    caseGlass: 'rgba(190, 225, 255, 0.34)',
    palm: '#1e5230',
    palmTop: '#3f9155',
    carpet: '#571a1c',
    accent: '#ffd76a',
    cone: 'rgba(255, 210, 90, 0.20)',
    coneEdge: 'rgba(255, 210, 90, 0.60)',
    cameraCone: 'rgba(255, 80, 70, 0.20)',
    cameraConeEdge: 'rgba(255, 80, 70, 0.65)',
    laser: '#ff4a3d',
    lamp: '#ffb347',
  },
  // The Vault Floor: the same warm base pushed toward copper and amber,
  // so the room reads as the working floor above the vault — busier,
  // warmer, more lamps, more places to hide.
  vaultFloor: {
    floor: '#37291f',
    floorAlt: '#413026',
    wall: '#5d3a28',
    wallTop: '#8a5a3c',
    case: '#33414d',
    caseTop: '#d9a441',
    caseGlass: 'rgba(190, 225, 255, 0.34)',
    palm: '#2a5c33',
    palmTop: '#4a9a4e',
    carpet: '#521619',
    accent: '#ffb347',
    cone: 'rgba(255, 180, 80, 0.20)',
    coneEdge: 'rgba(255, 180, 80, 0.60)',
    cameraCone: 'rgba(255, 80, 70, 0.20)',
    cameraConeEdge: 'rgba(255, 80, 70, 0.65)',
    laser: '#ff4a3d',
    lamp: '#ffb347',
  },
  // The Grand Vault: cold violet stone and ice-blue light, the colour of
  // a locked vault at night — the hardest room looks the coldest.
  grandVault: {
    floor: '#262233',
    floorAlt: '#2e2940',
    wall: '#453d5c',
    wallTop: '#5f5478',
    case: '#33414d',
    caseTop: '#d9a441',
    caseGlass: 'rgba(190, 225, 255, 0.34)',
    palm: '#23473a',
    palmTop: '#3a7a5c',
    carpet: '#3d1836',
    accent: '#7fd4ff',
    cone: 'rgba(255, 210, 90, 0.20)',
    coneEdge: 'rgba(255, 210, 90, 0.60)',
    cameraCone: 'rgba(255, 80, 70, 0.20)',
    cameraConeEdge: 'rgba(255, 80, 70, 0.65)',
    laser: '#ff4a3d',
    lamp: '#7fd4ff',
  },
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best result is kept between visits (this browser only). */
export const BEST_KEY = 'magpie-aldermere-heist.best';

/** A tiny deterministic random source: mulberry32. The game never calls Math.random. */
export function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
