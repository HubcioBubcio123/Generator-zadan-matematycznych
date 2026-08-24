# Generator Zadań Matematycznych

Static website generating Polish math practice tasks for szkoła podstawowa
(klasy 4–8) and liceum/technikum (klasy 1–4), plus exam-style sheets.

Design spec: `docs/superpowers/specs/2026-08-25-generator-zadan-matematycznych-design.md`

## Conventions

- **All user-facing text is in Polish.** UI labels, task content, answers,
  solutions, and error messages. Code identifiers and comments are English
  except domain terms that have no clean translation (`tresc`, `odpowiedz`,
  `rozwiazanie`, `zamkniete`, `otwarte`).
- **Numbers use the Polish decimal comma** (`3,4` — never `3.4`) in every
  rendered string. Route all numeric output through the shared formatter in
  `js/format.js`; never build number strings by hand.
- **No dependencies, no build step.** Plain HTML/CSS/JS, ES modules. Do not add
  npm packages, bundlers, or frameworks.
- **Templates are pure functions.** A template takes `(difficulty, rng)` and
  returns a task object. No DOM access, no globals, no `Math.random` directly —
  always use the injected `rng` so tests can seed it.
- **One topic category per file** in `js/topics/`. Keep files small and focused.

## Commands

- Run tests: `node --test`
- Run one test file: `node --test test/topics/<name>.test.js`
- Serve locally (required — ES modules do not work over `file://`):
  `python -m http.server 8000` then open `http://localhost:8000`

## Rules

- TDD: write the failing test first, watch it fail, then implement.
- Every template needs a test that **independently recomputes** the answer —
  never assert against the template's own arithmetic.
- Answers render **inline under each task**, never as a separate answer key at
  the bottom of the page.
- Commit after each completed task.
