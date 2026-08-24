# Generator Zadań Matematycznych — Design Document

**Date:** 2026-08-25
**Status:** Approved

## Purpose

A static website that generates original Polish math practice tasks for
students in szkoła podstawowa (klasy 4–8) and liceum/technikum (klasy 1–4).
Tasks are procedurally generated from parameterized templates modeled on the
style and format of exam tasks published annually by CKE (Centralna Komisja
Egzaminacyjna). The site also offers an exam mode producing sheets in the
style of *egzamin ósmoklasisty* and *matura (poziom podstawowy)*.

The entire user interface is in Polish.

## Success Criteria

- A student picks a grade and difficulty, requests 1–12 tasks, and receives a
  sheet of correct, grade-appropriate, uniquely-parameterized tasks.
- Answers with brief worked solutions can be revealed inline under each task.
- The sheet can be printed as a clean worksheet.
- Every generated task's stated answer is mathematically correct — verified by
  automated tests that independently recompute it.
- No build step, no backend, no dependencies: opening `index.html` works.

## Non-Goals (v1)

- Matura **poziom rozszerzony** (podstawowy only in v1).
- User accounts, cloud sync, or progress tracking across devices.
- Answer entry / auto-grading of what the student types.
- A timed full mock-exam simulator (sheet size is user-chosen, 1–12).
- Copying or redistributing actual CKE task texts — all tasks are original,
  generated content styled after CKE formats.

## Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Task source | Procedural templates | Unlimited unique tasks, no copyright concerns |
| Grade coverage | All 9 levels (SP 4–8, LO/TECH 1–4) | Matches the stated audience from day one |
| Topic depth | 3–5 core topics per grade | Ships a complete product; extensible later |
| Difficulty | Independent of grade | Grade picks the topic pool; difficulty scales within it |
| Sheet size | User-typed 1–12, both modes | Consistent generation UI everywhere |
| Matura level | Podstawowy only | Rozszerzony topics deferred to a later phase |
| Answers | Toggle, rendered **inline under each task** | No scrolling to match answers to questions |
| Solutions | Final answer + 2–4 line worked explanation | Useful for self-study |
| Task types | Both zamknięte (multiple choice) and otwarte | Matches real exam variety |
| Tech stack | Plain static HTML/CSS/JS, no build step | Simplest to host and navigate; matches user preference |
| Tests | `node --test` + `assert` (Node built-ins) | Real TDD with zero dependencies |

## Architecture

A single static site. All logic runs client-side in the browser. There is no
server, no bundler, and no package installation.

```
index.html               App shell: menu screen + sheet screen, toggled by JS
css/styles.css           Plain styling + @media print worksheet stylesheet
js/app.js                Menu wiring, reads selections, calls generator, renders
js/sheetGenerator.js     (mode, poolKey, difficulty, count) → array of N tasks
js/topicRegistry.js      Per-grade declaration of which template IDs are in scope
js/examModes.js          Topic pools + task-type mix for the two exam modes
js/topics/*.js           One file per topic category; exports template functions
test/topics/*.test.js    Per-topic correctness tests (node --test)
test/sheetGenerator.test.js  Sheet-level composition tests
```

**Module loading:** ES modules via `<script type="module">`. Because ES modules
are blocked by the `file://` CORS policy in browsers, the site is served over a
local static server during development (`npx serve`, `python -m http.server`, or
any equivalent) and from any static host in production. This keeps clean module
boundaries without introducing a build step.

### Design principles

- **Templates are pure functions.** A template takes a difficulty and a random
  source and returns a task object. It touches no DOM and no globals, so it can
  be unit-tested directly in Node.
- **The renderer is generic.** `app.js` knows only the task object shape, never
  what topic produced it. Adding a topic requires no renderer change.
- **One file per topic category.** Files stay small and focused; a new topic is
  a new file plus one registry entry.

## Data Contract

Every template function returns exactly this shape:

```js
{
  id: 'ulamki_dziesietne_dodawanie',   // template id, stable, for debugging
  type: 'zamkniete' | 'otwarte',
  tresc: 'Oblicz: 3,4 + 2,75',          // question text, Polish
  odpowiedzi: ['5,15', '6,15', '6,05', '5,05'],  // present only when zamkniete
  poprawna: 1,                          // index into odpowiedzi; only when zamkniete
  odpowiedz: '6,15',                    // final answer string; always present
  rozwiazanie: 'Wyrównujemy miejsca po przecinku...'  // 2–4 line worked solution
}
```

Rules:
- `odpowiedz` is always present, for both task types.
- `odpowiedzi` and `poprawna` are present if and only if `type === 'zamkniete'`.
- `odpowiedzi[poprawna]` must equal `odpowiedz` for closed tasks.
- All numbers rendered in text use the Polish decimal comma (`3,4` not `3.4`).
- No `NaN`, `undefined`, or `Infinity` may appear in any string field.

### Number formatting

A shared helper formats every number for display: decimal comma, no trailing
zeros beyond the needed precision, and fractions rendered as `3/4` (or as mixed
numbers `2 1/2` where the grade convention expects it). Templates must route all
numeric output through this helper so formatting is consistent site-wide.

## Difficulty Model

Grade selects the topic pool. Difficulty (`latwy` / `sredni` / `trudny`) scales
within that pool along three levers, chosen per template:

1. **Number magnitude** — e.g. klasa 6 easy: two-digit values; hard: three
   decimal places.
2. **Step count** — easy: one operation; hard: two or three operations, or a
   word problem wrapping the computation.
3. **Variant inclusion** — hard may introduce negative results, remainders, or
   unit conversion that easy avoids.

Each topic file documents its own three levels in a comment at the top.

### Distractors

Wrong options for closed tasks are generated from *typical student mistakes* —
misplaced decimal point, forgotten carry, wrong operation order, sign error —
never from random numbers. Distractors must be distinct from each other and
from the correct answer.

## Topic Taxonomy

### Szkoła podstawowa

| Klasa | Działy |
|---|---|
| 4 | Działania pisemne na liczbach naturalnych · Ułamki zwykłe (wprowadzenie) · Obwód i pole prostokąta · Proste zadania tekstowe |
| 5 | Działania na ułamkach zwykłych · Ułamki dziesiętne · Pole trójkąta i równoległoboku · Liczby całkowite (wprowadzenie) |
| 6 | Działania na ułamkach dziesiętnych · Procenty (wprowadzenie) · Liczby całkowite (pełne działania) · Pola i objętości brył prostych |
| 7 | Liczby wymierne (cztery działania) · Potęgi · Wyrażenia algebraiczne · Równania pierwszego stopnia · Procenty |
| 8 | Potęgi i pierwiastki · Równania i nierówności · Twierdzenie Pitagorasa · Statystyka i prawdopodobieństwo (elementy) |

### Liceum / technikum

| Klasa | Działy |
|---|---|
| 1 | Liczby rzeczywiste · Wyrażenia algebraiczne · Równania i nierówności liniowe · Funkcja liniowa |
| 2 | Funkcja kwadratowa · Wielomiany · Trygonometria (trójkąt prostokątny) · Planimetria |
| 3 | Ciągi liczbowe · Trygonometria (funkcje dowolnego kąta) · Geometria analityczna (równanie prostej) · Stereometria (wprowadzenie) |
| 4 | Rachunek prawdopodobieństwa i statystyka · Stereometria · Geometria analityczna · Funkcje wykładnicze i logarytmy |

### Exam pools

Exams are cumulative, so exam modes draw from unions rather than one grade:

- **Egzamin ósmoklasisty** — union of all SP topics (klasy 4–8).
- **Matura (poziom podstawowy)** — union of all LO/technikum topics (klasy 1–4).

Each exam mode declares a task-type mix approximating the real sheet
(roughly 60% zamknięte / 40% otwarte), which `sheetGenerator` honors when
composing a sheet.

## User Interface

Polish throughout. Plain, non-flashy: system font stack, white background, dark
text, simple bordered task boxes, no animations, no imagery, generous line
spacing. Single column on narrow screens. Fully keyboard-navigable, with proper
`<label>` associations on every control.

### Screen 1 — Menu

```
GENERATOR ZADAŃ Z MATEMATYKI

Tryb:         ( ) Ćwiczenia    ( ) Egzamin

[Ćwiczenia]   Etap:    [Szkoła podstawowa ▾]
              Klasa:   [Klasa 6 ▾]
              Dział:   [Wszystkie działy ▾]

[Egzamin]     Rodzaj:  [Egzamin ósmoklasisty ▾ | Matura (poziom podstawowy)]

Trudność:     ( ) Łatwy   (•) Średni   ( ) Trudny
Liczba zadań: [ 6 ]   (1–12)

                        [ Generuj zadania ]
```

Choosing *Ćwiczenia* reveals the etap/klasa/dział selects and hides the exam
select; choosing *Egzamin* does the reverse. Only one group is ever visible.

### Screen 2 — Sheet

```
Arkusz: Klasa 6 · Poziom średni · 6 zadań         [← Wróć do menu]

Zadanie 1.
Oblicz: 3,4 + 2,75
   A. 5,15    B. 6,15    C. 6,05    D. 5,05
   ┌ Odpowiedź: B. 6,15                        ← shown only when toggled on
   │ Wyrównujemy miejsca po przecinku: 3,40 + 2,75...

Zadanie 2.
Pole prostokąta wynosi 48 cm², a jeden z boków ma 6 cm.
Oblicz obwód tego prostokąta.
   ┌ Odpowiedź: 28 cm                          ← shown only when toggled on
   │ Drugi bok: 48 : 6 = 8 cm. Obwód: 2·(6+8) = 28 cm.

[ Pokaż odpowiedzi ]  [ Generuj nowy arkusz ]  [ Drukuj ]
```

**Answers are rendered inline directly beneath the task they belong to** — never
as a separate answer key at the bottom of the page. This is a hard requirement:
the student must not have to scroll away from a task to see its answer. The
toggle button reveals or hides all inline answer blocks at once, and its label
switches between `Pokaż odpowiedzi` and `Ukryj odpowiedzi`.

`Drukuj` calls `window.print()`. The print stylesheet hides the menu, buttons,
and header chrome so the printed page is a clean worksheet. Answer blocks print
only if they are currently visible, so a teacher can print either a blank
worksheet or a worked key.

### Persistence

Last-used selections (mode, etap, klasa, dział, difficulty, count) are saved to
`localStorage` and restored on the next visit. Every read and write is wrapped
in `try`/`catch`, and the app renders correct defaults when storage is
unavailable or empty.

## Error Handling

- **Too few templates for the requested count.** If a pool has fewer distinct
  templates than tasks requested, templates repeat with different random
  parameters. Two tasks in one sheet may never be textually identical.
- **Invalid count.** Non-numeric, empty, or out-of-range input clamps to the
  nearest valid value in 1–12 before generation.
- **Empty pool.** If a selected combination somehow yields no templates, the app
  shows a Polish message explaining the combination is unavailable and returns to
  the menu, rather than rendering an empty sheet.
- **localStorage unavailable.** Caught and ignored; defaults are used.

## Testing Strategy

Node's built-in test runner (`node --test`) with the `assert` module — no
dependencies to install. Templates are pure and DOM-free, so they run directly
under Node.

**Per-topic tests.** For each topic file, generate 100+ tasks at each difficulty
and assert:

1. The stated answer is mathematically correct, verified by recomputing it
   independently of the template's own arithmetic.
2. Generated values fall inside the range that difficulty declares.
3. Closed tasks have exactly one correct option, `odpowiedzi[poprawna]` equals
   `odpowiedz`, and no two options are duplicates.
4. No `NaN`, `undefined`, or `Infinity` appears in `tresc`, `odpowiedz`,
   `rozwiazanie`, or any option.
5. All decimal numbers in rendered text use a comma, not a period.

**Sheet-level tests.** Requesting N tasks returns exactly N; no two tasks in a
sheet are textually identical; exam modes respect their declared task-type mix;
count input clamps correctly at the 1 and 12 boundaries.

**Manual verification.** Browser check of both screens, the answer toggle, the
print preview, and keyboard navigation.

## Future Extensions (out of scope for v1)

- Matura poziom rozszerzony and its additional topics.
- More topics per grade beyond the v1 core set.
- Student answer entry with auto-grading and a score.
- A timed mock-exam mode with a full-length sheet.
