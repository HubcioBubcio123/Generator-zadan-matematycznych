# Interactive Function Charts — Design Document

**Date:** 2026-08-25
**Status:** Approved

## Purpose

Add interactive, hover/tap-to-trace graphs of linear and quadratic functions
to the generator, and two new "read from the graph" task templates in the
`funkcje` topic where the graph itself *is* the question (no formula is
given in the text — the student must read the answer off the chart).

## Success Criteria

- A new optional `wykres` field on the task contract lets any template attach
  a graph; existing templates and tests are unaffected.
- The graph is a self-contained inline SVG: axes, a "nice-numbers" grid, and
  the function curve, auto-scaled to fit its domain.
- Hovering (mouse) or dragging a finger (touch, via Pointer Events) across
  the graph moves a marker along the curve and shows its `(x, y)` coordinates
  in Polish decimal-comma format.
- Two new templates — `funkcja_liniowa_wykres_miejsce_zerowe` and
  `funkcja_kwadratowa_wykres_wierzcholek` — show only the graph and ask the
  student to read off the zero / vertex. Answers are still self-checked via
  the existing "Pokaż odpowiedzi" flow; no new grading capability is added.
- `chart.js` (pure SVG generation) is fully unit-tested with `node --test`,
  independently recomputing sampled points the same way every other template
  test recomputes its answer.
- The graph prints cleanly as a static image (interactivity is a no-op on
  paper, which is expected and requires no special handling).

## Non-Goals (v1)

- Auto-grading a click/drag on the graph as the answer. Self-check only, same
  as the rest of the app.
- Charts for any topic other than `funkcje` (liniowa/kwadratowa). Trygonometria,
  ciągi, etc. are not in scope here.
- Zoom or pan. The domain is fixed per task, chosen by the template so the
  interesting feature (root/vertex) is comfortably visible.
- Final difficulty tuning. The two new templates get provisional,
  legibility-tuned ranges (see below) that are **explicitly flagged for
  revision** once real podstawa programowa / matura reference material is
  available — same open item as the app's general difficulty calibration.

## Data Contract

A new optional field on the task object, present only when a task has a graph:

```js
wykres: {
  rownanie: 'liniowa' | 'kwadratowa',
  a: number,
  b: number,
  c: number,     // required and meaningful only when rownanie === 'kwadratowa'
  xMin: number,
  xMax: number,  // xMin < xMax; horizontal domain to draw
}
```

The template only picks `xMin`/`xMax` (a window with margin around the
feature being asked about). The vertical range is never specified by the
template — `chart.js` computes it by sampling `f(x)` across the domain.

`js/taskShape.js` gains a light validation block, run only when `wykres` is
present: `rownanie` must be one of the two allowed strings; `a`, `b`, `xMin`,
`xMax` must be finite numbers with `xMin < xMax`; `c` must be finite when
`rownanie === 'kwadratowa'`. This does not check mathematical correctness —
that remains the responsibility of the owning template's own test, exactly
like every other field on the contract.

## Chart Rendering (`js/chart.js`)

A new, pure, dependency-free module. Single export:

```js
chartSvg(wykres) => string   // self-contained <svg>...</svg> markup
```

Responsibilities:

1. **Sample** `f(x)` at a fixed number of points (e.g. 100) evenly spaced
   across `[xMin, xMax]`.
2. **Compute the y-range** from the sampled values, padded by ~10%, and
   widened if necessary so `y = 0` is always included (keeps the x-axis
   visible even for a task whose feature sits away from it).
3. **Pick "nice" grid steps** for both axes independently: choose a step from
   `{1, 2, 5} × 10^k` that yields a gridline count closest to a target (~8–10)
   for that axis's span. This keeps the grid legible regardless of how wide
   or narrow the computed range turns out to be, instead of assuming every
   task produces a small integer range.
4. **Render**, inside a fixed `viewBox`:
   - light grid lines at each computed step, both axes,
   - bold axes through `x = 0` / `y = 0` with a few numeric tick labels,
   - the curve as a single sampled `<path>` (a polyline through the sampled
     points — this handles lines and parabolas identically, no special-casing
     needed per equation type),
   - a transparent `<rect>` overlay covering the plot area (the interactivity
     layer's hit target),
   - a hidden marker `<circle>` and tooltip `<text>`, toggled by
     `chartInteraction.js`.
5. **Embed the inputs as `data-*` attributes** on the root `<svg>`
   (`data-rownanie`, `data-a`, `data-b`, `data-c`, `data-x-min`, `data-x-max`,
   plus the computed `data-y-min`/`data-y-max` needed to convert pixel
   coordinates back to function-space) so the interactivity layer never has
   to re-derive scaling logic or trust anything beyond reading these back.

`render.js`'s `taskToHtml` calls `chartSvg(task.wykres)` and embeds the
result **unescaped** when `task.wykres` is present — safe because this
markup is entirely generated by our own trusted code from numeric inputs,
never from user-controlled text (unlike `tresc`, which stays escaped).

## Interactivity (`js/chartInteraction.js`)

A new, DOM-only module (like `app.js`, not unit-testable without a DOM
environment — this project has none, by design, per the no-dependencies
rule). Single export:

```js
initCharts(container)   // wires up every chart SVG found inside `container`
```

For each chart SVG found:

- Reads back the `data-*` attributes (coefficients + domain/range).
- Attaches `pointerdown`, `pointermove`, and `pointerup`/`pointerleave`
  listeners to the transparent overlay `<rect>`. **Pointer Events are used
  instead of separate mouse/touch handlers** so hovering with a mouse and
  dragging a finger on a touch screen both work through the same code path —
  no separate mobile handling needed.
- On move (while pointer is down, or on hover for mouse): converts the
  pointer's client position to function-space `x` using the SVG's
  `viewBox`/`getBoundingClientRect()` and the stored domain, computes
  `y = f(x)` from the stored coefficients, moves the marker circle to
  `(x, y)` in SVG pixel space, and updates the tooltip text via the existing
  `formatNumber` helper (Polish comma, consistent with every other rendered
  number in the app).
- On pointer up/leave: hides the marker and tooltip.

`app.js` calls `initCharts(listaZadan)` once, immediately after
`listaZadan.innerHTML = sheetToHtml(tasks)` inside `renderSheet()`. Since
every code path that shows a sheet (initial generation, "Generuj nowy
arkusz") goes through `renderSheet()`, this single call site is sufficient.

## New Templates (`js/topics/funkcje.js`)

Both templates show **only** the graph — no formula appears in `tresc` — and
use their **own dedicated ranges**, separate from the existing algebra-only
`RANGES`/`VERTEX_RANGES`, tuned for visual legibility rather than algebraic
difficulty:

```js
GRAPH_RANGES = {
  liniowa: {
    latwy:  { coefMax: 3, rootRange: 5, halfStep: false },
    sredni: { coefMax: 4, rootRange: 7, halfStep: false },
    trudny: { coefMax: 4, rootRange: 7, halfStep: true },
  },
  kwadratowa: {
    latwy:  { pRange: 4, cMax: 6, aMax: 1 },
    sredni: { pRange: 5, cMax: 8, aMax: 1 },
    trudny: { pRange: 5, cMax: 8, aMax: 2 },
  },
};
```

**Why separate ranges:** the existing `VERTEX_RANGES` (used by the
non-graph `wierzcholek` template) allow combinations like `a = 4, p = 10`,
which would make a parabola drawn across a ~10-unit domain nearly vertical
and unreadable. Graph-reading tasks need coefficients chosen for *visual*
clarity, not just algebraic variety. These specific numbers are provisional
and are part of the difficulty items flagged for the later recalibration
pass.

- **`funkcja_liniowa_wykres_miejsce_zerowe`** (`otwarte`): picks a root
  (integer at `latwy`/`sredni`; may be a half-integer at `trudny`, landing
  between grid lines — a genuine "harder to read precisely" difficulty axis,
  not just bigger numbers), derives `a`, `b` to hit it exactly, sets
  `xMin`/`xMax` with margin around the root. `tresc` is a fixed prompt
  ("Na wykresie przedstawiono funkcję liniową. Odczytaj z wykresu miejsce
  zerowe tej funkcji.") with no interpolated numbers.
- **`funkcja_kwadratowa_wykres_wierzcholek`** (`otwarte`): picks a vertex
  `(p, q)` (always integer coordinates in v1), derives `a`, `b`, `c` to hit
  it exactly (same derivation already proven in the existing `wierzcholek`
  template), sets `xMin`/`xMax` with margin around `p`. `tresc` is a fixed
  prompt with no interpolated numbers.

## CSS (`css/styles.css`)

Small additions only:

- A `.wykres-kontener` wrapper (border consistent with `.zadanie`, spacing
  above/below) holding the chart SVG within `taskToHtml`'s output, inserted
  between the question text and the options/answer block.
- No print-specific rules are needed: the interactive marker/tooltip are
  hidden by default (only shown on pointer interaction) and pointer events
  don't fire during printing, so the printed sheet naturally shows a clean
  static graph with no extra work.

## Testing Plan

- **`test/chart.test.js`** (new): unit tests for `chartSvg()` —
  - returns a string containing `<svg`, `<path`, and the expected `data-*`
    attributes matching the input exactly;
  - for a handful of chosen `wykres` inputs, parses the sampled points back
    out of the rendered `<path>`'s `d` attribute and independently verifies
    `y ≈ f(x)` at those points using the module's own stated `a`/`b`/`c` —
    the same "recompute independently, don't trust internal state" rule
    every other test in this project already follows;
  - verifies the "nice grid step" picked for a few different y-range spans
    is one of `{1, 2, 5} × 10^k`.
- **`test/topics/funkcje.test.js`** (extended): for the two new templates —
  - assert `task.wykres` is present with the correct shape, and that
    substituting `wykres.a/b/(c)` reproduces the stated answer (root sits on
    the line; vertex is the true extremum of the parabola — reusing the same
    extremum check already written for the existing `wierzcholek` test, just
    driven from `wykres` fields instead of parsed `tresc` text);
  - assert `tresc` for these two templates is always the fixed prompt string
    with no embedded numbers (the graph-only design constraint).
- **`chartInteraction.js`**: no automated test (no DOM environment in this
  project, same as `app.js`). Verified manually via the browser automation
  tool — hover trace with the mouse, then a touch/pointer-drag simulation —
  before this feature is considered done.

## Known Follow-ups (explicitly out of scope here)

- General difficulty recalibration against real podstawa programowa /
  matura reference material (applies to this feature's `GRAPH_RANGES` too).
- Touch support is included from the start via Pointer Events, but no
  dedicated mobile-layout testing (chart sizing on small screens) is planned
  for this pass beyond the existing responsive CSS.
- **Keyboard accessibility gap.** The interactive trace is pointer-only
  (mouse hover / touch drag); there is no keyboard-driven way to move the
  marker along the curve. This is a real regression against the app's
  existing standard — every other control was verified fully keyboard-
  operable when Task 16 shipped. It's called out here rather than silently
  shipped: the two graph-reading templates remain solvable without the
  interaction (a student can still look at the printed/static curve and
  answer), so nothing becomes *impossible*, but the exploratory aid itself
  is mouse/touch-only in this pass. A follow-up could add arrow-key
  stepping of the marker when the chart SVG (or its overlay) has focus.
