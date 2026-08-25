// Deterministic seeded PRNG (mulberry32). Seeded so tests can reproduce sheets.

export function createRng(seed) {
  let state = seed >>> 0;

  function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  return {
    int(min, max) {
      return min + Math.floor(next() * (max - min + 1));
    },
    pick(array) {
      return array[Math.floor(next() * array.length)];
    },
    shuffle(array) {
      const out = [...array];
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    },
    bool() {
      return next() < 0.5;
    },
  };
}
