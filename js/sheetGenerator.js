import { createRng } from './rng.js';
import { getTemplatesForGrade } from './topicRegistry.js';
import { getTemplatesForExam, EXAM_MODES } from './examModes.js';

const MIN_COUNT = 1;
const MAX_COUNT = 12;
// Guards against a template whose parameter space is too small to yield a new
// question text; after this many tries we accept a repeat rather than hang.
const MAX_ATTEMPTS_PER_TASK = 40;

export function clampCount(value) {
  const parsed = Math.trunc(Number(value));
  if (!Number.isFinite(parsed)) return MIN_COUNT;
  if (parsed < MIN_COUNT) return MIN_COUNT;
  if (parsed > MAX_COUNT) return MAX_COUNT;
  return parsed;
}

function resolvePool(options) {
  if (options.mode === 'egzamin') {
    return getTemplatesForExam(options.examKey);
  }
  return getTemplatesForGrade(options.gradeKey, options.topicKey ?? null);
}

// Orders the templates so a sheet cycles through the pool before repeating any
// template, and (in exam mode) leans toward the declared closed/open mix.
function buildOrder(pool, count, rng, closedRatio) {
  let ordered = rng.shuffle(pool);

  if (closedRatio !== null) {
    const closed = ordered.filter((t) => t.probeType === 'zamkniete');
    const open = ordered.filter((t) => t.probeType !== 'zamkniete');
    const wantClosed = Math.round(count * closedRatio);
    const mixed = [
      ...closed.slice(0, wantClosed),
      ...open.slice(0, count - wantClosed),
    ];
    if (mixed.length >= Math.min(count, pool.length)) {
      ordered = rng.shuffle(mixed);
    }
  }

  const order = [];
  while (order.length < count) {
    order.push(...ordered);
  }
  return order.slice(0, count);
}

// Templates do not declare their type statically, so probe each one once to
// learn whether it produces a closed or open task. Cached on the template.
function ensureProbeTypes(pool) {
  for (const template of pool) {
    if (template.probeType === undefined) {
      template.probeType = template.generate('sredni', createRng(1)).type;
    }
  }
}

export function generateSheet(options) {
  const count = clampCount(options.count);
  const pool = resolvePool(options);

  if (pool.length === 0) {
    throw new Error('Brak zadan dla wybranej kombinacji.');
  }

  const seed = options.seed ?? Math.floor(Math.random() * 2 ** 31);
  const rng = createRng(seed);

  let closedRatio = null;
  if (options.mode === 'egzamin') {
    const mode = EXAM_MODES.find((m) => m.key === options.examKey);
    closedRatio = mode ? mode.closedRatio : null;
    ensureProbeTypes(pool);
  }

  const order = buildOrder(pool, count, rng, closedRatio);
  const sheet = [];
  const seenTexts = new Set();

  for (const template of order) {
    let task = null;
    for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_TASK; attempt++) {
      const candidate = template.generate(options.difficulty, rng);
      if (!seenTexts.has(candidate.tresc)) {
        task = candidate;
        break;
      }
    }
    if (task === null) {
      // Parameter space exhausted for this template; fall back to any other
      // template in the pool that can still produce something new.
      for (const alternative of rng.shuffle(pool)) {
        const candidate = alternative.generate(options.difficulty, rng);
        if (!seenTexts.has(candidate.tresc)) {
          task = candidate;
          break;
        }
      }
    }
    if (task === null) continue; // pool truly exhausted; sheet will be short
    seenTexts.add(task.tresc);
    sheet.push(task);
  }

  return sheet;
}
