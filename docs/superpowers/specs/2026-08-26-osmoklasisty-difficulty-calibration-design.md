# Egzamin Ósmoklasisty Difficulty Calibration — Design

## Purpose

The project's own design spec already flagged this as an open item: "General
difficulty recalibration against real podstawa programowa / matura reference
material — still open, applies project-wide." This spec closes that gap for
grades 4-8 (Phase 1), calibrated against a real CKE-style egzamin
ósmoklasisty paper. Grades lo1-lo4 (Phase 2, calibrated against a real
matura podstawowa paper) are an explicit follow-up, not part of this spec —
matura-level content (logarithms, piecewise functions, compound interest,
"wykaż że" proofs) is terminal lo4 difficulty and shouldn't leak into lo1-lo3
without grade-appropriate scaling, which deserves its own design pass.

## Reference Material

Two real exam PDFs were read in full for this work:

- `arkusze.pl/osmoklasisty/matematyka-2026-egzamin-osmoklasisty.pdf` — 20
  tasks: 1-14 closed (single correct answer or true/false judgment, 1 point
  each), 15-20 open (2-3 points each, free-form solution). Official topic
  weighting (stated in the exam's own Zadanie 1): ~35% arithmetic, 25%
  algebra, 20% statistics, 15% planimetry, 5% stereometry.
- `arkusze.pl/maturalne/matematyka-2026-maj-matura-podstawowa.pdf` — read for
  context only; confirms Phase 2 is meaningfully harder content and belongs
  in its own spec.

## Current-State Gap

Every existing template in `js/topics/*.js` for the sp4-sp8 topics
(`liczbyNaturalne.js`, `ulamki.js`, `ulamkiDziesietne.js`, `procenty.js`,
`geometriaPlaska.js`, `rownania.js`, `potegiPitagoras.js`) is a single-step
"compute this" exercise. The real exam is mostly multi-step reasoning
wrapped in a short word problem: two unknowns tied together by a ratio or
difference, true/false judgment on a pair of statements, a formula the
student must apply *and* recognize, angle systems solved via a sum
constraint, coordinate/map distance via Pythagoras, and reference figures
(a compass-oriented map, a labeled solid) that the current app has no way to
render at all. Stereometria (solids) has zero template coverage anywhere in
the app despite being explicitly tested.

## Decisions

- Build all 8 new reasoning-shape templates identified below in one pass
  (not a smaller representative subset).
- Add a reference-figure diagram generator (4 shape types) for the
  templates where the real exam genuinely uses a picture: map/coordinate,
  and solids. Also apply it to the new triangle and quadrilateral templates,
  since a labeled figure is standard presentation for those question types
  even where the real exam's specific instance happened to be phraseable in
  words alone.
- Rebuild the "Egzamin ósmoklasisty" exam mode to match the real paper's
  fixed structure: exactly 20 tasks, 14 closed followed by 6 open (not
  shuffled together), instead of a rough closed/open ratio over a
  user-chosen count.
- Do **not** add point-value tracking or display (e.g. "(0-2 pkt)" badges).
  That needs a task-contract change and is a separate feature from
  structure/content fidelity — noted under Non-Goals.

## New Templates

All eight follow this project's existing conventions: a `RANGES` table keyed
by difficulty, every rendered number routed through `formatNumber`, `zamknięte`
tasks built via the existing `buildOptions(correct, wrong, rng)` helper from
`js/distractors.js`, and "typowy błąd" comments explaining each wrong-answer
trap — matching the style already established in `procenty.js`, `rownania.js`,
`geometriaPlaska.js`, and `potegiPitagoras.js`.

### 1. `liczby_naturalne_nwd_nww` (closed) — `liczbyNaturalne.js`

Combines GCD and LCM into one question, mirroring the exam's "locker code"
framing. Construct `x = g·m1`, `y = g·m2` where `m1`,`m2` are coprime (so
`gcd(x,y) = g` exactly, by construction, not by luck), and pick `p`,`q`
directly for the LCM half. States "A is the GCD of x and y, B is the LCM of
p and q" and asks for both values as one answer (`NWD = g, NWW = lcm`).
Wrong options: swap the two labels, forget to divide by the GCD when
computing the LCM (`p·q` instead of `p·q/gcd(p,q)`), and use a multiplier
(`m1`) where the GCD belongs.

### 2. `liczby_naturalne_suma_kolejnych` (open) — `liczbyNaturalne.js`

States the sum-of-first-`n`-naturals formula `S = n·(n+1) : 2` directly in
the task text (formula-literacy, not memorization) and asks the student to
apply it for a given `n`. Fully deterministic and independently
recomputable.

### 3. `rownania_srednia_arytmetyczna` (closed) — `rownania.js`

Symbolic mean puzzle, deliberately never revealing the underlying numbers
(matching the real question exactly): "the mean of two numbers a and b is
X, the mean of a, b, and c is Y — find c." Solved via `c = 3Y - 2X`. Wrong
options: forgetting to double X (`3Y - X`), treating means additively
(`Y - X`), and swapping X/Y's roles (`3X - 2Y`).

### 4. `rownania_podzial_na_grupy` (open) — `rownania.js`

The "tied unknowns" word-problem shape that covers two different real exam
questions (the apples/oranges baskets, and the colored paper sheets) with
one general template: three categories where `cat2 = k·cat1` (a ratio, k
can be a clean fraction like 1.5) and `cat3 = cat1 - d` (a difference), a
known total `T = cat1 + cat2 + cat3`, solve for `cat2` (the ratio-based
category, matching which one the real exam asks for). `cat1` is picked
first as the hidden base value (kept even when `k` is fractional, so `k·cat1`
stays a clean number), then `T` is derived from it — guaranteeing exact,
clean numbers rather than solving a division that might not terminate
nicely.

### 5. `geometria_trojkat_rownoboczny_prawda_falsz` (open) — `geometriaPlaska.js`, with diagram

States an equilateral triangle's side length `s = 2k` (even, so the true
height `k√3 cm` and area `k²√3 cm²` stay in clean `n√3` form — no rounding),
then presents two claims (a height value and an area value) and asks the
student to judge each true or false independently, matching the real exam's
P/F-pair style. Each claim is independently randomized true/false; when
false, the stated value is a specific known trap (height claim: forgot the
÷2, i.e. stated `s√3` instead of `k√3`; area claim: forgot the ÷2 in the
triangle-area step, i.e. stated `2k²√3` instead of `k²√3`). The answer states
both judgments plus the derivation via the Pythagorean theorem (the actual
skill being tested — the equilateral triangle's height splits it into two
30-60-90 right triangles). Diagram: the triangle outline with its side
length labeled — the height/area claims themselves are not drawn, since
judging them is the point of the question.

### 6. `geometria_czworokat_katy` (closed) — `geometriaPlaska.js`, with diagram

Quadrilateral angle system solved via the 360° interior-angle-sum
constraint. `β` is picked directly (not solved for) so every other value
falls out as a clean integer: `γ = k·β` (k = 2 or 3, "γ is twice/three times
β"), `δ = 90°` (a fixed right angle, stated as a given fact), and
`α = 360 - β - γ - δ` (derived, then restated as "α is `diff` degrees more
than β" where `diff = α - β`). `β`'s range is constrained per `k` so `diff`
always comes out positive (`β·(2+k) < 270`). Asks for `α`. Diagram: the
quadrilateral outline with α, β, γ, δ labeled at their vertices and a small
right-angle marker at δ — structural labeling only, the numeric
relationships stay in the text.

### 7. `pitagoras_mapa_odleglosc` (open) — `potegiPitagoras.js`, with diagram

Reframes the existing Pythagorean-triple machinery (the same `TRIPLES` list
`pitagoras_przeciwprostokatna` already uses, for guaranteed clean integer
results) as a real-world map problem: "point B is `a` km west and `b` km
north of point A — find the straight-line distance," instead of "two legs
of a right triangle." Distinct template id and framing from the existing
one; same underlying formula, different skill (translating a verbal
direction description into a right triangle) — matching what actually makes
the real exam's version harder than a bare Pythagoras exercise. Diagram: the
two legs (horizontal `a`, vertical `b`) and the dashed hypotenuse, with a
small north-arrow compass marker and both leg lengths labeled.

### 8. New topic `bryly.js` (stereometria) — two templates, both with diagram

Currently there is no stereometria topic anywhere in the app despite it
being explicitly tested (5% of the real exam, and part of the sp6/sp8
podstawa programowa). Both templates share one `wymiary(difficulty, rng)`
helper (three cuboid edge lengths `a`, `b`, `c`, ranges scaled by difficulty
the same way `geometriaPlaska.js`'s `dimension()` already does) and one
diagram shape (`prostopadloscian`, all three dimensions labeled):

- **`bryly_pole_powierzchni_prostopadloscianu`** (closed) — total surface
  area, `P = 2·(ab + bc + ac)`. Wrong options: the volume formula used by
  mistake, the un-doubled sum, and doubling only one face pair.
- **`bryly_objetosc_prostopadloscianu`** (open) — volume, `V = a·b·c`.

`bryly` is added to sp6's and sp8's `topicKeys` in `topicRegistry.js` — the
grades where podstawa programowa actually covers rectangular-prism
surface area and volume.

## Reference-Figure Diagrams

**New pure module `js/diagram.js`**, structured exactly like `js/chart.js`
(no DOM access, deterministic string output from numeric input) but simpler
— these are static reference figures, not something the student draws on,
so there is no interaction layer to build. `diagramSvg(rysunek)` dispatches
on `rysunek.typ` to one of four shape renderers:

- `trojkat` — equilateral triangle outline, side length labeled.
- `czworokat` — quadrilateral outline, four vertex angle labels (α/β/γ/δ),
  small square right-angle marker at whichever vertex is the given right
  angle.
- `mapa` — two points connected by two solid legs (horizontal/vertical) and
  a dashed hypotenuse, small north-arrow marker, both leg lengths labeled.
- `prostopadloscian` — a schematic 3D-look box (front face rectangle plus a
  diagonally-offset rear rectangle joined by four edges — a fixed, simple
  isometric-style skew, not true 3D projection math), three edges labeled
  `a`/`b`/`c`.

Style: simple line-art (stroke-only outlines, no fill, no grid/axes,
consistent stroke width) — visually distinct from the boxed/gridded
function-chart SVGs `js/chart.js` produces, since these serve a different
purpose (a given reference figure, not an interactive answer surface).

**Task contract**: new optional field `task.rysunek` (object), sibling to
the existing `wykres` field, validated by a new `checkRysunek` in
`js/taskShape.js` (same pattern as the existing `checkWykres` — validates
`typ` is one of the four known values and that the required numeric fields
for that `typ` are present and finite).

**Rendering**: `js/render.js` gets `rysunekHtml(task)`, wrapping
`diagramSvg(task.rysunek)` in a `<div class="rysunek-kontener">`, following
the exact same pure-string-output pattern `wykresHtml` already uses.

**CSS**: a `.rysunek-kontener` box styled consistently with the existing
`.wykres-kontener`, plus generic stroke-only styling for the diagram's line/
polygon/text elements (no chart-specific classes like `.krzywa` or
`.rysunek-ucznia` apply here — these figures are never drawn on).

## Exam Mode Restructuring

`js/examModes.js`'s `osmoklasisty` entry gains a `fixedStructure:
{ closedCount: 14, openCount: 6 }` field and drops its now-superseded
`closedRatio` field (the two are mutually exclusive ways of controlling the
closed/open split; `matura`'s entry is untouched — it keeps `closedRatio`
and is unaffected by this spec entirely, per Non-Goals). `js/sheetGenerator.js`'s
`generateSheet` checks for `fixedStructure`: when present, it ignores
`options.count` entirely, splits the pool by `probeType` (already probed via
the existing `ensureProbeTypes`), runs `buildOrder` once for the `zamkniete`
half (count 14) and once for the `otwarte` half (count 6), then runs the
existing generate-and-dedupe-against-`seenTexts` loop across the two orders
back-to-back (closed first, open second) so the final sheet is
closed-then-open rather than interleaved, while every task in it is still
deduped against the whole sheet exactly as today — matching the real
paper's two-part structure (closed section, then a "przenieś rozwiązania"
transition, then the open section).

`js/app.js`: when `wybor-egzaminu` is set to `osmoklasisty`, the "Liczba
zadań" input is hidden (its value would be silently ignored otherwise,
which is worse UX than not showing it) and replaced with static text
stating the fixed 20-task structure.

## Testing Plan

- Each of the 8 new templates gets its own test asserting the answer is
  **independently recomputed**, never checked against the template's own
  arithmetic — the same rule every existing template test already follows.
  The four with a `rysunek` field get an additional assertion that the
  diagram's labeled values match the task's own numbers.
- `js/diagram.js` gets `test/diagram.test.js`, mirroring `chart.test.js`:
  one test per shape type asserting the emitted SVG contains the expected
  label text for given inputs, plus a test that an unknown `typ` throws.
- `js/taskShape.js`'s new `checkRysunek` gets tests mirroring the existing
  `checkWykres` tests (valid input passes, missing/wrong-typed fields throw
  a Polish error, unknown `typ` throws).
- `sheetGenerator.js`'s new fixed-structure branch gets tests: exactly 20
  tasks for `osmoklasisty` regardless of `options.count`, exactly 14
  `zamkniete` followed by exactly 6 `otwarte` (order asserted, not just
  counts), and the existing "same seed reproduces the same sheet" /
  "no two tasks share identical tresc" invariants still hold under this
  mode.
- Manual browser verification: generate an Egzamin ósmoklasisty sheet,
  confirm the 14/6 split and ordering, confirm each new diagram type
  renders correctly, confirm print preview still looks correct with the
  new diagrams present.

## Non-Goals (this pass)

- **Phase 2 (lo1-lo4 / matura calibration)** — separate spec, separate pass,
  after this one ships.
- **Comparing four symbolic power/root expressions** — redundant with the
  existing `potegi_obliczanie` template and meaningfully fragile to
  generate safely (guaranteeing exactly one of four symbolic rewrites is
  numerically correct without false collisions).
- **Reassembled-composite-figure geometry** (the real exam's
  cut-a-rectangle-into-a-trapezoid-and-triangle-then-reassemble-into-a-
  parallelogram question) — a genuinely different, harder-to-generalize
  shape than the existing `figura_zlozona` (cut-a-corner) template.
- **Formula-plus-symbolic-rearrangement recognition** (the real exam's
  "which of these is an equivalent rewrite of the given formula" second
  half of a formula question) — verifying algebraic equivalence
  programmatically is a meaningfully different, riskier problem than
  applying a stated formula numerically.
- **Generic "wykaż że..." proof-writing tasks** — no natural way to
  auto-verify a written proof in this app's self-check model.
- **Point-value tracking/display** ("(0-2 pkt)" badges, running score) —
  needs a task-contract change; a separate feature from structure/content
  fidelity.
- **Retrofitting diagrams onto pre-existing geometry templates**
  (`geometria_pole_trojkata`, `geometria_pole_trapezu`, the existing
  `geometria_figura_zlozona`, `pitagoras_przeciwprostokatna`) — reasonable
  future follow-up, not required for this pass since the diagram
  infrastructure being built here already covers everywhere it's
  load-bearing for the new content.

## Known Follow-ups

- Phase 2 (lo1-lo4, matura-calibrated) is the natural next spec after this
  one ships.
- If, once this lands, a specific grade's difficulty still feels off to
  the project owner, a targeted reference example for that grade would be
  higher-value feedback than more reference PDFs sent upfront.
