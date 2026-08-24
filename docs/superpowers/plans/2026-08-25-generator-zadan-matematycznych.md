# Generator Zadań Matematycznych Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dependency-free static website that generates original Polish math practice tasks for klasy 4–8 SP and 1–4 LO/technikum, plus exam-style sheets for egzamin ósmoklasisty and matura podstawowa.

**Architecture:** Pure-function task templates (one file per topic category) return a uniform task object. A sheet generator samples N templates from a grade- or exam-scoped pool at a chosen difficulty. A generic renderer draws any task object into the DOM without knowing which topic produced it. No backend, no build step, no dependencies.

**Tech Stack:** HTML5, CSS3, vanilla JavaScript (ES modules), `node --test` + `node:assert` for tests. No npm packages.

**Spec:** `docs/superpowers/specs/2026-08-25-generator-zadan-matematycznych-design.md`

## Global Constraints

- All user-facing text is in Polish. Code identifiers are English except domain terms: `tresc`, `odpowiedz`, `odpowiedzi`, `poprawna`, `rozwiazanie`, `zamkniete`, `otwarte`.
- Every rendered number uses the Polish decimal comma (`3,4`, never `3.4`), produced only via `js/format.js` helpers.
- No npm packages, no bundler, no framework, no build step. ES modules only.
- Templates are pure: signature `generate(difficulty, rng)`, no DOM, no globals, no direct `Math.random`.
- `difficulty` is always one of the exact strings `'latwy'`, `'sredni'`, `'trudny'`.
- Task objects conform exactly to the contract in Task 2. `odpowiedzi`/`poprawna` exist if and only if `type === 'zamkniete'`.
- Answers render inline under each task, never as a bottom-of-page answer key.
- Sheet size is an integer 1–12, clamped.
- Matura mode is poziom podstawowy only.
- Tests must recompute expected answers independently, never reuse the template's own arithmetic.
- Run tests with `node --test`. Serve locally with `python -m http.server 8000`.

---

### Task 1: Seeded RNG utility

**Files:**
- Create: `js/rng.js`
- Test: `test/rng.test.js`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `createRng(seed: number) => Rng` where `Rng` has:
    - `int(min, max) => number` — integer in `[min, max]` inclusive
    - `pick(array) => any` — one element, uniformly
    - `shuffle(array) => array` — new shuffled array, does not mutate input
    - `bool() => boolean`
  - Every template and the sheet generator take an `Rng` so tests can seed determinism.

- [ ] **Step 1: Write the failing test**

Create `test/rng.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../js/rng.js';

test('same seed produces same sequence', () => {
  const a = createRng(42);
  const b = createRng(42);
  const seqA = [a.int(1, 100), a.int(1, 100), a.int(1, 100)];
  const seqB = [b.int(1, 100), b.int(1, 100), b.int(1, 100)];
  assert.deepEqual(seqA, seqB);
});

test('different seeds produce different sequences', () => {
  const a = createRng(1);
  const b = createRng(2);
  const seqA = Array.from({ length: 10 }, () => a.int(1, 1000));
  const seqB = Array.from({ length: 10 }, () => b.int(1, 1000));
  assert.notDeepEqual(seqA, seqB);
});

test('int stays within inclusive bounds and hits both ends', () => {
  const rng = createRng(7);
  const seen = new Set();
  for (let i = 0; i < 2000; i++) {
    const v = rng.int(3, 6);
    assert.ok(Number.isInteger(v), `expected integer, got ${v}`);
    assert.ok(v >= 3 && v <= 6, `${v} out of range`);
    seen.add(v);
  }
  assert.deepEqual([...seen].sort(), [3, 4, 5, 6]);
});

test('int handles a single-value range', () => {
  const rng = createRng(9);
  assert.equal(rng.int(5, 5), 5);
});

test('pick returns an element of the array', () => {
  const rng = createRng(11);
  const arr = ['a', 'b', 'c'];
  for (let i = 0; i < 100; i++) {
    assert.ok(arr.includes(rng.pick(arr)));
  }
});

test('shuffle preserves elements and does not mutate the input', () => {
  const rng = createRng(13);
  const input = [1, 2, 3, 4, 5];
  const copy = [...input];
  const out = rng.shuffle(input);
  assert.deepEqual(input, copy, 'input was mutated');
  assert.deepEqual([...out].sort((x, y) => x - y), copy);
});

test('bool returns both values over many draws', () => {
  const rng = createRng(17);
  const seen = new Set();
  for (let i = 0; i < 200; i++) seen.add(rng.bool());
  assert.equal(seen.size, 2);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/rng.test.js`
Expected: FAIL — `Cannot find module '../js/rng.js'`

- [ ] **Step 3: Write minimal implementation**

Create `js/rng.js`:

```js
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/rng.test.js`
Expected: PASS, 7 tests

- [ ] **Step 5: Commit**

```bash
git add js/rng.js test/rng.test.js
git commit -m "feat: add seeded RNG utility"
```

---

### Task 2: Number formatting and task-object validation

**Files:**
- Create: `js/format.js`
- Create: `js/taskShape.js`
- Test: `test/format.test.js`
- Test: `test/taskShape.test.js`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `formatNumber(n: number) => string` — Polish decimal comma, trims trailing zeros, max 4 decimal places
  - `formatFraction(num: number, den: number) => string` — e.g. `'3/4'`; whole results collapse to `'2'`
  - `formatMixed(num: number, den: number) => string` — e.g. `'2 1/2'`; proper fractions stay bare
  - `assertValidTask(task) => void` — throws `Error` with a descriptive message when the contract is violated. Used by every topic test.

The task-object contract, referenced by every later task:

```js
{
  id: string,                    // stable template id, e.g. 'ulamki_dziesietne_dodawanie'
  type: 'zamkniete' | 'otwarte',
  tresc: string,                 // question text, Polish
  odpowiedzi: string[],          // 4 options; ONLY when type === 'zamkniete'
  poprawna: number,              // index into odpowiedzi; ONLY when type === 'zamkniete'
  odpowiedz: string,             // final answer, ALWAYS present
  rozwiazanie: string            // 2-4 line worked solution, ALWAYS present
}
```

- [ ] **Step 1: Write the failing formatting test**

Create `test/format.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatNumber, formatFraction, formatMixed } from '../js/format.js';

test('integers render without a decimal separator', () => {
  assert.equal(formatNumber(5), '5');
  assert.equal(formatNumber(-12), '-12');
  assert.equal(formatNumber(0), '0');
});

test('decimals use a comma and drop trailing zeros', () => {
  assert.equal(formatNumber(3.4), '3,4');
  assert.equal(formatNumber(2.75), '2,75');
  assert.equal(formatNumber(6.10), '6,1');
  assert.equal(formatNumber(0.5), '0,5');
  assert.equal(formatNumber(-1.25), '-1,25');
});

test('floating point noise is rounded away', () => {
  assert.equal(formatNumber(0.1 + 0.2), '0,3');
});

test('formatFraction renders a slash and collapses whole numbers', () => {
  assert.equal(formatFraction(3, 4), '3/4');
  assert.equal(formatFraction(6, 3), '2');
  assert.equal(formatFraction(5, 1), '5');
});

test('formatFraction reduces to lowest terms', () => {
  assert.equal(formatFraction(2, 4), '1/2');
  assert.equal(formatFraction(6, 8), '3/4');
});

test('formatMixed renders whole plus proper fraction', () => {
  assert.equal(formatMixed(5, 2), '2 1/2');
  assert.equal(formatMixed(3, 4), '3/4');
  assert.equal(formatMixed(8, 4), '2');
});

test('no formatted output ever contains a period', () => {
  const samples = [1.5, 22.25, 0.125, -3.75, 100.0];
  for (const s of samples) {
    assert.ok(!formatNumber(s).includes('.'), `${s} rendered with a period`);
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/format.test.js`
Expected: FAIL — `Cannot find module '../js/format.js'`

- [ ] **Step 3: Implement the formatter**

Create `js/format.js`:

```js
// All rendered numbers go through here. Polish convention: decimal comma.

const MAX_DECIMALS = 4;

export function formatNumber(n) {
  const rounded = Number(n.toFixed(MAX_DECIMALS));
  if (Number.isInteger(rounded)) return String(rounded);
  return String(rounded).replace('.', ',');
}

function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

export function formatFraction(num, den) {
  const divisor = gcd(num, den) || 1;
  const n = num / divisor;
  const d = den / divisor;
  if (d === 1) return String(n);
  return `${n}/${d}`;
}

export function formatMixed(num, den) {
  const divisor = gcd(num, den) || 1;
  const n = num / divisor;
  const d = den / divisor;
  if (d === 1) return String(n);
  const whole = Math.trunc(n / d);
  const rest = Math.abs(n % d);
  if (whole === 0) return `${n}/${d}`;
  return `${whole} ${rest}/${d}`;
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/format.test.js`
Expected: PASS, 7 tests

- [ ] **Step 5: Write the failing validator test**

Create `test/taskShape.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertValidTask } from '../js/taskShape.js';

const validOpen = {
  id: 'test_open',
  type: 'otwarte',
  tresc: 'Oblicz 2 + 2.',
  odpowiedz: '4',
  rozwiazanie: 'Dodajemy: 2 + 2 = 4.',
};

const validClosed = {
  id: 'test_closed',
  type: 'zamkniete',
  tresc: 'Oblicz 2 + 2.',
  odpowiedzi: ['3', '4', '5', '6'],
  poprawna: 1,
  odpowiedz: '4',
  rozwiazanie: 'Dodajemy: 2 + 2 = 4.',
};

test('accepts a valid open task', () => {
  assert.doesNotThrow(() => assertValidTask(validOpen));
});

test('accepts a valid closed task', () => {
  assert.doesNotThrow(() => assertValidTask(validClosed));
});

test('rejects a missing id', () => {
  assert.throws(() => assertValidTask({ ...validOpen, id: undefined }), /id/);
});

test('rejects an unknown type', () => {
  assert.throws(() => assertValidTask({ ...validOpen, type: 'inne' }), /type/);
});

test('rejects an open task carrying odpowiedzi', () => {
  assert.throws(
    () => assertValidTask({ ...validOpen, odpowiedzi: ['1', '2', '3', '4'] }),
    /odpowiedzi/
  );
});

test('rejects a closed task without four options', () => {
  assert.throws(
    () => assertValidTask({ ...validClosed, odpowiedzi: ['3', '4', '5'] }),
    /cztery/
  );
});

test('rejects a closed task with duplicate options', () => {
  assert.throws(
    () => assertValidTask({ ...validClosed, odpowiedzi: ['4', '4', '5', '6'] }),
    /powtarzaj/
  );
});

test('rejects a closed task where the marked option is not the answer', () => {
  assert.throws(() => assertValidTask({ ...validClosed, poprawna: 0 }), /poprawna/);
});

test('rejects NaN, undefined, or Infinity leaking into text', () => {
  assert.throws(() => assertValidTask({ ...validOpen, tresc: 'Oblicz NaN + 2.' }), /NaN/);
  assert.throws(() => assertValidTask({ ...validOpen, odpowiedz: 'undefined' }), /undefined/);
  assert.throws(() => assertValidTask({ ...validOpen, odpowiedz: 'Infinity' }), /Infinity/);
});

test('rejects a decimal period in rendered text', () => {
  assert.throws(() => assertValidTask({ ...validOpen, tresc: 'Oblicz 3.4 + 1.' }), /kropk/);
});

test('allows a period that ends a sentence', () => {
  assert.doesNotThrow(() =>
    assertValidTask({ ...validOpen, tresc: 'Oblicz 3,4 + 1. Podaj wynik.' })
  );
});

test('rejects an empty rozwiazanie', () => {
  assert.throws(() => assertValidTask({ ...validOpen, rozwiazanie: '' }), /rozwiazanie/);
});
```

- [ ] **Step 6: Run it to verify it fails**

Run: `node --test test/taskShape.test.js`
Expected: FAIL — `Cannot find module '../js/taskShape.js'`

- [ ] **Step 7: Implement the validator**

Create `js/taskShape.js`:

```js
// Contract enforcement for task objects. Every topic test runs its output
// through assertValidTask so a malformed task fails loudly in tests, not in
// the browser.

const BAD_TOKENS = ['NaN', 'undefined', 'Infinity', 'null'];

// A period between two digits is a decimal point; a period ending a sentence
// is fine.
const DECIMAL_PERIOD = /\d\.\d/;

function checkText(value, field) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Pole ${field} musi byc niepustym tekstem.`);
  }
  for (const token of BAD_TOKENS) {
    if (value.includes(token)) {
      throw new Error(`Pole ${field} zawiera ${token}: "${value}"`);
    }
  }
  if (DECIMAL_PERIOD.test(value)) {
    throw new Error(`Pole ${field} zawiera kropke dziesietna zamiast przecinka: "${value}"`);
  }
}

export function assertValidTask(task) {
  if (!task || typeof task !== 'object') {
    throw new Error('Zadanie musi byc obiektem.');
  }
  if (typeof task.id !== 'string' || task.id.length === 0) {
    throw new Error('Zadanie musi miec niepuste pole id.');
  }
  if (task.type !== 'zamkniete' && task.type !== 'otwarte') {
    throw new Error(`Nieznany type: ${task.type}`);
  }

  checkText(task.tresc, 'tresc');
  checkText(task.odpowiedz, 'odpowiedz');
  checkText(task.rozwiazanie, 'rozwiazanie');

  if (task.type === 'otwarte') {
    if ('odpowiedzi' in task || 'poprawna' in task) {
      throw new Error('Zadanie otwarte nie moze miec pol odpowiedzi ani poprawna.');
    }
    return;
  }

  if (!Array.isArray(task.odpowiedzi) || task.odpowiedzi.length !== 4) {
    throw new Error('Zadanie zamkniete musi miec cztery odpowiedzi.');
  }
  task.odpowiedzi.forEach((opt, i) => checkText(opt, `odpowiedzi[${i}]`));

  if (new Set(task.odpowiedzi).size !== 4) {
    throw new Error(`Odpowiedzi nie moga sie powtarzac: ${task.odpowiedzi.join(', ')}`);
  }
  if (!Number.isInteger(task.poprawna) || task.poprawna < 0 || task.poprawna > 3) {
    throw new Error(`Pole poprawna musi byc indeksem 0-3, otrzymano ${task.poprawna}`);
  }
  if (task.odpowiedzi[task.poprawna] !== task.odpowiedz) {
    throw new Error(
      `odpowiedzi[poprawna] = "${task.odpowiedzi[task.poprawna]}" != odpowiedz "${task.odpowiedz}"`
    );
  }
}
```

- [ ] **Step 8: Run both tests to verify they pass**

Run: `node --test test/format.test.js test/taskShape.test.js`
Expected: PASS, 19 tests total

- [ ] **Step 9: Commit**

```bash
git add js/format.js js/taskShape.js test/format.test.js test/taskShape.test.js
git commit -m "feat: add number formatting and task-shape validation"
```

---

### Task 3: Distractor helper for closed tasks

**Files:**
- Create: `js/distractors.js`
- Test: `test/distractors.test.js`

**Interfaces:**
- Consumes: `createRng` (Task 1), `formatNumber` (Task 2)
- Produces:
  - `buildOptions(correct: string, wrong: string[], rng) => { odpowiedzi: string[], poprawna: number }` — takes the correct answer plus candidate distractors, drops duplicates and any equal to the correct answer, pads with fallbacks if fewer than three survive, shuffles, and reports the correct index. Every closed template uses this so no template hand-rolls option shuffling.

- [ ] **Step 1: Write the failing test**

Create `test/distractors.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildOptions } from '../js/distractors.js';
import { createRng } from '../js/rng.js';

test('produces four options containing the correct answer', () => {
  const rng = createRng(1);
  const { odpowiedzi, poprawna } = buildOptions('12', ['10', '14', '11'], rng);
  assert.equal(odpowiedzi.length, 4);
  assert.equal(odpowiedzi[poprawna], '12');
});

test('removes distractors equal to the correct answer', () => {
  const rng = createRng(2);
  const { odpowiedzi } = buildOptions('12', ['12', '10', '14', '11'], rng);
  assert.equal(odpowiedzi.filter((o) => o === '12').length, 1);
});

test('removes duplicate distractors', () => {
  const rng = createRng(3);
  const { odpowiedzi } = buildOptions('12', ['10', '10', '14', '11'], rng);
  assert.equal(new Set(odpowiedzi).size, 4);
});

test('pads with fallbacks when too few distractors survive', () => {
  const rng = createRng(4);
  const { odpowiedzi, poprawna } = buildOptions('12', ['10'], rng);
  assert.equal(odpowiedzi.length, 4);
  assert.equal(new Set(odpowiedzi).size, 4);
  assert.equal(odpowiedzi[poprawna], '12');
});

test('pads correctly with no distractors at all', () => {
  const rng = createRng(5);
  const { odpowiedzi, poprawna } = buildOptions('7', [], rng);
  assert.equal(odpowiedzi.length, 4);
  assert.equal(new Set(odpowiedzi).size, 4);
  assert.equal(odpowiedzi[poprawna], '7');
});

test('shuffles: the correct answer is not always at the same index', () => {
  const positions = new Set();
  for (let seed = 0; seed < 40; seed++) {
    const rng = createRng(seed);
    const { poprawna } = buildOptions('12', ['10', '14', '11'], rng);
    positions.add(poprawna);
  }
  assert.ok(positions.size > 1, 'correct answer never moved');
});

test('padded fallbacks never contain a decimal period', () => {
  const rng = createRng(6);
  const { odpowiedzi } = buildOptions('2,5', [], rng);
  for (const o of odpowiedzi) {
    assert.ok(!/\d\.\d/.test(o), `option "${o}" uses a period`);
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/distractors.test.js`
Expected: FAIL — `Cannot find module '../js/distractors.js'`

- [ ] **Step 3: Write the implementation**

Create `js/distractors.js`:

```js
import { formatNumber } from './format.js';

// Builds the four options for a closed task. Templates supply plausible
// mistake-based distractors; this dedupes, pads, and shuffles them.

function fallbackOptions(correct, needed, taken) {
  // Only used when a template supplied too few usable distractors. Nudges the
  // numeric value so the padding still looks like an answer, not filler.
  const out = [];
  const asNumber = Number(correct.replace(',', '.'));
  const numeric = Number.isFinite(asNumber);
  let offset = 1;
  while (out.length < needed) {
    const candidate = numeric
      ? formatNumber(asNumber + offset)
      : `${correct} (${offset})`;
    if (!taken.has(candidate)) {
      out.push(candidate);
      taken.add(candidate);
    }
    offset = offset > 0 ? -offset : -offset + 1;
  }
  return out;
}

export function buildOptions(correct, wrong, rng) {
  const taken = new Set([correct]);
  const distractors = [];
  for (const w of wrong) {
    if (distractors.length === 3) break;
    if (taken.has(w)) continue;
    taken.add(w);
    distractors.push(w);
  }
  if (distractors.length < 3) {
    distractors.push(...fallbackOptions(correct, 3 - distractors.length, taken));
  }

  const odpowiedzi = rng.shuffle([correct, ...distractors]);
  return { odpowiedzi, poprawna: odpowiedzi.indexOf(correct) };
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/distractors.test.js`
Expected: PASS, 7 tests

- [ ] **Step 5: Commit**

```bash
git add js/distractors.js test/distractors.test.js
git commit -m "feat: add distractor builder for closed tasks"
```

---

### Task 4: First topic — działania na liczbach naturalnych (klasa 4)

This task establishes the pattern every later topic file copies. Read it fully before writing any other topic.

**Files:**
- Create: `js/topics/liczbyNaturalne.js`
- Test: `test/topics/liczbyNaturalne.test.js`

**Interfaces:**
- Consumes: `createRng` (Task 1), `formatNumber` (Task 2), `assertValidTask` (Task 2), `buildOptions` (Task 3)
- Produces:
  - Named export `templates` — an array of template descriptors, each `{ id, generate }` where `generate(difficulty, rng)` returns a task object. Every topic file in Tasks 5–12 exports `templates` with this identical shape; `topicRegistry.js` (Task 13) collects them.

- [ ] **Step 1: Write the failing test**

Create `test/topics/liczbyNaturalne.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { templates } from '../../js/topics/liczbyNaturalne.js';
import { assertValidTask } from '../../js/taskShape.js';
import { createRng } from '../../js/rng.js';

const LEVELS = ['latwy', 'sredni', 'trudny'];

// Parses a Polish-formatted number back to a JS number, so the test can
// recompute the answer independently of the template.
function parsePl(text) {
  return Number(text.replace(/\s/g, '').replace(',', '.'));
}

test('exports at least two templates with unique ids', () => {
  assert.ok(templates.length >= 2);
  const ids = templates.map((t) => t.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('every template produces contract-valid tasks at every difficulty', () => {
  for (const template of templates) {
    for (const difficulty of LEVELS) {
      for (let seed = 0; seed < 100; seed++) {
        const task = template.generate(difficulty, createRng(seed));
        assert.equal(task.id, template.id);
        assertValidTask(task);
      }
    }
  }
});

test('dodawanie: the stated answer equals the independently recomputed sum', () => {
  const template = templates.find((t) => t.id === 'liczby_naturalne_dodawanie');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const numbers = task.tresc.match(/\d+/g).map(Number);
      const expected = numbers.reduce((a, b) => a + b, 0);
      assert.equal(
        parsePl(task.odpowiedz),
        expected,
        `seed ${seed} ${difficulty}: "${task.tresc}" -> ${task.odpowiedz}`
      );
    }
  }
});

test('mnozenie: the stated answer equals the independently recomputed product', () => {
  const template = templates.find((t) => t.id === 'liczby_naturalne_mnozenie');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const numbers = task.tresc.match(/\d+/g).map(Number);
      const expected = numbers.reduce((a, b) => a * b, 1);
      assert.equal(parsePl(task.odpowiedz), expected, `seed ${seed} ${difficulty}`);
    }
  }
});

test('difficulty scales the operand magnitude', () => {
  const template = templates.find((t) => t.id === 'liczby_naturalne_dodawanie');
  const maxFor = (difficulty) => {
    let max = 0;
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      for (const n of task.tresc.match(/\d+/g).map(Number)) {
        max = Math.max(max, n);
      }
    }
    return max;
  };
  assert.ok(maxFor('latwy') < maxFor('sredni'), 'latwy is not easier than sredni');
  assert.ok(maxFor('sredni') < maxFor('trudny'), 'sredni is not easier than trudny');
});

test('results are never negative for this klasa-4 topic', () => {
  for (const template of templates) {
    for (const difficulty of LEVELS) {
      for (let seed = 0; seed < 100; seed++) {
        const task = template.generate(difficulty, createRng(seed));
        assert.ok(parsePl(task.odpowiedz) >= 0, `negative result: ${task.odpowiedz}`);
      }
    }
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/topics/liczbyNaturalne.test.js`
Expected: FAIL — `Cannot find module '../../js/topics/liczbyNaturalne.js'`

- [ ] **Step 3: Write the implementation**

Create `js/topics/liczbyNaturalne.js`:

```js
// Dzialania na liczbach naturalnych (klasa 4).
//
// Poziomy trudnosci:
//   latwy   - dwa skladniki do 100, jedno dzialanie
//   sredni  - dwa skladniki do 1000
//   trudny  - trzy skladniki do 10000

import { formatNumber } from '../format.js';
import { buildOptions } from '../distractors.js';

const RANGES = {
  latwy: { max: 100, count: 2, factorMax: 10 },
  sredni: { max: 1000, count: 2, factorMax: 30 },
  trudny: { max: 10000, count: 3, factorMax: 90 },
};

function dodawanie(difficulty, rng) {
  const { max, count } = RANGES[difficulty];
  const numbers = Array.from({ length: count }, () => rng.int(10, max));
  const sum = numbers.reduce((a, b) => a + b, 0);
  const correct = formatNumber(sum);

  // Typowe bledy: zgubione przeniesienie, dodanie zamiast odjecia ostatniej cyfry.
  const wrong = [
    formatNumber(sum - 10),
    formatNumber(sum + 1),
    formatNumber(sum - numbers[numbers.length - 1] * 2),
  ].filter((w) => !w.startsWith('-'));

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'liczby_naturalne_dodawanie',
    type: 'zamkniete',
    tresc: `Oblicz: ${numbers.join(' + ')}`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Dodajemy kolejno skladniki.\n` +
      `${numbers.join(' + ')} = ${correct}.`,
  };
}

function mnozenie(difficulty, rng) {
  const { factorMax } = RANGES[difficulty];
  const a = rng.int(2, factorMax);
  const b = rng.int(2, factorMax);
  const product = a * b;

  return {
    id: 'liczby_naturalne_mnozenie',
    type: 'otwarte',
    tresc: `Oblicz: ${a} · ${b}`,
    odpowiedz: formatNumber(product),
    rozwiazanie:
      `Mnozymy liczby przez siebie.\n` +
      `${a} · ${b} = ${formatNumber(product)}.`,
  };
}

export const templates = [
  { id: 'liczby_naturalne_dodawanie', generate: dodawanie },
  { id: 'liczby_naturalne_mnozenie', generate: mnozenie },
];
```

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/liczbyNaturalne.test.js`
Expected: PASS, 6 tests

- [ ] **Step 5: Commit**

```bash
git add js/topics/liczbyNaturalne.js test/topics/liczbyNaturalne.test.js
git commit -m "feat: add liczby naturalne topic templates"
```

---

### Task 5: Ułamki topic (klasy 4–5)

**Files:**
- Create: `js/topics/ulamki.js`
- Test: `test/topics/ulamki.test.js`

**Interfaces:**
- Consumes: `formatFraction`, `formatMixed` (Task 2), `buildOptions` (Task 3), `assertValidTask` (Task 2)
- Produces: `templates` array with ids `ulamki_dodawanie`, `ulamki_mnozenie`, `ulamki_porownanie`

- [ ] **Step 1: Write the failing test**

Create `test/topics/ulamki.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { templates } from '../../js/topics/ulamki.js';
import { assertValidTask } from '../../js/taskShape.js';
import { createRng } from '../../js/rng.js';

const LEVELS = ['latwy', 'sredni', 'trudny'];

function gcd(a, b) {
  while (b) [a, b] = [b, a % b];
  return Math.abs(a);
}

// '3/4' -> 0.75 ; '2 1/2' -> 2.5 ; '3' -> 3
function fractionValue(text) {
  const mixed = text.match(/^(-?\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) {
    const sign = mixed[1].startsWith('-') ? -1 : 1;
    return Number(mixed[1]) + sign * (Number(mixed[2]) / Number(mixed[3]));
  }
  const simple = text.match(/^(-?\d+)\/(\d+)$/);
  if (simple) return Number(simple[1]) / Number(simple[2]);
  return Number(text.replace(',', '.'));
}

test('exports three templates with unique ids', () => {
  assert.equal(templates.length, 3);
  assert.equal(new Set(templates.map((t) => t.id)).size, 3);
});

test('every template produces contract-valid tasks at every difficulty', () => {
  for (const template of templates) {
    for (const difficulty of LEVELS) {
      for (let seed = 0; seed < 100; seed++) {
        assertValidTask(template.generate(difficulty, createRng(seed)));
      }
    }
  }
});

test('dodawanie: the answer equals the independently recomputed sum', () => {
  const template = templates.find((t) => t.id === 'ulamki_dodawanie');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const parts = task.tresc.match(/(\d+)\/(\d+)/g);
      const expected = parts.reduce((acc, p) => {
        const [n, d] = p.split('/').map(Number);
        return acc + n / d;
      }, 0);
      assert.ok(
        Math.abs(fractionValue(task.odpowiedz) - expected) < 1e-9,
        `${task.tresc} -> ${task.odpowiedz}, expected ${expected}`
      );
    }
  }
});

test('mnozenie: the answer equals the independently recomputed product', () => {
  const template = templates.find((t) => t.id === 'ulamki_mnozenie');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const parts = task.tresc.match(/(\d+)\/(\d+)/g);
      const expected = parts.reduce((acc, p) => {
        const [n, d] = p.split('/').map(Number);
        return acc * (n / d);
      }, 1);
      assert.ok(Math.abs(fractionValue(task.odpowiedz) - expected) < 1e-9);
    }
  }
});

test('answers are always in lowest terms', () => {
  for (const template of templates) {
    for (const difficulty of LEVELS) {
      for (let seed = 0; seed < 200; seed++) {
        const task = template.generate(difficulty, createRng(seed));
        const m = task.odpowiedz.match(/(\d+)\/(\d+)/);
        if (m) {
          assert.equal(
            gcd(Number(m[1]), Number(m[2])),
            1,
            `${task.odpowiedz} is not reduced`
          );
        }
      }
    }
  }
});

test('porownanie answers with one of the comparison symbols', () => {
  const template = templates.find((t) => t.id === 'ulamki_porownanie');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 100; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      assert.ok(['<', '>', '='].includes(task.odpowiedz), `got "${task.odpowiedz}"`);
    }
  }
});

test('porownanie: the stated relation is actually true', () => {
  const template = templates.find((t) => t.id === 'ulamki_porownanie');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [left, right] = task.tresc.match(/(\d+)\/(\d+)/g).map((p) => {
        const [n, d] = p.split('/').map(Number);
        return n / d;
      });
      const actual = left < right ? '<' : left > right ? '>' : '=';
      assert.equal(task.odpowiedz, actual, `${task.tresc}`);
    }
  }
});

test('denominators grow with difficulty', () => {
  const template = templates.find((t) => t.id === 'ulamki_dodawanie');
  const maxDen = (difficulty) => {
    let max = 0;
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      for (const p of task.tresc.match(/(\d+)\/(\d+)/g)) {
        max = Math.max(max, Number(p.split('/')[1]));
      }
    }
    return max;
  };
  assert.ok(maxDen('latwy') < maxDen('trudny'));
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/topics/ulamki.test.js`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

Create `js/topics/ulamki.js`:

```js
// Ulamki zwykle (klasy 4-5).
//
// Poziomy trudnosci:
//   latwy   - mianowniki do 8, ten sam mianownik przy dodawaniu
//   sredni  - mianowniki do 12, rozne mianowniki
//   trudny  - mianowniki do 20, rozne mianowniki, wynik moze byc liczba mieszana

import { formatFraction, formatMixed } from '../format.js';
import { buildOptions } from '../distractors.js';

const RANGES = {
  latwy: { denMax: 8, sameDenominator: true },
  sredni: { denMax: 12, sameDenominator: false },
  trudny: { denMax: 20, sameDenominator: false },
};

function gcd(a, b) {
  while (b) [a, b] = [b, a % b];
  return Math.abs(a);
}

function properFraction(rng, denMax) {
  const den = rng.int(2, denMax);
  const num = rng.int(1, den - 1);
  return { num, den };
}

function dodawanie(difficulty, rng) {
  const { denMax, sameDenominator } = RANGES[difficulty];
  const a = properFraction(rng, denMax);
  const b = sameDenominator
    ? { num: rng.int(1, a.den - 1), den: a.den }
    : properFraction(rng, denMax);

  const num = a.num * b.den + b.num * a.den;
  const den = a.den * b.den;
  const correct = formatMixed(num, den);

  // Typowy blad: dodanie licznikow i mianownikow osobno.
  const wrong = [
    formatMixed(a.num + b.num, a.den + b.den),
    formatMixed(num + 1, den),
    formatMixed(a.num * b.num, a.den * b.den),
  ];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);
  const divisor = gcd(num, den);

  return {
    id: 'ulamki_dodawanie',
    type: 'zamkniete',
    tresc: `Oblicz: ${formatFraction(a.num, a.den)} + ${formatFraction(b.num, b.den)}`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Sprowadzamy ulamki do wspolnego mianownika ${den}.\n` +
      `${a.num}/${a.den} = ${a.num * b.den}/${den}, ${b.num}/${b.den} = ${b.num * a.den}/${den}.\n` +
      `Dodajemy liczniki: ${a.num * b.den} + ${b.num * a.den} = ${num}, czyli ${num}/${den}.\n` +
      `Skracamy przez ${divisor}: wynik to ${correct}.`,
  };
}

function mnozenie(difficulty, rng) {
  const { denMax } = RANGES[difficulty];
  const a = properFraction(rng, denMax);
  const b = properFraction(rng, denMax);
  const num = a.num * b.num;
  const den = a.den * b.den;
  const correct = formatFraction(num, den);

  return {
    id: 'ulamki_mnozenie',
    type: 'otwarte',
    tresc: `Oblicz: ${formatFraction(a.num, a.den)} · ${formatFraction(b.num, b.den)}`,
    odpowiedz: correct,
    rozwiazanie:
      `Mnozymy licznik przez licznik i mianownik przez mianownik.\n` +
      `${a.num} · ${b.num} = ${num}, ${a.den} · ${b.den} = ${den}.\n` +
      `Po skroceniu otrzymujemy ${correct}.`,
  };
}

function porownanie(difficulty, rng) {
  const { denMax } = RANGES[difficulty];
  const a = properFraction(rng, denMax);
  const b = properFraction(rng, denMax);
  const left = a.num * b.den;
  const right = b.num * a.den;
  const correct = left < right ? '<' : left > right ? '>' : '=';

  return {
    id: 'ulamki_porownanie',
    type: 'otwarte',
    tresc:
      `Wstaw znak <, > lub = miedzy ulamki: ` +
      `${formatFraction(a.num, a.den)} ... ${formatFraction(b.num, b.den)}`,
    odpowiedz: correct,
    rozwiazanie:
      `Sprowadzamy do wspolnego mianownika ${a.den * b.den}.\n` +
      `${a.num}/${a.den} = ${left}/${a.den * b.den}, ${b.num}/${b.den} = ${right}/${a.den * b.den}.\n` +
      `Poniewaz ${left} ${correct} ${right}, wstawiamy znak ${correct}.`,
  };
}

export const templates = [
  { id: 'ulamki_dodawanie', generate: dodawanie },
  { id: 'ulamki_mnozenie', generate: mnozenie },
  { id: 'ulamki_porownanie', generate: porownanie },
];
```

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/ulamki.test.js`
Expected: PASS, 8 tests

- [ ] **Step 5: Commit**

```bash
git add js/topics/ulamki.js test/topics/ulamki.test.js
git commit -m "feat: add ulamki zwykle topic templates"
```

---

### Task 6: Ułamki dziesiętne topic (klasy 5–6)

**Files:**
- Create: `js/topics/ulamkiDziesietne.js`
- Test: `test/topics/ulamkiDziesietne.test.js`

**Interfaces:**
- Consumes: `formatNumber` (Task 2), `buildOptions` (Task 3), `assertValidTask` (Task 2)
- Produces: `templates` array with ids `ulamki_dziesietne_dodawanie`, `ulamki_dziesietne_mnozenie`

- [ ] **Step 1: Write the failing test**

Create `test/topics/ulamkiDziesietne.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { templates } from '../../js/topics/ulamkiDziesietne.js';
import { assertValidTask } from '../../js/taskShape.js';
import { createRng } from '../../js/rng.js';

const LEVELS = ['latwy', 'sredni', 'trudny'];

function parsePl(text) {
  return Number(text.replace(',', '.'));
}

function numbersIn(text) {
  return text.match(/\d+(?:,\d+)?/g).map(parsePl);
}

test('exports two templates with unique ids', () => {
  assert.equal(templates.length, 2);
  assert.equal(new Set(templates.map((t) => t.id)).size, 2);
});

test('every template produces contract-valid tasks at every difficulty', () => {
  for (const template of templates) {
    for (const difficulty of LEVELS) {
      for (let seed = 0; seed < 100; seed++) {
        assertValidTask(template.generate(difficulty, createRng(seed)));
      }
    }
  }
});

test('dodawanie: the answer equals the independently recomputed sum', () => {
  const template = templates.find((t) => t.id === 'ulamki_dziesietne_dodawanie');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const expected = numbersIn(task.tresc).reduce((a, b) => a + b, 0);
      assert.ok(
        Math.abs(parsePl(task.odpowiedz) - expected) < 1e-9,
        `${task.tresc} -> ${task.odpowiedz}, expected ${expected}`
      );
    }
  }
});

test('mnozenie: the answer equals the independently recomputed product', () => {
  const template = templates.find((t) => t.id === 'ulamki_dziesietne_mnozenie');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const expected = numbersIn(task.tresc).reduce((a, b) => a * b, 1);
      assert.ok(Math.abs(parsePl(task.odpowiedz) - expected) < 1e-9);
    }
  }
});

test('decimal places grow with difficulty', () => {
  const template = templates.find((t) => t.id === 'ulamki_dziesietne_dodawanie');
  const maxPlaces = (difficulty) => {
    let max = 0;
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      for (const m of task.tresc.match(/\d+,\d+/g) ?? []) {
        max = Math.max(max, m.split(',')[1].length);
      }
    }
    return max;
  };
  assert.ok(maxPlaces('latwy') <= maxPlaces('sredni'));
  assert.ok(maxPlaces('sredni') < maxPlaces('trudny'));
});

test('no answer suffers visible floating point noise', () => {
  for (const template of templates) {
    for (const difficulty of LEVELS) {
      for (let seed = 0; seed < 200; seed++) {
        const task = template.generate(difficulty, createRng(seed));
        const decimals = task.odpowiedz.split(',')[1];
        assert.ok(
          !decimals || decimals.length <= 4,
          `noisy answer: ${task.odpowiedz}`
        );
      }
    }
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/topics/ulamkiDziesietne.test.js`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

Create `js/topics/ulamkiDziesietne.js`:

```js
// Ulamki dziesietne (klasy 5-6).
//
// Poziomy trudnosci:
//   latwy   - jedno miejsce po przecinku, wartosci do 20
//   sredni  - dwa miejsca po przecinku, wartosci do 100
//   trudny  - trzy miejsca po przecinku, wartosci do 100, trzy skladniki

import { formatNumber } from '../format.js';
import { buildOptions } from '../distractors.js';

const RANGES = {
  latwy: { places: 1, max: 20, count: 2 },
  sredni: { places: 2, max: 100, count: 2 },
  trudny: { places: 3, max: 100, count: 3 },
};

function decimalValue(rng, places, max) {
  const scale = 10 ** places;
  return rng.int(1, max * scale) / scale;
}

function dodawanie(difficulty, rng) {
  const { places, max, count } = RANGES[difficulty];
  const numbers = Array.from({ length: count }, () => decimalValue(rng, places, max));
  const sum = Number(numbers.reduce((a, b) => a + b, 0).toFixed(places));
  const correct = formatNumber(sum);

  // Typowy blad: zle wyrownany przecinek, zgubione przeniesienie.
  const wrong = [
    formatNumber(Number((sum * 10).toFixed(places))),
    formatNumber(Number((sum + 0.1).toFixed(places))),
    formatNumber(Number((sum - 1).toFixed(places))),
  ].filter((w) => !w.startsWith('-'));

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'ulamki_dziesietne_dodawanie',
    type: 'zamkniete',
    tresc: `Oblicz: ${numbers.map(formatNumber).join(' + ')}`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Wyrownujemy liczby wedlug przecinka i dodajemy kolumnami.\n` +
      `${numbers.map(formatNumber).join(' + ')} = ${correct}.`,
  };
}

function mnozenie(difficulty, rng) {
  const { places, max } = RANGES[difficulty];
  const a = decimalValue(rng, places, max);
  const b = rng.int(2, 12);
  const product = Number((a * b).toFixed(places));

  return {
    id: 'ulamki_dziesietne_mnozenie',
    type: 'otwarte',
    tresc: `Oblicz: ${formatNumber(a)} · ${b}`,
    odpowiedz: formatNumber(product),
    rozwiazanie:
      `Mnozymy tak jak liczby naturalne, a nastepnie oddzielamy ${places} ` +
      `miejsc po przecinku.\n` +
      `${formatNumber(a)} · ${b} = ${formatNumber(product)}.`,
  };
}

export const templates = [
  { id: 'ulamki_dziesietne_dodawanie', generate: dodawanie },
  { id: 'ulamki_dziesietne_mnozenie', generate: mnozenie },
];
```

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/ulamkiDziesietne.test.js`
Expected: PASS, 6 tests

- [ ] **Step 5: Commit**

```bash
git add js/topics/ulamkiDziesietne.js test/topics/ulamkiDziesietne.test.js
git commit -m "feat: add ulamki dziesietne topic templates"
```

---

### Task 7: Procenty topic (klasy 6–7)

**Files:**
- Create: `js/topics/procenty.js`
- Test: `test/topics/procenty.test.js`

**Interfaces:**
- Consumes: `formatNumber` (Task 2), `buildOptions` (Task 3), `assertValidTask` (Task 2)
- Produces: `templates` array with ids `procenty_z_liczby`, `procenty_podwyzka`

- [ ] **Step 1: Write the failing test**

Create `test/topics/procenty.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { templates } from '../../js/topics/procenty.js';
import { assertValidTask } from '../../js/taskShape.js';
import { createRng } from '../../js/rng.js';

const LEVELS = ['latwy', 'sredni', 'trudny'];

function parsePl(text) {
  return Number(text.replace(/[^\d,-]/g, '').replace(',', '.'));
}

test('exports two templates with unique ids', () => {
  assert.equal(templates.length, 2);
  assert.equal(new Set(templates.map((t) => t.id)).size, 2);
});

test('every template produces contract-valid tasks at every difficulty', () => {
  for (const template of templates) {
    for (const difficulty of LEVELS) {
      for (let seed = 0; seed < 100; seed++) {
        assertValidTask(template.generate(difficulty, createRng(seed)));
      }
    }
  }
});

test('procent z liczby: the answer equals the recomputed percentage', () => {
  const template = templates.find((t) => t.id === 'procenty_z_liczby');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [percent, base] = task.tresc.match(/\d+(?:,\d+)?/g).map(parsePl);
      const expected = (percent / 100) * base;
      assert.ok(
        Math.abs(parsePl(task.odpowiedz) - expected) < 1e-6,
        `${task.tresc} -> ${task.odpowiedz}, expected ${expected}`
      );
    }
  }
});

test('podwyzka: the answer equals base increased by the percentage', () => {
  const template = templates.find((t) => t.id === 'procenty_podwyzka');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [base, percent] = task.tresc.match(/\d+(?:,\d+)?/g).map(parsePl);
      const expected = base * (1 + percent / 100);
      assert.ok(
        Math.abs(parsePl(task.odpowiedz) - expected) < 1e-6,
        `${task.tresc} -> ${task.odpowiedz}, expected ${expected}`
      );
    }
  }
});

test('percentages used are sensible values between 1 and 100', () => {
  const template = templates.find((t) => t.id === 'procenty_z_liczby');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [percent] = task.tresc.match(/\d+(?:,\d+)?/g).map(parsePl);
      assert.ok(percent >= 1 && percent <= 100, `percent out of range: ${percent}`);
    }
  }
});

test('easy percentages are round numbers', () => {
  const template = templates.find((t) => t.id === 'procenty_z_liczby');
  for (let seed = 0; seed < 200; seed++) {
    const task = template.generate('latwy', createRng(seed));
    const [percent] = task.tresc.match(/\d+(?:,\d+)?/g).map(parsePl);
    assert.equal(percent % 10, 0, `latwy used a non-round percent: ${percent}`);
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/topics/procenty.test.js`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

Create `js/topics/procenty.js`:

```js
// Procenty (klasy 6-7).
//
// Poziomy trudnosci:
//   latwy   - procenty wielokrotnosci 10, podstawa do 200
//   sredni  - procenty wielokrotnosci 5, podstawa do 1000
//   trudny  - dowolne procenty 1-99, podstawa do 5000

import { formatNumber } from '../format.js';
import { buildOptions } from '../distractors.js';

const RANGES = {
  latwy: { percents: [10, 20, 30, 40, 50, 60, 70, 80, 90], baseMax: 200 },
  sredni: { percents: [5, 15, 25, 35, 45, 55, 65, 75, 85, 95], baseMax: 1000 },
  trudny: { percents: null, baseMax: 5000 },
};

function choosePercent(difficulty, rng) {
  const { percents } = RANGES[difficulty];
  return percents ? rng.pick(percents) : rng.int(1, 99);
}

function procentZLiczby(difficulty, rng) {
  const { baseMax } = RANGES[difficulty];
  const percent = choosePercent(difficulty, rng);
  // Base is a multiple of 20 so answers stay tidy at every level.
  const base = rng.int(1, baseMax / 20) * 20;
  const result = Number(((percent / 100) * base).toFixed(4));
  const correct = formatNumber(result);

  // Typowe bledy: przesuniety przecinek, procent potraktowany jako ulamek dziesietny.
  const wrong = [
    formatNumber(Number((result * 10).toFixed(4))),
    formatNumber(Number((result / 10).toFixed(4))),
    formatNumber(Number((base - result).toFixed(4))),
  ];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'procenty_z_liczby',
    type: 'zamkniete',
    tresc: `Oblicz ${percent}% liczby ${formatNumber(base)}.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `${percent}% to ${formatNumber(percent / 100)}.\n` +
      `${formatNumber(percent / 100)} · ${formatNumber(base)} = ${correct}.`,
  };
}

function podwyzka(difficulty, rng) {
  const { baseMax } = RANGES[difficulty];
  const percent = choosePercent(difficulty, rng);
  const base = rng.int(1, baseMax / 20) * 20;
  const result = Number((base * (1 + percent / 100)).toFixed(4));

  return {
    id: 'procenty_podwyzka',
    type: 'otwarte',
    tresc:
      `Cena towaru wynosila ${formatNumber(base)} zl i wzrosla o ${percent}%. ` +
      `Ile wynosi nowa cena?`,
    odpowiedz: `${formatNumber(result)} zl`,
    rozwiazanie:
      `Podwyzka wynosi ${percent}% z ${formatNumber(base)} zl, ` +
      `czyli ${formatNumber(Number(((percent / 100) * base).toFixed(4)))} zl.\n` +
      `Nowa cena: ${formatNumber(base)} + ` +
      `${formatNumber(Number(((percent / 100) * base).toFixed(4)))} = ` +
      `${formatNumber(result)} zl.`,
  };
}

export const templates = [
  { id: 'procenty_z_liczby', generate: procentZLiczby },
  { id: 'procenty_podwyzka', generate: podwyzka },
];
```

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/procenty.test.js`
Expected: PASS, 6 tests

- [ ] **Step 5: Commit**

```bash
git add js/topics/procenty.js test/topics/procenty.test.js
git commit -m "feat: add procenty topic templates"
```

---

### Task 8: Geometria płaska topic (klasy 4–6)

**Files:**
- Create: `js/topics/geometriaPlaska.js`
- Test: `test/topics/geometriaPlaska.test.js`

**Interfaces:**
- Consumes: `formatNumber` (Task 2), `buildOptions` (Task 3), `assertValidTask` (Task 2)
- Produces: `templates` array with ids `geometria_pole_prostokata`, `geometria_obwod_prostokata`, `geometria_pole_trojkata`

- [ ] **Step 1: Write the failing test**

Create `test/topics/geometriaPlaska.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { templates } from '../../js/topics/geometriaPlaska.js';
import { assertValidTask } from '../../js/taskShape.js';
import { createRng } from '../../js/rng.js';

const LEVELS = ['latwy', 'sredni', 'trudny'];

function parsePl(text) {
  return Number(text.replace(/[^\d,-]/g, '').replace(',', '.'));
}

test('exports three templates with unique ids', () => {
  assert.equal(templates.length, 3);
  assert.equal(new Set(templates.map((t) => t.id)).size, 3);
});

test('every template produces contract-valid tasks at every difficulty', () => {
  for (const template of templates) {
    for (const difficulty of LEVELS) {
      for (let seed = 0; seed < 100; seed++) {
        assertValidTask(template.generate(difficulty, createRng(seed)));
      }
    }
  }
});

test('pole prostokata: answer equals a times b', () => {
  const template = templates.find((t) => t.id === 'geometria_pole_prostokata');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [a, b] = task.tresc.match(/\d+(?:,\d+)?/g).map(parsePl);
      assert.ok(Math.abs(parsePl(task.odpowiedz) - a * b) < 1e-6, task.tresc);
    }
  }
});

test('obwod prostokata: answer equals 2*(a+b)', () => {
  const template = templates.find((t) => t.id === 'geometria_obwod_prostokata');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [a, b] = task.tresc.match(/\d+(?:,\d+)?/g).map(parsePl);
      assert.ok(Math.abs(parsePl(task.odpowiedz) - 2 * (a + b)) < 1e-6, task.tresc);
    }
  }
});

test('pole trojkata: answer equals half of base times height', () => {
  const template = templates.find((t) => t.id === 'geometria_pole_trojkata');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [base, height] = task.tresc.match(/\d+(?:,\d+)?/g).map(parsePl);
      assert.ok(
        Math.abs(parsePl(task.odpowiedz) - (base * height) / 2) < 1e-6,
        task.tresc
      );
    }
  }
});

test('area answers carry squared units and perimeter answers do not', () => {
  const area = templates.filter((t) => t.id.startsWith('geometria_pole'));
  for (const template of area) {
    for (let seed = 0; seed < 50; seed++) {
      const task = template.generate('sredni', createRng(seed));
      assert.ok(task.odpowiedz.includes('cm²'), `missing cm2: ${task.odpowiedz}`);
    }
  }
  const perimeter = templates.find((t) => t.id === 'geometria_obwod_prostokata');
  for (let seed = 0; seed < 50; seed++) {
    const task = perimeter.generate('sredni', createRng(seed));
    assert.ok(task.odpowiedz.includes('cm'), `missing cm: ${task.odpowiedz}`);
    assert.ok(!task.odpowiedz.includes('cm²'), `perimeter got cm2`);
  }
});

test('dimensions grow with difficulty', () => {
  const template = templates.find((t) => t.id === 'geometria_pole_prostokata');
  const maxDim = (difficulty) => {
    let max = 0;
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      for (const n of task.tresc.match(/\d+(?:,\d+)?/g).map(parsePl)) {
        max = Math.max(max, n);
      }
    }
    return max;
  };
  assert.ok(maxDim('latwy') < maxDim('trudny'));
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/topics/geometriaPlaska.test.js`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

Create `js/topics/geometriaPlaska.js`:

```js
// Geometria plaska: pola i obwody figur (klasy 4-6).
//
// Poziomy trudnosci:
//   latwy   - wymiary calkowite do 12
//   sredni  - wymiary calkowite do 40
//   trudny  - wymiary z jednym miejscem po przecinku, do 40

import { formatNumber } from '../format.js';
import { buildOptions } from '../distractors.js';

const RANGES = {
  latwy: { max: 12, decimal: false },
  sredni: { max: 40, decimal: false },
  trudny: { max: 40, decimal: true },
};

function dimension(rng, difficulty) {
  const { max, decimal } = RANGES[difficulty];
  return decimal ? rng.int(20, max * 10) / 10 : rng.int(2, max);
}

function poleProstokata(difficulty, rng) {
  const a = dimension(rng, difficulty);
  const b = dimension(rng, difficulty);
  const area = Number((a * b).toFixed(4));
  const correct = `${formatNumber(area)} cm²`;

  // Typowy blad: policzony obwod zamiast pola.
  const wrong = [
    `${formatNumber(Number((2 * (a + b)).toFixed(4)))} cm²`,
    `${formatNumber(Number((a + b).toFixed(4)))} cm²`,
    `${formatNumber(Number((area / 2).toFixed(4)))} cm²`,
  ];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'geometria_pole_prostokata',
    type: 'zamkniete',
    tresc:
      `Prostokat ma boki dlugosci ${formatNumber(a)} cm i ${formatNumber(b)} cm. ` +
      `Oblicz jego pole.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Pole prostokata to iloczyn dlugosci jego bokow: P = a · b.\n` +
      `P = ${formatNumber(a)} · ${formatNumber(b)} = ${formatNumber(area)} cm².`,
  };
}

function obwodProstokata(difficulty, rng) {
  const a = dimension(rng, difficulty);
  const b = dimension(rng, difficulty);
  const perimeter = Number((2 * (a + b)).toFixed(4));

  return {
    id: 'geometria_obwod_prostokata',
    type: 'otwarte',
    tresc:
      `Prostokat ma boki dlugosci ${formatNumber(a)} cm i ${formatNumber(b)} cm. ` +
      `Oblicz jego obwod.`,
    odpowiedz: `${formatNumber(perimeter)} cm`,
    rozwiazanie:
      `Obwod prostokata to Ob = 2 · (a + b).\n` +
      `Ob = 2 · (${formatNumber(a)} + ${formatNumber(b)}) = ` +
      `${formatNumber(perimeter)} cm.`,
  };
}

function poleTrojkata(difficulty, rng) {
  const base = dimension(rng, difficulty);
  const height = dimension(rng, difficulty);
  const area = Number(((base * height) / 2).toFixed(4));

  return {
    id: 'geometria_pole_trojkata',
    type: 'otwarte',
    tresc:
      `Trojkat ma podstawe dlugosci ${formatNumber(base)} cm ` +
      `i wysokosc ${formatNumber(height)} cm. Oblicz jego pole.`,
    odpowiedz: `${formatNumber(area)} cm²`,
    rozwiazanie:
      `Pole trojkata to P = (a · h) : 2.\n` +
      `P = (${formatNumber(base)} · ${formatNumber(height)}) : 2 = ` +
      `${formatNumber(area)} cm².`,
  };
}

export const templates = [
  { id: 'geometria_pole_prostokata', generate: poleProstokata },
  { id: 'geometria_obwod_prostokata', generate: obwodProstokata },
  { id: 'geometria_pole_trojkata', generate: poleTrojkata },
];
```

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/geometriaPlaska.test.js`
Expected: PASS, 7 tests

- [ ] **Step 5: Commit**

```bash
git add js/topics/geometriaPlaska.js test/topics/geometriaPlaska.test.js
git commit -m "feat: add geometria plaska topic templates"
```

---

### Task 9: Równania i wyrażenia algebraiczne topic (klasy 7–8, LO 1)

**Files:**
- Create: `js/topics/rownania.js`
- Test: `test/topics/rownania.test.js`

**Interfaces:**
- Consumes: `formatNumber` (Task 2), `buildOptions` (Task 3), `assertValidTask` (Task 2)
- Produces: `templates` array with ids `rownania_liniowe`, `rownania_uproszczenie`

- [ ] **Step 1: Write the failing test**

Create `test/topics/rownania.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { templates } from '../../js/topics/rownania.js';
import { assertValidTask } from '../../js/taskShape.js';
import { createRng } from '../../js/rng.js';

const LEVELS = ['latwy', 'sredni', 'trudny'];

function parsePl(text) {
  return Number(text.replace('x = ', '').replace(',', '.'));
}

test('exports two templates with unique ids', () => {
  assert.equal(templates.length, 2);
  assert.equal(new Set(templates.map((t) => t.id)).size, 2);
});

test('every template produces contract-valid tasks at every difficulty', () => {
  for (const template of templates) {
    for (const difficulty of LEVELS) {
      for (let seed = 0; seed < 100; seed++) {
        assertValidTask(template.generate(difficulty, createRng(seed)));
      }
    }
  }
});

test('rownania liniowe: substituting the answer satisfies the equation', () => {
  const template = templates.find((t) => t.id === 'rownania_liniowe');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 300; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const equation = task.tresc.replace('Rozwiaz rownanie: ', '');
      const [lhs, rhs] = equation.split('=');
      const x = parsePl(task.odpowiedz);
      const evaluate = (side) =>
        Function('x', `return ${side.replace(/,/g, '.').replace(/(\d)x/g, '$1*x')};`)(x);
      assert.ok(
        Math.abs(evaluate(lhs) - evaluate(rhs)) < 1e-6,
        `${equation} with ${task.odpowiedz} does not balance`
      );
    }
  }
});

test('rownania liniowe answers are stated in the form "x = ..."', () => {
  const template = templates.find((t) => t.id === 'rownania_liniowe');
  for (let seed = 0; seed < 100; seed++) {
    const task = template.generate('sredni', createRng(seed));
    assert.match(task.odpowiedz, /^x = -?\d+(,\d+)?$/, task.odpowiedz);
  }
});

test('uproszczenie: the simplified expression matches at sample x values', () => {
  const template = templates.find((t) => t.id === 'rownania_uproszczenie');
  const toJs = (s) => s.replace(/,/g, '.').replace(/(\d)x/g, '$1*x');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const original = task.tresc.replace('Uprosc wyrazenie: ', '');
      for (const x of [-3, 0, 2, 7.5]) {
        const a = Function('x', `return ${toJs(original)};`)(x);
        const b = Function('x', `return ${toJs(task.odpowiedz)};`)(x);
        assert.ok(
          Math.abs(a - b) < 1e-6,
          `${original} != ${task.odpowiedz} at x=${x}`
        );
      }
    }
  }
});

test('easy equations have integer solutions', () => {
  const template = templates.find((t) => t.id === 'rownania_liniowe');
  for (let seed = 0; seed < 200; seed++) {
    const task = template.generate('latwy', createRng(seed));
    assert.ok(Number.isInteger(parsePl(task.odpowiedz)), task.odpowiedz);
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/topics/rownania.test.js`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

Create `js/topics/rownania.js`:

```js
// Rownania liniowe i wyrazenia algebraiczne (klasy 7-8, liceum 1).
//
// Poziomy trudnosci:
//   latwy   - ax + b = c, rozwiazanie calkowite, wspolczynniki do 10
//   sredni  - ax + b = cx + d, rozwiazanie calkowite, wspolczynniki do 20
//   trudny  - ax + b = cx + d, rozwiazanie moze byc ulamkiem dziesietnym

import { formatNumber } from '../format.js';
import { buildOptions } from '../distractors.js';

const RANGES = {
  latwy: { coefMax: 10, bothSides: false, integerRoot: true },
  sredni: { coefMax: 20, bothSides: true, integerRoot: true },
  trudny: { coefMax: 20, bothSides: true, integerRoot: false },
};

// Renders "3x + 5" / "3x - 5" / "-3x" correctly, never "3x + -5".
function linearSide(coefficient, constant) {
  const parts = [];
  if (coefficient !== 0) parts.push(`${coefficient === 1 ? '' : coefficient === -1 ? '-' : coefficient}x`);
  if (constant !== 0 || coefficient === 0) {
    if (parts.length === 0) parts.push(String(constant));
    else parts.push(`${constant > 0 ? '+' : '-'} ${Math.abs(constant)}`);
  }
  return parts.join(' ');
}

function rownaniaLiniowe(difficulty, rng) {
  const { coefMax, bothSides, integerRoot } = RANGES[difficulty];

  let a = rng.int(2, coefMax);
  let c = bothSides ? rng.int(1, coefMax) : 0;
  if (a === c) a += 1; // keep the equation solvable

  const root = integerRoot ? rng.int(-10, 10) : rng.int(-100, 100) / 4;
  const b = rng.int(-coefMax, coefMax);
  // Choose d so that a*root + b = c*root + d holds exactly.
  const d = a * root + b - c * root;

  const correct = `x = ${formatNumber(root)}`;

  // Typowe bledy: znak przy przenoszeniu, dzielenie przez zly wspolczynnik.
  const wrong = [
    `x = ${formatNumber(-root)}`,
    `x = ${formatNumber(Number((root + 1).toFixed(4)))}`,
    `x = ${formatNumber(Number(((b - d) / (a - c || 1)).toFixed(4)))}`,
  ];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);
  const constantDiff = d - b;
  const coefDiff = a - c;

  return {
    id: 'rownania_liniowe',
    type: 'zamkniete',
    tresc: `Rozwiaz rownanie: ${linearSide(a, b)} = ${linearSide(c, d)}`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Przenosimy niewiadome na lewa strone, a liczby na prawa.\n` +
      `${coefDiff}x = ${constantDiff}.\n` +
      `Dzielimy obie strony przez ${coefDiff}: x = ${formatNumber(root)}.`,
  };
}

function uproszczenie(difficulty, rng) {
  const { coefMax } = RANGES[difficulty];
  const a = rng.int(1, coefMax);
  const b = rng.int(-coefMax, coefMax);
  const c = rng.int(1, coefMax);
  const d = rng.int(-coefMax, coefMax);

  const coefSum = a + c;
  const constSum = b + d;
  const simplified = linearSide(coefSum, constSum);

  return {
    id: 'rownania_uproszczenie',
    type: 'otwarte',
    tresc: `Uprosc wyrazenie: ${linearSide(a, b)} + ${linearSide(c, d)}`,
    odpowiedz: simplified,
    rozwiazanie:
      `Grupujemy wyrazy podobne.\n` +
      `Wyrazy z x: ${a}x + ${c}x = ${coefSum}x.\n` +
      `Wyrazy wolne: ${b} + ${d} = ${constSum}.\n` +
      `Wynik: ${simplified}.`,
  };
}

export const templates = [
  { id: 'rownania_liniowe', generate: rownaniaLiniowe },
  { id: 'rownania_uproszczenie', generate: uproszczenie },
];
```

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/rownania.test.js`
Expected: PASS, 6 tests

Note: if the parenthesization of `linearSide` output breaks the test's `Function` evaluation for negative leading coefficients, wrap each side in parentheses inside `tresc` — but only after confirming the failure, and update the test's `replace` accordingly.

- [ ] **Step 5: Commit**

```bash
git add js/topics/rownania.js test/topics/rownania.test.js
git commit -m "feat: add rownania i wyrazenia topic templates"
```

---

### Task 10: Potęgi, pierwiastki i twierdzenie Pitagorasa (klasy 7–8)

**Files:**
- Create: `js/topics/potegiPitagoras.js`
- Test: `test/topics/potegiPitagoras.test.js`

**Interfaces:**
- Consumes: `formatNumber` (Task 2), `buildOptions` (Task 3), `assertValidTask` (Task 2)
- Produces: `templates` array with ids `potegi_obliczanie`, `pierwiastki_obliczanie`, `pitagoras_przeciwprostokatna`

- [ ] **Step 1: Write the failing test**

Create `test/topics/potegiPitagoras.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { templates } from '../../js/topics/potegiPitagoras.js';
import { assertValidTask } from '../../js/taskShape.js';
import { createRng } from '../../js/rng.js';

const LEVELS = ['latwy', 'sredni', 'trudny'];

function parsePl(text) {
  return Number(text.replace(/[^\d,-]/g, '').replace(',', '.'));
}

test('exports three templates with unique ids', () => {
  assert.equal(templates.length, 3);
  assert.equal(new Set(templates.map((t) => t.id)).size, 3);
});

test('every template produces contract-valid tasks at every difficulty', () => {
  for (const template of templates) {
    for (const difficulty of LEVELS) {
      for (let seed = 0; seed < 100; seed++) {
        assertValidTask(template.generate(difficulty, createRng(seed)));
      }
    }
  }
});

test('potegi: the answer equals base to the exponent', () => {
  const template = templates.find((t) => t.id === 'potegi_obliczanie');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [base, exponent] = task.tresc.match(/\d+/g).map(Number);
      assert.equal(parsePl(task.odpowiedz), base ** exponent, task.tresc);
    }
  }
});

test('pierwiastki: the answer squared equals the radicand', () => {
  const template = templates.find((t) => t.id === 'pierwiastki_obliczanie');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [radicand] = task.tresc.match(/\d+/g).map(Number);
      const answer = parsePl(task.odpowiedz);
      assert.equal(answer * answer, radicand, task.tresc);
    }
  }
});

test('pierwiastki radicands are always perfect squares', () => {
  const template = templates.find((t) => t.id === 'pierwiastki_obliczanie');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [radicand] = task.tresc.match(/\d+/g).map(Number);
      assert.ok(Number.isInteger(Math.sqrt(radicand)), `${radicand} is not a square`);
    }
  }
});

test('pitagoras: legs and hypotenuse satisfy a2 + b2 = c2 exactly', () => {
  const template = templates.find((t) => t.id === 'pitagoras_przeciwprostokatna');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [a, b] = task.tresc.match(/\d+/g).map(Number);
      const c = parsePl(task.odpowiedz);
      assert.equal(a * a + b * b, c * c, `${a},${b} -> ${c}`);
    }
  }
});

test('pitagoras answers are whole numbers with a unit', () => {
  const template = templates.find((t) => t.id === 'pitagoras_przeciwprostokatna');
  for (let seed = 0; seed < 100; seed++) {
    const task = template.generate('sredni', createRng(seed));
    assert.ok(task.odpowiedz.includes('cm'), task.odpowiedz);
    assert.ok(Number.isInteger(parsePl(task.odpowiedz)), task.odpowiedz);
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/topics/potegiPitagoras.test.js`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

Create `js/topics/potegiPitagoras.js`:

```js
// Potegi, pierwiastki i twierdzenie Pitagorasa (klasy 7-8).
//
// Poziomy trudnosci:
//   latwy   - podstawy do 5, wykladniki 2-3; trojki pitagorejskie bez skalowania
//   sredni  - podstawy do 9, wykladniki 2-4; trojki skalowane do x3
//   trudny  - podstawy do 12, wykladniki 2-5; trojki skalowane do x6

import { formatNumber } from '../format.js';
import { buildOptions } from '../distractors.js';

// Pythagorean triples keep every answer a whole number, as CKE tasks do.
const TRIPLES = [
  [3, 4, 5],
  [5, 12, 13],
  [8, 15, 17],
  [7, 24, 25],
  [20, 21, 29],
];

const RANGES = {
  latwy: { baseMax: 5, expMax: 3, rootMax: 12, scaleMax: 1 },
  sredni: { baseMax: 9, expMax: 4, rootMax: 20, scaleMax: 3 },
  trudny: { baseMax: 12, expMax: 5, rootMax: 30, scaleMax: 6 },
};

function potegi(difficulty, rng) {
  const { baseMax, expMax } = RANGES[difficulty];
  const base = rng.int(2, baseMax);
  const exponent = rng.int(2, expMax);
  const value = base ** exponent;
  const correct = formatNumber(value);

  // Typowy blad: pomnozenie podstawy przez wykladnik.
  const wrong = [
    formatNumber(base * exponent),
    formatNumber(base ** (exponent - 1)),
    formatNumber(base ** (exponent + 1)),
  ];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'potegi_obliczanie',
    type: 'zamkniete',
    tresc: `Oblicz wartosc potegi ${base}^${exponent}.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Potegę obliczamy mnozac podstawe przez siebie ${exponent} razy.\n` +
      `${Array(exponent).fill(base).join(' · ')} = ${correct}.`,
  };
}

function pierwiastki(difficulty, rng) {
  const { rootMax } = RANGES[difficulty];
  const root = rng.int(2, rootMax);
  const radicand = root * root;

  return {
    id: 'pierwiastki_obliczanie',
    type: 'otwarte',
    tresc: `Oblicz pierwiastek kwadratowy z liczby ${radicand}.`,
    odpowiedz: formatNumber(root),
    rozwiazanie:
      `Szukamy liczby, ktora podniesiona do kwadratu daje ${radicand}.\n` +
      `${root} · ${root} = ${radicand}, wiec wynik to ${root}.`,
  };
}

function pitagoras(difficulty, rng) {
  const { scaleMax } = RANGES[difficulty];
  const [a0, b0, c0] = rng.pick(TRIPLES);
  const scale = rng.int(1, scaleMax);
  const a = a0 * scale;
  const b = b0 * scale;
  const c = c0 * scale;

  return {
    id: 'pitagoras_przeciwprostokatna',
    type: 'otwarte',
    tresc:
      `W trojkacie prostokatnym przyprostokatne maja dlugosci ${a} cm i ${b} cm. ` +
      `Oblicz dlugosc przeciwprostokatnej.`,
    odpowiedz: `${formatNumber(c)} cm`,
    rozwiazanie:
      `Z twierdzenia Pitagorasa: a² + b² = c².\n` +
      `${a}² + ${b}² = ${a * a} + ${b * b} = ${c * c}.\n` +
      `c = pierwiastek z ${c * c} = ${c} cm.`,
  };
}

export const templates = [
  { id: 'potegi_obliczanie', generate: potegi },
  { id: 'pierwiastki_obliczanie', generate: pierwiastki },
  { id: 'pitagoras_przeciwprostokatna', generate: pitagoras },
];
```

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/potegiPitagoras.test.js`
Expected: PASS, 7 tests

- [ ] **Step 5: Commit**

```bash
git add js/topics/potegiPitagoras.js test/topics/potegiPitagoras.test.js
git commit -m "feat: add potegi, pierwiastki i Pitagoras topic templates"
```

---

### Task 11: Funkcje liniowa i kwadratowa (LO/technikum 1–2)

**Files:**
- Create: `js/topics/funkcje.js`
- Test: `test/topics/funkcje.test.js`

**Interfaces:**
- Consumes: `formatNumber` (Task 2), `buildOptions` (Task 3), `assertValidTask` (Task 2)
- Produces: `templates` array with ids `funkcja_liniowa_miejsce_zerowe`, `funkcja_kwadratowa_delta`, `funkcja_kwadratowa_pierwiastki`

- [ ] **Step 1: Write the failing test**

Create `test/topics/funkcje.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { templates } from '../../js/topics/funkcje.js';
import { assertValidTask } from '../../js/taskShape.js';
import { createRng } from '../../js/rng.js';

const LEVELS = ['latwy', 'sredni', 'trudny'];

function parsePl(text) {
  return Number(text.replace(/[^\d,-]/g, '').replace(',', '.'));
}

test('exports three templates with unique ids', () => {
  assert.equal(templates.length, 3);
  assert.equal(new Set(templates.map((t) => t.id)).size, 3);
});

test('every template produces contract-valid tasks at every difficulty', () => {
  for (const template of templates) {
    for (const difficulty of LEVELS) {
      for (let seed = 0; seed < 100; seed++) {
        assertValidTask(template.generate(difficulty, createRng(seed)));
      }
    }
  }
});

test('miejsce zerowe: f(answer) equals zero', () => {
  const template = templates.find((t) => t.id === 'funkcja_liniowa_miejsce_zerowe');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 300; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const body = task.tresc.match(/f\(x\) = ([^.]+)\./)[1];
      const js = body.replace(/,/g, '.').replace(/(\d)x/g, '$1*x');
      const x = parsePl(task.odpowiedz);
      const value = Function('x', `return ${js};`)(x);
      assert.ok(Math.abs(value) < 1e-6, `f(${x}) = ${value} for ${body}`);
    }
  }
});

test('delta: the answer equals b squared minus 4ac', () => {
  const template = templates.find((t) => t.id === 'funkcja_kwadratowa_delta');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 300; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const body = task.tresc.match(/f\(x\) = ([^.]+)\./)[1];
      const a = Number((body.match(/(-?\d*)x²/) ?? [])[1] || 1);
      const bMatch = body.match(/([+-]\s*\d+)x(?!²)/);
      const b = bMatch ? Number(bMatch[1].replace(/\s/g, '')) : 0;
      const cMatch = body.match(/([+-]\s*\d+)\s*$/);
      const c = cMatch ? Number(cMatch[1].replace(/\s/g, '')) : 0;
      assert.equal(parsePl(task.odpowiedz), b * b - 4 * a * c, body);
    }
  }
});

test('pierwiastki: both stated roots satisfy the equation', () => {
  const template = templates.find((t) => t.id === 'funkcja_kwadratowa_pierwiastki');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 300; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const body = task.tresc.match(/f\(x\) = ([^.]+)\./)[1];
      const js = body
        .replace(/,/g, '.')
        .replace(/x²/g, '(x*x)')
        .replace(/(\d)\(x\*x\)/g, '$1*(x*x)')
        .replace(/(\d)x/g, '$1*x');
      const roots = task.odpowiedz.match(/-?\d+(?:,\d+)?/g).map((r) => parsePl(r));
      assert.equal(roots.length, 2, task.odpowiedz);
      for (const r of roots) {
        const value = Function('x', `return ${js};`)(r);
        assert.ok(Math.abs(value) < 1e-6, `f(${r}) = ${value} for ${body}`);
      }
    }
  }
});

test('pierwiastki tasks always have a positive discriminant', () => {
  const template = templates.find((t) => t.id === 'funkcja_kwadratowa_pierwiastki');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const roots = task.odpowiedz.match(/-?\d+(?:,\d+)?/g).map(parsePl);
      assert.notEqual(roots[0], roots[1], 'roots coincided; delta was zero');
    }
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/topics/funkcje.test.js`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

Create `js/topics/funkcje.js`:

```js
// Funkcja liniowa i kwadratowa (liceum/technikum 1-2).
//
// Poziomy trudnosci:
//   latwy   - wspolczynniki do 6, pierwiastki calkowite z zakresu -5..5
//   sredni  - wspolczynniki do 10, pierwiastki calkowite z zakresu -9..9
//   trudny  - wspolczynniki do 15, a moze byc rozne od 1

import { formatNumber } from '../format.js';
import { buildOptions } from '../distractors.js';

const RANGES = {
  latwy: { coefMax: 6, rootRange: 5, leadingOne: true },
  sredni: { coefMax: 10, rootRange: 9, leadingOne: true },
  trudny: { coefMax: 15, rootRange: 9, leadingOne: false },
};

function signed(value, suffix) {
  const sign = value >= 0 ? '+' : '-';
  return `${sign} ${Math.abs(value)}${suffix}`;
}

function miejsceZerowe(difficulty, rng) {
  const { coefMax } = RANGES[difficulty];
  const a = rng.int(1, coefMax) * (rng.bool() ? 1 : -1);
  const root = rng.int(-9, 9);
  const b = -a * root; // guarantees f(root) === 0

  const correct = `x = ${formatNumber(root)}`;
  // Typowe bledy: zapomniany znak minus, podstawienie b zamiast -b/a.
  const wrong = [
    `x = ${formatNumber(-root)}`,
    `x = ${formatNumber(b)}`,
    `x = ${formatNumber(a)}`,
  ];
  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'funkcja_liniowa_miejsce_zerowe',
    type: 'zamkniete',
    tresc: `Dana jest funkcja f(x) = ${a}x ${signed(b, '')}. Wyznacz miejsce zerowe tej funkcji.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Miejsce zerowe to rozwiazanie rownania f(x) = 0.\n` +
      `${a}x ${signed(b, '')} = 0, zatem ${a}x = ${formatNumber(-b)}.\n` +
      `x = ${formatNumber(-b)} : ${a} = ${formatNumber(root)}.`,
  };
}

function delta(difficulty, rng) {
  const { coefMax, leadingOne } = RANGES[difficulty];
  const a = leadingOne ? 1 : rng.int(1, 4);
  const b = rng.int(-coefMax, coefMax);
  const c = rng.int(-coefMax, coefMax);
  const value = b * b - 4 * a * c;

  return {
    id: 'funkcja_kwadratowa_delta',
    type: 'otwarte',
    tresc:
      `Dana jest funkcja f(x) = ${a === 1 ? '' : a}x² ${signed(b, 'x')} ` +
      `${signed(c, '')}. Oblicz wyroznik (delte) tej funkcji.`,
    odpowiedz: formatNumber(value),
    rozwiazanie:
      `Korzystamy ze wzoru Δ = b² - 4ac.\n` +
      `a = ${a}, b = ${b}, c = ${c}.\n` +
      `Δ = ${b}² - 4 · ${a} · ${c} = ${b * b} - ${4 * a * c} = ${formatNumber(value)}.`,
  };
}

function pierwiastki(difficulty, rng) {
  const { rootRange } = RANGES[difficulty];
  // Build the quadratic from its roots so both roots are exact integers.
  let r1 = rng.int(-rootRange, rootRange);
  let r2 = rng.int(-rootRange, rootRange);
  if (r1 === r2) r2 = r1 + 1; // keep delta strictly positive
  if (r1 > r2) [r1, r2] = [r2, r1];

  const b = -(r1 + r2);
  const c = r1 * r2;
  const discriminant = b * b - 4 * c;

  return {
    id: 'funkcja_kwadratowa_pierwiastki',
    type: 'otwarte',
    tresc:
      `Dana jest funkcja f(x) = x² ${signed(b, 'x')} ${signed(c, '')}. ` +
      `Wyznacz miejsca zerowe tej funkcji.`,
    odpowiedz: `x₁ = ${formatNumber(r1)}, x₂ = ${formatNumber(r2)}`,
    rozwiazanie:
      `Δ = ${b}² - 4 · 1 · ${c} = ${discriminant}.\n` +
      `Pierwiastek z Δ wynosi ${formatNumber(Math.sqrt(discriminant))}.\n` +
      `x₁ = (${-b} - ${formatNumber(Math.sqrt(discriminant))}) : 2 = ${formatNumber(r1)}, ` +
      `x₂ = (${-b} + ${formatNumber(Math.sqrt(discriminant))}) : 2 = ${formatNumber(r2)}.`,
  };
}

export const templates = [
  { id: 'funkcja_liniowa_miejsce_zerowe', generate: miejsceZerowe },
  { id: 'funkcja_kwadratowa_delta', generate: delta },
  { id: 'funkcja_kwadratowa_pierwiastki', generate: pierwiastki },
];
```

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/funkcje.test.js`
Expected: PASS, 6 tests

- [ ] **Step 5: Commit**

```bash
git add js/topics/funkcje.js test/topics/funkcje.test.js
git commit -m "feat: add funkcje liniowa i kwadratowa topic templates"
```

---

### Task 12: Ciągi, trygonometria, geometria analityczna i prawdopodobieństwo (LO/technikum 2–4)

**Files:**
- Create: `js/topics/liceumZaawansowane.js`
- Test: `test/topics/liceumZaawansowane.test.js`

**Interfaces:**
- Consumes: `formatNumber` (Task 2), `buildOptions` (Task 3), `assertValidTask` (Task 2)
- Produces: `templates` array with ids `ciag_arytmetyczny_wyraz`, `trygonometria_trojkat_prostokatny`, `geometria_analityczna_odleglosc`, `prawdopodobienstwo_kostka`

- [ ] **Step 1: Write the failing test**

Create `test/topics/liceumZaawansowane.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { templates } from '../../js/topics/liceumZaawansowane.js';
import { assertValidTask } from '../../js/taskShape.js';
import { createRng } from '../../js/rng.js';

const LEVELS = ['latwy', 'sredni', 'trudny'];

function parsePl(text) {
  return Number(text.replace(/[^\d,-]/g, '').replace(',', '.'));
}

test('exports four templates with unique ids', () => {
  assert.equal(templates.length, 4);
  assert.equal(new Set(templates.map((t) => t.id)).size, 4);
});

test('every template produces contract-valid tasks at every difficulty', () => {
  for (const template of templates) {
    for (const difficulty of LEVELS) {
      for (let seed = 0; seed < 100; seed++) {
        assertValidTask(template.generate(difficulty, createRng(seed)));
      }
    }
  }
});

test('ciag arytmetyczny: answer equals a1 + (n-1)*r', () => {
  const template = templates.find((t) => t.id === 'ciag_arytmetyczny_wyraz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [a1, r, n] = task.tresc.match(/-?\d+/g).map(Number);
      assert.equal(parsePl(task.odpowiedz), a1 + (n - 1) * r, task.tresc);
    }
  }
});

test('trygonometria: sin of the angle equals opposite over hypotenuse', () => {
  const template = templates.find((t) => t.id === 'trygonometria_trojkat_prostokatny');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [opposite, hypotenuse] = task.tresc.match(/\d+/g).map(Number);
      const expected = opposite / hypotenuse;
      assert.ok(
        Math.abs(parsePl(task.odpowiedz) - expected) < 5e-3,
        `${task.tresc} -> ${task.odpowiedz}, expected ${expected}`
      );
    }
  }
});

test('odleglosc punktow: answer matches the distance formula', () => {
  const template = templates.find((t) => t.id === 'geometria_analityczna_odleglosc');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [x1, y1, x2, y2] = task.tresc.match(/-?\d+/g).map(Number);
      const expected = Math.hypot(x2 - x1, y2 - y1);
      assert.ok(
        Math.abs(parsePl(task.odpowiedz) - expected) < 1e-6,
        `${task.tresc} -> ${task.odpowiedz}, expected ${expected}`
      );
    }
  }
});

test('odleglosc results are whole numbers, never irrational', () => {
  const template = templates.find((t) => t.id === 'geometria_analityczna_odleglosc');
  for (let seed = 0; seed < 200; seed++) {
    const task = template.generate('trudny', createRng(seed));
    assert.ok(Number.isInteger(parsePl(task.odpowiedz)), task.odpowiedz);
  }
});

test('prawdopodobienstwo: answer is a fraction between 0 and 1', () => {
  const template = templates.find((t) => t.id === 'prawdopodobienstwo_kostka');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const m = task.odpowiedz.match(/^(\d+)\/(\d+)$/);
      assert.ok(m, `not a fraction: ${task.odpowiedz}`);
      const value = Number(m[1]) / Number(m[2]);
      assert.ok(value > 0 && value <= 1, `${task.odpowiedz} out of range`);
    }
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/topics/liceumZaawansowane.test.js`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

Create `js/topics/liceumZaawansowane.js`:

```js
// Ciagi, trygonometria, geometria analityczna i prawdopodobienstwo
// (liceum/technikum 2-4).
//
// Poziomy trudnosci:
//   latwy   - male wartosci, n do 10, wspolrzedne do 6
//   sredni  - n do 25, wspolrzedne do 12
//   trudny  - n do 60, wspolrzedne do 20, wieksze skalowania trojkatow

import { formatNumber, formatFraction } from '../format.js';
import { buildOptions } from '../distractors.js';

const TRIPLES = [
  [3, 4, 5],
  [5, 12, 13],
  [8, 15, 17],
  [7, 24, 25],
];

const RANGES = {
  latwy: { nMax: 10, coordMax: 6, scaleMax: 1, diffMax: 6 },
  sredni: { nMax: 25, coordMax: 12, scaleMax: 2, diffMax: 12 },
  trudny: { nMax: 60, coordMax: 20, scaleMax: 4, diffMax: 20 },
};

function ciagArytmetyczny(difficulty, rng) {
  const { nMax, diffMax } = RANGES[difficulty];
  const a1 = rng.int(-diffMax, diffMax);
  const r = rng.int(1, diffMax) * (rng.bool() ? 1 : -1);
  const n = rng.int(3, nMax);
  const value = a1 + (n - 1) * r;
  const correct = formatNumber(value);

  // Typowy blad: uzycie n zamiast n-1 we wzorze.
  const wrong = [
    formatNumber(a1 + n * r),
    formatNumber(a1 + (n - 2) * r),
    formatNumber(a1 * n),
  ];
  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'ciag_arytmetyczny_wyraz',
    type: 'zamkniete',
    tresc:
      `W ciagu arytmetycznym pierwszy wyraz wynosi ${a1}, ` +
      `a roznica wynosi ${r}. Oblicz wyraz o numerze ${n}.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Korzystamy ze wzoru aₙ = a₁ + (n - 1) · r.\n` +
      `aₙ = ${a1} + (${n} - 1) · ${r} = ${a1} + ${(n - 1) * r} = ${correct}.`,
  };
}

function trygonometria(difficulty, rng) {
  const { scaleMax } = RANGES[difficulty];
  const [a0, , c0] = rng.pick(TRIPLES);
  const scale = rng.int(1, scaleMax);
  const opposite = a0 * scale;
  const hypotenuse = c0 * scale;
  const sine = opposite / hypotenuse;

  return {
    id: 'trygonometria_trojkat_prostokatny',
    type: 'otwarte',
    tresc:
      `W trojkacie prostokatnym przyprostokatna lezaca naprzeciw kata ostrego ` +
      `α ma dlugosc ${opposite} cm, a przeciwprostokatna ma dlugosc ` +
      `${hypotenuse} cm. Oblicz sin α.`,
    odpowiedz: formatNumber(Number(sine.toFixed(4))),
    rozwiazanie:
      `Sinus kata ostrego to stosunek przyprostokatnej lezacej naprzeciw tego ` +
      `kata do przeciwprostokatnej.\n` +
      `sin α = ${opposite} : ${hypotenuse} = ` +
      `${formatNumber(Number(sine.toFixed(4)))}.`,
  };
}

function odleglosc(difficulty, rng) {
  const { coordMax, scaleMax } = RANGES[difficulty];
  // Offsets come from a Pythagorean triple so the distance is a whole number.
  const [dx0, dy0, d0] = rng.pick(TRIPLES);
  const scale = rng.int(1, scaleMax);
  const x1 = rng.int(-coordMax, coordMax);
  const y1 = rng.int(-coordMax, coordMax);
  const x2 = x1 + dx0 * scale * (rng.bool() ? 1 : -1);
  const y2 = y1 + dy0 * scale * (rng.bool() ? 1 : -1);
  const distance = d0 * scale;

  return {
    id: 'geometria_analityczna_odleglosc',
    type: 'otwarte',
    tresc:
      `Dane sa punkty A = (${x1}, ${y1}) oraz B = (${x2}, ${y2}). ` +
      `Oblicz odleglosc miedzy tymi punktami.`,
    odpowiedz: formatNumber(distance),
    rozwiazanie:
      `Korzystamy ze wzoru |AB| = pierwiastek z ((x₂ - x₁)² + (y₂ - y₁)²).\n` +
      `x₂ - x₁ = ${x2 - x1}, y₂ - y₁ = ${y2 - y1}.\n` +
      `|AB| = pierwiastek z (${(x2 - x1) ** 2} + ${(y2 - y1) ** 2}) = ` +
      `pierwiastek z ${distance * distance} = ${distance}.`,
  };
}

function prawdopodobienstwo(difficulty, rng) {
  const events = [
    { opis: 'wypadnie liczba parzysta', favourable: 3 },
    { opis: 'wypadnie liczba wieksza od 4', favourable: 2 },
    { opis: 'wypadnie liczba pierwsza', favourable: 3 },
    { opis: 'wypadnie liczba podzielna przez 3', favourable: 2 },
    { opis: 'wypadnie liczba mniejsza od 6', favourable: 5 },
  ];
  const event = rng.pick(events);
  const correct = formatFraction(event.favourable, 6);

  return {
    id: 'prawdopodobienstwo_kostka',
    type: 'otwarte',
    tresc:
      `Rzucamy jeden raz szescienna kostka do gry. ` +
      `Oblicz prawdopodobienstwo zdarzenia: ${event.opis}.`,
    odpowiedz: correct,
    rozwiazanie:
      `Wszystkich mozliwych wynikow jest 6.\n` +
      `Zdarzeniu sprzyja ${event.favourable} wynikow.\n` +
      `P = ${event.favourable}/6 = ${correct}.`,
  };
}

export const templates = [
  { id: 'ciag_arytmetyczny_wyraz', generate: ciagArytmetyczny },
  { id: 'trygonometria_trojkat_prostokatny', generate: trygonometria },
  { id: 'geometria_analityczna_odleglosc', generate: odleglosc },
  { id: 'prawdopodobienstwo_kostka', generate: prawdopodobienstwo },
];
```

Note: `prawdopodobienstwo_kostka` intentionally has a small fixed event list, so a sheet requesting many tasks from a probability-only pool will repeat wording. The sheet generator (Task 14) prevents textually identical duplicates, so this is safe.

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/liceumZaawansowane.test.js`
Expected: PASS, 7 tests

- [ ] **Step 5: Commit**

```bash
git add js/topics/liceumZaawansowane.js test/topics/liceumZaawansowane.test.js
git commit -m "feat: add liceum advanced topic templates"
```

---

### Task 13: Topic registry and exam pools

**Files:**
- Create: `js/topicRegistry.js`
- Create: `js/examModes.js`
- Test: `test/topicRegistry.test.js`

**Interfaces:**
- Consumes: `templates` exports from Tasks 4–12
- Produces:
  - `GRADES` — ordered array of `{ key, label, etap }`, e.g. `{ key: 'sp4', label: 'Klasa 4', etap: 'podstawowa' }`. Etap values: `'podstawowa'` | `'ponadpodstawowa'`.
  - `TOPICS` — array of `{ key, label, templates }` where `label` is the Polish display name for the dropdown
  - `getTopicsForGrade(gradeKey) => Topic[]`
  - `getTemplatesForGrade(gradeKey, topicKey|null) => Template[]` — all templates for the grade, or just one topic's when `topicKey` is given
  - From `examModes.js`: `EXAM_MODES` — array of `{ key, label, gradeKeys, closedRatio }`, and `getTemplatesForExam(examKey) => Template[]`

- [ ] **Step 1: Write the failing test**

Create `test/topicRegistry.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  GRADES,
  TOPICS,
  getTopicsForGrade,
  getTemplatesForGrade,
} from '../js/topicRegistry.js';
import { EXAM_MODES, getTemplatesForExam } from '../js/examModes.js';

test('declares all nine grades in curriculum order', () => {
  assert.equal(GRADES.length, 9);
  assert.deepEqual(
    GRADES.map((g) => g.key),
    ['sp4', 'sp5', 'sp6', 'sp7', 'sp8', 'lo1', 'lo2', 'lo3', 'lo4']
  );
});

test('grades carry Polish labels and a valid etap', () => {
  for (const grade of GRADES) {
    assert.ok(grade.label.startsWith('Klasa'), grade.label);
    assert.ok(['podstawowa', 'ponadpodstawowa'].includes(grade.etap), grade.etap);
  }
});

test('every grade has at least two topics', () => {
  for (const grade of GRADES) {
    const topics = getTopicsForGrade(grade.key);
    assert.ok(topics.length >= 2, `${grade.key} has ${topics.length} topics`);
  }
});

test('every grade resolves to at least four templates', () => {
  for (const grade of GRADES) {
    const templates = getTemplatesForGrade(grade.key, null);
    assert.ok(templates.length >= 4, `${grade.key} has ${templates.length} templates`);
  }
});

test('every template in the registry is callable and has an id', () => {
  for (const topic of TOPICS) {
    assert.ok(topic.templates.length > 0, `${topic.key} is empty`);
    for (const template of topic.templates) {
      assert.equal(typeof template.generate, 'function', topic.key);
      assert.equal(typeof template.id, 'string', topic.key);
    }
  }
});

test('topic keys and template ids are globally unique', () => {
  const topicKeys = TOPICS.map((t) => t.key);
  assert.equal(new Set(topicKeys).size, topicKeys.length);
  const ids = TOPICS.flatMap((t) => t.templates.map((x) => x.id));
  assert.equal(new Set(ids).size, ids.length, 'duplicate template id');
});

test('filtering by topic returns only that topic templates', () => {
  const topics = getTopicsForGrade('sp6');
  const chosen = topics[0];
  const filtered = getTemplatesForGrade('sp6', chosen.key);
  assert.deepEqual(
    filtered.map((t) => t.id).sort(),
    chosen.templates.map((t) => t.id).sort()
  );
});

test('an unknown grade key returns no templates rather than throwing', () => {
  assert.deepEqual(getTemplatesForGrade('nieistniejaca', null), []);
});

test('declares both exam modes with Polish labels', () => {
  assert.deepEqual(EXAM_MODES.map((m) => m.key), ['osmoklasisty', 'matura']);
  for (const mode of EXAM_MODES) {
    assert.ok(mode.label.length > 0);
    assert.ok(mode.closedRatio > 0 && mode.closedRatio < 1);
  }
});

test('osmoklasisty pool draws from primary school grades only', () => {
  const spTemplates = new Set(
    ['sp4', 'sp5', 'sp6', 'sp7', 'sp8'].flatMap((g) =>
      getTemplatesForGrade(g, null).map((t) => t.id)
    )
  );
  for (const template of getTemplatesForExam('osmoklasisty')) {
    assert.ok(spTemplates.has(template.id), `${template.id} is not an SP template`);
  }
});

test('matura pool draws from secondary school grades only', () => {
  const loTemplates = new Set(
    ['lo1', 'lo2', 'lo3', 'lo4'].flatMap((g) =>
      getTemplatesForGrade(g, null).map((t) => t.id)
    )
  );
  for (const template of getTemplatesForExam('matura')) {
    assert.ok(loTemplates.has(template.id), `${template.id} is not an LO template`);
  }
});

test('exam pools contain no duplicate templates', () => {
  for (const mode of EXAM_MODES) {
    const ids = getTemplatesForExam(mode.key).map((t) => t.id);
    assert.equal(new Set(ids).size, ids.length, `${mode.key} has duplicates`);
  }
});

test('each exam pool has enough templates to fill a twelve-task sheet variety', () => {
  for (const mode of EXAM_MODES) {
    assert.ok(getTemplatesForExam(mode.key).length >= 6, mode.key);
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/topicRegistry.test.js`
Expected: FAIL — `Cannot find module '../js/topicRegistry.js'`

- [ ] **Step 3: Write the registry**

Create `js/topicRegistry.js`:

```js
// Maps grades to the topic pools available to them. Adding a topic means
// adding one entry to TOPICS and listing its key under the relevant grades.

import { templates as liczbyNaturalne } from './topics/liczbyNaturalne.js';
import { templates as ulamki } from './topics/ulamki.js';
import { templates as ulamkiDziesietne } from './topics/ulamkiDziesietne.js';
import { templates as procenty } from './topics/procenty.js';
import { templates as geometriaPlaska } from './topics/geometriaPlaska.js';
import { templates as rownania } from './topics/rownania.js';
import { templates as potegiPitagoras } from './topics/potegiPitagoras.js';
import { templates as funkcje } from './topics/funkcje.js';
import { templates as liceumZaawansowane } from './topics/liceumZaawansowane.js';

export const TOPICS = [
  { key: 'liczby_naturalne', label: 'Dzialania na liczbach naturalnych', templates: liczbyNaturalne },
  { key: 'ulamki', label: 'Ulamki zwykle', templates: ulamki },
  { key: 'ulamki_dziesietne', label: 'Ulamki dziesietne', templates: ulamkiDziesietne },
  { key: 'procenty', label: 'Procenty', templates: procenty },
  { key: 'geometria_plaska', label: 'Pola i obwody figur', templates: geometriaPlaska },
  { key: 'rownania', label: 'Rownania i wyrazenia algebraiczne', templates: rownania },
  { key: 'potegi_pitagoras', label: 'Potegi, pierwiastki i twierdzenie Pitagorasa', templates: potegiPitagoras },
  { key: 'funkcje', label: 'Funkcja liniowa i kwadratowa', templates: funkcje },
  { key: 'liceum_zaawansowane', label: 'Ciagi, trygonometria, geometria analityczna, prawdopodobienstwo', templates: liceumZaawansowane },
];

export const GRADES = [
  { key: 'sp4', label: 'Klasa 4', etap: 'podstawowa', topicKeys: ['liczby_naturalne', 'ulamki', 'geometria_plaska'] },
  { key: 'sp5', label: 'Klasa 5', etap: 'podstawowa', topicKeys: ['ulamki', 'ulamki_dziesietne', 'geometria_plaska', 'liczby_naturalne'] },
  { key: 'sp6', label: 'Klasa 6', etap: 'podstawowa', topicKeys: ['ulamki_dziesietne', 'procenty', 'geometria_plaska', 'ulamki'] },
  { key: 'sp7', label: 'Klasa 7', etap: 'podstawowa', topicKeys: ['procenty', 'potegi_pitagoras', 'rownania', 'ulamki_dziesietne'] },
  { key: 'sp8', label: 'Klasa 8', etap: 'podstawowa', topicKeys: ['potegi_pitagoras', 'rownania', 'procenty', 'geometria_plaska'] },
  { key: 'lo1', label: 'Klasa 1 (liceum/technikum)', etap: 'ponadpodstawowa', topicKeys: ['rownania', 'funkcje', 'potegi_pitagoras', 'procenty'] },
  { key: 'lo2', label: 'Klasa 2 (liceum/technikum)', etap: 'ponadpodstawowa', topicKeys: ['funkcje', 'liceum_zaawansowane', 'rownania'] },
  { key: 'lo3', label: 'Klasa 3 (liceum/technikum)', etap: 'ponadpodstawowa', topicKeys: ['liceum_zaawansowane', 'funkcje', 'potegi_pitagoras'] },
  { key: 'lo4', label: 'Klasa 4 (liceum/technikum)', etap: 'ponadpodstawowa', topicKeys: ['liceum_zaawansowane', 'funkcje', 'rownania', 'procenty'] },
];

function findGrade(gradeKey) {
  return GRADES.find((g) => g.key === gradeKey) ?? null;
}

export function getTopicsForGrade(gradeKey) {
  const grade = findGrade(gradeKey);
  if (!grade) return [];
  return grade.topicKeys
    .map((key) => TOPICS.find((t) => t.key === key))
    .filter(Boolean);
}

export function getTemplatesForGrade(gradeKey, topicKey) {
  const topics = getTopicsForGrade(gradeKey);
  if (topicKey) {
    const topic = topics.find((t) => t.key === topicKey);
    return topic ? [...topic.templates] : [];
  }
  return topics.flatMap((t) => t.templates);
}
```

- [ ] **Step 4: Write the exam pools**

Create `js/examModes.js`:

```js
// Exam pools are cumulative: an exam draws from every grade in its stage,
// not from a single year.

import { getTemplatesForGrade } from './topicRegistry.js';

export const EXAM_MODES = [
  {
    key: 'osmoklasisty',
    label: 'Egzamin osmoklasisty',
    gradeKeys: ['sp4', 'sp5', 'sp6', 'sp7', 'sp8'],
    closedRatio: 0.6,
  },
  {
    key: 'matura',
    label: 'Matura (poziom podstawowy)',
    gradeKeys: ['lo1', 'lo2', 'lo3', 'lo4'],
    closedRatio: 0.6,
  },
];

export function getTemplatesForExam(examKey) {
  const mode = EXAM_MODES.find((m) => m.key === examKey);
  if (!mode) return [];
  const seen = new Set();
  const out = [];
  for (const gradeKey of mode.gradeKeys) {
    for (const template of getTemplatesForGrade(gradeKey, null)) {
      if (seen.has(template.id)) continue;
      seen.add(template.id);
      out.push(template);
    }
  }
  return out;
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `node --test test/topicRegistry.test.js`
Expected: PASS, 13 tests

- [ ] **Step 6: Run the full suite**

Run: `node --test`
Expected: PASS, all tests from Tasks 1–13

- [ ] **Step 7: Commit**

```bash
git add js/topicRegistry.js js/examModes.js test/topicRegistry.test.js
git commit -m "feat: add topic registry and exam pools"
```

---

### Task 14: Sheet generator

**Files:**
- Create: `js/sheetGenerator.js`
- Test: `test/sheetGenerator.test.js`

**Interfaces:**
- Consumes: `createRng` (Task 1), `getTemplatesForGrade` (Task 13), `getTemplatesForExam` (Task 13), `EXAM_MODES` (Task 13)
- Produces:
  - `clampCount(value) => number` — coerces anything to an integer in 1–12
  - `generateSheet(options) => Task[]` where `options` is
    `{ mode: 'cwiczenia' | 'egzamin', gradeKey?, topicKey?, examKey?, difficulty, count, seed? }`.
    Throws `Error('Brak zadan dla wybranej kombinacji.')` when the pool is empty.
    Consumed by `app.js` (Task 16).

- [ ] **Step 1: Write the failing test**

Create `test/sheetGenerator.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateSheet, clampCount } from '../js/sheetGenerator.js';
import { assertValidTask } from '../js/taskShape.js';
import { GRADES } from '../js/topicRegistry.js';

const LEVELS = ['latwy', 'sredni', 'trudny'];

test('clampCount coerces anything into 1-12', () => {
  assert.equal(clampCount(6), 6);
  assert.equal(clampCount(1), 1);
  assert.equal(clampCount(12), 12);
  assert.equal(clampCount(0), 1);
  assert.equal(clampCount(-5), 1);
  assert.equal(clampCount(13), 12);
  assert.equal(clampCount(999), 12);
  assert.equal(clampCount(3.7), 3);
  assert.equal(clampCount('8'), 8);
  assert.equal(clampCount(''), 1);
  assert.equal(clampCount('abc'), 1);
  assert.equal(clampCount(null), 1);
  assert.equal(clampCount(undefined), 1);
  assert.equal(clampCount(NaN), 1);
});

test('returns exactly the requested number of tasks, for every count', () => {
  for (let count = 1; count <= 12; count++) {
    const sheet = generateSheet({
      mode: 'cwiczenia',
      gradeKey: 'sp6',
      topicKey: null,
      difficulty: 'sredni',
      count,
      seed: count,
    });
    assert.equal(sheet.length, count);
  }
});

test('every task in every grade and difficulty is contract-valid', () => {
  for (const grade of GRADES) {
    for (const difficulty of LEVELS) {
      const sheet = generateSheet({
        mode: 'cwiczenia',
        gradeKey: grade.key,
        topicKey: null,
        difficulty,
        count: 12,
        seed: 5,
      });
      assert.equal(sheet.length, 12, grade.key);
      sheet.forEach((task) => assertValidTask(task));
    }
  }
});

test('no two tasks in a sheet share identical tresc', () => {
  for (const grade of GRADES) {
    for (let seed = 0; seed < 30; seed++) {
      const sheet = generateSheet({
        mode: 'cwiczenia',
        gradeKey: grade.key,
        topicKey: null,
        difficulty: 'sredni',
        count: 12,
        seed,
      });
      const texts = sheet.map((t) => t.tresc);
      assert.equal(new Set(texts).size, texts.length, `${grade.key} seed ${seed}`);
    }
  }
});

test('the same seed reproduces the same sheet', () => {
  const options = {
    mode: 'cwiczenia',
    gradeKey: 'sp7',
    topicKey: null,
    difficulty: 'trudny',
    count: 8,
    seed: 123,
  };
  assert.deepEqual(generateSheet(options), generateSheet(options));
});

test('different seeds produce different sheets', () => {
  const base = {
    mode: 'cwiczenia',
    gradeKey: 'sp7',
    topicKey: null,
    difficulty: 'sredni',
    count: 8,
  };
  const a = generateSheet({ ...base, seed: 1 }).map((t) => t.tresc);
  const b = generateSheet({ ...base, seed: 2 }).map((t) => t.tresc);
  assert.notDeepEqual(a, b);
});

test('topic filtering restricts the sheet to that topic', () => {
  const sheet = generateSheet({
    mode: 'cwiczenia',
    gradeKey: 'sp6',
    topicKey: 'procenty',
    difficulty: 'sredni',
    count: 6,
    seed: 9,
  });
  assert.equal(sheet.length, 6);
  for (const task of sheet) {
    assert.ok(task.id.startsWith('procenty_'), task.id);
  }
});

test('exam mode produces valid tasks for both exams', () => {
  for (const examKey of ['osmoklasisty', 'matura']) {
    const sheet = generateSheet({
      mode: 'egzamin',
      examKey,
      difficulty: 'sredni',
      count: 12,
      seed: 3,
    });
    assert.equal(sheet.length, 12);
    sheet.forEach((task) => assertValidTask(task));
  }
});

test('exam mode includes both closed and open tasks on a full sheet', () => {
  for (const examKey of ['osmoklasisty', 'matura']) {
    const sheet = generateSheet({
      mode: 'egzamin',
      examKey,
      difficulty: 'sredni',
      count: 12,
      seed: 4,
    });
    const types = new Set(sheet.map((t) => t.type));
    assert.ok(types.has('zamkniete'), `${examKey} had no closed tasks`);
    assert.ok(types.has('otwarte'), `${examKey} had no open tasks`);
  }
});

test('an out-of-range count is clamped rather than rejected', () => {
  const sheet = generateSheet({
    mode: 'cwiczenia',
    gradeKey: 'sp5',
    topicKey: null,
    difficulty: 'latwy',
    count: 50,
    seed: 2,
  });
  assert.equal(sheet.length, 12);
});

test('an empty pool throws a Polish error', () => {
  assert.throws(
    () =>
      generateSheet({
        mode: 'cwiczenia',
        gradeKey: 'nieistniejaca',
        topicKey: null,
        difficulty: 'latwy',
        count: 3,
        seed: 1,
      }),
    /Brak zadan/
  );
});

test('tasks repeat templates with different parameters when the pool is small', () => {
  const sheet = generateSheet({
    mode: 'cwiczenia',
    gradeKey: 'sp4',
    topicKey: 'liczby_naturalne',
    difficulty: 'trudny',
    count: 12,
    seed: 6,
  });
  assert.equal(sheet.length, 12);
  assert.equal(new Set(sheet.map((t) => t.tresc)).size, 12);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/sheetGenerator.test.js`
Expected: FAIL — `Cannot find module '../js/sheetGenerator.js'`

- [ ] **Step 3: Write the implementation**

Create `js/sheetGenerator.js`:

```js
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
```

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/sheetGenerator.test.js`
Expected: PASS, 12 tests

If "tasks repeat templates with different parameters when the pool is small" fails because a small-pool template cannot produce 12 distinct texts at that difficulty, widen that template's parameter range in its topic file (and re-run its own topic test) rather than weakening this assertion.

- [ ] **Step 5: Commit**

```bash
git add js/sheetGenerator.js test/sheetGenerator.test.js
git commit -m "feat: add sheet generator with dedupe and exam task mix"
```

---

### Task 15: HTML shell and stylesheet

**Files:**
- Create: `index.html`
- Create: `css/styles.css`

**Interfaces:**
- Consumes: nothing yet (script wiring lands in Task 16)
- Produces: the DOM element ids `app.js` binds to in Task 16:
  - Menu: `#tryb-cwiczenia`, `#tryb-egzamin` (radios, name `tryb`), `#grupa-cwiczenia`, `#grupa-egzamin`, `#wybor-etapu`, `#wybor-klasy`, `#wybor-dzialu`, `#wybor-egzaminu`, `#trudnosc` (radio group, name `trudnosc`, values `latwy`/`sredni`/`trudny`), `#liczba-zadan`, `#generuj`
  - Sheet: `#ekran-menu`, `#ekran-arkusz`, `#naglowek-arkusza`, `#lista-zadan`, `#pokaz-odpowiedzi`, `#nowy-arkusz`, `#drukuj`, `#powrot`, `#komunikat-bledu`

- [ ] **Step 1: Write the HTML shell**

Create `index.html`:

```html
<!doctype html>
<html lang="pl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Generator zadań z matematyki</title>
    <link rel="stylesheet" href="css/styles.css" />
  </head>
  <body>
    <header class="naglowek">
      <h1>Generator zadań z matematyki</h1>
    </header>

    <main>
      <section id="ekran-menu">
        <form id="formularz" novalidate>
          <fieldset>
            <legend>Tryb</legend>
            <label>
              <input type="radio" name="tryb" id="tryb-cwiczenia" value="cwiczenia" checked />
              Ćwiczenia
            </label>
            <label>
              <input type="radio" name="tryb" id="tryb-egzamin" value="egzamin" />
              Egzamin
            </label>
          </fieldset>

          <fieldset id="grupa-cwiczenia">
            <legend>Zakres materiału</legend>
            <p class="pole">
              <label for="wybor-etapu">Etap</label>
              <select id="wybor-etapu">
                <option value="podstawowa">Szkoła podstawowa</option>
                <option value="ponadpodstawowa">Liceum / technikum</option>
              </select>
            </p>
            <p class="pole">
              <label for="wybor-klasy">Klasa</label>
              <select id="wybor-klasy"></select>
            </p>
            <p class="pole">
              <label for="wybor-dzialu">Dział</label>
              <select id="wybor-dzialu"></select>
            </p>
          </fieldset>

          <fieldset id="grupa-egzamin" hidden>
            <legend>Rodzaj egzaminu</legend>
            <p class="pole">
              <label for="wybor-egzaminu">Egzamin</label>
              <select id="wybor-egzaminu"></select>
            </p>
          </fieldset>

          <fieldset id="trudnosc">
            <legend>Trudność</legend>
            <label><input type="radio" name="trudnosc" value="latwy" /> Łatwy</label>
            <label><input type="radio" name="trudnosc" value="sredni" checked /> Średni</label>
            <label><input type="radio" name="trudnosc" value="trudny" /> Trudny</label>
          </fieldset>

          <p class="pole">
            <label for="liczba-zadan">Liczba zadań (1–12)</label>
            <input type="number" id="liczba-zadan" min="1" max="12" step="1" value="6" />
          </p>

          <p id="komunikat-bledu" class="komunikat" role="alert" hidden></p>

          <p><button type="submit" id="generuj">Generuj zadania</button></p>
        </form>
      </section>

      <section id="ekran-arkusz" hidden>
        <div class="pasek">
          <p id="naglowek-arkusza"></p>
          <button type="button" id="powrot">← Wróć do menu</button>
        </div>

        <ol id="lista-zadan"></ol>

        <div class="pasek pasek-akcji">
          <button type="button" id="pokaz-odpowiedzi">Pokaż odpowiedzi</button>
          <button type="button" id="nowy-arkusz">Generuj nowy arkusz</button>
          <button type="button" id="drukuj">Drukuj</button>
        </div>
      </section>
    </main>

    <script type="module" src="js/app.js"></script>
  </body>
</html>
```

- [ ] **Step 2: Write the stylesheet**

Create `css/styles.css`:

```css
/* Plain, readable styling. No animations, no imagery, no colour beyond
   what is needed to separate regions. */

:root {
  --tekst: #1a1a1a;
  --tlo: #ffffff;
  --ramka: #999999;
  --tlo-pomocnicze: #f4f4f4;
  --akcent: #24406b;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0 1rem 3rem;
  font-family: system-ui, -apple-system, "Segoe UI", Arial, sans-serif;
  font-size: 1rem;
  line-height: 1.6;
  color: var(--tekst);
  background: var(--tlo);
}

main {
  max-width: 46rem;
  margin: 0 auto;
}

.naglowek {
  max-width: 46rem;
  margin: 0 auto;
  padding: 1.5rem 0 1rem;
  border-bottom: 2px solid var(--ramka);
}

h1 {
  margin: 0;
  font-size: 1.5rem;
}

fieldset {
  margin: 1.25rem 0;
  padding: 0.75rem 1rem 1rem;
  border: 1px solid var(--ramka);
}

legend {
  padding: 0 0.4rem;
  font-weight: 600;
}

fieldset label {
  display: inline-block;
  margin-right: 1.25rem;
}

.pole {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  margin: 0.6rem 0;
}

.pole label {
  min-width: 9rem;
}

select,
input[type="number"] {
  padding: 0.35rem 0.5rem;
  font: inherit;
  color: inherit;
  background: var(--tlo);
  border: 1px solid var(--ramka);
}

input[type="number"] {
  width: 5rem;
}

button {
  padding: 0.5rem 1rem;
  font: inherit;
  color: var(--tlo);
  background: var(--akcent);
  border: 1px solid var(--akcent);
  cursor: pointer;
}

button:hover {
  background: #16294a;
}

:focus-visible {
  outline: 3px solid var(--akcent);
  outline-offset: 2px;
}

.komunikat {
  padding: 0.6rem 0.8rem;
  border: 1px solid var(--ramka);
  background: var(--tlo-pomocnicze);
}

.pasek {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 0;
}

.pasek-akcji {
  justify-content: flex-start;
  border-top: 1px solid var(--ramka);
}

#naglowek-arkusza {
  margin: 0;
  font-weight: 600;
}

#lista-zadan {
  margin: 0;
  padding: 0;
  list-style: none;
  counter-reset: zadanie;
}

.zadanie {
  margin: 0 0 1.25rem;
  padding: 0.9rem 1rem;
  border: 1px solid var(--ramka);
}

.zadanie-numer {
  margin: 0 0 0.4rem;
  font-weight: 600;
}

.zadanie-tresc {
  margin: 0 0 0.6rem;
  white-space: pre-wrap;
}

.opcje {
  margin: 0;
  padding: 0;
  list-style: none;
}

.opcje li {
  margin: 0.15rem 0;
}

/* Answers sit directly under the task they belong to, never in a separate
   answer key, so the student never scrolls away to check one. */
.odpowiedz-blok {
  margin: 0.75rem 0 0;
  padding: 0.6rem 0.8rem;
  border-left: 4px solid var(--akcent);
  background: var(--tlo-pomocnicze);
}

.odpowiedz-blok p {
  margin: 0 0 0.35rem;
}

.odpowiedz-blok .rozwiazanie {
  margin: 0;
  white-space: pre-wrap;
}

@media (max-width: 30rem) {
  .pole label {
    min-width: 100%;
  }
}

@media print {
  .naglowek,
  .pasek,
  button,
  #ekran-menu {
    display: none !important;
  }

  body {
    padding: 0;
    font-size: 11pt;
  }

  .zadanie {
    page-break-inside: avoid;
    border: 1px solid #000;
  }

  .odpowiedz-blok {
    background: transparent;
    border-left: 2px solid #000;
  }
}
```

- [ ] **Step 3: Verify the page loads**

Run: `python -m http.server 8000` and open `http://localhost:8000`
Expected: The heading, the mode radios, an empty Klasa/Dział pair of selects, the difficulty radios, the count input, and the Generuj button all render. The console shows a 404 or module error for `js/app.js` — that is expected until Task 16.

- [ ] **Step 4: Commit**

```bash
git add index.html css/styles.css
git commit -m "feat: add HTML shell and plain stylesheet"
```

---

### Task 16: Menu wiring, rendering, and persistence

**Files:**
- Create: `js/app.js`
- Create: `js/render.js`
- Create: `js/storage.js`
- Test: `test/render.test.js`
- Test: `test/storage.test.js`

**Interfaces:**
- Consumes: `generateSheet`, `clampCount` (Task 14), `GRADES`, `getTopicsForGrade` (Task 13), `EXAM_MODES` (Task 13), all DOM ids from Task 15
- Produces:
  - From `render.js`: `taskToHtml(task, index) => string` — the `<li>` markup for one task, with its answer block present but hidden; `sheetToHtml(tasks) => string`
  - From `storage.js`: `loadPreferences() => object|null`, `savePreferences(prefs) => void` — both swallow every storage error

- [ ] **Step 1: Write the failing render test**

Create `test/render.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { taskToHtml, sheetToHtml } from '../js/render.js';

const openTask = {
  id: 'test_open',
  type: 'otwarte',
  tresc: 'Oblicz 2 + 2.',
  odpowiedz: '4',
  rozwiazanie: 'Dodajemy: 2 + 2 = 4.',
};

const closedTask = {
  id: 'test_closed',
  type: 'zamkniete',
  tresc: 'Oblicz 2 + 2.',
  odpowiedzi: ['3', '4', '5', '6'],
  poprawna: 1,
  odpowiedz: '4',
  rozwiazanie: 'Dodajemy: 2 + 2 = 4.',
};

test('renders the task number in Polish', () => {
  assert.match(taskToHtml(openTask, 0), /Zadanie 1\./);
  assert.match(taskToHtml(openTask, 5), /Zadanie 6\./);
});

test('renders the question text', () => {
  assert.match(taskToHtml(openTask, 0), /Oblicz 2 \+ 2\./);
});

test('renders lettered options for closed tasks only', () => {
  const closed = taskToHtml(closedTask, 0);
  assert.match(closed, /A\./);
  assert.match(closed, /B\./);
  assert.match(closed, /C\./);
  assert.match(closed, /D\./);
  assert.ok(!taskToHtml(openTask, 0).includes('A.'));
});

test('the answer block is emitted inside the same task element, hidden', () => {
  const html = taskToHtml(openTask, 0);
  const blockIndex = html.indexOf('odpowiedz-blok');
  const closeIndex = html.lastIndexOf('</li>');
  assert.ok(blockIndex > -1, 'no answer block emitted');
  assert.ok(blockIndex < closeIndex, 'answer block escaped its task element');
  assert.match(html, /hidden/);
});

test('the answer block carries both the answer and the solution', () => {
  const html = taskToHtml(openTask, 0);
  assert.match(html, /Odpowiedź/);
  assert.match(html, /Dodajemy: 2 \+ 2 = 4\./);
});

test('closed tasks show the answer with its option letter', () => {
  assert.match(taskToHtml(closedTask, 0), /B\. 4/);
});

test('escapes HTML so task text cannot inject markup', () => {
  const nasty = { ...openTask, tresc: 'Oblicz <b>2</b> & 3.' };
  const html = taskToHtml(nasty, 0);
  assert.ok(!html.includes('<b>'), 'raw tag survived');
  assert.match(html, /&lt;b&gt;/);
  assert.match(html, /&amp;/);
});

test('sheetToHtml renders every task once, in order', () => {
  const html = sheetToHtml([openTask, closedTask, openTask]);
  assert.equal((html.match(/class="zadanie"/g) ?? []).length, 3);
  assert.ok(html.indexOf('Zadanie 1.') < html.indexOf('Zadanie 2.'));
  assert.ok(html.indexOf('Zadanie 2.') < html.indexOf('Zadanie 3.'));
});

test('every task element contains exactly one answer block', () => {
  const html = sheetToHtml([openTask, closedTask]);
  assert.equal((html.match(/odpowiedz-blok/g) ?? []).length, 2);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/render.test.js`
Expected: FAIL — `Cannot find module '../js/render.js'`

- [ ] **Step 3: Write the renderer**

Create `js/render.js`:

```js
// Renders task objects to markup. Knows only the task contract, never which
// topic produced a task, so new topics need no change here.

const LITERY = ['A', 'B', 'C', 'D'];

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function optionsHtml(task) {
  if (task.type !== 'zamkniete') return '';
  const items = task.odpowiedzi
    .map((opt, i) => `<li>${LITERY[i]}. ${escapeHtml(opt)}</li>`)
    .join('');
  return `<ul class="opcje">${items}</ul>`;
}

function answerLabel(task) {
  if (task.type === 'zamkniete') {
    return `${LITERY[task.poprawna]}. ${escapeHtml(task.odpowiedz)}`;
  }
  return escapeHtml(task.odpowiedz);
}

// The answer block is nested inside the task's own <li> so revealing it never
// makes the student scroll away from the question.
export function taskToHtml(task, index) {
  return [
    '<li class="zadanie">',
    `<p class="zadanie-numer">Zadanie ${index + 1}.</p>`,
    `<p class="zadanie-tresc">${escapeHtml(task.tresc)}</p>`,
    optionsHtml(task),
    '<div class="odpowiedz-blok" hidden>',
    `<p><strong>Odpowiedź:</strong> ${answerLabel(task)}</p>`,
    `<p class="rozwiazanie">${escapeHtml(task.rozwiazanie)}</p>`,
    '</div>',
    '</li>',
  ].join('');
}

export function sheetToHtml(tasks) {
  return tasks.map((task, i) => taskToHtml(task, i)).join('');
}
```

- [ ] **Step 4: Run the render test to verify it passes**

Run: `node --test test/render.test.js`
Expected: PASS, 9 tests

- [ ] **Step 5: Write the failing storage test**

Create `test/storage.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadPreferences, savePreferences } from '../js/storage.js';

function withStorage(impl, fn) {
  const previous = globalThis.localStorage;
  Object.defineProperty(globalThis, 'localStorage', {
    value: impl,
    configurable: true,
    writable: true,
  });
  try {
    fn();
  } finally {
    Object.defineProperty(globalThis, 'localStorage', {
      value: previous,
      configurable: true,
      writable: true,
    });
  }
}

function memoryStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
  };
}

test('saves and reloads preferences', () => {
  withStorage(memoryStorage(), () => {
    savePreferences({ tryb: 'egzamin', trudnosc: 'trudny', liczba: 9 });
    assert.deepEqual(loadPreferences(), {
      tryb: 'egzamin',
      trudnosc: 'trudny',
      liczba: 9,
    });
  });
});

test('returns null when nothing has been saved', () => {
  withStorage(memoryStorage(), () => {
    assert.equal(loadPreferences(), null);
  });
});

test('returns null instead of throwing on corrupt stored data', () => {
  const storage = memoryStorage();
  storage.setItem('generator-zadan-preferencje', '{nie-json');
  withStorage(storage, () => {
    assert.equal(loadPreferences(), null);
  });
});

test('swallows a throwing storage on read', () => {
  const throwing = {
    getItem() {
      throw new Error('storage disabled');
    },
    setItem() {},
  };
  withStorage(throwing, () => {
    assert.equal(loadPreferences(), null);
  });
});

test('swallows a throwing storage on write', () => {
  const throwing = {
    getItem: () => null,
    setItem() {
      throw new Error('quota exceeded');
    },
  };
  withStorage(throwing, () => {
    assert.doesNotThrow(() => savePreferences({ tryb: 'cwiczenia' }));
  });
});

test('survives localStorage being absent entirely', () => {
  withStorage(undefined, () => {
    assert.equal(loadPreferences(), null);
    assert.doesNotThrow(() => savePreferences({ tryb: 'cwiczenia' }));
  });
});
```

- [ ] **Step 6: Run it to verify it fails**

Run: `node --test test/storage.test.js`
Expected: FAIL — `Cannot find module '../js/storage.js'`

- [ ] **Step 7: Write the storage module**

Create `js/storage.js`:

```js
// Remembering the last menu selection is a convenience, never a requirement:
// every access is guarded so a private window or blocked storage is harmless.

const KLUCZ = 'generator-zadan-preferencje';

export function loadPreferences() {
  try {
    const raw = globalThis.localStorage?.getItem(KLUCZ);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export function savePreferences(prefs) {
  try {
    globalThis.localStorage?.setItem(KLUCZ, JSON.stringify(prefs));
  } catch {
    // Storage unavailable or full; preferences simply are not remembered.
  }
}
```

- [ ] **Step 8: Run the storage test to verify it passes**

Run: `node --test test/storage.test.js`
Expected: PASS, 6 tests

- [ ] **Step 9: Write the app wiring**

Create `js/app.js`:

```js
import { GRADES, getTopicsForGrade } from './topicRegistry.js';
import { EXAM_MODES } from './examModes.js';
import { generateSheet, clampCount } from './sheetGenerator.js';
import { sheetToHtml } from './render.js';
import { loadPreferences, savePreferences } from './storage.js';

const el = (id) => document.getElementById(id);

const ekranMenu = el('ekran-menu');
const ekranArkusz = el('ekran-arkusz');
const formularz = el('formularz');
const wyborEtapu = el('wybor-etapu');
const wyborKlasy = el('wybor-klasy');
const wyborDzialu = el('wybor-dzialu');
const wyborEgzaminu = el('wybor-egzaminu');
const grupaCwiczenia = el('grupa-cwiczenia');
const grupaEgzamin = el('grupa-egzamin');
const liczbaZadan = el('liczba-zadan');
const komunikat = el('komunikat-bledu');
const listaZadan = el('lista-zadan');
const naglowekArkusza = el('naglowek-arkusza');
const przyciskOdpowiedzi = el('pokaz-odpowiedzi');

const ETYKIETY_TRUDNOSCI = {
  latwy: 'poziom łatwy',
  sredni: 'poziom średni',
  trudny: 'poziom trudny',
};

let ostatnieUstawienia = null;
let odpowiedziWidoczne = false;

function selectedRadio(name) {
  return formularz.querySelector(`input[name="${name}"]:checked`)?.value;
}

function fillSelect(select, items) {
  select.innerHTML = items
    .map((i) => `<option value="${i.value}">${i.label}</option>`)
    .join('');
}

function refreshKlasy() {
  const etap = wyborEtapu.value;
  const grades = GRADES.filter((g) => g.etap === etap);
  fillSelect(
    wyborKlasy,
    grades.map((g) => ({ value: g.key, label: g.label }))
  );
  refreshDzialy();
}

function refreshDzialy() {
  const topics = getTopicsForGrade(wyborKlasy.value);
  fillSelect(wyborDzialu, [
    { value: '', label: 'Wszystkie działy' },
    ...topics.map((t) => ({ value: t.key, label: t.label })),
  ]);
}

function refreshTryb() {
  const egzamin = selectedRadio('tryb') === 'egzamin';
  grupaCwiczenia.hidden = egzamin;
  grupaEgzamin.hidden = !egzamin;
}

function showError(message) {
  komunikat.textContent = message;
  komunikat.hidden = false;
}

function clearError() {
  komunikat.hidden = true;
  komunikat.textContent = '';
}

function sheetHeading(options) {
  const zakres =
    options.mode === 'egzamin'
      ? EXAM_MODES.find((m) => m.key === options.examKey)?.label
      : GRADES.find((g) => g.key === options.gradeKey)?.label;
  const liczba = options.count === 1 ? '1 zadanie' : `${options.count} zadań`;
  return `Arkusz: ${zakres} · ${ETYKIETY_TRUDNOSCI[options.difficulty]} · ${liczba}`;
}

function setAnswersVisible(visible) {
  odpowiedziWidoczne = visible;
  for (const block of listaZadan.querySelectorAll('.odpowiedz-blok')) {
    block.hidden = !visible;
  }
  przyciskOdpowiedzi.textContent = visible
    ? 'Ukryj odpowiedzi'
    : 'Pokaż odpowiedzi';
}

function readOptions() {
  const mode = selectedRadio('tryb');
  return {
    mode,
    gradeKey: wyborKlasy.value,
    topicKey: wyborDzialu.value || null,
    examKey: wyborEgzaminu.value,
    difficulty: selectedRadio('trudnosc'),
    count: clampCount(liczbaZadan.value),
  };
}

function renderSheet(options) {
  let tasks;
  try {
    tasks = generateSheet(options);
  } catch (error) {
    showError(error.message);
    return;
  }
  if (tasks.length === 0) {
    showError('Brak zadan dla wybranej kombinacji.');
    return;
  }

  clearError();
  ostatnieUstawienia = options;
  listaZadan.innerHTML = sheetToHtml(tasks);
  naglowekArkusza.textContent = sheetHeading({ ...options, count: tasks.length });
  setAnswersVisible(false);
  ekranMenu.hidden = true;
  ekranArkusz.hidden = false;
  ekranArkusz.scrollIntoView({ block: 'start' });
}

function restorePreferences() {
  const prefs = loadPreferences();
  if (!prefs) return;
  const trybInput = formularz.querySelector(
    `input[name="tryb"][value="${prefs.tryb}"]`
  );
  if (trybInput) trybInput.checked = true;
  if (prefs.etap) wyborEtapu.value = prefs.etap;
  refreshKlasy();
  if (prefs.klasa) {
    wyborKlasy.value = prefs.klasa;
    refreshDzialy();
  }
  if (prefs.dzial !== undefined) wyborDzialu.value = prefs.dzial;
  if (prefs.egzamin) wyborEgzaminu.value = prefs.egzamin;
  const trudnoscInput = formularz.querySelector(
    `input[name="trudnosc"][value="${prefs.trudnosc}"]`
  );
  if (trudnoscInput) trudnoscInput.checked = true;
  if (prefs.liczba) liczbaZadan.value = clampCount(prefs.liczba);
  refreshTryb();
}

function persist() {
  savePreferences({
    tryb: selectedRadio('tryb'),
    etap: wyborEtapu.value,
    klasa: wyborKlasy.value,
    dzial: wyborDzialu.value,
    egzamin: wyborEgzaminu.value,
    trudnosc: selectedRadio('trudnosc'),
    liczba: clampCount(liczbaZadan.value),
  });
}

function init() {
  fillSelect(
    wyborEgzaminu,
    EXAM_MODES.map((m) => ({ value: m.key, label: m.label }))
  );
  refreshKlasy();
  refreshTryb();
  restorePreferences();

  wyborEtapu.addEventListener('change', refreshKlasy);
  wyborKlasy.addEventListener('change', refreshDzialy);
  for (const input of formularz.querySelectorAll('input[name="tryb"]')) {
    input.addEventListener('change', refreshTryb);
  }

  formularz.addEventListener('submit', (event) => {
    event.preventDefault();
    liczbaZadan.value = clampCount(liczbaZadan.value);
    persist();
    renderSheet(readOptions());
  });

  przyciskOdpowiedzi.addEventListener('click', () =>
    setAnswersVisible(!odpowiedziWidoczne)
  );

  el('nowy-arkusz').addEventListener('click', () => {
    if (ostatnieUstawienia) renderSheet(ostatnieUstawienia);
  });

  el('drukuj').addEventListener('click', () => window.print());

  el('powrot').addEventListener('click', () => {
    ekranArkusz.hidden = true;
    ekranMenu.hidden = false;
    ekranMenu.scrollIntoView({ block: 'start' });
  });
}

init();
```

- [ ] **Step 10: Run the full test suite**

Run: `node --test`
Expected: PASS, every test from Tasks 1–16

- [ ] **Step 11: Verify in the browser**

Run: `python -m http.server 8000` and open `http://localhost:8000`

Check each of these by hand and fix anything that fails:
1. Switching *Etap* between Szkoła podstawowa and Liceum/technikum changes the Klasa options.
2. Switching Klasa changes the Dział options.
3. Choosing *Egzamin* hides the grade selects and shows the exam select; choosing *Ćwiczenia* reverses it.
4. Generating with count 6 produces exactly 6 tasks; typing 20 clamps to 12; typing 0 clamps to 1.
5. `Pokaż odpowiedzi` reveals an answer block **directly under each task** and the button label flips to `Ukryj odpowiedzi`.
6. `Generuj nowy arkusz` produces a different sheet with the same settings, and answers start hidden again.
7. `Drukuj` preview shows the tasks without menu chrome or buttons; with answers revealed they appear in the preview too.
8. `Wróć do menu` returns to the menu with previous selections intact.
9. Reloading the page restores the last-used selections.
10. The whole menu is reachable and operable with Tab and the keyboard alone.

- [ ] **Step 12: Commit**

```bash
git add js/app.js js/render.js js/storage.js test/render.test.js test/storage.test.js
git commit -m "feat: wire up menu, sheet rendering, and preference persistence"
```

---

### Task 17: README and final verification

**Files:**
- Create: `README.md`
- Modify: `CLAUDE.md` (only if any convention drifted during implementation)

**Interfaces:**
- Consumes: the finished application
- Produces: nothing consumed by other tasks

- [ ] **Step 1: Write the README**

Create `README.md`:

```markdown
# Generator zadań z matematyki

Statyczna strona generująca zadania z matematyki dla uczniów szkoły
podstawowej (klasy 4–8) oraz liceum i technikum (klasy 1–4). Zadania są
tworzone losowo na podstawie szablonów wzorowanych na formacie arkuszy CKE.

## Uruchomienie

Strona korzysta z modułów ES, więc wymaga serwera HTTP (otwarcie pliku
`index.html` bezpośrednio z dysku nie zadziała):

```
python -m http.server 8000
```

Następnie otwórz `http://localhost:8000`.

## Testy

```
node --test
```

## Tryby

- **Ćwiczenia** — wybierasz etap, klasę i dział, a następnie poziom trudności
  i liczbę zadań (1–12).
- **Egzamin** — generuje arkusz w stylu egzaminu ósmoklasisty lub matury na
  poziomie podstawowym, z mieszanką zadań zamkniętych i otwartych.

Przycisk **Pokaż odpowiedzi** wyświetla odpowiedź wraz z krótkim rozwiązaniem
bezpośrednio pod każdym zadaniem. Przycisk **Drukuj** przygotowuje arkusz do
wydruku.

## Struktura projektu

- `index.html` — szkielet strony
- `css/styles.css` — style, w tym arkusz wydruku
- `js/app.js` — obsługa menu i renderowanie arkusza
- `js/sheetGenerator.js` — losowanie zadań do arkusza
- `js/topicRegistry.js` — przypisanie działów do klas
- `js/examModes.js` — pule zadań egzaminacyjnych
- `js/topics/` — szablony zadań, jeden plik na dział
- `test/` — testy jednostkowe

## Dodawanie nowego działu

1. Utwórz `js/topics/<nazwa>.js` eksportujący tablicę `templates`, gdzie każdy
   element to `{ id, generate(difficulty, rng) }`.
2. Dodaj wpis do `TOPICS` w `js/topicRegistry.js` i wymień jego klucz w
   `topicKeys` odpowiednich klas.
3. Napisz test w `test/topics/<nazwa>.test.js`, który niezależnie przelicza
   poprawność każdej odpowiedzi.
```

- [ ] **Step 2: Run the whole suite one final time**

Run: `node --test`
Expected: PASS, zero failures. Record the reported test count.

- [ ] **Step 3: Re-verify the browser checklist**

Run: `python -m http.server 8000`

Re-run all ten manual checks from Task 16 Step 11 against the finished app. Every one must pass before this task is complete.

- [ ] **Step 4: Confirm no stray files or dependencies crept in**

Run: `git status --short` and `ls`
Expected: a clean tree, and no `node_modules/`, no `package.json`, no lockfile.

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "docs: add README with setup, usage, and extension guide"
```
