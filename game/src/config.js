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
