# Interactive Function Charts — Design Document

**Date:** 2026-08-25
**Status:** Approved (v2 — supersedes the original hover-to-read design below)

**Revision note:** The original version of this document (implemented, then
found in manual testing to be very hard to use — precisely hovering over an
exact point on a curve is genuinely difficult) specified two "read the
answer off the graph" templates using hover/drag-to-trace. That interaction
model is replaced entirely by this revision with a "draw the function
yourself" model: the student is given the formula, sketches it freehand on
a blank grid, then reveals the correct curve overlaid on their own sketch to
compare. The hover-to-trace code this originally shipped is removed as part
of this revision.

## Purpose

Add a **freehand drawing** capability to the generator's function graphs,
and two new task templates in the `funkcje` topic — `funkcja_liniowa_narysuj_wykres`
and `funkcja_kwadratowa_narysuj_wykres` — where the student is given a
function's formula and asked to sketch its graph on a blank grid. Clicking
"Pokaż odpowiedzi" overlays the correct curve on top of the student's own
sketch, in a contrasting color, so they can compare directly.

## Success Criteria

- The `wykres` field on the task contract (already established) still
  describes the function; `chart.js` still renders the same axes/grid, but
  the curve itself now starts **hidden** and reveals in sync with the
  existing "Pokaż odpowiedzi" answer-toggle — no new reveal mechanism.
- Dragging (mouse or touch, via Pointer Events) across the grid draws a
  freehand line following the pointer — multiple separate strokes are
  supported without erasing earlier ones.
- The two new templates state the function's formula directly in `tresc`
  (the opposite of the superseded design) and attach a `wykres` descriptor
  used purely to draw the blank grid and the (initially hidden) correct
  curve.
- A printed sheet needs no special-casing: unrevealed, it's the question
  text + a blank grid (a real paper worksheet); revealed, it's the same
  grid with the correct curve visible (an answer key) — exactly how every
  other template's answer already behaves via the existing print stylesheet.
- `chart.js` remains fully unit-tested and pure; the removed hover-tracing
  code and its dead CSS are deleted rather than left unused.

## Non-Goals (v2)

- Auto-grading how closely the student's freehand sketch matches the
  correct curve. Self-check only, same as the rest of the app: the student
  visually compares their own drawing to the revealed overlay.
- An undo/clear-drawing button. Not requested; can be added later if it
  turns out to matter in practice.
- Charts for any topic other than `funkcje`. Trygonometria, ciągi, etc. are
  still not in scope.
- Final difficulty tuning — same open item as before, now simplified since
  these two templates reuse the existing `RANGES`/`VERTEX_RANGES` (see
  below) rather than needing their own legibility-tuned ranges.

## Data Contract — unchanged

The `wykres` field's shape (`{ rownanie, a, b, c, xMin, xMax }`) and its
`taskShape.js` validation are unchanged from the original design. Only how
templates use it, and how `chart.js` renders it, change.

## Chart Rendering (`js/chart.js`) — changes

`chartSvg(wykres)` keeps the same grid/axis/tick-label/curve-sampling logic
entirely as-is (already correct and tested: nice-numbers grid, y-range
padding, off-canvas label clamping). Only the elements after the curve
change:

- The curve `<path class="krzywa">` now renders with a `hidden` attribute
  by default (it's the answer, not shown until revealed).
- **Removed:** the marker `<circle class="znacznik">` and tooltip
  `<text class="etykieta-znacznika">` — no longer needed once hovering is
  replaced by drawing.
- **Added:** an empty `<path class="rysunek-ucznia" d="" fill="none">` —
  the student's freehand drawing target, populated live by
  `chartInteraction.js`. Starts empty (nothing drawn) and is always visible
  (not gated by the answer-reveal toggle — it's the student's own work, not
  the answer).
- The transparent `<rect class="nakladka">` overlay is unchanged — still
  the interaction hit-target, now for drawing instead of hovering.

The `data-*` attributes stay as they are (harmless, still useful for tests
and any future consumer) even though `chartInteraction.js` no longer reads
the function coefficients from them — freehand drawing only needs pixel
geometry, not the function itself.

## Drawing (`js/chartInteraction.js`) — replaces hover-tracing entirely

Single export, same name as before, entirely new body:

```js
initCharts(container)   // wires up every chart SVG found inside `container`
```

For each chart SVG found, on its `.nakladka` overlay:

- `pointerdown`: capture the pointer (`setPointerCapture`, now for **every**
  pointer type — mouse included — since dragging, not hovering, is the only
  interaction now), start a new subpath (`M x y`) on `.rysunek-ucznia` at
  the converted point, and mark "currently drawing."
- `pointermove` (while drawing): convert the pointer's client position to
  an SVG-space point (via `getBoundingClientRect()`/`viewBox`, same
  technique as before) and append it (`L x y`) to the path's `d` attribute.
  The point is clamped to `[CHART_PADDING, CHART_SIZE - CHART_PADDING]` on
  both axes so a drag that leaves the chart still draws up to the plot's
  edge rather than escaping the visible grid.
- `pointerup`/`pointercancel`: stop drawing (the next `pointerdown` starts a
  **new** subpath, so multiple separate strokes accumulate on the same path
  without erasing earlier ones — a real freehand sketch, not a single
  continuous line).

This is simpler than the code it replaces: no domain/range math, no
function evaluation, no tooltip formatting — just client-to-SVG pixel
conversion and path-string building.

## Answer Reveal Integration (`js/app.js`) — small addition

`setAnswersVisible(visible)` already toggles every `.odpowiedz-blok` in the
rendered sheet. It gains one more loop, revealing/hiding each chart's
correct curve in the same pass:

```js
for (const curve of listaZadan.querySelectorAll('.wykres .krzywa')) {
  if (visible) curve.removeAttribute('hidden');
  else curve.setAttribute('hidden', '');
}
```

No new reveal mechanism, no new button — the existing "Pokaż odpowiedzi"
toggle now also reveals the correct curve wherever one exists.

## New Templates (`js/topics/funkcje.js`)

Both **replace** the removed `wykres_miejsce_zerowe`/`wykres_wierzcholek`
templates and reuse the **existing** `RANGES`/`VERTEX_RANGES` (the same
ones the plain-text `miejsceZerowe`/`wierzcholek` templates already use) —
the dedicated `GRAPH_RANGES` from the superseded design are removed, since
there's no longer a "keep the curve legible while hiding the formula"
tension: the formula is shown, so the same coefficient ranges used for the
algebra-only templates are fine here too.

- **`funkcja_liniowa_narysuj_wykres`** (`otwarte`): same `a`/`root`/`b`
  generation as `miejsceZerowe`. `tresc` states the formula directly
  (`"Narysuj wykres funkcji f(x) = ..."`). Domain is a fixed, generous
  window (`xMin = -10, xMax = 10`) — the student needs room to sketch the
  general shape, not a window targeted at a hidden feature.
- **`funkcja_kwadratowa_narysuj_wykres`** (`otwarte`): same `a`/`p`/`b`/`c`/
  `q` generation as `wierzcholek`. `tresc` states the formula directly.
  Domain is centered on the vertex with a fixed margin (`p ± 6`) so the
  parabola's shape is comfortably visible regardless of where its vertex
  falls.

Both keep a textual `odpowiedz` (the zero, or the vertex coordinates) as a
supplementary numeric cross-check alongside the visually revealed curve —
consistent with every template needing a stated `odpowiedz`, and it costs
nothing to give both forms of the answer.

## CSS (`css/styles.css`) — changes

- **Removed:** `.wykres .znacznik`, `.wykres .etykieta-znacznika`, and the
  `.wykres .znacznik[hidden], .wykres .etykieta-znacznika[hidden]` rule —
  all dead once the marker/tooltip elements are gone.
- **Added:** `.wykres .krzywa[hidden] { display: none; }` — the same
  explicit-rule pattern (the browser's built-in `[hidden]` UA rule does not
  apply inside the SVG namespace, confirmed during the original
  implementation), now needed for the curve instead of the marker.
- **Added:** `.wykres .rysunek-ucznia { stroke: <a contrasting color, e.g.
  a red/orange>; stroke-width: 2; }` — visually distinct from `.krzywa`'s
  blue so the overlay comparison is easy to read.
- `.wykres-kontener`, `.wykres`, `.siatka`, `.os`, `.etykieta`, `.nakladka`,
  and the print rule hiding `.nakladka` are all unchanged.

## Testing Plan

- **`test/chart.test.js`**: existing grid/axis/curve-sampling tests are
  unaffected (that logic didn't change). Remove any assertions about the
  marker/tooltip elements (none currently exist as dedicated tests, since
  those were only exercised via `chartInteraction.js`, which had no
  automated tests). Add: the curve `<path class="krzywa">` carries `hidden`
  by default; a `<path class="rysunek-ucznia">` exists with an empty `d`.
- **`test/topics/funkcje.test.js`**: replace the two removed templates'
  tests with new ones for the draw-the-function templates — since the
  formula is now in `tresc` (not hidden), these can reuse the exact same
  parsing style as the existing `miejsceZerowe`/`wierzcholek` tests
  (extract `a`/`b`/`c` from the rendered text and independently verify the
  stated root/vertex), *plus* assert `task.wykres`'s `a`/`b`/`c` match what
  `tresc` states, and that the root/vertex falls inside `[xMin, xMax]`.
- **`chartInteraction.js`**: still no automated test (DOM-only, no test
  environment). Verified manually: draw with a simulated mouse drag and a
  simulated touch drag, confirm multiple strokes accumulate, confirm
  drawing is clamped to the plot area, confirm "Pokaż odpowiedzi" reveals
  the correct curve overlaid in a distinct color, confirm print shows a
  blank grid unrevealed / the correct curve revealed.

## Known Follow-ups (explicitly out of scope here)

- General difficulty recalibration against real podstawa programowa /
  matura reference material — still open, applies project-wide.
- No undo/clear-drawing control (see Non-Goals).
- **Touch scroll is blocked over charts.** `.wykres` needs `touch-action:
  none` so freehand drawing can capture movement in every direction — but
  since charts are near-full-width on a phone, a finger landing on one
  won't scroll the page past it, which is a real usability cost found
  during the final review. A proper fix (e.g. a per-chart "tryb rysowania"
  toggle that only claims touch gestures while active) is a real feature
  addition, not a quick patch, and is deferred rather than solved here.
- Keyboard accessibility: freehand drawing is inherently a pointer/touch
  interaction with no natural keyboard equivalent. Unlike the superseded
  hover-read design, this is not flagged as a regression against a
  previously-working keyboard path, since the task remains fully answerable
  without any interaction at all (read the formula, sketch on paper or
  mentally, reveal to compare) — the drawing tool is a convenience, not a
  requirement to complete the task.
