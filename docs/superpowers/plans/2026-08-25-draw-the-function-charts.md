# Draw-the-Function Charts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hover-to-read-a-value chart interaction (found too imprecise in manual testing) with a draw-the-function model: the student sees the formula, sketches it freehand on a blank grid, then reveals the correct curve overlaid on their own sketch via the existing "Pokaż odpowiedzi" toggle.

**Architecture:** `js/chart.js` keeps its grid/axis/curve-sampling logic unchanged, but the curve now renders hidden-by-default and a new empty student-drawing path is added. `js/chartInteraction.js` is rewritten from hover-tracing to freehand-stroke capture (client→SVG pixel conversion only, no function evaluation). `js/app.js`'s existing answer-toggle reveals the curve in the same pass as everything else. `js/topics/funkcje.js`'s two graph templates now state the formula in `tresc` and reuse the existing algebra-only coefficient ranges.

**Tech Stack:** Plain ES modules, inline SVG, Pointer Events API, `node --test`. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-08-25-interactive-function-charts-design.md` (v2 — the draw-the-function revision)

## Global Constraints

- No npm packages, no bundler, no build step. ES modules only.
- `js/chart.js` stays a pure function module: no DOM access, deterministic output.
- `js/chartInteraction.js` remains DOM-only glue with no automated test — verify manually in a browser before considering this done.
- The two templates' `tresc` must state the function's formula directly (opposite of the superseded design) — no template hides the formula anymore.
- All rendered numbers go through `formatNumber` — never a raw JS decimal.
- Chart geometry constants (`CHART_SIZE`, `CHART_PADDING`) stay defined once in `js/chart.js` and imported everywhere else that needs them.
- Delete code that becomes genuinely unused (the marker/tooltip logic and its CSS) rather than leaving it as dead weight — YAGNI.

---

### Task 1: `js/chart.js` — hide the curve by default, add the student-drawing path, remove the marker/tooltip elements

**Files:**
- Modify: `js/chart.js`
- Modify: `test/chart.test.js`

**Interfaces:**
- Consumes: nothing new
- Produces: `chartSvg(wykres)` output now includes `<path class="krzywa" ... hidden>` (was visible by default) and a new empty `<path class="rysunek-ucznia" d="" fill="none">`; no longer includes `<circle class="znacznik">` or `<text class="etykieta-znacznika">`. `TOOLTIP_LABEL_WIDTH` export is removed (no longer used by anything).

- [ ] **Step 1: Update the test file**

In `test/chart.test.js`, add these two tests (append after the existing `'rejects a degenerate domain...'` test, before end of file):

```js
test('the curve is hidden by default (it is the answer, revealed later)', () => {
  const svg = chartSvg(LINIOWA);
  assert.match(svg, /<path[^>]*class="krzywa"[^>]*hidden/);
});

test('an empty student-drawing path is present and visible by default', () => {
  const svg = chartSvg(LINIOWA);
  assert.match(svg, /<path class="rysunek-ucznia" d="" fill="none">/);
  assert.ok(!/<path class="rysunek-ucznia"[^>]*hidden/.test(svg), 'student path should not be hidden');
});

test('no marker or tooltip elements are emitted', () => {
  const svg = chartSvg(LINIOWA);
  assert.ok(!svg.includes('znacznik'), 'marker element should be removed');
  assert.ok(!svg.includes('etykieta-znacznika'), 'tooltip element should be removed');
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/chart.test.js`
Expected: FAIL — the curve isn't hidden yet, there's no student-drawing path, and the marker/tooltip elements are still emitted.

- [ ] **Step 3: Update the implementation**

In `js/chart.js`:

1. Remove the line `export const TOOLTIP_LABEL_WIDTH = 60;` (no longer used anywhere once Task 2 lands).
2. Find the `return (...)` block at the end of `chartSvg()`. Replace:

```js
    `<path class="krzywa" d="${pathD}" fill="none" />` +
    `<rect class="nakladka" x="${CHART_PADDING}" y="${CHART_PADDING}" width="${PLOT}" height="${PLOT}" fill="transparent" />` +
    `<circle class="znacznik" r="4" cx="0" cy="0" hidden></circle>` +
    `<text class="etykieta-znacznika" x="0" y="0" hidden></text>` +
    `</svg>`
```

with:

```js
    `<path class="krzywa" d="${pathD}" fill="none" hidden></path>` +
    `<path class="rysunek-ucznia" d="" fill="none"></path>` +
    `<rect class="nakladka" x="${CHART_PADDING}" y="${CHART_PADDING}" width="${PLOT}" height="${PLOT}" fill="transparent" />` +
    `</svg>`
```

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/chart.test.js`
Expected: PASS, all tests (the original 6 plus the 3 new ones)

- [ ] **Step 5: Commit**

```bash
git add js/chart.js test/chart.test.js
git commit -m "feat: hide the chart curve by default, add student-drawing path"
```

---

### Task 2: `js/chartInteraction.js` — replace hover-tracing with freehand-drawing capture

**Files:**
- Modify: `js/chartInteraction.js` (full rewrite of the module body)

**Interfaces:**
- Consumes: `CHART_SIZE`, `CHART_PADDING` (`js/chart.js`)
- Produces: `initCharts(container)` — same export name and signature as before, entirely new behavior: wires up freehand drawing instead of hover-tracing.

**Note:** No automated test for this file (DOM-only, no DOM test environment in this project). Verified manually in Task 6.

- [ ] **Step 1: Replace the file's contents**

Replace the entire contents of `js/chartInteraction.js` with:

```js
// DOM-only glue: lets the student draw freehand on a chart's blank grid by
// dragging across its transparent overlay. Not unit-tested — this project
// has no DOM test environment. Verified manually in the browser.

import { CHART_SIZE, CHART_PADDING } from './chart.js';

// Converts a pointer event's client position to a point in the SVG's own
// coordinate space, clamped to the plot area so a drag that leaves the
// chart still draws up to the grid's edge instead of escaping it.
function clientToSvgPoint(svg, clientX, clientY) {
  const rect = svg.getBoundingClientRect();
  const viewBox = svg.viewBox.baseVal;
  const fractionX = (clientX - rect.left) / rect.width;
  const fractionY = (clientY - rect.top) / rect.height;
  const x = viewBox.x + fractionX * viewBox.width;
  const y = viewBox.y + fractionY * viewBox.height;
  return {
    x: Math.min(Math.max(x, CHART_PADDING), CHART_SIZE - CHART_PADDING),
    y: Math.min(Math.max(y, CHART_PADDING), CHART_SIZE - CHART_PADDING),
  };
}

export function initCharts(container) {
  for (const svg of container.querySelectorAll('svg.wykres')) {
    const overlay = svg.querySelector('.nakladka');
    const drawing = svg.querySelector('.rysunek-ucznia');
    if (!overlay || !drawing) continue;

    let isDrawing = false;
    let pathData = drawing.getAttribute('d') || '';

    function appendPoint(command, clientX, clientY) {
      const { x, y } = clientToSvgPoint(svg, clientX, clientY);
      pathData += `${pathData ? ' ' : ''}${command} ${x.toFixed(2)} ${y.toFixed(2)}`;
      drawing.setAttribute('d', pathData);
    }

    overlay.addEventListener('pointerdown', (event) => {
      isDrawing = true;
      overlay.setPointerCapture(event.pointerId);
      appendPoint('M', event.clientX, event.clientY);
    });

    overlay.addEventListener('pointermove', (event) => {
      if (isDrawing) appendPoint('L', event.clientX, event.clientY);
    });

    overlay.addEventListener('pointerup', () => {
      isDrawing = false;
    });

    overlay.addEventListener('pointercancel', () => {
      isDrawing = false;
    });
  }
}
```

- [ ] **Step 2: Sanity-check syntax**

Run: `node --check js/chartInteraction.js` (Node.js is at `C:\Program Files\nodejs\node.exe` — if `node` isn't on PATH, invoke it via that full path, or run `$env:Path = "C:\Program Files\nodejs;$env:Path"` first in PowerShell)
Expected: no output (valid syntax)

- [ ] **Step 3: Commit**

```bash
git add js/chartInteraction.js
git commit -m "feat: replace chart hover-tracing with freehand-drawing capture"
```

---

### Task 3: `js/app.js` — reveal the correct curve alongside the answer block

**Files:**
- Modify: `js/app.js`

**Interfaces:**
- Consumes: nothing new
- Produces: `setAnswersVisible(visible)` now also toggles every chart's `.krzywa` element in sync with the `.odpowiedz-blok` reveal.

- [ ] **Step 1: Update `setAnswersVisible`**

In `js/app.js`, find the `setAnswersVisible` function:

```js
function setAnswersVisible(visible) {
  odpowiedziWidoczne = visible;
  for (const block of listaZadan.querySelectorAll('.odpowiedz-blok')) {
    block.hidden = !visible;
  }
  przyciskOdpowiedzi.textContent = visible
    ? 'Ukryj odpowiedzi'
    : 'Pokaż odpowiedzi';
}
```

Add a loop revealing/hiding each chart's correct curve, right after the existing `.odpowiedz-blok` loop:

```js
function setAnswersVisible(visible) {
  odpowiedziWidoczne = visible;
  for (const block of listaZadan.querySelectorAll('.odpowiedz-blok')) {
    block.hidden = !visible;
  }
  for (const curve of listaZadan.querySelectorAll('.wykres .krzywa')) {
    if (visible) curve.removeAttribute('hidden');
    else curve.setAttribute('hidden', '');
  }
  przyciskOdpowiedzi.textContent = visible
    ? 'Ukryj odpowiedzi'
    : 'Pokaż odpowiedzi';
}
```

- [ ] **Step 2: Sanity-check syntax**

Run: `node --check js/app.js`
Expected: no output (valid syntax)

- [ ] **Step 3: Commit**

```bash
git add js/app.js
git commit -m "feat: reveal chart curves in sync with the answer toggle"
```

---

### Task 4: `css/styles.css` — remove dead marker/tooltip styles, add curve-hidden and student-drawing styles, fix touch-action for 2D drawing

**Files:**
- Modify: `css/styles.css`

**Interfaces:**
- Consumes: nothing
- Produces: updated chart styling matching the new element set.

- [ ] **Step 1: Update the styles**

In `css/styles.css`, make these changes:

1. Change `.wykres`'s `touch-action` from `pan-y` back to `none` — freehand drawing needs to capture movement in every direction (a vertical stroke must not be hijacked by the browser as a page-scroll gesture), unlike the old horizontal-only value-tracing interaction this project shipped before:

```css
.wykres {
  display: block;
  width: 100%;
  max-width: 20rem;
  height: auto;
  touch-action: none;
}
```

2. Remove these two rules entirely (the marker/tooltip elements they style no longer exist):

```css
.wykres .znacznik {
  fill: var(--akcent);
}

.wykres .etykieta-znacznika {
  font-size: 10px;
  font-weight: 600;
  fill: #16294a;
}
```

3. Replace the marker/tooltip hidden-state rule:

```css
/* The browser's built-in [hidden] { display: none } rule does not apply
   within the SVG namespace, so the marker and its tooltip need their own
   explicit hidden-state rule. */
.wykres .znacznik[hidden],
.wykres .etykieta-znacznika[hidden] {
  display: none;
}
```

with one for the curve (same underlying reason, now needed for the curve instead), plus a new rule styling the student's own freehand drawing in a color that contrasts with the curve's blue:

```css
/* The browser's built-in [hidden] { display: none } rule does not apply
   within the SVG namespace, so the curve needs its own explicit
   hidden-state rule to actually disappear before it's revealed. */
.wykres .krzywa[hidden] {
  display: none;
}

.wykres .rysunek-ucznia {
  stroke: #c0392b;
  stroke-width: 2;
}
```

- [ ] **Step 2: Verify visually**

No automated test for pure CSS — verified together with Task 6's manual browser check.

- [ ] **Step 3: Commit**

```bash
git add css/styles.css
git commit -m "feat: style student drawing, hide-by-default curve; fix touch-action for freehand drawing"
```

---

### Task 5: `js/topics/funkcje.js` — replace the two graph-reading templates with draw-the-function templates

**Files:**
- Modify: `js/topics/funkcje.js`
- Modify: `test/topics/funkcje.test.js`

**Interfaces:**
- Consumes: `RANGES`, `VERTEX_RANGES`, `signed()` (already in this file), `formatNumber` (`js/format.js`)
- Produces: two new templates, `funkcja_liniowa_narysuj_wykres` and `funkcja_kwadratowa_narysuj_wykres`, replacing `funkcja_liniowa_wykres_miejsce_zerowe` and `funkcja_kwadratowa_wykres_wierzcholek`. Both state the formula in `tresc` and attach a `wykres` field.

- [ ] **Step 1: Update the test file**

In `test/topics/funkcje.test.js`, replace the two tests named `'wykres miejsce zerowe: ...'` and `'wykres wierzcholek: ...'` (the last two tests in the file) with:

```js
test('narysuj wykres liniowy: wykres describes the same function as tresc, and the zero lies inside the drawn domain', () => {
  const template = templates.find((t) => t.id === 'funkcja_liniowa_narysuj_wykres');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const body = task.tresc.match(/f\(x\) = ([^.]+)\./)[1];
      const js = body.replace(/,/g, '.').replace(/(\d)x/g, '$1*x');
      const fFromTresc = (x) => Function('x', `return ${js};`)(x);
      const { rownanie, a, b, xMin, xMax } = task.wykres;
      const fFromWykres = (x) => a * x + b;
      assert.equal(rownanie, 'liniowa');
      for (const x of [-3, 0, 2, 7.5]) {
        assert.ok(
          Math.abs(fFromTresc(x) - fFromWykres(x)) < 1e-6,
          `tresc and wykres disagree at x=${x}: ${fFromTresc(x)} vs ${fFromWykres(x)}`
        );
      }
      const root = -b / a;
      assert.ok(Math.abs(fFromWykres(root)) < 1e-9, `f(${root}) != 0`);
      assert.ok(xMin < root && root < xMax, `root ${root} not inside domain [${xMin}, ${xMax}]`);
      assert.match(task.tresc, /^Narysuj wykres funkcji f\(x\)/);
    }
  }
});

test('narysuj wykres kwadratowy: wykres describes the same function as tresc, and the vertex lies inside the drawn domain', () => {
  const template = templates.find((t) => t.id === 'funkcja_kwadratowa_narysuj_wykres');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const body = task.tresc.match(/f\(x\) = ([^.]+)\./)[1];
      const js = body
        .replace(/,/g, '.')
        .replace(/x²/g, '(x*x)')
        .replace(/(\d)\(x\*x\)/g, '$1*(x*x)')
        .replace(/(\d)x/g, '$1*x');
      const fFromTresc = (x) => Function('x', `return ${js};`)(x);
      const { rownanie, a, b, c, xMin, xMax } = task.wykres;
      const fFromWykres = (x) => a * x * x + b * x + c;
      assert.equal(rownanie, 'kwadratowa');
      for (const x of [-3, 0, 2, 7.5]) {
        assert.ok(
          Math.abs(fFromTresc(x) - fFromWykres(x)) < 1e-6,
          `tresc and wykres disagree at x=${x}: ${fFromTresc(x)} vs ${fFromWykres(x)}`
        );
      }
      const p = -b / (2 * a);
      const q = fFromWykres(p);
      const left = fFromWykres(p - 1);
      const right = fFromWykres(p + 1);
      const isMin = left >= q - 1e-6 && right >= q - 1e-6;
      const isMax = left <= q + 1e-6 && right <= q + 1e-6;
      assert.ok(isMin || isMax, `p=${p} is not an extremum for ${body}`);
      assert.ok(xMin < p && p < xMax, `vertex x=${p} not inside domain [${xMin}, ${xMax}]`);
      assert.match(task.tresc, /^Narysuj wykres funkcji f\(x\)/);
    }
  }
});
```

Leave every other test in the file untouched (the `'exports six templates with unique ids'` count stays 6 — two templates are removed, two are added).

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/topics/funkcje.test.js`
Expected: FAIL — `funkcja_liniowa_narysuj_wykres` and `funkcja_kwadratowa_narysuj_wykres` don't exist yet, so `template` is `undefined` and the tests throw.

- [ ] **Step 3: Update the implementation**

In `js/topics/funkcje.js`:

1. Update the file's top doc-comment to remove the now-inaccurate description of `wykres_miejsce_zerowe`/`wykres_wierzcholek`, replacing the relevant paragraph with:

```js
// narysuj_wykres templates show the formula directly (unlike the other
// templates in this file, which is the point — the student sketches the
// graph themselves, then reveals the correct curve to compare) and reuse
// the same RANGES/VERTEX_RANGES as the algebra-only templates below,
// since there's no "keep the curve legible while hiding the formula"
// tension once the formula is shown.
```

2. Remove the `GRAPH_RANGES` and `GRAPH_DOMAIN_MARGIN` constants entirely (no longer used).

3. Remove the `wykresMiejsceZerowe` and `wykresWierzcholek` functions entirely, replacing them with:

```js
function narysujWykresLiniowy(difficulty, rng) {
  const { coefMax } = RANGES[difficulty];
  const a = rng.int(1, coefMax) * (rng.bool() ? 1 : -1);
  const root = rng.int(-9, 9);
  const b = -a * root;

  return {
    id: 'funkcja_liniowa_narysuj_wykres',
    type: 'otwarte',
    tresc: `Narysuj wykres funkcji f(x) = ${a}x ${signed(b, '')}.`,
    wykres: { rownanie: 'liniowa', a, b, xMin: -10, xMax: 10 },
    odpowiedz: `Miejsce zerowe: x = ${formatNumber(root)}`,
    rozwiazanie:
      `Wykresem funkcji liniowej jest linia prosta - wystarczą dwa punkty.\n` +
      `Dla x = 0: f(0) = ${formatNumber(b)}.\n` +
      `Miejsce zerowe: f(x) = 0 dla x = ${formatNumber(root)}.\n` +
      `Poprawny wykres pokazany jest na rysunku po odsłonięciu odpowiedzi.`,
  };
}

function narysujWykresKwadratowy(difficulty, rng) {
  const { pRange, cMax, leadingOne, aMax } = VERTEX_RANGES[difficulty];
  const a = (leadingOne ? 1 : rng.int(1, aMax)) * (rng.bool() ? 1 : -1);
  const p = rng.int(-pRange, pRange);
  const b = -2 * a * p;
  const c = rng.int(-cMax, cMax);
  const q = a * p * p + b * p + c;
  const margin = 6;

  return {
    id: 'funkcja_kwadratowa_narysuj_wykres',
    type: 'otwarte',
    tresc:
      `Narysuj wykres funkcji f(x) = ${a === 1 ? '' : a === -1 ? '-' : a}x² ` +
      `${signed(b, 'x')} ${signed(c, '')}.`,
    wykres: { rownanie: 'kwadratowa', a, b, c, xMin: p - margin, xMax: p + margin },
    odpowiedz: `Wierzchołek: W = (${formatNumber(p)}, ${formatNumber(q)})`,
    rozwiazanie:
      `Wykresem funkcji kwadratowej jest parabola.\n` +
      `Współrzędne wierzchołka: p = -b/(2a) = ${formatNumber(p)}, q = f(p) = ${formatNumber(q)}.\n` +
      `Poprawny wykres pokazany jest na rysunku po odsłonięciu odpowiedzi.`,
  };
}
```

4. Update the `templates` export array, replacing the two `wykres*` entries:

```js
export const templates = [
  { id: 'funkcja_liniowa_miejsce_zerowe', generate: miejsceZerowe },
  { id: 'funkcja_kwadratowa_delta', generate: delta },
  { id: 'funkcja_kwadratowa_pierwiastki', generate: pierwiastki },
  { id: 'funkcja_kwadratowa_wierzcholek', generate: wierzcholek },
  { id: 'funkcja_liniowa_narysuj_wykres', generate: narysujWykresLiniowy },
  { id: 'funkcja_kwadratowa_narysuj_wykres', generate: narysujWykresKwadratowy },
];
```

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/funkcje.test.js`
Expected: PASS, all tests

- [ ] **Step 5: Run the full suite to confirm nothing else broke**

Run: `node --test`
Expected: PASS, every test in the project

- [ ] **Step 6: Commit**

```bash
git add js/topics/funkcje.js test/topics/funkcje.test.js
git commit -m "feat: replace graph-reading templates with draw-the-function templates"
```

---

### Task 6: Full suite + manual browser verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full automated suite**

Run: `node --test`
Expected: PASS, every test

- [ ] **Step 2: Manually verify in a browser**

Serve the site and, using browser automation (or by hand):

1. Generate a ćwiczenia sheet for grade `lo1` or `lo2`, topic "Funkcja liniowa i kwadratowa", count 12 (regenerate if needed until both new templates appear).
2. Confirm each draw-the-function task shows: the formula in the question text, a blank grid (no curve visible), no console errors.
3. Draw with a simulated mouse drag across the grid — confirm a red/orange freehand line appears following the drag path.
4. Release and drag again elsewhere on the same grid — confirm the second stroke is added without erasing the first.
5. Simulate a touch drag (pointer events with `pointerType: 'touch'`) — confirm the same drawing behavior works, in every direction (not just horizontal).
6. Click "Pokaż odpowiedzi" — confirm the correct curve (blue) appears overlaid on top of the student's drawing (red/orange), and the textual answer (zero or vertex) is also shown.
7. Click "Ukryj odpowiedzi" (or re-toggle) — confirm the curve hides again while the student's own drawing remains visible.
8. Check print preview — confirm an unrevealed sheet shows a blank grid with the question text (a real practice sheet), and a revealed sheet shows the grid with the correct curve visible.
9. Confirm dragging outside the chart's boundary still draws up to the grid's edge rather than escaping it or breaking.

- [ ] **Step 3: Fix anything that fails**

If any check in Step 2 fails, fix the relevant file and re-run both Step 1 and Step 2 before proceeding.

- [ ] **Step 4: Report results**

No commit for this task (verification-only) — summarize what was checked and confirmed working.
