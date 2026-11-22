// Magpie — The Aldermere Heist: level-data validator.
//
// The three rooms are plain data tables in levels.js, and a typo in one
// (a guard waypoint off the floor, a camera sweeping nowhere, a prize
// inside a wall, a jewel missing) would only show up as a weird room
// while playing. This module checks every room against the tuning in
// config.js and reports each problem as a plain string, so the game can
// log them at boot and a test can fail on them. It only reads the
// tables — it never changes how a room plays, what the renderer draws,
// or where anything sits.
//
// The checks run once when this module is imported, inside a try/catch,
// so a bad table can never stop the game from starting: problems are
// logged to the console, and only the exported assertLevels() throws,
// which is meant for tests, not for play.

import { FIELD, PLAYER, GUARD, DOG, CAMERA, LASER, PALETTES, ROOM_PALETTES } from './config.js';
import { LEVELS } from './levels.js';

/** Every colour key a room palette must define, in one place. */
const PALETTE_KEYS = [
  'floor',
  'floorAlt',
  'wall',
  'wallTop',
  'case',
  'caseTop',
  'caseGlass',
  'palm',
  'palmTop',
  'carpet',
  'accent',
  'cone',
  'coneEdge',
  'cameraCone',
  'cameraConeEdge',
  'laser',
  'lamp',
];

/** True when the point has numbers and sits inside the 1280x720 field. */
function isPointInField(point) {
  return (
    point != null &&
    typeof point.x === 'number' &&
    typeof point.y === 'number' &&
    Number.isFinite(point.x) &&
    Number.isFinite(point.y) &&
    point.x >= 0 &&
    point.y >= 0 &&
    point.x <= FIELD.width &&
    point.y <= FIELD.height
  );
}

/** True when the rectangle has a positive size and sits inside the field. */
function isRectInField(rect) {
  return (
    rect != null &&
    typeof rect.x === 'number' &&
    typeof rect.y === 'number' &&
    typeof rect.w === 'number' &&
    typeof rect.h === 'number' &&
    rect.w > 0 &&
    rect.h > 0 &&
    rect.x >= 0 &&
    rect.y >= 0 &&
    rect.x + rect.w <= FIELD.width &&
    rect.y + rect.h <= FIELD.height
  );
}

/**
 * True when the point lies strictly inside the rectangle. A point exactly
 * on an edge does not count: the rooms deliberately park a patrol
 * waypoint on the corner of a display case (Grand Vault guard 6 stands
 * at the case's corner), and that is a chosen position, not a typo.
 */
function isPointInRect(point, rect) {
  return (
    point.x > rect.x &&
    point.x < rect.x + rect.w &&
    point.y > rect.y &&
    point.y < rect.y + rect.h
  );
}

/** True when two rectangles overlap at all. */
function rectsOverlap(a, b) {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

/** True when the value is a #rrggbb hex colour or an rgba() colour. */
function isColorString(value) {
  if (typeof value !== 'string' || value.length === 0) return false;
  if (/^#[0-9a-fA-F]{6}$/.test(value)) return true;
  const rgba = /^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(0|1|0?\.\d+)\s*\)$/.exec(value);
  if (!rgba) return false;
  const red = Number(rgba[1]);
  const green = Number(rgba[2]);
  const blue = Number(rgba[3]);
  return red <= 255 && green <= 255 && blue <= 255;
}

/**
 * Check one room's palette: every key present, every value a real colour,
 * and every value identical to the canonical palette in config.js, so a
 * room can never drift away from the palette it is meant to wear.
 */
function checkPalette(level, index, problems) {
  const room = `Room ${index + 1} (${level.name || 'unnamed'})`;
  const key = ROOM_PALETTES[index];
  const canonical = key ? PALETTES[key] : null;
  const palette = level.palette || {};
  for (const name of PALETTE_KEYS) {
    const value = palette[name];
    if (value === undefined) {
      problems.push(`${room}: palette is missing ${name}.`);
      continue;
    }
    if (!isColorString(value)) {
      problems.push(`${room}: palette ${name} (${value}) is not a hex or rgba colour.`);
    } else if (canonical && canonical[name] !== undefined && canonical[name] !== value) {
      problems.push(`${room}: palette ${name} (${value}) does not match the canonical ${canonical[name]}.`);
    }
  }
}

/**
 * Check the tuning numbers the rooms share: laser blink times, smoke
 * pellets, and the vision cones. A zero or negative value here would
 * make a whole mechanic silently do nothing.
 */
function checkSharedTuning(problems) {
  if (!(LASER.onTime > 0)) problems.push(`Lasers: onTime ${LASER.onTime} must be positive.`);
  if (!(LASER.offTime > 0)) problems.push(`Lasers: offTime ${LASER.offTime} must be positive.`);
  if (!(LASER.onTime + LASER.offTime > 0)) problems.push('Lasers: the blink cycle must be longer than zero.');
  if (!Number.isInteger(PLAYER.smokePellets) || PLAYER.smokePellets < 0 || PLAYER.smokePellets > 5) {
    problems.push(`Smoke pellets per room is ${PLAYER.smokePellets}, expected a whole number from 0 to 5.`);
  }
  if (!(GUARD.coneRange > 0)) problems.push(`Guards: cone range ${GUARD.coneRange} must be positive.`);
  if (!(GUARD.coneHalfAngle > 0 && GUARD.coneHalfAngle < Math.PI / 2)) {
    problems.push(`Guards: cone half-angle ${GUARD.coneHalfAngle} must be between 0 and PI/2.`);
  }
  if (!(CAMERA.coneRange > 0)) problems.push(`Cameras: cone range ${CAMERA.coneRange} must be positive.`);
  if (!(CAMERA.sweepSpeed > 0)) problems.push(`Cameras: sweep speed ${CAMERA.sweepSpeed} must be positive.`);
  if (!(DOG.hearRange > 0)) problems.push(`Hound: hearing range ${DOG.hearRange} must be positive.`);
}

/**
 * Check one room and return its problems. Every problem names the room
 * and the thing that is wrong, so a log line is enough to find it.
 */
function validateLevel(level, index) {
  const problems = [];
  const room = `Room ${index + 1} (${level.name || 'unnamed'})`;

  if (typeof level.name !== 'string' || level.name.trim() === '') {
    problems.push(`${room}: no name.`);
  }
  if (typeof level.prize !== 'string' || level.prize.trim() === '') {
    problems.push(`${room}: no prize name.`);
  }

  // The thief must start on the floor, not inside a wall or a case.
  if (!isPointInField(level.playerStart)) {
    problems.push(`${room}: player start is outside the ${FIELD.width}x${FIELD.height} field.`);
  } else {
    for (const wall of level.walls || []) {
      if (isPointInRect(level.playerStart, wall)) problems.push(`${room}: player starts inside a wall.`);
    }
    for (const display of level.cases || []) {
      if (isPointInRect(level.playerStart, display)) problems.push(`${room}: player starts inside a display case.`);
    }
  }

  // The service door must exist, sit on the floor, and stay clear of
  // walls and cases, or the room could never be left.
  if (!level.exit) {
    problems.push(`${room}: no service door.`);
  } else if (!isRectInField(level.exit)) {
    problems.push(`${room}: service door is outside the field.`);
  } else {
    for (const wall of level.walls || []) {
      if (rectsOverlap(level.exit, wall)) problems.push(`${room}: service door overlaps a wall.`);
    }
    for (const display of level.cases || []) {
      if (rectsOverlap(level.exit, display)) problems.push(`${room}: service door overlaps a display case.`);
    }
  }

  // The prize must sit on the floor, out in the open, not inside a wall
  // or a display case where it could never be picked up.
  if (!isPointInField(level.prizeLoot)) {
    problems.push(`${room}: prize ${level.prize || ''} is outside the field.`);
  } else {
    for (const wall of level.walls || []) {
      if (isPointInRect(level.prizeLoot, wall)) problems.push(`${room}: prize sits inside a wall.`);
    }
    for (const display of level.cases || []) {
      if (isPointInRect(level.prizeLoot, display)) problems.push(`${room}: prize sits inside a display case.`);
    }
  }

  // Exactly three small jewels per room, each on the floor and clear of
  // walls and cases, or the 12-piece total on the win screen is a lie.
  const loot = level.loot || [];
  if (loot.length !== 3) {
    problems.push(`${room}: ${loot.length} small jewel(s), expected 3.`);
  }
  loot.forEach((jewel, j) => {
    if (!isPointInField(jewel)) {
      problems.push(`${room}: jewel ${j + 1} is outside the field.`);
    } else {
      for (const wall of level.walls || []) {
        if (isPointInRect(jewel, wall)) problems.push(`${room}: jewel ${j + 1} sits inside a wall.`);
      }
      for (const display of level.cases || []) {
        if (isPointInRect(jewel, display)) problems.push(`${room}: jewel ${j + 1} sits inside a display case.`);
      }
    }
  });

  // Guards: at least one patrol, every patrol at least two waypoints
  // (one waypoint is standing still, not a patrol), every waypoint on
  // the floor and clear of walls and cases.
  const guards = level.guards || [];
  if (guards.length === 0) {
    problems.push(`${room}: no guards on patrol.`);
  }
  guards.forEach((guard, g) => {
    const points = guard.waypoints || [];
    if (points.length < 2) {
      problems.push(`${room}: guard ${g + 1} has ${points.length} waypoint(s), a patrol needs at least 2.`);
    }
    points.forEach((point, p) => {
      if (!isPointInField(point)) {
        problems.push(`${room}: guard ${g + 1} waypoint ${p + 1} is outside the field.`);
      } else {
        for (const wall of level.walls || []) {
          if (isPointInRect(point, wall)) problems.push(`${room}: guard ${g + 1} waypoint ${p + 1} sits inside a wall.`);
        }
        for (const display of level.cases || []) {
          if (isPointInRect(point, display)) problems.push(`${room}: guard ${g + 1} waypoint ${p + 1} sits inside a display case.`);
        }
      }
    });
  });

  // The hound patrols like a guard, with the same rules.
  if (level.dog) {
    const points = level.dog.waypoints || [];
    if (points.length < 2) {
      problems.push(`${room}: the hound has ${points.length} waypoint(s), a patrol needs at least 2.`);
    }
    points.forEach((point, p) => {
      if (!isPointInField(point)) {
        problems.push(`${room}: hound waypoint ${p + 1} is outside the field.`);
      }
    });
  }

  // Two patrols must never share a waypoint: two watchers standing on
  // the same spot is either a typo or a wasted guard.
  const patrolPaths = guards.map((guard, g) => ({ label: `guard ${g + 1}`, points: guard.waypoints || [] }));
  if (level.dog) patrolPaths.push({ label: 'hound', points: level.dog.waypoints || [] });
  const seenWaypoints = new Map();
  for (const path of patrolPaths) {
    for (const point of path.points) {
      const key = `${point.x},${point.y}`;
      if (seenWaypoints.has(key)) {
        problems.push(`${room}: ${path.label} shares waypoint (${point.x}, ${point.y}) with ${seenWaypoints.get(key)}.`);
      } else {
        seenWaypoints.set(key, path.label);
      }
    }
  }

  // Cameras: fixed to a wall, so they must sit on the floor, and their
  // sweep must be a real arc — zero sweep is a frozen camera, and more
  // than a half-turn would sweep through the wall behind it.
  (level.cameras || []).forEach((camera, c) => {
    if (!isPointInField(camera)) {
      problems.push(`${room}: camera ${c + 1} is outside the field.`);
    }
    if (typeof camera.baseAngle !== 'number' || camera.baseAngle < -Math.PI || camera.baseAngle > Math.PI) {
      problems.push(`${room}: camera ${c + 1} base angle ${camera.baseAngle} is outside -PI..PI.`);
    }
    if (typeof camera.sweep !== 'number' || camera.sweep <= 0 || camera.sweep > Math.PI) {
      problems.push(`${room}: camera ${c + 1} sweep ${camera.sweep} is outside 0..PI.`);
    }
  });

  // Lasers: both endpoints on the floor, and the blink phase inside one
  // blink cycle, or the beam would never go dark.
  (level.lasers || []).forEach((laser, l) => {
    const start = { x: laser.x1, y: laser.y1 };
    const end = { x: laser.x2, y: laser.y2 };
    if (!isPointInField(start) || !isPointInField(end)) {
      problems.push(`${room}: laser ${l + 1} has an endpoint outside the field.`);
    }
    if (typeof laser.phase !== 'number' || laser.phase < 0 || laser.phase >= LASER.onTime + LASER.offTime) {
      problems.push(`${room}: laser ${l + 1} phase ${laser.phase} is outside 0..${LASER.onTime + LASER.offTime}.`);
    }
  });

  // Every rectangle the room lists — walls, cases, palms, carpets — must
  // sit inside the field, and every lamp must sit on the floor.
  const rectGroups = [
    ['wall', level.walls],
    ['display case', level.cases],
    ['palm', level.palms],
    ['carpet', level.carpets],
  ];
  for (const [label, rects] of rectGroups) {
    (rects || []).forEach((rect, r) => {
      if (!isRectInField(rect)) problems.push(`${room}: ${label} ${r + 1} is outside the field.`);
    });
  }
  (level.lamps || []).forEach((lamp, l) => {
    if (!isPointInField(lamp)) problems.push(`${room}: lamp ${l + 1} is outside the field.`);
  });

  checkPalette(level, index, problems);
  return problems;
}

/**
 * Check every room (and the tuning they share) and return all problems
 * as strings, in room order. An empty list means the museum is sound.
 */
export function validateLevels(levels = LEVELS) {
  const problems = [];
  checkSharedTuning(problems);
  if (!Array.isArray(levels) || levels.length === 0) {
    problems.push('No rooms defined.');
    return problems;
  }
  levels.forEach((level, index) => {
    problems.push(...validateLevel(level, index));
  });
  return problems;
}

/**
 * One human-readable line about a room: its name, its watchers, and its
 * prize. Out-of-range indexes say so instead of throwing.
 */
export function describeLevel(index) {
  const level = LEVELS[index];
  if (!level) return `No room ${index + 1}: the museum has ${LEVELS.length} rooms.`;
  const guards = (level.guards || []).length;
  const cameras = (level.cameras || []).length;
  const lasers = (level.lasers || []).length;
  const hound = level.dog ? ', a hound' : '';
  const jewels = (level.loot || []).length;
  return (
    `Room ${index + 1}: ${level.name} — ${guards} guard${guards === 1 ? '' : 's'}, ` +
    `${cameras} camera${cameras === 1 ? '' : 's'}, ${lasers} laser${lasers === 1 ? '' : 's'}${hound}, ` +
    `prize ${level.prize}, ${jewels} small jewel${jewels === 1 ? '' : 's'}`
  );
}

/**
 * Throw when any room has a problem. For tests and build checks only —
 * the game itself logs problems and plays on.
 */
export function assertLevels(levels = LEVELS) {
  const problems = validateLevels(levels);
  if (problems.length > 0) {
    throw new Error(`Magpie level data has ${problems.length} problem(s):\n${problems.join('\n')}`);
  }
  return true;
}

// Check the rooms as soon as this module loads, but never let a bad
// table stop the game: problems are logged, never thrown.
try {
  const problems = validateLevels();
  if (problems.length === 0) {
    const guards = LEVELS.reduce((n, level) => n + (level.guards || []).length, 0);
    const cameras = LEVELS.reduce((n, level) => n + (level.cameras || []).length, 0);
    console.info(`Magpie levels OK: ${LEVELS.length} rooms, ${guards} guards, ${cameras} cameras.`);
  } else {
    console.warn(`Magpie levels: ${problems.length} problem(s)`, problems);
  }
} catch (error) {
  console.warn('Magpie level validation skipped:', error);
}
