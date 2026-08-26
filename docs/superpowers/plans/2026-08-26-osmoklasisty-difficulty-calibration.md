# Egzamin Ósmoklasisty Difficulty Calibration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the difficulty/style gap between the app's sp4-sp8 content and a real CKE-style egzamin ósmoklasisty paper by adding 8 new multi-step reasoning templates (including a brand-new stereometria topic), a static reference-figure diagram generator for the templates that need one, and a fixed 14-closed/6-open exam structure for "Egzamin ósmoklasisty" mode.

**Architecture:** New pure module `js/figura.js` (static line-art SVG, no interaction — analogous to `js/chart.js` but simpler) plugs into the task contract via a new optional `task.figura` field, validated in `js/taskShape.js` and rendered in `js/render.js` the same way `wykres` already is. Eight new templates land in existing topic files (`liczbyNaturalne.js`, `rownania.js`, `geometriaPlaska.js`, `potegiPitagoras.js`) plus one brand-new topic file `js/topics/bryly.js`. `js/sheetGenerator.js` gains a `fixedStructure`-aware branch so "Egzamin ósmoklasisty" always produces exactly 20 tasks (14 closed, then 6 open) regardless of the UI's task-count input, which gets hidden for that mode.

**Tech Stack:** Plain ES modules, inline SVG, `node --test`. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-08-26-osmoklasisty-difficulty-calibration-design.md`

**Naming note (deviation from the spec's prose):** the spec calls the new reference-figure field "rysunek" in prose, but this codebase already uses `rysunek-ucznia` to mean the *student's own freehand drawing* on a function chart (from the interactive-charts feature). To avoid colliding with that established vocabulary, this plan uses **`figura`** (a static, given reference figure) throughout instead — same concept the spec describes, different, non-colliding name.

## Global Constraints

- No npm packages, no bundler, no build step. ES modules only.
- All user-facing text is in Polish; numbers rendered via `formatNumber` (`js/format.js`) — never a raw JS decimal, never a `.` decimal point in rendered text.
- `js/figura.js` stays a pure function module: no DOM access, deterministic output, mirrors `js/chart.js`'s existing pattern.
- Every template test **independently recomputes** the expected answer — never asserts against the template's own arithmetic.
- Every closed (`zamkniete`) template is built via the existing `buildOptions(correct, wrong, rng)` helper from `js/distractors.js`.
- Commit after each completed task.

---

### Task 1: `js/figura.js` — pure SVG generator for static reference figures

**Files:**
- Create: `js/figura.js`
- Create: `test/figura.test.js`

**Interfaces:**
- Consumes: `formatNumber` (`js/format.js`)
- Produces: `figuraSvg(figura)` — takes `{ typ, ...fields }`, returns an SVG markup string. Supported `typ` values: `'trojkat'` (needs `bok`), `'czworokat'` (no fields needed), `'mapa'` (needs `dx`, `dy`), `'prostopadloscian'` (needs `a`, `b`, `c`). Throws on an unknown `typ`.

- [ ] **Step 1: Write the failing test**

Create `test/figura.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { figuraSvg } from '../js/figura.js';

test('trojkat: emits an svg containing the side-length label', () => {
  const svg = figuraSvg({ typ: 'trojkat', bok: 8 });
  assert.match(svg, /<svg class="figura"/);
  assert.match(svg, />8 cm</);
});

test('czworokat: labels all four vertices and marks the right angle', () => {
  const svg = figuraSvg({ typ: 'czworokat' });
  for (const label of ['α', 'β', 'γ', 'δ']) {
    assert.ok(svg.includes(`>${label}<`), `missing label ${label}`);
  }
  assert.match(svg, /znacznik-katu/);
});

test('mapa: labels both leg distances and includes a north marker', () => {
  const svg = figuraSvg({ typ: 'mapa', dx: 6, dy: 8 });
  assert.match(svg, />6 km</);
  assert.match(svg, />8 km</);
  assert.match(svg, /strzalka-polnoc/);
});

test('prostopadloscian: labels all three dimensions', () => {
  const svg = figuraSvg({ typ: 'prostopadloscian', a: 3, b: 4, c: 5 });
  assert.match(svg, />3 cm</);
  assert.match(svg, />4 cm</);
  assert.match(svg, />5 cm</);
});

test('numbers route through formatNumber (Polish decimal comma)', () => {
  const svg = figuraSvg({ typ: 'trojkat', bok: 2.5 });
  assert.match(svg, />2,5 cm</);
  assert.ok(!svg.includes('2.5'), 'raw decimal point leaked into the SVG');
});

test('rejects an unknown typ', () => {
  assert.throws(() => figuraSvg({ typ: 'kolo' }), /Nieznany typ/);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/figura.test.js`
Expected: FAIL — `js/figura.js` does not exist yet.

- [ ] **Step 3: Write the implementation**

Create `js/figura.js`:

```js
// Pure SVG generator for static reference figures (a labeled triangle,
// quadrilateral, map, or solid) that accompany a word problem. Unlike
// js/chart.js's function graphs, these are never drawn on by the student —
// simple line-art only. No DOM access; takes a shape spec, returns markup.

import { formatNumber } from './format.js';

function trojkatSvg({ bok }) {
  const label = `${formatNumber(bok)} cm`;
  return (
    `<svg class="figura" viewBox="0 0 240 220" xmlns="http://www.w3.org/2000/svg">` +
    `<polygon class="ksztalt" points="120,20 20,200 220,200" />` +
    `<text class="etykieta-figury" x="120" y="216" text-anchor="middle">${label}</text>` +
    `</svg>`
  );
}

function czworokatSvg() {
  return (
    `<svg class="figura" viewBox="0 0 240 220" xmlns="http://www.w3.org/2000/svg">` +
    `<polygon class="ksztalt" points="40,40 200,60 180,200 50,180" />` +
    `<text class="etykieta-figury" x="25" y="35" text-anchor="middle">α</text>` +
    `<text class="etykieta-figury" x="215" y="55" text-anchor="middle">β</text>` +
    `<text class="etykieta-figury" x="195" y="205" text-anchor="middle">γ</text>` +
    `<text class="etykieta-figury" x="30" y="200" text-anchor="middle">δ</text>` +
    `<polyline class="znacznik-katu" points="50,165 65,165 65,180" />` +
    `</svg>`
  );
}

function mapaSvg({ dx, dy }) {
  return (
    `<svg class="figura" viewBox="0 0 240 220" xmlns="http://www.w3.org/2000/svg">` +
    `<line class="ksztalt" x1="190" y1="190" x2="190" y2="60" />` +
    `<line class="ksztalt" x1="190" y1="60" x2="60" y2="60" />` +
    `<line class="ksztalt przerywana" x1="190" y1="190" x2="60" y2="60" />` +
    `<circle class="punkt" cx="190" cy="190" r="3" />` +
    `<circle class="punkt" cx="60" cy="60" r="3" />` +
    `<text class="etykieta-figury" x="200" y="195" text-anchor="start">A</text>` +
    `<text class="etykieta-figury" x="50" y="55" text-anchor="end">B</text>` +
    `<text class="etykieta-figury" x="205" y="125" text-anchor="middle">${formatNumber(dy)} km</text>` +
    `<text class="etykieta-figury" x="125" y="50" text-anchor="middle">${formatNumber(dx)} km</text>` +
    `<line class="strzalka-polnoc" x1="30" y1="55" x2="30" y2="25" />` +
    `<polygon class="strzalka-polnoc" points="30,15 25,27 35,27" />` +
    `<text class="etykieta-figury" x="30" y="12" text-anchor="middle">N</text>` +
    `</svg>`
  );
}

function prostopadloscianSvg({ a, b, c }) {
  return (
    `<svg class="figura" viewBox="0 0 240 200" xmlns="http://www.w3.org/2000/svg">` +
    `<polygon class="ksztalt" points="40,150 180,150 180,60 40,60" />` +
    `<polygon class="ksztalt" points="80,120 220,120 220,30 80,30" />` +
    `<line class="ksztalt" x1="40" y1="150" x2="80" y2="120" />` +
    `<line class="ksztalt" x1="180" y1="150" x2="220" y2="120" />` +
    `<line class="ksztalt" x1="180" y1="60" x2="220" y2="30" />` +
    `<line class="ksztalt" x1="40" y1="60" x2="80" y2="30" />` +
    `<text class="etykieta-figury" x="110" y="168" text-anchor="middle">${formatNumber(a)} cm</text>` +
    `<text class="etykieta-figury" x="20" y="108" text-anchor="middle">${formatNumber(b)} cm</text>` +
    `<text class="etykieta-figury" x="65" y="140" text-anchor="middle">${formatNumber(c)} cm</text>` +
    `</svg>`
  );
}

export function figuraSvg(figura) {
  switch (figura.typ) {
    case 'trojkat':
      return trojkatSvg(figura);
    case 'czworokat':
      return czworokatSvg(figura);
    case 'mapa':
      return mapaSvg(figura);
    case 'prostopadloscian':
      return prostopadloscianSvg(figura);
    default:
      throw new Error(`Nieznany typ figury: ${figura.typ}`);
  }
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/figura.test.js`
Expected: PASS, all 6 tests.

- [ ] **Step 5: Commit**

```bash
git add js/figura.js test/figura.test.js
git commit -m "feat: add pure SVG generator for static reference figures"
```

---

### Task 2: `js/taskShape.js` — validate the new `figura` field

**Files:**
- Modify: `js/taskShape.js`
- Modify: `test/taskShape.test.js`

**Interfaces:**
- Consumes: nothing new
- Produces: `assertValidTask(task)` now also validates `task.figura` when present (same pattern as the existing `wykres` validation).

- [ ] **Step 1: Write the failing tests**

In `test/taskShape.test.js`, append after the existing wykres tests (end of file):

```js
const validFigura = {
  ...validOpen,
  figura: { typ: 'trojkat', bok: 6 },
};

test('accepts a valid task with a figura field', () => {
  assert.doesNotThrow(() => assertValidTask(validFigura));
});

test('accepts a czworokat figura with no numeric fields required', () => {
  assert.doesNotThrow(() =>
    assertValidTask({ ...validOpen, figura: { typ: 'czworokat' } })
  );
});

test('rejects an unknown typ in figura', () => {
  assert.throws(
    () => assertValidTask({ ...validFigura, figura: { typ: 'kolo', bok: 6 } }),
    /typ/
  );
});

test('rejects a figura with a non-finite numeric field', () => {
  assert.throws(
    () => assertValidTask({ ...validFigura, figura: { typ: 'trojkat', bok: NaN } }),
    /figura\.bok/
  );
});

test('rejects a mapa figura missing dy', () => {
  assert.throws(
    () => assertValidTask({ ...validOpen, figura: { typ: 'mapa', dx: 3 } }),
    /figura\.dy/
  );
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/taskShape.test.js`
Expected: FAIL — `checkFigura` doesn't exist yet, so a `figura` field is silently ignored and none of the new tests throw as expected.

- [ ] **Step 3: Update the implementation**

In `js/taskShape.js`, add after the existing `checkWykres` function:

```js
const ALLOWED_FIGURA_TYPES = ['trojkat', 'czworokat', 'mapa', 'prostopadloscian'];

const FIGURA_NUMERIC_FIELDS = {
  trojkat: ['bok'],
  czworokat: [],
  mapa: ['dx', 'dy'],
  prostopadloscian: ['a', 'b', 'c'],
};

function checkFigura(figura) {
  if (!figura || typeof figura !== 'object') {
    throw new Error('Pole figura musi byc obiektem.');
  }
  if (!ALLOWED_FIGURA_TYPES.includes(figura.typ)) {
    throw new Error(`Nieznany typ w figura.typ: ${figura.typ}`);
  }
  for (const key of FIGURA_NUMERIC_FIELDS[figura.typ]) {
    if (typeof figura[key] !== 'number' || !Number.isFinite(figura[key])) {
      throw new Error(`Pole figura.${key} musi byc skonczona liczba.`);
    }
  }
}
```

Then in `assertValidTask`, right after the existing `if ('wykres' in task) { checkWykres(task.wykres); }` block, add:

```js
  if ('figura' in task) {
    checkFigura(task.figura);
  }
```

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/taskShape.test.js`
Expected: PASS, all tests including the 5 new ones.

- [ ] **Step 5: Run the full suite to confirm nothing else broke**

Run: `node --test`
Expected: PASS, every test in the project.

- [ ] **Step 6: Commit**

```bash
git add js/taskShape.js test/taskShape.test.js
git commit -m "feat: validate the optional figura field in the task contract"
```

---

### Task 3: `js/render.js` — embed the figura SVG into rendered tasks

**Files:**
- Modify: `js/render.js`
- Modify: `test/render.test.js`

**Interfaces:**
- Consumes: `figuraSvg` (`js/figura.js`)
- Produces: `taskToHtml(task, index)` now emits `<div class="figura-kontener">...</div>` right after the question text (before the chart, if any) when `task.figura` is present.

- [ ] **Step 1: Write the failing tests**

In `test/render.test.js`, add near the existing chart-related tests (after the "omits the chart container..." test, before the reroll-button test):

```js
const taskWithFigura = {
  id: 'test_figura',
  type: 'otwarte',
  tresc: 'Dany jest trójkąt równoboczny.',
  figura: { typ: 'trojkat', bok: 6 },
  odpowiedz: 'Prawda',
  rozwiazanie: 'Bo tak.',
};

test('embeds the figura svg, unescaped, when a task has a figura field', () => {
  const html = taskToHtml(taskWithFigura, 0);
  assert.match(html, /<div class="figura-kontener">/);
  assert.match(html, /<svg class="figura"/);
  assert.ok(!html.includes('&lt;svg'), 'figura markup was escaped');
});

test('omits the figura container when a task has no figura field', () => {
  const html = taskToHtml(openTask, 0);
  assert.ok(!html.includes('figura-kontener'));
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/render.test.js`
Expected: FAIL — no `figura-kontener` is emitted yet.

- [ ] **Step 3: Update the implementation**

In `js/render.js`, add the import and a new helper, then wire it into `taskToHtml`:

```js
import { figuraSvg } from './figura.js';
```

Add near `wykresHtml`:

```js
function figuraHtml(task) {
  if (!task.figura) return '';
  return `<div class="figura-kontener">${figuraSvg(task.figura)}</div>`;
}
```

In `taskToHtml`, insert `figuraHtml(task),` right after the `zadanie-tresc` line and before `wykresHtml(task),`:

```js
export function taskToHtml(task, index) {
  return [
    '<li class="zadanie">',
    zadanieNaglowekHtml(index),
    `<p class="zadanie-tresc">${escapeHtml(task.tresc)}</p>`,
    figuraHtml(task),
    wykresHtml(task),
    optionsHtml(task),
    '<div class="odpowiedz-blok" hidden>',
    `<p><strong>Odpowiedź:</strong> ${answerLabel(task)}</p>`,
    `<p class="rozwiazanie">${escapeHtml(task.rozwiazanie)}</p>`,
    '</div>',
    '</li>',
  ].join('');
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/render.test.js`
Expected: PASS, all tests.

- [ ] **Step 5: Run the full suite**

Run: `node --test`
Expected: PASS, every test in the project.

- [ ] **Step 6: Commit**

```bash
git add js/render.js test/render.test.js
git commit -m "feat: render the figura reference diagram alongside its task"
```

---

### Task 4: `css/styles.css` — style the figura container and its line-art elements

**Files:**
- Modify: `css/styles.css`

**Interfaces:**
- Consumes: nothing
- Produces: visual styling for `.figura-kontener` and the SVG classes `js/figura.js` emits (`.ksztalt`, `.przerywana`, `.punkt`, `.znacznik-katu`, `.strzalka-polnoc`, `.etykieta-figury`).

- [ ] **Step 1: Add the styles**

In `css/styles.css`, insert this block right after the existing `.wykres .rysunek-ucznia { ... }` rule and before the `@media print { ... }` block:

```css
.figura-kontener {
  margin: 0.75rem 0;
  padding: 0.5rem;
  border: 1px solid var(--ramka);
  background: var(--tlo);
}

.figura {
  display: block;
  width: 100%;
  max-width: 16rem;
  height: auto;
}

.figura .ksztalt {
  fill: none;
  stroke: #333333;
  stroke-width: 1.5;
}

.figura .przerywana {
  stroke-dasharray: 4 3;
}

.figura .punkt {
  fill: #333333;
}

.figura .znacznik-katu {
  fill: none;
  stroke: #333333;
  stroke-width: 1.5;
}

.figura .strzalka-polnoc {
  fill: #333333;
  stroke: #333333;
  stroke-width: 1.5;
}

.figura .etykieta-figury {
  font-size: 11px;
  fill: #1a1a1a;
}
```

- [ ] **Step 2: Sanity-check**

No automated test for pure CSS — verified together with Task 15's manual browser check. Run the full suite anyway to make sure nothing else regressed:

Run: `node --test`
Expected: PASS, every test in the project.

- [ ] **Step 3: Commit**

```bash
git add css/styles.css
git commit -m "feat: style the figura reference-diagram container and line-art elements"
```

---

### Task 5: `js/topics/liczbyNaturalne.js` — add `liczby_naturalne_nwd_nww`

**Files:**
- Modify: `js/topics/liczbyNaturalne.js`
- Modify: `test/topics/liczbyNaturalne.test.js`

**Interfaces:**
- Consumes: `formatNumber`, `buildOptions` (already imported in this file)
- Produces: new template `liczby_naturalne_nwd_nww` (closed).

- [ ] **Step 1: Write the failing tests**

In `test/topics/liczbyNaturalne.test.js`, add a local independent GCD/LCM (do not import the template's own helpers) and the new tests, right before the final `test('results are never negative...')` test:

```js
function gcdIndependent(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

function lcmIndependent(a, b) {
  return (a * b) / gcdIndependent(a, b);
}

test('nwd_nww: the stated NWD and NWW are independently correct', () => {
  const template = templates.find((t) => t.id === 'liczby_naturalne_nwd_nww');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const numbers = task.tresc.match(/\d+/g).map(Number);
      const [x, y, p, q] = numbers;
      const m = task.odpowiedz.match(/^NWD = (\d+), NWW = (\d+)$/);
      assert.ok(m, `unexpected answer format: "${task.odpowiedz}"`);
      assert.equal(Number(m[1]), gcdIndependent(x, y), task.tresc);
      assert.equal(Number(m[2]), lcmIndependent(p, q), task.tresc);
    }
  }
});
```

Also update the existing `'results are never negative for this klasa-4 topic'` test to skip this template, since its answer is a compound "NWD = x, NWW = y" label rather than a single leading number:

```js
test('results are never negative for this klasa-4 topic', () => {
  for (const template of templates) {
    if (template.id === 'liczby_naturalne_nwd_nww') continue; // compound answer, not a bare number
    for (const difficulty of LEVELS) {
      for (let seed = 0; seed < 100; seed++) {
        const task = template.generate(difficulty, createRng(seed));
        const value = parsePl(task.odpowiedz.split(' ')[0]);
        assert.ok(value >= 0, `negative result: ${task.odpowiedz}`);
      }
    }
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/topics/liczbyNaturalne.test.js`
Expected: FAIL — `templates.find(...)` returns `undefined` for the new id, so `template.generate` throws.

- [ ] **Step 3: Update the implementation**

In `js/topics/liczbyNaturalne.js`, add near the top (after the `RANGES` constant):

```js
function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

function lcm(a, b) {
  return (a * b) / gcd(a, b);
}

const NWD_NWW_RANGES = {
  latwy: { gMax: 6, mMax: 6, pqMax: 8 },
  sredni: { gMax: 9, mMax: 8, pqMax: 10 },
  trudny: { gMax: 12, mMax: 10, pqMax: 12 },
};

function coprimePair(rng, max) {
  let m1, m2;
  do {
    m1 = rng.int(2, max);
    m2 = rng.int(2, max);
  } while (gcd(m1, m2) !== 1 || m1 === m2);
  return [m1, m2];
}

function nwdNww(difficulty, rng) {
  const { gMax, mMax, pqMax } = NWD_NWW_RANGES[difficulty];
  const g = rng.int(2, gMax);
  const [m1, m2] = coprimePair(rng, mMax);
  const x = g * m1;
  const y = g * m2;

  let p, q;
  do {
    p = rng.int(2, pqMax);
    q = rng.int(2, pqMax);
  } while (p === q);
  const w = lcm(p, q);

  const correct = `NWD = ${g}, NWW = ${w}`;

  // Typowe błędy: zamiana miejscami NWD i NWW, pominięcie dzielenia przez
  // NWD przy liczeniu NWW, użycie mnożnika zamiast NWD.
  const wrong = [
    `NWD = ${w}, NWW = ${g}`,
    `NWD = ${g}, NWW = ${p * q}`,
    `NWD = ${m1}, NWW = ${w}`,
  ];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'liczby_naturalne_nwd_nww',
    type: 'zamkniete',
    tresc:
      `Liczba A to największy wspólny dzielnik liczb ${x} i ${y}, ` +
      `a liczba B to najmniejsza wspólna wielokrotność liczb ${p} i ${q}. ` +
      `Wybierz właściwą odpowiedź spośród podanych.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `NWD(${x}, ${y}) = ${g} (największa liczba, przez którą dzielą się obie liczby).\n` +
      `NWW(${p}, ${q}) = (${p} · ${q}) : NWD(${p}, ${q}) = ${p * q} : ${gcd(p, q)} = ${w}.\n` +
      `${correct}.`,
  };
}
```

Update the `templates` export array:

```js
export const templates = [
  { id: 'liczby_naturalne_dodawanie', generate: dodawanie },
  { id: 'liczby_naturalne_mnozenie', generate: mnozenie },
  { id: 'liczby_naturalne_dzielenie', generate: dzielenie },
  { id: 'liczby_naturalne_nwd_nww', generate: nwdNww },
];
```

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/liczbyNaturalne.test.js`
Expected: PASS, all tests.

- [ ] **Step 5: Run the full suite**

Run: `node --test`
Expected: PASS, every test in the project.

- [ ] **Step 6: Commit**

```bash
git add js/topics/liczbyNaturalne.js test/topics/liczbyNaturalne.test.js
git commit -m "feat: add liczby_naturalne_nwd_nww template"
```

---

### Task 6: `js/topics/liczbyNaturalne.js` — add `liczby_naturalne_suma_kolejnych`

**Files:**
- Modify: `js/topics/liczbyNaturalne.js`
- Modify: `test/topics/liczbyNaturalne.test.js`

**Interfaces:**
- Consumes: `formatNumber`
- Produces: new template `liczby_naturalne_suma_kolejnych` (open).

- [ ] **Step 1: Write the failing test**

In `test/topics/liczbyNaturalne.test.js`, add:

```js
test('suma_kolejnych: the stated sum equals n(n+1)/2 for the stated n', () => {
  const template = templates.find((t) => t.id === 'liczby_naturalne_suma_kolejnych');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [n] = task.tresc.match(/do (\d+)\./).slice(1).map(Number);
      const expected = (n * (n + 1)) / 2;
      assert.equal(parsePl(task.odpowiedz), expected, `n=${n} -> ${task.odpowiedz}`);
    }
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/topics/liczbyNaturalne.test.js`
Expected: FAIL — the template doesn't exist yet.

- [ ] **Step 3: Update the implementation**

In `js/topics/liczbyNaturalne.js`, add after `nwdNww`:

```js
const SUMA_KOLEJNYCH_RANGES = {
  latwy: { nMax: 30 },
  sredni: { nMax: 100 },
  trudny: { nMax: 500 },
};

function sumaKolejnych(difficulty, rng) {
  const { nMax } = SUMA_KOLEJNYCH_RANGES[difficulty];
  const n = rng.int(5, nMax);
  const suma = (n * (n + 1)) / 2;

  return {
    id: 'liczby_naturalne_suma_kolejnych',
    type: 'otwarte',
    tresc:
      `Sumę S kolejnych liczb naturalnych od 1 do n można obliczyć ze wzoru ` +
      `S = n · (n + 1) : 2. Oblicz sumę kolejnych liczb naturalnych od 1 do ${n}.`,
    odpowiedz: formatNumber(suma),
    rozwiazanie:
      `Podstawiamy n = ${n} do wzoru: S = ${n} · (${n} + 1) : 2.\n` +
      `S = ${n} · ${n + 1} : 2 = ${n * (n + 1)} : 2 = ${formatNumber(suma)}.`,
  };
}
```

Update the `templates` export array:

```js
export const templates = [
  { id: 'liczby_naturalne_dodawanie', generate: dodawanie },
  { id: 'liczby_naturalne_mnozenie', generate: mnozenie },
  { id: 'liczby_naturalne_dzielenie', generate: dzielenie },
  { id: 'liczby_naturalne_nwd_nww', generate: nwdNww },
  { id: 'liczby_naturalne_suma_kolejnych', generate: sumaKolejnych },
];
```

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/liczbyNaturalne.test.js`
Expected: PASS, all tests.

- [ ] **Step 5: Run the full suite**

Run: `node --test`
Expected: PASS, every test in the project.

- [ ] **Step 6: Commit**

```bash
git add js/topics/liczbyNaturalne.js test/topics/liczbyNaturalne.test.js
git commit -m "feat: add liczby_naturalne_suma_kolejnych template"
```

---

### Task 7: `js/topics/rownania.js` — add `rownania_srednia_arytmetyczna`

**Files:**
- Modify: `js/topics/rownania.js`
- Modify: `test/topics/rownania.test.js`

**Interfaces:**
- Consumes: `formatNumber`, `buildOptions`
- Produces: new template `rownania_srednia_arytmetyczna` (closed).

- [ ] **Step 1: Write the failing tests**

In `test/topics/rownania.test.js`, update the exact-count test:

```js
test('exports four templates with unique ids', () => {
  assert.equal(templates.length, 4);
  assert.equal(new Set(templates.map((t) => t.id)).size, 4);
});
```

(this replaces the existing `'exports three templates with unique ids'` test)

Then add, after the existing `nawiasy` tests:

```js
test('srednia arytmetyczna: c equals 3Y - 2X for the stated X and Y', () => {
  const template = templates.find((t) => t.id === 'rownania_srednia_arytmetyczna');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [X, Y] = task.tresc.match(/równa (\d+)/g).map((m) => Number(m.replace('równa ', '')));
      const expected = 3 * Y - 2 * X;
      assert.equal(parsePl(task.odpowiedz), expected, `X=${X} Y=${Y} -> ${task.odpowiedz}`);
    }
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/topics/rownania.test.js`
Expected: FAIL — count is still 3, and the new template doesn't exist.

- [ ] **Step 3: Update the implementation**

In `js/topics/rownania.js`, add after `rownaniaNawiasy`:

```js
const SREDNIA_RANGES = {
  latwy: { meanMax: 10 },
  sredni: { meanMax: 20 },
  trudny: { meanMax: 30 },
};

function sredniaArytmetyczna(difficulty, rng) {
  const { meanMax } = SREDNIA_RANGES[difficulty];
  const X = rng.int(1, meanMax);
  const Y = rng.int(1, meanMax);
  const c = 3 * Y - 2 * X;
  const correct = formatNumber(c);

  // Typowe błędy: brak podwojenia X, odjęcie średnich wprost, zamiana ról X i Y.
  const wrong = [
    formatNumber(3 * Y - X),
    formatNumber(Y - X),
    formatNumber(3 * X - 2 * Y),
  ];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'rownania_srednia_arytmetyczna',
    type: 'zamkniete',
    tresc:
      `Średnia arytmetyczna dwóch liczb a i b jest równa ${X}, ` +
      `a średnia arytmetyczna trzech liczb a, b i c jest równa ${Y}. ` +
      `Oblicz liczbę c.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Z pierwszej średniej: a + b = 2 · ${X} = ${2 * X}.\n` +
      `Z drugiej średniej: a + b + c = 3 · ${Y} = ${3 * Y}.\n` +
      `c = ${3 * Y} - ${2 * X} = ${correct}.`,
  };
}
```

Update the `templates` export array:

```js
export const templates = [
  { id: 'rownania_liniowe', generate: rownaniaLiniowe },
  { id: 'rownania_uproszczenie', generate: uproszczenie },
  { id: 'rownania_nawiasy', generate: rownaniaNawiasy },
  { id: 'rownania_srednia_arytmetyczna', generate: sredniaArytmetyczna },
];
```

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/rownania.test.js`
Expected: PASS, all tests.

- [ ] **Step 5: Run the full suite**

Run: `node --test`
Expected: PASS, every test in the project.

- [ ] **Step 6: Commit**

```bash
git add js/topics/rownania.js test/topics/rownania.test.js
git commit -m "feat: add rownania_srednia_arytmetyczna template"
```

---

### Task 8: `js/topics/rownania.js` — add `rownania_podzial_na_grupy`

**Files:**
- Modify: `js/topics/rownania.js`
- Modify: `test/topics/rownania.test.js`

**Interfaces:**
- Consumes: `formatNumber`
- Produces: new template `rownania_podzial_na_grupy` (open).

- [ ] **Step 1: Write the failing tests**

In `test/topics/rownania.test.js`, update the exact-count test again:

```js
test('exports five templates with unique ids', () => {
  assert.equal(templates.length, 5);
  assert.equal(new Set(templates.map((t) => t.id)).size, 5);
});
```

(replaces the `'exports four templates with unique ids'` test from Task 7)

Then add:

```js
function parsePlComma(text) {
  return Number(text.replace(',', '.'));
}

test('podzial na grupy: the total splits exactly into the stated ratio/difference relationship', () => {
  const template = templates.find((t) => t.id === 'rownania_podzial_na_grupy');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const total = Number(task.tresc.match(/łącznie (\d+)/)[1]);
      const k = parsePlComma(task.tresc.match(/(\d+(?:,\d+)?) razy więcej/)[1]);
      const d = Number(task.tresc.match(/o (\d+) mniej/)[1]);
      // total = cat1 + k*cat1 + (cat1 - d)  =>  cat1 = (total + d) / (2 + k)
      const cat1 = (total + d) / (2 + k);
      const expectedCat2 = k * cat1;
      assert.ok(
        Math.abs(parsePl(task.odpowiedz) - expectedCat2) < 1e-6,
        `${task.tresc} -> ${task.odpowiedz} (expected ${expectedCat2})`
      );
    }
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/topics/rownania.test.js`
Expected: FAIL — count is still 4, and the new template doesn't exist.

- [ ] **Step 3: Update the implementation**

In `js/topics/rownania.js`, add after `sredniaArytmetyczna`:

```js
const PODZIAL_RANGES = {
  latwy: { baseMax: 20, dMax: 5, ratios: [2, 3] },
  sredni: { baseMax: 30, dMax: 10, ratios: [2, 3, 1.5] },
  trudny: { baseMax: 40, dMax: 15, ratios: [1.5, 2, 2.5, 3] },
};

function podzialNaGrupy(difficulty, rng) {
  const { baseMax, dMax, ratios } = PODZIAL_RANGES[difficulty];
  const k = rng.pick(ratios);
  // Keep k * base an integer even when k is fractional (e.g. 1.5, 2.5) by
  // always picking an even base.
  const base = Number.isInteger(k)
    ? rng.int(5, baseMax)
    : rng.int(3, Math.floor(baseMax / 2)) * 2;
  const d = rng.int(1, Math.min(dMax, base - 1));

  const cat1 = base;
  const cat2 = k * base;
  const cat3 = base - d;
  const total = cat1 + cat2 + cat3;
  const kLabel = formatNumber(k);

  return {
    id: 'rownania_podzial_na_grupy',
    type: 'otwarte',
    tresc:
      `W pudełku jest łącznie ${formatNumber(total)} kulek w trzech kolorach: ` +
      `czerwone, niebieskie i zielone. Kulek niebieskich jest ${kLabel} razy ` +
      `więcej niż czerwonych, a kulek zielonych jest o ${d} mniej niż czerwonych. ` +
      `Oblicz, ile jest kulek niebieskich.`,
    odpowiedz: formatNumber(cat2),
    rozwiazanie:
      `Niech liczba kulek czerwonych będzie równa x. Wtedy niebieskich jest ${kLabel}x, ` +
      `a zielonych x - ${d}.\n` +
      `x + ${kLabel}x + (x - ${d}) = ${formatNumber(total)}.\n` +
      `x = ${cat1}, więc kulek niebieskich jest ${kLabel} · ${cat1} = ${formatNumber(cat2)}.`,
  };
}
```

Update the `templates` export array:

```js
export const templates = [
  { id: 'rownania_liniowe', generate: rownaniaLiniowe },
  { id: 'rownania_uproszczenie', generate: uproszczenie },
  { id: 'rownania_nawiasy', generate: rownaniaNawiasy },
  { id: 'rownania_srednia_arytmetyczna', generate: sredniaArytmetyczna },
  { id: 'rownania_podzial_na_grupy', generate: podzialNaGrupy },
];
```

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/rownania.test.js`
Expected: PASS, all tests.

- [ ] **Step 5: Run the full suite**

Run: `node --test`
Expected: PASS, every test in the project.

- [ ] **Step 6: Commit**

```bash
git add js/topics/rownania.js test/topics/rownania.test.js
git commit -m "feat: add rownania_podzial_na_grupy template"
```

---

### Task 9: `js/topics/geometriaPlaska.js` — add `geometria_trojkat_rownoboczny_prawda_falsz`

**Files:**
- Modify: `js/topics/geometriaPlaska.js`
- Modify: `test/topics/geometriaPlaska.test.js`

**Interfaces:**
- Consumes: nothing new
- Produces: new template `geometria_trojkat_rownoboczny_prawda_falsz` (open, carries a `figura` of `typ: 'trojkat'`).

- [ ] **Step 1: Write the failing tests**

In `test/topics/geometriaPlaska.test.js`, update the exact-count test:

```js
test('exports six templates with unique ids', () => {
  assert.equal(templates.length, 6);
  assert.equal(new Set(templates.map((t) => t.id)).size, 6);
});
```

(replaces the existing `'exports five templates with unique ids'` test)

Then add:

```js
test('trojkat rownoboczny prawda/falsz: both judgments are independently correct, and the figura matches the stated side', () => {
  const template = templates.find((t) => t.id === 'geometria_trojkat_rownoboczny_prawda_falsz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [s] = task.tresc.match(/boku długości (\d+) cm/).slice(1).map(Number);
      assert.equal(task.figura.typ, 'trojkat');
      assert.equal(task.figura.bok, s);

      const k = s / 2;
      const trueHeightText = k === 1 ? '√3 cm' : `${k}√3 cm`;
      const trueAreaText = `${k * k}√3 cm²`;

      const heightClaim = task.tresc.match(/Wysokość tego trójkąta jest równa ([^.]+)\./)[1];
      const areaClaim = task.tresc.match(/Pole tego trójkąta jest równe ([^.]+)\./)[1];
      const answerMatch = task.odpowiedz.match(/^1\. (Prawda|Fałsz), 2\. (Prawda|Fałsz)$/);
      assert.ok(answerMatch, `unexpected answer format: "${task.odpowiedz}"`);

      const heightJudgedTrue = answerMatch[1] === 'Prawda';
      const areaJudgedTrue = answerMatch[2] === 'Prawda';
      assert.equal(heightClaim === trueHeightText, heightJudgedTrue, task.tresc);
      assert.equal(areaClaim === trueAreaText, areaJudgedTrue, task.tresc);
    }
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/topics/geometriaPlaska.test.js`
Expected: FAIL — count is still 5, and the new template doesn't exist.

- [ ] **Step 3: Update the implementation**

In `js/topics/geometriaPlaska.js`, add after `figuraZlozona`:

```js
const TROJKAT_RB_RANGES = {
  latwy: { kMax: 5 },
  sredni: { kMax: 8 },
  trudny: { kMax: 12 },
};

function trojkatRownobocznyPrawdaFalsz(difficulty, rng) {
  const { kMax } = TROJKAT_RB_RANGES[difficulty];
  const k = rng.int(1, kMax);
  const s = 2 * k;

  const trueHeightText = k === 1 ? '√3 cm' : `${k}√3 cm`;
  const trueAreaText = `${k * k}√3 cm²`;
  const wrongHeightText = `${s}√3 cm`; // pominięte dzielenie przez 2
  const wrongAreaText = `${2 * k * k}√3 cm²`; // pominięte dzielenie przez 2

  const claim1True = rng.bool();
  const claim2True = rng.bool();
  const claimHeightText = claim1True ? trueHeightText : wrongHeightText;
  const claimAreaText = claim2True ? trueAreaText : wrongAreaText;

  return {
    id: 'geometria_trojkat_rownoboczny_prawda_falsz',
    type: 'otwarte',
    figura: { typ: 'trojkat', bok: s },
    tresc:
      `Dany jest trójkąt równoboczny o boku długości ${s} cm.\n` +
      `1. Wysokość tego trójkąta jest równa ${claimHeightText}.\n` +
      `2. Pole tego trójkąta jest równe ${claimAreaText}.\n` +
      `Oceń prawdziwość obu zdań.`,
    odpowiedz: `1. ${claim1True ? 'Prawda' : 'Fałsz'}, 2. ${claim2True ? 'Prawda' : 'Fałsz'}`,
    rozwiazanie:
      `Wysokość trójkąta równobocznego dzieli go na dwa trójkąty prostokątne ` +
      `o przeciwprostokątnej ${s} cm i jednej przyprostokątnej ${k} cm.\n` +
      `Z twierdzenia Pitagorasa: h² = ${s}² - ${k}² = ${s * s} - ${k * k} = ${s * s - k * k}, ` +
      `więc h = ${trueHeightText}.\n` +
      `Pole: P = (${s} · ${trueHeightText}) : 2 = ${trueAreaText}.\n` +
      `Zdanie 1 jest ${claim1True ? 'prawdziwe' : 'fałszywe'}, ` +
      `zdanie 2 jest ${claim2True ? 'prawdziwe' : 'fałszywe'}.`,
  };
}
```

Update the `templates` export array:

```js
export const templates = [
  { id: 'geometria_pole_prostokata', generate: poleProstokata },
  { id: 'geometria_obwod_prostokata', generate: obwodProstokata },
  { id: 'geometria_pole_trojkata', generate: poleTrojkata },
  { id: 'geometria_pole_trapezu', generate: poleTrapezu },
  { id: 'geometria_figura_zlozona', generate: figuraZlozona },
  { id: 'geometria_trojkat_rownoboczny_prawda_falsz', generate: trojkatRownobocznyPrawdaFalsz },
];
```

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/geometriaPlaska.test.js`
Expected: PASS, all tests.

- [ ] **Step 5: Run the full suite**

Run: `node --test`
Expected: PASS, every test in the project.

- [ ] **Step 6: Commit**

```bash
git add js/topics/geometriaPlaska.js test/topics/geometriaPlaska.test.js
git commit -m "feat: add geometria_trojkat_rownoboczny_prawda_falsz template"
```

---

### Task 10: `js/topics/geometriaPlaska.js` — add `geometria_czworokat_katy`

**Files:**
- Modify: `js/topics/geometriaPlaska.js`
- Modify: `test/topics/geometriaPlaska.test.js`

**Interfaces:**
- Consumes: `buildOptions`
- Produces: new template `geometria_czworokat_katy` (closed, carries a `figura` of `typ: 'czworokat'`).

- [ ] **Step 1: Write the failing tests**

In `test/topics/geometriaPlaska.test.js`, update the exact-count test:

```js
test('exports seven templates with unique ids', () => {
  assert.equal(templates.length, 7);
  assert.equal(new Set(templates.map((t) => t.id)).size, 7);
});
```

(replaces the `'exports six templates with unique ids'` test from Task 9)

Then add:

```js
test('czworokat katy: alpha satisfies the 360-degree sum and matches the stated relationships', () => {
  const template = templates.find((t) => t.id === 'geometria_czworokat_katy');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      assert.equal(task.figura.typ, 'czworokat');

      const diff = Number(task.tresc.match(/o (\d+)° większa/)[1]);
      const mnoznik = task.tresc.includes('dwukrotnie') ? 2 : 3;
      const alpha = Number(task.odpowiedz.replace('°', ''));
      const beta = alpha - diff;
      const gamma = mnoznik * beta;
      const delta = 90;
      assert.equal(alpha + beta + gamma + delta, 360, task.tresc);
      assert.ok(beta > 0 && gamma > 0 && alpha > 0, `non-positive angle: ${task.tresc}`);
    }
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/topics/geometriaPlaska.test.js`
Expected: FAIL — count is still 6, and the new template doesn't exist.

- [ ] **Step 3: Update the implementation**

In `js/topics/geometriaPlaska.js`, add after `trojkatRownobocznyPrawdaFalsz`:

```js
const CZWOROKAT_RANGES = {
  latwy: { betaMax: 40, k: 2 },
  sredni: { betaMax: 50, k: 2 },
  trudny: { betaMax: 50, k: 3 },
};

function czworokatKaty(difficulty, rng) {
  const { betaMax, k } = CZWOROKAT_RANGES[difficulty];
  // beta*(2+k) must stay at or below 269 so diff = alpha - beta comes out
  // strictly positive ("alpha bigger than beta" has to actually be true).
  const betaLimit = Math.min(betaMax, Math.floor(269 / (2 + k)));
  const beta = rng.int(10, betaLimit);
  const gamma = k * beta;
  const delta = 90;
  const alpha = 360 - beta - gamma - delta;
  const diff = alpha - beta;
  const mnoznik = k === 2 ? 'dwukrotnie' : 'trzykrotnie';

  const correct = `${alpha}°`;
  // Typowe błędy: podanie beta lub gamma zamiast alfa, zapomnienie o kącie prostym.
  const wrong = [`${beta}°`, `${gamma}°`, `${360 - beta - gamma}°`];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'geometria_czworokat_katy',
    type: 'zamkniete',
    figura: { typ: 'czworokat' },
    tresc:
      `Kąty wewnętrzne czworokąta ABCD oznaczono odpowiednio α, β, γ, δ. ` +
      `Miara kąta α jest o ${diff}° większa od miary kąta β, a miara kąta γ jest ` +
      `${mnoznik} większa od miary kąta β. Kąt δ jest kątem prostym. ` +
      `Oblicz miarę kąta α.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Suma kątów wewnętrznych czworokąta wynosi 360°.\n` +
      `β + γ + δ + α = 360°, gdzie γ = ${k} · β, δ = 90°, α = β + ${diff}°.\n` +
      `β + ${k}β + 90 + β + ${diff} = 360°, więc ${2 + k}β = ${270 - diff}, β = ${beta}°.\n` +
      `α = β + ${diff}° = ${beta}° + ${diff}° = ${correct}.`,
  };
}
```

Update the `templates` export array:

```js
export const templates = [
  { id: 'geometria_pole_prostokata', generate: poleProstokata },
  { id: 'geometria_obwod_prostokata', generate: obwodProstokata },
  { id: 'geometria_pole_trojkata', generate: poleTrojkata },
  { id: 'geometria_pole_trapezu', generate: poleTrapezu },
  { id: 'geometria_figura_zlozona', generate: figuraZlozona },
  { id: 'geometria_trojkat_rownoboczny_prawda_falsz', generate: trojkatRownobocznyPrawdaFalsz },
  { id: 'geometria_czworokat_katy', generate: czworokatKaty },
];
```

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/geometriaPlaska.test.js`
Expected: PASS, all tests.

- [ ] **Step 5: Run the full suite**

Run: `node --test`
Expected: PASS, every test in the project.

- [ ] **Step 6: Commit**

```bash
git add js/topics/geometriaPlaska.js test/topics/geometriaPlaska.test.js
git commit -m "feat: add geometria_czworokat_katy template"
```

---

### Task 11: `js/topics/potegiPitagoras.js` — add `pitagoras_mapa_odleglosc`

**Files:**
- Modify: `js/topics/potegiPitagoras.js`
- Modify: `test/topics/potegiPitagoras.test.js`

**Interfaces:**
- Consumes: `formatNumber`, the existing `TRIPLES` array and `RANGES` table (already in this file)
- Produces: new template `pitagoras_mapa_odleglosc` (open, carries a `figura` of `typ: 'mapa'`).

- [ ] **Step 1: Write the failing tests**

In `test/topics/potegiPitagoras.test.js`, update the exact-count test:

```js
test('exports five templates with unique ids', () => {
  assert.equal(templates.length, 5);
  assert.equal(new Set(templates.map((t) => t.id)).size, 5);
});
```

(replaces the `'exports four templates with unique ids'` test)

Then add:

```js
test('pitagoras mapa: the distance satisfies dx^2 + dy^2 = distance^2, and the figura matches', () => {
  const template = templates.find((t) => t.id === 'pitagoras_mapa_odleglosc');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [dx, dy] = task.tresc.match(/\d+/g).map(Number);
      const distance = parsePl(task.odpowiedz);
      assert.equal(dx * dx + dy * dy, distance * distance, `${dx},${dy} -> ${distance}`);
      assert.equal(task.figura.typ, 'mapa');
      assert.equal(task.figura.dx, dx);
      assert.equal(task.figura.dy, dy);
    }
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/topics/potegiPitagoras.test.js`
Expected: FAIL — count is still 4, and the new template doesn't exist.

- [ ] **Step 3: Update the implementation**

In `js/topics/potegiPitagoras.js`, add after `pitagoras`:

```js
function pitagorasMapaOdleglosc(difficulty, rng) {
  const { scaleMax } = RANGES[difficulty];
  const [a0, b0, c0] = rng.pick(TRIPLES);
  const scale = rng.int(1, scaleMax);
  const dx = a0 * scale;
  const dy = b0 * scale;
  const distance = c0 * scale;

  return {
    id: 'pitagoras_mapa_odleglosc',
    type: 'otwarte',
    figura: { typ: 'mapa', dx, dy },
    tresc:
      `Punkt B znajduje się ${dx} km na zachód i ${dy} km na północ od punktu A. ` +
      `Oblicz odległość w linii prostej między punktami A i B.`,
    odpowiedz: `${formatNumber(distance)} km`,
    rozwiazanie:
      `Odcinek łączący A i B jest przeciwprostokątną trójkąta prostokątnego ` +
      `o przyprostokątnych ${dx} km i ${dy} km.\n` +
      `Z twierdzenia Pitagorasa: ${dx}² + ${dy}² = ${dx * dx} + ${dy * dy} = ${dx * dx + dy * dy}.\n` +
      `Odległość = pierwiastek z ${dx * dx + dy * dy} = ${distance} km.`,
  };
}
```

Update the `templates` export array:

```js
export const templates = [
  { id: 'potegi_obliczanie', generate: potegi },
  { id: 'pierwiastki_obliczanie', generate: pierwiastki },
  { id: 'pierwiastki_uproszczenie', generate: pierwiastkiUproszczenie },
  { id: 'pitagoras_przeciwprostokatna', generate: pitagoras },
  { id: 'pitagoras_mapa_odleglosc', generate: pitagorasMapaOdleglosc },
];
```

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/potegiPitagoras.test.js`
Expected: PASS, all tests.

- [ ] **Step 5: Run the full suite**

Run: `node --test`
Expected: PASS, every test in the project.

- [ ] **Step 6: Commit**

```bash
git add js/topics/potegiPitagoras.js test/topics/potegiPitagoras.test.js
git commit -m "feat: add pitagoras_mapa_odleglosc template"
```

---

### Task 12: New topic `js/topics/bryly.js` (stereometria) + registry wiring

**Files:**
- Create: `js/topics/bryly.js`
- Create: `test/topics/bryly.test.js`
- Modify: `js/topicRegistry.js`

**Interfaces:**
- Consumes: `formatNumber`, `buildOptions`
- Produces: `templates` export with two entries: `bryly_pole_powierzchni_prostopadloscianu` (closed) and `bryly_objetosc_prostopadloscianu` (open), both carrying a `figura` of `typ: 'prostopadloscian'`. `bryly` becomes a new entry in `TOPICS`, added to sp6's and sp8's `topicKeys`. `liczby_naturalne` is also added to sp8's `topicKeys` (currently missing there despite being exam-relevant review content).

- [ ] **Step 1: Write the failing tests**

Create `test/topics/bryly.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { templates } from '../../js/topics/bryly.js';
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
        const task = template.generate(difficulty, createRng(seed));
        assert.equal(task.id, template.id);
        assertValidTask(task);
      }
    }
  }
});

test('pole powierzchni: the answer equals 2(ab + bc + ac), and the figura matches the stated dimensions', () => {
  const template = templates.find((t) => t.id === 'bryly_pole_powierzchni_prostopadloscianu');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [a, b, c] = task.tresc.match(/\d+(?:,\d+)?/g).map(parsePl);
      const expected = 2 * (a * b + b * c + a * c);
      assert.ok(
        Math.abs(parsePl(task.odpowiedz) - expected) < 1e-6,
        `${task.tresc} -> ${task.odpowiedz}`
      );
      assert.equal(task.figura.typ, 'prostopadloscian');
      assert.equal(task.figura.a, a);
      assert.equal(task.figura.b, b);
      assert.equal(task.figura.c, c);
    }
  }
});

test('objetosc: the answer equals a * b * c, and the figura matches the stated dimensions', () => {
  const template = templates.find((t) => t.id === 'bryly_objetosc_prostopadloscianu');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [a, b, c] = task.tresc.match(/\d+(?:,\d+)?/g).map(parsePl);
      const expected = a * b * c;
      assert.ok(
        Math.abs(parsePl(task.odpowiedz) - expected) < 1e-6,
        `${task.tresc} -> ${task.odpowiedz}`
      );
      assert.equal(task.figura.typ, 'prostopadloscian');
      assert.equal(task.figura.a, a);
      assert.equal(task.figura.b, b);
      assert.equal(task.figura.c, c);
    }
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/topics/bryly.test.js`
Expected: FAIL — `js/topics/bryly.js` does not exist yet.

- [ ] **Step 3: Write the implementation**

Create `js/topics/bryly.js`:

```js
// Bryły: pole powierzchni i objętość prostopadłościanu (klasy 6, 8).
//
// Poziomy trudności:
//   łatwy   - wymiary całkowite do 12
//   średni  - wymiary całkowite do 25
//   trudny  - wymiary z jednym miejscem po przecinku, do 25

import { formatNumber } from '../format.js';
import { buildOptions } from '../distractors.js';

const RANGES = {
  latwy: { max: 12, decimal: false },
  sredni: { max: 25, decimal: false },
  trudny: { max: 25, decimal: true },
};

function wymiar(rng, difficulty) {
  const { max, decimal } = RANGES[difficulty];
  return decimal ? rng.int(20, max * 10) / 10 : rng.int(2, max);
}

function wymiary(rng, difficulty) {
  return [wymiar(rng, difficulty), wymiar(rng, difficulty), wymiar(rng, difficulty)];
}

function polePowierzchni(difficulty, rng) {
  const [a, b, c] = wymiary(rng, difficulty);
  const pole = Number((2 * (a * b + b * c + a * c)).toFixed(4));
  const correct = `${formatNumber(pole)} cm²`;

  // Typowe błędy: policzona objętość zamiast pola, brak podwojenia sumy pól
  // ścian, podwojenie tylko jednej pary ścian.
  const wrong = [
    `${formatNumber(Number((a * b * c).toFixed(4)))} cm²`,
    `${formatNumber(Number((a * b + b * c + a * c).toFixed(4)))} cm²`,
    `${formatNumber(Number((4 * a * b).toFixed(4)))} cm²`,
  ];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'bryly_pole_powierzchni_prostopadloscianu',
    type: 'zamkniete',
    figura: { typ: 'prostopadloscian', a, b, c },
    tresc:
      `Prostopadłościan ma wymiary ${formatNumber(a)} cm, ${formatNumber(b)} cm ` +
      `oraz ${formatNumber(c)} cm. Oblicz pole powierzchni całkowitej tej bryły.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Pole powierzchni całkowitej: P = 2 · (a·b + b·c + a·c).\n` +
      `P = 2 · (${formatNumber(a)} · ${formatNumber(b)} + ${formatNumber(b)} · ${formatNumber(c)} + ` +
      `${formatNumber(a)} · ${formatNumber(c)}) = ${correct}.`,
  };
}

function objetosc(difficulty, rng) {
  const [a, b, c] = wymiary(rng, difficulty);
  const objetoscWartosc = Number((a * b * c).toFixed(4));

  return {
    id: 'bryly_objetosc_prostopadloscianu',
    type: 'otwarte',
    figura: { typ: 'prostopadloscian', a, b, c },
    tresc:
      `Prostopadłościan ma wymiary ${formatNumber(a)} cm, ${formatNumber(b)} cm ` +
      `oraz ${formatNumber(c)} cm. Oblicz objętość tej bryły.`,
    odpowiedz: `${formatNumber(objetoscWartosc)} cm³`,
    rozwiazanie:
      `Objętość prostopadłościanu: V = a · b · c.\n` +
      `V = ${formatNumber(a)} · ${formatNumber(b)} · ${formatNumber(c)} = ` +
      `${formatNumber(objetoscWartosc)} cm³.`,
  };
}

export const templates = [
  { id: 'bryly_pole_powierzchni_prostopadloscianu', generate: polePowierzchni },
  { id: 'bryly_objetosc_prostopadloscianu', generate: objetosc },
];
```

In `js/topicRegistry.js`, add the import:

```js
import { templates as bryly } from './topics/bryly.js';
```

Add `bryly` to the `TOPICS` array:

```js
export const TOPICS = [
  { key: 'liczby_naturalne', label: 'Działania na liczbach naturalnych', templates: liczbyNaturalne },
  { key: 'ulamki', label: 'Ułamki zwykłe', templates: ulamki },
  { key: 'ulamki_dziesietne', label: 'Ułamki dziesiętne', templates: ulamkiDziesietne },
  { key: 'procenty', label: 'Procenty', templates: procenty },
  { key: 'geometria_plaska', label: 'Pola i obwody figur', templates: geometriaPlaska },
  { key: 'rownania', label: 'Równania i wyrażenia algebraiczne', templates: rownania },
  { key: 'potegi_pitagoras', label: 'Potęgi, pierwiastki i twierdzenie Pitagorasa', templates: potegiPitagoras },
  { key: 'funkcje', label: 'Funkcja liniowa i kwadratowa', templates: funkcje },
  { key: 'liceum_zaawansowane', label: 'Ciągi, trygonometria, geometria analityczna, prawdopodobieństwo', templates: liceumZaawansowane },
  { key: 'bryly', label: 'Bryły: pole powierzchni i objętość', templates: bryly },
];
```

Update sp6's and sp8's `topicKeys` in `GRADES` (sp6 gains `bryly`; sp8 gains `liczby_naturalne` and `bryly`):

```js
  { key: 'sp6', label: 'Klasa 6', etap: 'podstawowa', topicKeys: ['ulamki_dziesietne', 'procenty', 'geometria_plaska', 'ulamki', 'bryly'] },
  { key: 'sp7', label: 'Klasa 7', etap: 'podstawowa', topicKeys: ['procenty', 'potegi_pitagoras', 'rownania', 'ulamki_dziesietne'] },
  { key: 'sp8', label: 'Klasa 8', etap: 'podstawowa', topicKeys: ['potegi_pitagoras', 'rownania', 'procenty', 'geometria_plaska', 'liczby_naturalne', 'bryly'] },
```

(sp7's line is unchanged — shown only for context; only sp6's and sp8's `topicKeys` arrays actually change.)

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/bryly.test.js`
Expected: PASS, all tests.

- [ ] **Step 5: Run the full suite**

Run: `node --test`
Expected: PASS, every test in the project — `test/topicRegistry.test.js`'s generic tests (unique ids, every template callable, every grade resolves to templates) automatically cover the new topic and grade wiring with no changes needed there.

- [ ] **Step 6: Commit**

```bash
git add js/topics/bryly.js test/topics/bryly.test.js js/topicRegistry.js
git commit -m "feat: add bryly (stereometria) topic, wire into sp6/sp8"
```

---

### Task 13: `js/sheetGenerator.js` + `js/examModes.js` — fixed 14-closed/6-open structure for Egzamin ósmoklasisty

**Files:**
- Modify: `js/examModes.js`
- Modify: `js/sheetGenerator.js`
- Modify: `test/sheetGenerator.test.js`

**Interfaces:**
- Consumes: nothing new
- Produces: `EXAM_MODES`'s `osmoklasisty` entry now has `fixedStructure: { closedCount: 14, openCount: 6 }` instead of `closedRatio`. `generateSheet(options)` honors `fixedStructure` when present: ignores `options.count`, returns exactly `closedCount + openCount` tasks, closed section first.

- [ ] **Step 1: Write the failing tests**

In `test/sheetGenerator.test.js`, add:

```js
test('osmoklasisty exam mode always produces a fixed 20-task sheet regardless of options.count', () => {
  for (const count of [1, 5, 12]) {
    const sheet = generateSheet({
      mode: 'egzamin',
      examKey: 'osmoklasisty',
      difficulty: 'sredni',
      count,
      seed: 1,
    });
    assert.equal(sheet.length, 20);
  }
});

test('osmoklasisty exam mode puts exactly 14 closed tasks first, then 6 open tasks', () => {
  const sheet = generateSheet({
    mode: 'egzamin',
    examKey: 'osmoklasisty',
    difficulty: 'sredni',
    count: 20,
    seed: 2,
  });
  const types = sheet.map((t) => t.type);
  assert.deepEqual(types.slice(0, 14), Array(14).fill('zamkniete'));
  assert.deepEqual(types.slice(14), Array(6).fill('otwarte'));
});

test('osmoklasisty exam mode: the same seed reproduces the same sheet', () => {
  const options = {
    mode: 'egzamin',
    examKey: 'osmoklasisty',
    difficulty: 'trudny',
    count: 20,
    seed: 42,
  };
  assert.deepEqual(generateSheet(options), generateSheet(options));
});

test('osmoklasisty exam mode: no two tasks share identical tresc', () => {
  for (let seed = 0; seed < 10; seed++) {
    const sheet = generateSheet({
      mode: 'egzamin',
      examKey: 'osmoklasisty',
      difficulty: 'sredni',
      count: 20,
      seed,
    });
    const texts = sheet.map((t) => t.tresc);
    assert.equal(new Set(texts).size, texts.length, `seed ${seed}`);
  }
});

test('matura exam mode is unaffected: still respects options.count and mixes closed/open', () => {
  const sheet = generateSheet({
    mode: 'egzamin',
    examKey: 'matura',
    difficulty: 'sredni',
    count: 8,
    seed: 3,
  });
  assert.equal(sheet.length, 8);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/sheetGenerator.test.js`
Expected: FAIL — the 20-task/14-6-split tests fail because `osmoklasisty` still uses the old `closedRatio`-over-`count` behavior.

- [ ] **Step 3: Update `js/examModes.js`**

Replace the `osmoklasisty` entry's `closedRatio` field with `fixedStructure` (leave `matura` untouched):

```js
export const EXAM_MODES = [
  {
    key: 'osmoklasisty',
    label: 'Egzamin ósmoklasisty',
    gradeKeys: ['sp4', 'sp5', 'sp6', 'sp7', 'sp8'],
    fixedStructure: { closedCount: 14, openCount: 6 },
  },
  {
    key: 'matura',
    label: 'Matura (poziom podstawowy)',
    gradeKeys: ['lo1', 'lo2', 'lo3', 'lo4'],
    closedRatio: 0.6,
  },
];
```

- [ ] **Step 4: Update `js/sheetGenerator.js`**

Extend `taskIdentity` to also account for `figura` (so two tasks with the same wording but different figures — not expected in practice, but kept consistent with how `wykres` is already handled — are never treated as duplicates):

```js
function taskIdentity(task) {
  if (task.wykres) return `${task.tresc}|${JSON.stringify(task.wykres)}`;
  if (task.figura) return `${task.tresc}|${JSON.stringify(task.figura)}`;
  return task.tresc;
}
```

Extract the existing generate-and-dedupe loop out of `generateSheet` into a reusable helper, then add the `fixedStructure` branch. Replace the whole body of `generateSheet` (and add the new helper function right after it):

```js
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
```

- [ ] **Step 5: Run it to verify it passes**

Run: `node --test test/sheetGenerator.test.js`
Expected: PASS, all tests.

- [ ] **Step 6: Run the full suite**

Run: `node --test`
Expected: PASS, every test in the project.

- [ ] **Step 7: Commit**

```bash
git add js/examModes.js js/sheetGenerator.js test/sheetGenerator.test.js
git commit -m "feat: fixed 14-closed/6-open structure for Egzamin osmoklasisty"
```

---

### Task 14: `index.html` + `js/app.js` — hide the task-count input for Egzamin ósmoklasisty

**Files:**
- Modify: `index.html`
- Modify: `js/app.js`

**Interfaces:**
- Consumes: nothing new
- Produces: when "Egzamin ósmoklasisty" is selected, the "Liczba zadań" input is hidden and replaced with a static note; it reappears (and the note hides) for every other mode/exam combination.

**Note:** DOM-only UI wiring — no automated test for this file (matches this project's existing pattern for `app.js`, which has no test file). Verified manually in Task 15.

- [ ] **Step 1: Update `index.html`**

Find the "Liczba zadań" paragraph:

```html
<p class="pole">
  <label for="liczba-zadan">Liczba zadań (1–12)</label>
  <input type="number" id="liczba-zadan" min="1" max="12" step="1" value="6" />
</p>
```

Replace it with (adds an `id` to the existing `<p>` and a new sibling note, initially hidden):

```html
<p class="pole" id="pole-liczba-zadan">
  <label for="liczba-zadan">Liczba zadań (1–12)</label>
  <input type="number" id="liczba-zadan" min="1" max="12" step="1" value="6" />
</p>
<p class="pole" id="info-liczba-zadan" hidden>
  Liczba zadań: 20 (stała, jak na egzaminie ósmoklasisty).
</p>
```

- [ ] **Step 2: Update `js/app.js`**

Add two new element lookups near the top, alongside the existing ones (right after the `liczbaZadan` lookup):

```js
const poleLiczbaZadan = el('pole-liczba-zadan');
const infoLiczbaZadan = el('info-liczba-zadan');
```

Add a new function right after `refreshTryb`:

```js
function refreshLiczbaZadanWidoczna() {
  const staleZadania =
    selectedRadio('tryb') === 'egzamin' && wyborEgzaminu.value === 'osmoklasisty';
  poleLiczbaZadan.hidden = staleZadania;
  infoLiczbaZadan.hidden = !staleZadania;
}
```

Call it from `refreshTryb` (append the call at the end of the existing function):

```js
function refreshTryb() {
  const egzamin = selectedRadio('tryb') === 'egzamin';
  grupaCwiczenia.hidden = egzamin;
  grupaEgzamin.hidden = !egzamin;
  refreshLiczbaZadanWidoczna();
}
```

In `init()`, add a change listener on the exam-select dropdown, right after the existing `wyborKlasy.addEventListener('change', refreshDzialy);` line:

```js
  wyborEgzaminu.addEventListener('change', refreshLiczbaZadanWidoczna);
```

- [ ] **Step 3: Sanity-check syntax**

Run: `node --check js/app.js`
Expected: no output (valid syntax).

- [ ] **Step 4: Run the full suite**

Run: `node --test`
Expected: PASS, every test in the project (this task touches no tested files, so this just confirms nothing else broke).

- [ ] **Step 5: Commit**

```bash
git add index.html js/app.js
git commit -m "feat: hide the task-count input for the fixed-structure osmoklasisty exam"
```

---

### Task 15: Full suite + manual browser verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full automated suite**

Run: `node --test`
Expected: PASS, every test in the project.

- [ ] **Step 2: Manually verify in a browser**

Serve the site (`python -m http.server 8000`) and, using browser automation or by hand — **hard-reload the page** (the dev server sends no cache headers, so a plain navigate can serve a stale cached module):

1. Generate a Ćwiczenia sheet for Klasa 8, "Bryły: pole powierzchni i objętość" — confirm both new templates appear with a labeled cuboid diagram, and that "Wszystkie działy" for Klasa 8 now also offers "Działania na liczbach naturalnych".
2. Generate a Ćwiczenia sheet for a grade/topic combo that includes the triangle P/F template — confirm the triangle diagram renders with its side length labeled, and the two true/false judgments read sensibly against the revealed answer.
3. Generate a sheet including the quadrilateral-angle template — confirm the quadrilateral diagram renders with α/β/γ/δ labeled at its corners and a right-angle marker at one vertex.
4. Generate a sheet including the map-distance template — confirm the diagram shows two legs, a dashed hypotenuse, both leg labels, and a north arrow.
5. Select Tryb "Egzamin" → Egzamin "Egzamin ósmoklasisty" — confirm the "Liczba zadań" input disappears and the "20 zadań (stała...)" note appears; generate the sheet and confirm it has exactly 20 tasks, the first 14 closed (lettered options) and the last 6 open (no lettered options).
6. Switch the exam dropdown to "Matura (poziom podstawowy)" — confirm the "Liczba zadań" input reappears and works as before (matura is unaffected by this work).
7. Check print preview on a sheet containing several of the new diagram types — confirm the figures print clearly (line art visible, labels legible).

- [ ] **Step 3: Fix anything that fails**

If any check in Step 2 fails, fix the relevant file and re-run both Step 1 and Step 2 before proceeding.

- [ ] **Step 4: Report results**

No commit for this task (verification-only) — summarize what was checked and confirmed working.
