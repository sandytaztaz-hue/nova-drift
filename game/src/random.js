// A small seeded random number generator (mulberry32): the same seed gives the
// same game, which is what makes the screenshot scenes repeatable.
export function createRandom(seed) {
  let state = (seed | 0) >>> 0;
  return function random() {
    state = (state + 0x6d2b79f5) | 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

/** A random number in [min, max). */
export function randomRange(random, min, max) {
  return min + random() * (max - min);
}

/** One element of `items`, picked with `random`. */
export function randomPick(random, items) {
  return items[Math.floor(random() * items.length)];
}

/** An integer in [min, max] inclusive. */
export function randomInt(random, min, max) {
  return min + Math.floor(random() * (max - min + 1));
}
