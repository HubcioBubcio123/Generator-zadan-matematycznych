import { createRng } from './rng.js';
import { getTemplatesForGrade } from './topicRegistry.js';
import { getTemplatesForExam, EXAM_MODES } from './examModes.js';

const MIN_COUNT = 1;
const MAX_COUNT = 12;
// Guards against a template whose parameter space is too small to yield a new
// question text; after this many tries we accept a repeat rather than hang.
const MAX_ATTEMPTS_PER_TASK = 40;

function taskIdentity(task) {
  if (task.wykres) return `${task.tresc}|${JSON.stringify(task.wykres)}`;
  if (task.figura) return `${task.tresc}|${JSON.stringify(task.figura)}`;
  return task.tresc;
}

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
  let fixedStructure = null;
  if (options.mode === 'egzamin') {
    const mode = EXAM_MODES.find((m) => m.key === options.examKey);
    closedRatio = mode ? mode.closedRatio ?? null : null;
    fixedStructure = mode ? mode.fixedStructure ?? null : null;
    ensureProbeTypes(pool);
  }

  const seenTexts = new Set();
  const sheet = [];

  if (fixedStructure) {
    const closedPool = pool.filter((t) => t.probeType === 'zamkniete');
    const openPool = pool.filter((t) => t.probeType !== 'zamkniete');
    const closedOrder = buildOrder(closedPool, fixedStructure.closedCount, rng, null);
    const openOrder = buildOrder(openPool, fixedStructure.openCount, rng, null);
    appendGenerated(sheet, seenTexts, closedOrder, closedPool, options, rng);
    appendGenerated(sheet, seenTexts, openOrder, openPool, options, rng);
    return sheet;
  }

  const order = buildOrder(pool, count, rng, closedRatio);
  appendGenerated(sheet, seenTexts, order, pool, options, rng);
  return sheet;
}

// Generates one task per template in `order`, retrying against a different
// template from `pool` on parameter-space exhaustion, and appends every
// task it manages to produce onto `sheet` — shared by the single-sheet path
// and both halves of the fixedStructure path above.
function appendGenerated(sheet, seenTexts, order, pool, options, rng) {
  for (const template of order) {
    let task = null;
    for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_TASK; attempt++) {
      const candidate = template.generate(options.difficulty, rng);
      if (!seenTexts.has(taskIdentity(candidate))) {
        task = candidate;
        break;
      }
    }
    if (task === null) {
      for (const alternative of rng.shuffle(pool)) {
        const candidate = alternative.generate(options.difficulty, rng);
        if (!seenTexts.has(taskIdentity(candidate))) {
          task = candidate;
          break;
        }
      }
    }
    if (task === null) continue; // pool truly exhausted; sheet will be short
    seenTexts.add(taskIdentity(task));
    sheet.push(task);
  }
}

// Shared by both reroll functions below: draws from `template` until it finds
// text that collides with no task currently in the sheet (same dedup
// guarantee generateSheet gives the whole sheet), falling back to a possible
// repeat after MAX_ATTEMPTS_PER_TASK tries rather than hanging.
function generateForSlot(rng, options, tasks, template) {
  const seenTexts = new Set(tasks.map(taskIdentity));
  for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_TASK; attempt++) {
    const candidate = template.generate(options.difficulty, rng);
    if (!seenTexts.has(taskIdentity(candidate))) return candidate;
  }
  return template.generate(options.difficulty, rng);
}

// Regenerates tasks[index] using its own template, keeping the same question
// type but drawing fresh numbers. `seed` is optional (tests pin it; the UI
// omits it for a genuinely random reroll), same convention as generateSheet.
export function rerollTaskNumbers(options, tasks, index, seed) {
  const pool = resolvePool(options);
  const template = pool.find((t) => t.id === tasks[index].id);
  if (!template) {
    throw new Error('Nie znaleziono szablonu dla tego zadania.');
  }
  const rng = createRng(seed ?? Math.floor(Math.random() * 2 ** 31));
  return generateForSlot(rng, options, tasks, template);
}

// Regenerates tasks[index] using a different template from the same pool
// (falling back to the same template when the pool has only one), for a
// student who wants a different kind of question in that slot entirely.
export function rerollTaskType(options, tasks, index, seed) {
  const pool = resolvePool(options);
  const current = tasks[index];
  const alternatives = pool.filter((t) => t.id !== current.id);
  const candidates = alternatives.length > 0 ? alternatives : pool;
  const rng = createRng(seed ?? Math.floor(Math.random() * 2 ** 31));
  const template = rng.pick(candidates);
  return generateForSlot(rng, options, tasks, template);
}
