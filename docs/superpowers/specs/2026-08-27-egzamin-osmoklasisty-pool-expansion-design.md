# Egzamin Ósmoklasisty Pool Expansion — Design

## Purpose

The first calibration pass (`2026-08-26-osmoklasisty-difficulty-calibration-design.md`)
fixed the exam's *structure* (20 tasks, 14 closed then 6 open) and added 9
exam-style templates, but left `js/examModes.js`'s `osmoklasisty` entry on
`gradeKeys` — a comment in that file explains why: *"the cutover is
deliberately held off until enough exam-exclusive topics exist to fill 14
closed/6 open slots without heavy repetition."* That is the exact problem
reported now: generating a sheet filtered to one subject produces the same
~12 tasks over and over with only the numbers changed. This spec finishes
that deferred work: grow the exam-exclusive template pool to roughly 3x the
sheet's own slot count, then flip the cutover.

## Reference Material

`arkusze.pl/osmoklasisty/matematyka-2026-egzamin-osmoklasisty.pdf` (the same
paper the first pass used) was re-read in full for this spec, specifically
to check which of its 20 problems still have no matching template anywhere
in the exam-exclusive pool after the first pass. Ten gaps were found;
per-problem detail is in the "New Templates" tables below. Two are
deliberately deferred (see Non-Goals) as needing new diagram infrastructure
disproportionate to one exam's worth of content.

## Current-State Gap

Running every exam-exclusive template's generator and counting by `type`
gives the actual baseline (not the file count, since a topic's mix of
`zamkniete`/`otwarte` matters more than its size):

| Source | Closed | Open |
|---|---|---|
| 5 existing exam-exclusive topics | 14 | 7 |
| 9 templates migrated from the first pass (see below) | 4 | 5 |
| **Baseline total** | **18** | **12** |

Against a 3x-the-slots target of **42 closed / 18 open**, open is nearly
there but **closed is short by 24 templates** — the real gap is almost
entirely on the closed side, because one exam paper only has 14 closed
problems total, so "cover this year's gaps" alone was never going to get
close to 3x. Reaching 42 closed means several topics need a genuine
*family* of closed variants — the same way `geometriaEgzamin.js` already
has 5 closely related but distinct circle-geometry templates rather than
one.

## Decisions

- **Migrate, don't reference.** The 9 templates from the first pass that
  currently reach the exam only via the `gradeKeys` union
  (`liczby_naturalne_nwd_nww`, `liczby_naturalne_suma_kolejnych`,
  `rownania_srednia_arytmetyczna`, `rownania_podzial_na_grupy`,
  `geometria_trojkat_rownoboczny_prawda_falsz`, `geometria_czworokat_katy`,
  `pitagoras_mapa_odleglosc`, `bryly_pole_powierzchni_prostopadloscianu`,
  `bryly_objetosc_prostopadloscianu`) get duplicated as `_egz`-suffixed
  exam-exclusive templates, matching the established naming pattern. This
  keeps the exam pool fully self-contained and immune to whatever the
  later grade-exclusivity project (Project A) does to the shared `Ćwiczenia`
  files these originals live in.
- **Weighted-by-size pool targets, not a weighted sampler.** Sheet sampling
  stays uniform-per-template (no change to `sheetGenerator.js`'s selection
  logic). The real exam's own stated topic weighting (35% arytmetyka, 25%
  algebra, 20% statystyka, 15% planimetria, 5% stereometria) is used only to
  size each topic's *pool*, padded +5 points per topic since the user noted
  this weighting isn't fixed year to year: 40/30/25/20/10. Scaled to 42
  closed / 18 open:

  | Topic | Closed target | Open target |
  |---|---|---|
  | Arytmetyka | 13 | 6 |
  | Algebra (równania) | 10 | 4 |
  | Statystyka | 8 | 4 |
  | Planimetria (geometria) | 7 | 3 |
  | Stereometria (bryły) | 4 | 1 |

- **Build-then-cutover.** Every new/migrated template lands while
  `osmoklasisty` still uses `gradeKeys`, so nothing user-facing changes
  mid-work and every commit stays independently safe. The single-line flip
  from `gradeKeys` to `examTopics` in `js/examModes.js` is the last commit.
- **Defer the two hardest 2026-paper gaps.** Cut-and-reassemble-into-a-
  parallelogram (needs a new figura diagram type plus care to keep the cut
  generatable) and tetrahedron-inside-a-cube volume ratio (a genuinely new,
  harder stereometria shape) are out of scope this pass — see Non-Goals.
- **Revises two prior Non-Goals, narrowly.** The first spec deferred
  "formula-plus-symbolic-rearrangement recognition" and "comparing four
  symbolic power/root expressions" as too fragile to generate safely. Both
  are back in scope here, but not in the risky general form:
  - *Formula rearrangement* (`rownania_wzor_przeksztalcenie_egz`) uses a
    small **fixed, hand-verified catalog** of (formula, correct rearrangement,
    2-3 wrong rearrangements) tuples — never a general symbolic-algebra
    engine. The task varies which catalog entry it shows, not the algebra
    itself.
  - *Expression comparison* (`arytmetyka_porownanie_wyrazen_egz`) compares
    four purely **numeric** expressions (order-of-operations arithmetic, no
    unknowns), verified by direct computation — unlike the deferred
    "symbolic power/root" idea, there is no symbolic-equivalence checking
    and therefore no false-collision risk.

## New / Migrated Templates

Given the volume (38 new templates plus 9 migrations), each is described in
one line rather than in the first spec's full-paragraph style — the
implementation plan pins exact formulas, ranges, and wrong-answer traps
per this project's existing conventions (a `RANGES` table per difficulty,
`buildOptions` for closed tasks, a `typowy błąd` comment per wrong option,
answers routed through `formatNumber`).

### `arytmetykaEgzamin.js` — target 13 closed / 6 open

Migrated (from `liczbyNaturalnePowtorka.js`): `liczby_naturalne_nwd_nww_egz`
(closed), `liczby_naturalne_suma_kolejnych_egz` (open).

New closed (9):
| id | Skill |
|---|---|
| `arytmetyka_porownanie_wyrazen_egz` | Which of 4 numeric expressions equals a given one (order of operations) — 2026 paper zad. 3 |
| `arytmetyka_potega_iloczyn_egz` | Evaluate a product/quotient of powers via the exponent rules |
| `arytmetyka_zaokraglanie_egz` | Round a number to a stated precision; distractors are common rounding-direction mistakes |
| `arytmetyka_kolejnosc_dzialan_egz` | Evaluate one mixed-operation/bracketed expression; distractors are common order-of-operations errors |
| `arytmetyka_ulamek_dziesietny_zamiana_egz` | Convert between fraction/decimal/percent forms of the same value |
| `arytmetyka_najwieksza_najmniejsza_egz` | Order a mixed set of fractions/decimals/negatives, pick the largest or smallest |
| `arytmetyka_dzielnik_pierwszy_egz` | Prime factorization / divisibility reasoning |
| `arytmetyka_procent_prosty_egz` | Quick "X% of Y" — a fast MC counterpart to `procentyEgzamin.js`'s longer word problems |
| `arytmetyka_reszta_z_dzielenia_egz` | Remainder/modulo reasoning |

New open (4):
| id | Skill |
|---|---|
| `arytmetyka_parzystosc_kul_egz` | Numbered-ball parity/combinatorics, compound answer — 2026 paper zad. 6 |
| `arytmetyka_dzialania_lancuchowe_egz` | Multi-step chained arithmetic word problem |
| `arytmetyka_szacowanie_egz` | Estimation word problem ("at least / at most how many...") |
| `arytmetyka_czas_kalendarz_egz` | Time/calendar unit-conversion word problem |

### New file `rownaniaEgzamin.js` — target 10 closed / 4 open

Migrated (from `rownania.js`): `rownania_srednia_arytmetyczna_egz` (closed),
`rownania_podzial_na_grupy_egz` (open).

New closed (9):
| id | Skill |
|---|---|
| `rownania_wzor_przeksztalcenie_egz` | Formula-rearrangement recognition via a fixed catalog — 2026 paper zad. 8b |
| `rownania_wyrazenie_algebraiczne_wartosc_egz` | Evaluate an algebraic expression at a given x |
| `rownania_uklad_dwoch_niewiadomych_egz` | Simple 2-unknown linear system, MC on one variable |
| `rownania_nierownosc_egz` | Simple linear inequality, which x satisfies it |
| `rownania_wyrazenie_rownowazne_egz` | Pick the equivalent simplified form of an expression |
| `rownania_procent_z_rownania_egz` | "x increased by p% equals y" — solve for x |
| `rownania_dlugosc_boku_z_obwodu_egz` | Derive an unknown side length from a perimeter equation |
| `rownania_wiek_zadanie_egz` | Classic age word problem via a linear equation |
| `rownania_predkosc_prosta_egz` | Solve `distance = speed × time` for the missing quantity |

New open (3):
| id | Skill |
|---|---|
| `rownania_predkosc_uzasadnij_egz` | Speed/time word problem, justify a threshold comparison — 2026 paper zad. 16 |
| `rownania_zadanie_tekstowe_dwie_niewiadome_egz` | Open word problem, two linear unknowns via substitution |
| `rownania_procent_zadanie_tekstowe_egz` | Open percent-based equation word problem |

### `statystykaEgzamin.js` — target 8 closed / 4 open

No migrations (this topic didn't exist before the first pass).

New closed (4):
| id | Skill |
|---|---|
| `statystyka_tabela_niewiadoma_egz` | Solve for a table's unknown cell from a stated total/difference constraint |
| `statystyka_diagram_kolowe_procent_egz` | Pie-chart percentage → count for the one unlabeled category — 2026 paper zad. 1 |
| `statystyka_srednia_wazona_egz` | Weighted average |
| `statystyka_czestosc_egz` | Most/least frequent category from a table |

New open (3):
| id | Skill |
|---|---|
| `statystyka_tabela_niewiadoma_procent_egz` | Full shape: unknown table cell, then percent-of-total — 2026 paper zad. 17 |
| `statystyka_srednia_zadanie_egz` | Open word problem computing a mean from raw data |
| `statystyka_tabela_zestawienie_egz` | Open, sum-across-rows/columns table word problem |

### `geometriaEgzamin.js` — target 7 closed / 3 open

Migrated (from `geometriaPlaska.js` / `potegiPitagoras.js`):
`geometria_trojkat_rownoboczny_prawda_falsz_egz` (open),
`geometria_czworokat_katy_egz` (closed), `pitagoras_mapa_odleglosc_egz` (open).

New closed (3):
| id | Skill |
|---|---|
| `geometria_pieciokat_trojkat_kwadrat_egz` | Pentagon split into triangle+square; back out the square's area — 2026 paper zad. 13 |
| `geometria_trojkat_prostokatny_pole_egz` | Right-triangle area from its two legs |
| `geometria_romb_pole_z_przekatnych_egz` | Rhombus area from its diagonals |

New open (1):
| id | Skill |
|---|---|
| `geometria_mapa_trzy_punkty_egz` | Map with 3 points, two P/F distance judgments — 2026 paper zad. 12. Extends the existing `mapa` figura type to optionally render a third point rather than adding a new `typ`. |

### `procentyEgzamin.js` — new open item counted toward planimetria's weight

| id | Skill |
|---|---|
| `procenty_pakowanie_trapez_egz` | Trapezoid area → minimum whole packages needed to cover it (ceiling division) — 2026 paper zad. 19 |

### `brylyEgzamin.js` — target 4 closed / 1 open

Migrated (from `bryly.js`): `bryly_pole_powierzchni_prostopadloscianu_egz`
(closed), `bryly_objetosc_prostopadloscianu_egz` (open).

New closed (1):
| id | Skill |
|---|---|
| `bryly_pole_podstawy_ostroslupa_egz` | Pyramid base area from given facts — a facet distinct from the existing pole/objętość pair |

### Resulting totals

| | Closed | Open |
|---|---|---|
| Target | 42 | 18 |
| **Projected actual** | **44** | **24** |

Per-topic closed counts land on or at their target exactly; open ends up
comfortably over its floor everywhere (never under) since several topics'
existing/migrated open templates already met or exceeded their target
before any new open template was added.

## Exam Mode Cutover

Once every template above exists and passes its tests, `js/examModes.js`'s
`osmoklasisty` entry changes from:

```js
{ key: 'osmoklasisty', label: 'Egzamin ósmoklasisty', gradeKeys: [...], fixedStructure: {...} }
```

to:

```js
{ key: 'osmoklasisty', label: 'Egzamin ósmoklasisty', examTopics: [
  'statystyka_osmoklasisty', 'procenty_osmoklasisty', 'geometria_osmoklasisty',
  'arytmetyka_osmoklasisty', 'bryly_osmoklasisty', 'rownania_osmoklasisty',
], fixedStructure: {...} }
```

(`rownania_osmoklasisty` is a new `TOPICS` entry for the new
`rownaniaEgzamin.js` file, registered exam-exclusive exactly like the other
five — not listed under any grade's `topicKeys`.) `getTemplatesForExam`
already handles the `examTopics` branch via the existing, tested
`getTemplatesForTopics` — no other code changes needed for the cutover
itself.

## Testing Plan

- Every new/migrated template gets a test that **independently
  recomputes** the answer, per this project's standing rule — never
  asserted against the template's own arithmetic.
- `rownania_wzor_przeksztalcenie_egz`'s fixed catalog gets a dedicated test
  asserting every catalog entry's "correct" rearrangement is actually
  algebraically equivalent to its source formula at several sample values,
  and every "wrong" entry is not — catching a bad catalog entry at test
  time instead of trusting hand-verification alone.
- `geometria_mapa_trzy_punkty_egz`'s figura extension gets a test asserting
  the third point renders with its own label when present, and that the
  existing two-point `mapa` figura tests still pass unchanged.
- New `test/examModes.test.js` assertions (extending what the first pass's
  Task 13 built): after the cutover, `getTemplatesForExam('osmoklasisty')`
  returns at least 42 `zamkniete` and at least 18 `otwarte` templates, all
  with unique ids.
- Full `node --test` run after every task, per existing convention.
- Manual browser verification (per the user's standing preference): filter
  a Ćwiczenia sheet to a single exam-exclusive-fed subject and generate
  several sheets back to back, confirming visibly more variety than the
  "~12 repeating tasks" currently reported; generate an Egzamin
  ósmoklasisty sheet and spot-check the new template types render (new
  figura extension, new problem phrasings) and print cleanly.

## Non-Goals (this pass)

- **Cut-and-reassemble-into-a-parallelogram** (2026 paper zad. 20) — needs
  a new figura diagram type and careful geometry to keep the cut always
  generatable; noted as a follow-up.
- **Tetrahedron-inside-a-cube volume ratio** (2026 paper zad. 18) — a
  genuinely new, harder stereometria shape needing its own diagram
  treatment; noted as a follow-up.
- **Project A (grade-exclusive Ćwiczenia pools)** — separate spec, separate
  pass, sequenced after this one per the user's explicit choice.
- **Weighted/non-uniform sheet sampling** — pool *size* encodes the topic
  weighting this pass; changing `sheetGenerator.js`'s actual selection
  algorithm is out of scope.

## Known Follow-ups

- Once Project A splits the shared `Ćwiczenia` topic files into per-grade
  pools, revisit whether any of this pass's exam-exclusive templates should
  also inform that split (they were explicitly duplicated to avoid coupling,
  but the reasoning-shape ideas may still be a useful reference).
- If, after this ships, the exam still feels repetitive for a specific
  topic, that is a signal that topic's weighted target was set too low
  relative to how often users actually filter to it — worth revisiting the
  +5-point padding rule with real usage feedback rather than guessing again.
