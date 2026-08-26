# Interactive Function Charts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add interactive (mouse-hover / touch-drag) SVG graphs of linear and quadratic functions, and two new `funkcje` templates where the graph itself is the question.

**Architecture:** A pure SVG-generating module (`js/chart.js`) turns a small numeric descriptor into a self-contained, data-attribute-annotated `<svg>`. `render.js` embeds that markup (trusted, unescaped) into a task's HTML. A separate DOM-only module (`js/chartInteraction.js`), wired up once from `app.js`, reads the embedded data attributes back and drives a hover/drag marker via Pointer Events (works for mouse and touch through one code path). Two new templates in `funkcje.js` attach a `wykres` descriptor and ask the student to read the answer off the graph, with no formula shown.

**Tech Stack:** Plain ES modules, inline SVG, Pointer Events API, `node --test`. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-08-25-interactive-function-charts-design.md`

## Global Constraints

- No npm packages, no bundler, no build step. ES modules only.
- `js/chart.js` must be a pure function module: no DOM access, deterministic output for the same input, unit-testable directly in Node.
- `js/chartInteraction.js` is DOM-only glue and has no automated test — verify it manually via the browser tool before considering the feature done (same situation as `app.js`).
- The `wykres` field on a task object is optional; every existing template and test must keep working unmodified.
- All rendered numbers go through `formatNumber`/Polish comma formatting — never a raw JS decimal.
- The two new templates' `tresc` must never contain the function's coefficients — the whole point is reading them off the graph.
- Chart geometry constants (`300` viewBox size, `20` padding) are defined once in `js/chart.js` and imported everywhere else that needs them (`chartInteraction.js`, tests) — never re-hardcoded.

---

### Task 1: Pure SVG chart generator (`js/chart.js`)

**Files:**
- Create: `js/chart.js`
- Test: `test/chart.test.js`

**Interfaces:**
- Consumes: `formatNumber` (`js/format.js`)
- Produces:
  - `CHART_SIZE = 300`, `CHART_PADDING = 20` — exported numeric constants used by `chartInteraction.js` and tests to convert between SVG pixel space and function space.
  - `chartSvg(wykres) => string` where `wykres = { rownanie: 'liniowa'|'kwadratowa', a, b, c, xMin, xMax }` (`c` only meaningful for `'kwadratowa'`). Returns a self-contained `<svg class="wykres" ...>` string with `data-rownanie`, `data-a`, `data-b`, `data-c`, `data-x-min`, `data-x-max`, `data-y-min`, `data-y-max`, `data-x-step`, `data-y-step` attributes on the root, a `<path class="krzywa">` curve, grid `<line class="siatka">` elements, axis `<line class="os">` elements, tick `<text class="etykieta">` labels, a transparent `<rect class="nakladka">` overlay, and a hidden `<circle class="znacznik">` + `<text class="etykieta-znacznika">` for the interactive marker.

- [ ] **Step 1: Write the failing test**

Create `test/chart.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chartSvg, CHART_SIZE, CHART_PADDING } from '../js/chart.js';

const LINIOWA = { rownanie: 'liniowa', a: 2, b: -4, xMin: -5, xMax: 5 };
const KWADRATOWA = { rownanie: 'kwadratowa', a: 1, b: 0, c: -4, xMin: -6, xMax: 6 };

function parseDataAttrs(svg) {
  const attrs = {};
  for (const m of svg.matchAll(/data-([a-z-]+)="(-?[\d.]+|liniowa|kwadratowa)"/g)) {
    attrs[m[1]] = m[2];
  }
  return attrs;
}

function pathPoints(svg) {
  const d = svg.match(/<path[^>]*class="krzywa"[^>]*d="([^"]+)"/)[1];
  return [...d.matchAll(/(-?[\d.]+) (-?[\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
}

// Converts an SVG pixel point back to function-space, independently of
// chart.js's own internal math, using only the geometry constants and the
// data attributes chart.js publishes.
function toFunctionSpace(attrs, px, py) {
  const xMin = Number(attrs['x-min']);
  const xMax = Number(attrs['x-max']);
  const yMin = Number(attrs['y-min']);
  const yMax = Number(attrs['y-max']);
  const plot = CHART_SIZE - CHART_PADDING * 2;
  const x = xMin + ((px - CHART_PADDING) / plot) * (xMax - xMin);
  const y = yMin + (1 - (py - CHART_PADDING) / plot) * (yMax - yMin);
  return { x, y };
}

test('chartSvg returns an svg with a curve path and matching data attributes', () => {
  const svg = chartSvg(LINIOWA);
  assert.match(svg, /<svg[^>]*class="wykres"/);
  assert.match(svg, /<path[^>]*class="krzywa"/);
  const attrs = parseDataAttrs(svg);
  assert.equal(attrs['rownanie'], 'liniowa');
  assert.equal(Number(attrs['a']), 2);
  assert.equal(Number(attrs['b']), -4);
  assert.equal(Number(attrs['x-min']), -5);
  assert.equal(Number(attrs['x-max']), 5);
});

test('sampled path points independently satisfy y = a*x + b for a linear function', () => {
  const svg = chartSvg(LINIOWA);
  const coords = pathPoints(svg);
  assert.ok(coords.length > 50, 'too few sampled points');
  const attrs = parseDataAttrs(svg);

  for (const [px, py] of [coords[0], coords[coords.length - 1]]) {
    const { x, y } = toFunctionSpace(attrs, px, py);
    assert.ok(
      Math.abs(y - (2 * x - 4)) < 0.05,
      `point (${x}, ${y}) does not satisfy y = 2x - 4`
    );
  }
});

test('sampled path points independently satisfy y = a*x^2 + b*x + c for a quadratic', () => {
  const svg = chartSvg(KWADRATOWA);
  const coords = pathPoints(svg);
  const attrs = parseDataAttrs(svg);

  let closest = coords[0];
  let closestDist = Infinity;
  for (const point of coords) {
    const { x } = toFunctionSpace(attrs, point[0], point[1]);
    if (Math.abs(x) < closestDist) {
      closestDist = Math.abs(x);
      closest = point;
    }
  }
  const { x, y } = toFunctionSpace(attrs, closest[0], closest[1]);
  assert.ok(Math.abs(y - (x * x - 4)) < 0.05, `near x=0 point does not satisfy y = x^2 - 4`);
});

test('the y-range always includes zero so the x-axis is visible', () => {
  const svg = chartSvg(KWADRATOWA);
  const attrs = parseDataAttrs(svg);
  assert.ok(Number(attrs['y-min']) <= 0 && Number(attrs['y-max']) >= 0);
});

test('grid steps are always 1, 2, or 5 times a power of ten', () => {
  const cases = [
    LINIOWA,
    KWADRATOWA,
    { rownanie: 'kwadratowa', a: 3, b: 12, c: 40, xMin: -10, xMax: 2 },
  ];
  for (const wykres of cases) {
    const svg = chartSvg(wykres);
    const attrs = parseDataAttrs(svg);
    for (const key of ['x-step', 'y-step']) {
      const step = Number(attrs[key]);
      const magnitude = 10 ** Math.floor(Math.log10(step));
      const normalized = Number((step / magnitude).toFixed(6));
      assert.ok([1, 2, 5].includes(normalized), `${key}=${step} is not a nice number`);
    }
  }
});

test('rejects a degenerate domain the same way callers should never produce', () => {
  assert.throws(() => chartSvg({ rownanie: 'liniowa', a: 1, b: 0, xMin: 5, xMax: 5 }));
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/chart.test.js`
Expected: FAIL — `Cannot find module '../js/chart.js'`

- [ ] **Step 3: Write the implementation**

Create `js/chart.js`:

```js
// Pure SVG generator for linear/quadratic function graphs. No DOM access;
// takes numbers, returns a markup string. The interactivity layer
// (js/chartInteraction.js) reads the data-* attributes this module embeds
// on the root <svg> instead of re-deriving any of this geometry.

import { formatNumber } from './format.js';

export const CHART_SIZE = 300;
export const CHART_PADDING = 20;
const PLOT = CHART_SIZE - CHART_PADDING * 2;
const SAMPLE_COUNT = 100;
const TARGET_GRID_LINES = 8;

function evaluate(wykres, x) {
  const { rownanie, a, b, c } = wykres;
  return rownanie === 'kwadratowa' ? a * x * x + b * x + (c ?? 0) : a * x + b;
}

function samplePoints(wykres) {
  const { xMin, xMax } = wykres;
  const points = [];
  for (let i = 0; i <= SAMPLE_COUNT; i++) {
    const x = xMin + ((xMax - xMin) * i) / SAMPLE_COUNT;
    points.push({ x, y: evaluate(wykres, x) });
  }
  return points;
}

function computeYRange(points) {
  let yMin = Math.min(...points.map((p) => p.y));
  let yMax = Math.max(...points.map((p) => p.y));
  if (yMin === yMax) {
    yMin -= 1;
    yMax += 1;
  }
  const padding = (yMax - yMin) * 0.1;
  yMin -= padding;
  yMax += padding;
  if (yMin > 0) yMin = 0;
  if (yMax < 0) yMax = 0;
  return { yMin, yMax };
}

// Picks a "nice" step (1, 2, or 5 times a power of ten) so a grid stays
// legible no matter how wide or narrow the computed range turns out to be.
function niceStep(span, targetCount) {
  const rough = span / targetCount;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const normalized = rough / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

function gridLines(min, max, step) {
  const lines = [];
  const start = Math.ceil(min / step) * step;
  for (let v = start; v <= max + 1e-9; v += step) {
    lines.push(Number(v.toFixed(6)));
  }
  return lines;
}

export function chartSvg(wykres) {
  const { rownanie, a, b, c, xMin, xMax } = wykres;
  if (!(xMin < xMax)) {
    throw new Error('wykres.xMin musi byc mniejsze od wykres.xMax.');
  }

  const points = samplePoints(wykres);
  const { yMin, yMax } = computeYRange(points);
  const xStep = niceStep(xMax - xMin, TARGET_GRID_LINES);
  const yStep = niceStep(yMax - yMin, TARGET_GRID_LINES);

  const px = (x) => CHART_PADDING + ((x - xMin) / (xMax - xMin)) * PLOT;
  const py = (y) => CHART_PADDING + (1 - (y - yMin) / (yMax - yMin)) * PLOT;

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${px(p.x).toFixed(2)} ${py(p.y).toFixed(2)}`)
    .join(' ');

  const xGridLines = gridLines(xMin, xMax, xStep)
    .map(
      (x) =>
        `<line class="siatka" x1="${px(x).toFixed(2)}" y1="${CHART_PADDING}" x2="${px(x).toFixed(2)}" y2="${CHART_SIZE - CHART_PADDING}" />`
    )
    .join('');
  const yGridLines = gridLines(yMin, yMax, yStep)
    .map(
      (y) =>
        `<line class="siatka" x1="${CHART_PADDING}" y1="${py(y).toFixed(2)}" x2="${CHART_SIZE - CHART_PADDING}" y2="${py(y).toFixed(2)}" />`
    )
    .join('');

  const xAxisY = py(0);
  const yAxisX = px(0);

  const xTicks = gridLines(xMin, xMax, xStep)
    .filter((x) => x !== 0)
    .map(
      (x) =>
        `<text class="etykieta" x="${px(x).toFixed(2)}" y="${(xAxisY + 14).toFixed(2)}" text-anchor="middle">${formatNumber(x)}</text>`
    )
    .join('');
  const yTicks = gridLines(yMin, yMax, yStep)
    .filter((y) => y !== 0)
    .map(
      (y) =>
        `<text class="etykieta" x="${(yAxisX - 6).toFixed(2)}" y="${(py(y) + 4).toFixed(2)}" text-anchor="end">${formatNumber(y)}</text>`
    )
    .join('');

  return (
    `<svg class="wykres" viewBox="0 0 ${CHART_SIZE} ${CHART_SIZE}" xmlns="http://www.w3.org/2000/svg" ` +
    `data-rownanie="${rownanie}" data-a="${a}" data-b="${b}" data-c="${c ?? 0}" ` +
    `data-x-min="${xMin}" data-x-max="${xMax}" data-y-min="${yMin}" data-y-max="${yMax}" ` +
    `data-x-step="${xStep}" data-y-step="${yStep}">` +
    `<g class="siatka-warstwa">${xGridLines}${yGridLines}</g>` +
    `<line class="os" x1="${CHART_PADDING}" y1="${xAxisY.toFixed(2)}" x2="${CHART_SIZE - CHART_PADDING}" y2="${xAxisY.toFixed(2)}" />` +
    `<line class="os" x1="${yAxisX.toFixed(2)}" y1="${CHART_PADDING}" x2="${yAxisX.toFixed(2)}" y2="${CHART_SIZE - CHART_PADDING}" />` +
    `<g class="etykiety-warstwa">${xTicks}${yTicks}</g>` +
    `<path class="krzywa" d="${pathD}" fill="none" />` +
    `<rect class="nakladka" x="${CHART_PADDING}" y="${CHART_PADDING}" width="${PLOT}" height="${PLOT}" fill="transparent" />` +
    `<circle class="znacznik" r="4" cx="0" cy="0" hidden></circle>` +
    `<text class="etykieta-znacznika" x="0" y="0" hidden></text>` +
    `</svg>`
  );
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/chart.test.js`
Expected: PASS, 6 tests

- [ ] **Step 5: Commit**

```bash
git add js/chart.js test/chart.test.js
git commit -m "feat: add pure SVG generator for function charts"
```

---

### Task 2: Validate the `wykres` field in the task contract

**Files:**
- Modify: `js/taskShape.js`
- Test: `test/taskShape.test.js`

**Interfaces:**
- Consumes: nothing new
- Produces: `assertValidTask` now also validates an optional `task.wykres` field, using the same shape documented in the design spec.

- [ ] **Step 1: Write the failing tests**

Add to `test/taskShape.test.js` (append, do not remove existing tests):

```js
const validWykres = {
  ...validOpen,
  wykres: { rownanie: 'liniowa', a: 2, b: -4, xMin: -5, xMax: 5 },
};

test('accepts a valid task with a wykres field', () => {
  assert.doesNotThrow(() => assertValidTask(validWykres));
});

test('rejects an unknown rownanie in wykres', () => {
  assert.throws(
    () => assertValidTask({ ...validWykres, wykres: { ...validWykres.wykres, rownanie: 'szescienna' } }),
    /rownanie/
  );
});

test('rejects a wykres with a non-finite coefficient', () => {
  assert.throws(
    () => assertValidTask({ ...validWykres, wykres: { ...validWykres.wykres, a: NaN } }),
    /wykres\.a/
  );
});

test('rejects a wykres where xMin is not less than xMax', () => {
  assert.throws(
    () => assertValidTask({ ...validWykres, wykres: { ...validWykres.wykres, xMin: 5, xMax: 5 } }),
    /xMin/
  );
});

test('rejects a kwadratowa wykres missing c', () => {
  const kwadratowa = { rownanie: 'kwadratowa', a: 1, b: 0, xMin: -5, xMax: 5 };
  assert.throws(
    () => assertValidTask({ ...validWykres, wykres: kwadratowa }),
    /wykres\.c/
  );
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/taskShape.test.js`
Expected: FAIL — new tests throw nothing, or throw the wrong kind of error, because `assertValidTask` doesn't know about `wykres` yet.

- [ ] **Step 3: Implement the validation**

In `js/taskShape.js`, add near the top (after `DECIMAL_PERIOD`):

```js
const ALLOWED_ROWNANIA = ['liniowa', 'kwadratowa'];

function checkWykres(wykres) {
  if (!wykres || typeof wykres !== 'object') {
    throw new Error('Pole wykres musi byc obiektem.');
  }
  if (!ALLOWED_ROWNANIA.includes(wykres.rownanie)) {
    throw new Error(`Nieznane rownanie w wykres.rownanie: ${wykres.rownanie}`);
  }
  for (const key of ['a', 'b', 'xMin', 'xMax']) {
    if (typeof wykres[key] !== 'number' || !Number.isFinite(wykres[key])) {
      throw new Error(`Pole wykres.${key} musi byc skonczona liczba.`);
    }
  }
  if (!(wykres.xMin < wykres.xMax)) {
    throw new Error('Pole wykres.xMin musi byc mniejsze od wykres.xMax.');
  }
  if (wykres.rownanie === 'kwadratowa') {
    if (typeof wykres.c !== 'number' || !Number.isFinite(wykres.c)) {
      throw new Error('Pole wykres.c musi byc skonczona liczba dla rownania kwadratowego.');
    }
  }
}
```

Then inside `assertValidTask`, right before the final `if (task.type === 'otwarte')` branch check (i.e., after the `checkText(task.rozwiazanie, 'rozwiazanie')` line and before the `if (task.type === 'otwarte') { ... }` block), add:

```js
  if ('wykres' in task) {
    checkWykres(task.wykres);
  }
```

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/taskShape.test.js`
Expected: PASS, all tests including the 5 new ones

- [ ] **Step 5: Commit**

```bash
git add js/taskShape.js test/taskShape.test.js
git commit -m "feat: validate the optional wykres field in the task contract"
```

---

### Task 3: Graph-reading templates in `funkcje.js`

**Files:**
- Modify: `js/topics/funkcje.js`
- Test: `test/topics/funkcje.test.js`

**Interfaces:**
- Consumes: `assertValidTask` (Task 2), `formatNumber` (`js/format.js`)
- Produces: two new templates, `funkcja_liniowa_wykres_miejsce_zerowe` and `funkcja_kwadratowa_wykres_wierzcholek`, each returning a task with a `wykres` field and no coefficients in `tresc`.

- [ ] **Step 1: Write the failing tests**

Add to `test/topics/funkcje.test.js`. First change the template-count assertion:

```js
test('exports six templates with unique ids', () => {
  assert.equal(templates.length, 6);
  assert.equal(new Set(templates.map((t) => t.id)).size, 6);
});
```

(Replace the existing `exports four templates with unique ids` test with this one.)

Then append two new tests:

```js
test('wykres miejsce zerowe: a*root + b equals zero, root is inside the drawn domain, and tresc reveals no numbers', () => {
  const template = templates.find((t) => t.id === 'funkcja_liniowa_wykres_miejsce_zerowe');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const root = parsePl(task.odpowiedz);
      const { rownanie, a, b, xMin, xMax } = task.wykres;
      assert.equal(rownanie, 'liniowa');
      assert.ok(Math.abs(a * root + b) < 1e-9, `a*root+b != 0 for root=${root}`);
      assert.ok(xMin < root && root < xMax, `root ${root} not inside domain [${xMin}, ${xMax}]`);
      assert.ok(!/\d/.test(task.tresc), `tresc leaks a number: ${task.tresc}`);
    }
  }
});

test('wykres wierzcholek: q equals f(p), p is genuinely the extremum, vertex is inside the drawn domain, and tresc reveals no numbers', () => {
  const template = templates.find((t) => t.id === 'funkcja_kwadratowa_wykres_wierzcholek');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const { a, b, c, xMin, xMax } = task.wykres;
      const f = (x) => a * x * x + b * x + c;
      const [pText, qText] = task.odpowiedz.replace(/[()]/g, '').split(',').map((s) => s.trim());
      const p = parsePl(pText);
      const q = parsePl(qText);
      assert.ok(Math.abs(f(p) - q) < 1e-9, `f(${p}) != ${q}`);
      const left = f(p - 1);
      const right = f(p + 1);
      const isMin = left >= q - 1e-9 && right >= q - 1e-9;
      const isMax = left <= q + 1e-9 && right <= q + 1e-9;
      assert.ok(isMin || isMax, `p=${p} is not an extremum`);
      assert.ok(xMin < p && p < xMax, `vertex x=${p} not inside domain [${xMin}, ${xMax}]`);
      assert.ok(!/\d/.test(task.tresc), `tresc leaks a number: ${task.tresc}`);
    }
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/topics/funkcje.test.js`
Expected: FAIL — template count is 4, not 6; the two new templates don't exist yet.

- [ ] **Step 3: Write the implementation**

In `js/topics/funkcje.js`, add after the existing `VERTEX_RANGES` constant:

```js
// Ranges tuned for visual legibility of the drawn graph, not for algebraic
// difficulty — deliberately separate from RANGES/VERTEX_RANGES above. See
// the design spec's "Known Follow-ups": these specific numbers are
// provisional pending a general difficulty recalibration pass.
const GRAPH_RANGES = {
  liniowa: {
    latwy: { coefMax: 3, rootRange: 5, halfStep: false },
    sredni: { coefMax: 4, rootRange: 7, halfStep: false },
    trudny: { coefMax: 4, rootRange: 7, halfStep: true },
  },
  kwadratowa: {
    latwy: { pRange: 4, cMax: 6, aMax: 1 },
    sredni: { pRange: 5, cMax: 8, aMax: 1 },
    trudny: { pRange: 5, cMax: 8, aMax: 2 },
  },
};

const GRAPH_DOMAIN_MARGIN = 5;

function wykresMiejsceZerowe(difficulty, rng) {
  const { coefMax, rootRange, halfStep } = GRAPH_RANGES.liniowa[difficulty];
  const a = rng.int(1, coefMax) * (rng.bool() ? 1 : -1);
  const rootWhole = rng.int(-rootRange, rootRange);
  const root = halfStep && rng.bool() ? rootWhole + 0.5 : rootWhole;
  const b = -a * root;
  const xMin = Math.floor(root - GRAPH_DOMAIN_MARGIN);
  const xMax = Math.ceil(root + GRAPH_DOMAIN_MARGIN);

  return {
    id: 'funkcja_liniowa_wykres_miejsce_zerowe',
    type: 'otwarte',
    tresc:
      'Na wykresie przedstawiono funkcję liniową. ' +
      'Odczytaj z wykresu miejsce zerowe tej funkcji.',
    wykres: { rownanie: 'liniowa', a, b, xMin, xMax },
    odpowiedz: `x = ${formatNumber(root)}`,
    rozwiazanie:
      'Miejsce zerowe to punkt przecięcia wykresu z osią OX.\n' +
      `Wykres przecina oś OX w punkcie x = ${formatNumber(root)}.`,
  };
}

function wykresWierzcholek(difficulty, rng) {
  const { pRange, cMax, aMax } = GRAPH_RANGES.kwadratowa[difficulty];
  const a = rng.int(1, aMax) * (rng.bool() ? 1 : -1);
  const p = rng.int(-pRange, pRange);
  const b = -2 * a * p;
  const c = rng.int(-cMax, cMax);
  const q = a * p * p + b * p + c;
  const xMin = p - GRAPH_DOMAIN_MARGIN;
  const xMax = p + GRAPH_DOMAIN_MARGIN;

  return {
    id: 'funkcja_kwadratowa_wykres_wierzcholek',
    type: 'otwarte',
    tresc:
      'Na wykresie przedstawiono funkcję kwadratową. ' +
      'Odczytaj z wykresu współrzędne wierzchołka paraboli.',
    wykres: { rownanie: 'kwadratowa', a, b, c, xMin, xMax },
    odpowiedz: `(${formatNumber(p)}, ${formatNumber(q)})`,
    rozwiazanie:
      'Wierzchołek paraboli to najniższy (dla a > 0) lub najwyższy ' +
      '(dla a < 0) punkt wykresu.\n' +
      `Odczytujemy współrzędne z wykresu: W = (${formatNumber(p)}, ${formatNumber(q)}).`,
  };
}
```

Then update the `templates` export at the bottom of the file to:

```js
export const templates = [
  { id: 'funkcja_liniowa_miejsce_zerowe', generate: miejsceZerowe },
  { id: 'funkcja_kwadratowa_delta', generate: delta },
  { id: 'funkcja_kwadratowa_pierwiastki', generate: pierwiastki },
  { id: 'funkcja_kwadratowa_wierzcholek', generate: wierzcholek },
  { id: 'funkcja_liniowa_wykres_miejsce_zerowe', generate: wykresMiejsceZerowe },
  { id: 'funkcja_kwadratowa_wykres_wierzcholek', generate: wykresWierzcholek },
];
```

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/funkcje.test.js`
Expected: PASS, 9 tests

- [ ] **Step 5: Run the full suite to confirm nothing else broke**

Run: `node --test`
Expected: PASS, every test (the generic "every template produces contract-valid tasks" loop now also exercises `assertValidTask`'s new `wykres` branch against these two templates)

- [ ] **Step 6: Commit**

```bash
git add js/topics/funkcje.js test/topics/funkcje.test.js
git commit -m "feat: add graph-reading templates to funkcje"
```

---

### Task 4: Embed the chart in rendered tasks

**Files:**
- Modify: `js/render.js`
- Test: `test/render.test.js`

**Interfaces:**
- Consumes: `chartSvg` (Task 1)
- Produces: `taskToHtml` embeds a `<div class="wykres-kontener">` containing the chart markup when `task.wykres` is present.

- [ ] **Step 1: Write the failing test**

Add to `test/render.test.js`:

```js
const taskWithChart = {
  id: 'test_chart',
  type: 'otwarte',
  tresc: 'Odczytaj z wykresu.',
  wykres: { rownanie: 'liniowa', a: 1, b: -2, xMin: -5, xMax: 5 },
  odpowiedz: 'x = 2',
  rozwiazanie: 'Wykres przecina os OX w punkcie x = 2.',
};

test('embeds the chart svg, unescaped, when a task has a wykres field', () => {
  const html = taskToHtml(taskWithChart, 0);
  assert.match(html, /<div class="wykres-kontener">/);
  assert.match(html, /<svg class="wykres"/);
  assert.ok(!html.includes('&lt;svg'), 'svg markup was escaped');
});

test('omits the chart container when a task has no wykres field', () => {
  const html = taskToHtml(openTask, 0);
  assert.ok(!html.includes('wykres-kontener'));
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/render.test.js`
Expected: FAIL — no `wykres-kontener` is ever emitted yet.

- [ ] **Step 3: Implement**

In `js/render.js`, add the import and a new helper, then call it from `taskToHtml`:

```js
import { chartSvg } from './chart.js';
```

```js
function wykresHtml(task) {
  if (!task.wykres) return '';
  return `<div class="wykres-kontener">${chartSvg(task.wykres)}</div>`;
}
```

Update `taskToHtml` to insert `wykresHtml(task)` right after the question text:

```js
export function taskToHtml(task, index) {
  return [
    '<li class="zadanie">',
    `<p class="zadanie-numer">Zadanie ${index + 1}.</p>`,
    `<p class="zadanie-tresc">${escapeHtml(task.tresc)}</p>`,
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
Expected: PASS, all tests including the 2 new ones

- [ ] **Step 5: Commit**

```bash
git add js/render.js test/render.test.js
git commit -m "feat: embed function charts into rendered tasks"
```

---

### Task 5: Chart styling

**Files:**
- Modify: `css/styles.css`

**Interfaces:**
- Consumes: nothing (pure CSS)
- Produces: visual styling for `.wykres-kontener`, `.wykres`, and its child element classes (`.siatka`, `.os`, `.krzywa`, `.etykieta`, `.znacznik`, `.etykieta-znacznika`, `.nakladka`)

- [ ] **Step 1: Add the styles**

Append to `css/styles.css` (before the closing `@media print` block, so the new print rule below lands inside the existing print section):

```css
.wykres-kontener {
  margin: 0.75rem 0;
  padding: 0.5rem;
  border: 1px solid var(--ramka);
  background: var(--tlo);
}

.wykres {
  display: block;
  width: 100%;
  max-width: 20rem;
  height: auto;
  touch-action: none;
}

.wykres .siatka {
  stroke: #dddddd;
  stroke-width: 1;
}

.wykres .os {
  stroke: #333333;
  stroke-width: 1.5;
}

.wykres .krzywa {
  stroke: var(--akcent);
  stroke-width: 2;
}

.wykres .etykieta {
  font-size: 9px;
  fill: #555555;
}

.wykres .znacznik {
  fill: var(--akcent);
}

.wykres .etykieta-znacznika {
  font-size: 10px;
  font-weight: 600;
  fill: #16294a;
}
```

Then, inside the existing `@media print { ... }` block at the bottom of the file, add:

```css
  .wykres .nakladka {
    display: none;
  }
```

- [ ] **Step 2: Verify visually**

There is no automated test for pure CSS. This gets verified together with Task 8's manual browser check.

- [ ] **Step 3: Commit**

```bash
git add css/styles.css
git commit -m "feat: style interactive function charts"
```

---

### Task 6: Pointer-driven interactivity (`js/chartInteraction.js`)

**Files:**
- Create: `js/chartInteraction.js`

**Interfaces:**
- Consumes: `formatNumber` (`js/format.js`), `CHART_SIZE`, `CHART_PADDING` (`js/chart.js`)
- Produces: `initCharts(container)` — finds every `svg.wykres` inside `container` and wires up pointer-driven hover/drag tracing.

**Note:** This module manipulates the DOM directly and has no automated test — this project has no DOM test environment (no dependencies allowed). It is verified manually in Task 8.

- [ ] **Step 1: Write the module**

Create `js/chartInteraction.js`:

```js
// DOM-only glue: reads the data-* attributes chart.js embeds on a chart's
// <svg> and drives the hover/drag marker via Pointer Events, so mouse hover
// and touch drag both work through the same code path. Not unit-tested —
// this project has no DOM test environment. Verified manually in the browser.

import { formatNumber } from './format.js';
import { CHART_SIZE, CHART_PADDING } from './chart.js';

const PLOT = CHART_SIZE - CHART_PADDING * 2;

function evaluate(svg, x) {
  const rownanie = svg.dataset.rownanie;
  const a = Number(svg.dataset.a);
  const b = Number(svg.dataset.b);
  const c = Number(svg.dataset.c);
  return rownanie === 'kwadratowa' ? a * x * x + b * x + c : a * x + b;
}

function clientXToFunctionX(svg, clientX) {
  const rect = svg.getBoundingClientRect();
  const viewBox = svg.viewBox.baseVal;
  const fractionAcross = (clientX - rect.left) / rect.width;
  const svgX = viewBox.x + fractionAcross * viewBox.width;
  const xMin = Number(svg.dataset.xMin);
  const xMax = Number(svg.dataset.xMax);
  const fraction = (svgX - CHART_PADDING) / PLOT;
  return xMin + fraction * (xMax - xMin);
}

function toSvgPoint(svg, x, y) {
  const xMin = Number(svg.dataset.xMin);
  const xMax = Number(svg.dataset.xMax);
  const yMin = Number(svg.dataset.yMin);
  const yMax = Number(svg.dataset.yMax);
  const px = CHART_PADDING + ((x - xMin) / (xMax - xMin)) * PLOT;
  const py = CHART_PADDING + (1 - (y - yMin) / (yMax - yMin)) * PLOT;
  return { px, py };
}

function updateMarker(svg, x) {
  const xMin = Number(svg.dataset.xMin);
  const xMax = Number(svg.dataset.xMax);
  const clampedX = Math.max(xMin, Math.min(xMax, x));
  const y = evaluate(svg, clampedX);
  const { px, py } = toSvgPoint(svg, clampedX, y);

  const marker = svg.querySelector('.znacznik');
  const label = svg.querySelector('.etykieta-znacznika');
  marker.setAttribute('cx', px.toFixed(2));
  marker.setAttribute('cy', py.toFixed(2));
  marker.hidden = false;
  label.setAttribute('x', Math.min(px + 8, CHART_SIZE - 60).toFixed(2));
  label.setAttribute('y', Math.max(py - 8, 12).toFixed(2));
  label.textContent = `(${formatNumber(Number(clampedX.toFixed(2)))}, ${formatNumber(Number(y.toFixed(2)))})`;
  label.hidden = false;
}

function hideMarker(svg) {
  svg.querySelector('.znacznik').hidden = true;
  svg.querySelector('.etykieta-znacznika').hidden = true;
}

export function initCharts(container) {
  for (const svg of container.querySelectorAll('svg.wykres')) {
    const overlay = svg.querySelector('.nakladka');
    let dragging = false;

    const handleMove = (event) => {
      updateMarker(svg, clientXToFunctionX(svg, event.clientX));
    };

    overlay.addEventListener('pointerdown', (event) => {
      if (event.pointerType !== 'mouse') {
        dragging = true;
        overlay.setPointerCapture(event.pointerId);
      }
      handleMove(event);
    });

    overlay.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'mouse' || dragging) handleMove(event);
    });

    overlay.addEventListener('pointerup', (event) => {
      if (event.pointerType !== 'mouse') {
        dragging = false;
        hideMarker(svg);
      }
    });

    overlay.addEventListener('pointerleave', () => {
      if (!dragging) hideMarker(svg);
    });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add js/chartInteraction.js
git commit -m "feat: add pointer-driven chart interactivity"
```

---

### Task 7: Wire chart interactivity into the app

**Files:**
- Modify: `js/app.js`

**Interfaces:**
- Consumes: `initCharts` (Task 6)
- Produces: every rendered sheet gets its charts wired up automatically.

- [ ] **Step 1: Add the import**

In `js/app.js`, add near the other imports:

```js
import { initCharts } from './chartInteraction.js';
```

- [ ] **Step 2: Call it after rendering a sheet**

In `renderSheet()`, immediately after the line `listaZadan.innerHTML = sheetToHtml(tasks);`, add:

```js
  initCharts(listaZadan);
```

So the relevant part of `renderSheet` reads:

```js
  clearError();
  ostatnieUstawienia = options;
  listaZadan.innerHTML = sheetToHtml(tasks);
  initCharts(listaZadan);
  naglowekArkusza.textContent = sheetHeading({ ...options, count: tasks.length });
  setAnswersVisible(false);
  ekranMenu.hidden = true;
  ekranArkusz.hidden = false;
  ekranArkusz.scrollIntoView({ block: 'start' });
```

- [ ] **Step 3: Commit**

```bash
git add js/app.js
git commit -m "feat: wire up chart interactivity when a sheet renders"
```

---

### Task 8: Full suite + manual browser verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full automated suite**

Run: `node --test`
Expected: PASS, every test (this project's full suite plus the new chart/taskShape/funkcje/render tests from Tasks 1–4)

- [ ] **Step 2: Manually verify in a browser**

Serve the site (`python -m http.server 8000` or `npx serve .`) and, using whatever browser automation is available (or by hand):

1. Generate a ćwiczenia sheet for grade `lo1` or `lo2`, topic "Funkcja liniowa i kwadratowa", any difficulty, count high enough that both new templates are likely to appear (12 is safest) — regenerate with "Generuj nowy arkusz" a few times if needed until both appear.
2. Confirm each chart renders: grid, axes, curve, no console errors.
3. Hover the mouse across a chart's curve — confirm the marker and `(x, y)` tooltip appear and track the cursor, using the Polish-comma format (e.g. `2,50` not `2.5` or `2.50`).
4. Move the mouse off the chart — confirm the marker/tooltip disappear.
5. Simulate a touch drag (pointer events with `pointerType: 'touch'`, or an actual touch-capable device/emulator) across a chart — confirm the same tracing behavior works, and that lifting the touch hides the marker.
6. Click "Pokaż odpowiedzi" — confirm the revealed answer for a graph-only task states a coordinate matching what the chart actually shows (e.g. hover the stated x and visually confirm the curve crosses zero / peaks there).
7. Click "Drukuj" (or check print preview) — confirm the chart still shows as a clean static image with no visible overlay artifacts.
8. Resize the browser narrow (mobile width) — confirm the chart still fits within its container without causing horizontal overflow of the page.

- [ ] **Step 3: Fix anything that fails**

If any check in Step 2 fails, fix the relevant file (`chart.js`, `chartInteraction.js`, `render.js`, or `styles.css`) and re-run both Step 1 and Step 2 before proceeding.

- [ ] **Step 4: Report results**

No commit for this task (it's verification-only) — summarize what was checked and confirmed working.
