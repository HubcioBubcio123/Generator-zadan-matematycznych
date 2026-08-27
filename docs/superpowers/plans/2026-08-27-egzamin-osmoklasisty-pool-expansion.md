# Egzamin Ósmoklasisty Pool Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Grow the "Egzamin ósmoklasisty" exam-exclusive template pool from 18 closed/12 open to at least 42 closed/18 open templates (38 new + 9 migrated from the first calibration pass), then cut the exam mode over from `gradeKeys` to a curated `examTopics` pool, fixing the reported "~12 repeating tasks" problem.

**Architecture:** Every new/migrated template is added directly to one of six exam-exclusive topic files (`arytmetykaEgzamin.js`, new `rownaniaEgzamin.js`, `statystykaEgzamin.js`, `geometriaEgzamin.js`, `procentyEgzamin.js`, `brylyEgzamin.js`), each already registered in `js/topicRegistry.js`'s `TOPICS` list under no grade's `topicKeys` (exam-exclusive). `js/figura.js`'s `mapa` shape gains an optional third point. The final task flips `js/examModes.js`'s `osmoklasisty` entry from `gradeKeys` to `examTopics`.

**Tech Stack:** Plain ES modules, `node --test`. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-08-27-egzamin-osmoklasisty-pool-expansion-design.md`

## Global Constraints

- No npm packages, no bundler, no build step. ES modules only.
- All user-facing text is in Polish; numbers rendered via `formatNumber` (`js/format.js`) — never a raw JS decimal, never a `.` decimal point in rendered text.
- Templates are pure `(difficulty, rng) => task` functions — no `Math.random`, always the injected `rng`.
- Every template test **independently recomputes** the expected answer from the task's own `tresc`/`odpowiedz` text — never asserts against the template's own arithmetic.
- Every closed (`zamkniete`) template is built via `buildOptions(correct, wrong, rng)` from `js/distractors.js`, with a `typowy błąd` comment explaining each wrong option's mistake.
- Migrated templates (from the first calibration pass) are duplicated as new `_egz`-suffixed functions/ids directly inside the exam-exclusive files — never imported/referenced from the original `Ćwiczenia` files.
- `rownania_wzor_przeksztalcenie_egz` uses a small fixed, hand-verified catalog of (formula, correct rearrangement, 3 wrong rearrangements) tuples — never a general symbolic-algebra engine.
- Commit after each completed task.

---

## Part 1: `js/topics/arytmetykaEgzamin.js` (target 13 closed / 6 open)

### Task 1: Migrate `liczby_naturalne_nwd_nww` and `liczby_naturalne_suma_kolejnych`

**Files:**
- Modify: `js/topics/arytmetykaEgzamin.js`
- Modify: `test/topics/arytmetykaEgzamin.test.js`

**Interfaces:**
- Consumes: `formatNumber`, `buildOptions` (already imported in this file)
- Produces: `liczby_naturalne_nwd_nww_egz` (closed), `liczby_naturalne_suma_kolejnych_egz` (open) — exact duplicates of `liczbyNaturalnePowtorka.js`'s `nwdNww`/`sumaKolejnych`, renamed.

- [ ] **Step 1: Write the failing tests**

In `test/topics/arytmetykaEgzamin.test.js`, change the count test:

```js
test('exports six templates with unique ids', () => {
  assert.equal(templates.length, 6);
  assert.equal(new Set(templates.map((t) => t.id)).size, 6);
});
```

(replaces `'exports four templates with unique ids'`). Then add, after the existing `dzialania calkowite` test:

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

test('nwd nww egz: the stated NWD and NWW are independently correct', () => {
  const template = templates.find((t) => t.id === 'liczby_naturalne_nwd_nww_egz');
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

test('suma kolejnych egz: the stated sum equals n(n+1)/2 for the stated n', () => {
  const template = templates.find((t) => t.id === 'liczby_naturalne_suma_kolejnych_egz');
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

Run: `node --test test/topics/arytmetykaEgzamin.test.js`
Expected: FAIL — count is still 4, and neither new id exists.

- [ ] **Step 3: Update the implementation**

In `js/topics/arytmetykaEgzamin.js`, add near the top (after the imports):

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

function nwdNwwEgz(difficulty, rng) {
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
    id: 'liczby_naturalne_nwd_nww_egz',
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

const SUMA_KOLEJNYCH_RANGES = {
  latwy: { nMax: 30 },
  sredni: { nMax: 100 },
  trudny: { nMax: 500 },
};

function sumaKolejnychEgz(difficulty, rng) {
  const { nMax } = SUMA_KOLEJNYCH_RANGES[difficulty];
  const n = rng.int(5, nMax);
  const suma = (n * (n + 1)) / 2;

  return {
    id: 'liczby_naturalne_suma_kolejnych_egz',
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
  { id: 'arytmetyka_proporcja_wartosc_egz', generate: proporcjaWartosc },
  { id: 'arytmetyka_proporcja_zadanie_egz', generate: proporcjaZadanie },
  { id: 'arytmetyka_podzial_proporcjonalny_egz', generate: podzialProporcjonalny },
  { id: 'arytmetyka_dzialania_calkowite_egz', generate: dzialaniaCalkowite },
  { id: 'liczby_naturalne_nwd_nww_egz', generate: nwdNwwEgz },
  { id: 'liczby_naturalne_suma_kolejnych_egz', generate: sumaKolejnychEgz },
];
```

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/arytmetykaEgzamin.test.js`
Expected: PASS, all tests.

- [ ] **Step 5: Run the full suite**

Run: `node --test`
Expected: PASS, every test in the project.

- [ ] **Step 6: Commit**

```bash
git add js/topics/arytmetykaEgzamin.js test/topics/arytmetykaEgzamin.test.js
git commit -m "feat: migrate nwd_nww and suma_kolejnych into arytmetykaEgzamin"
```

---

### Task 2: Add `arytmetyka_porownanie_wyrazen_egz`

**Files:**
- Modify: `js/topics/arytmetykaEgzamin.js`
- Modify: `test/topics/arytmetykaEgzamin.test.js`

**Interfaces:**
- Consumes: `formatNumber`, `buildOptions`
- Produces: `arytmetyka_porownanie_wyrazen_egz` (closed).

- [ ] **Step 1: Write the failing tests**

Update the count test:

```js
test('exports seven templates with unique ids', () => {
  assert.equal(templates.length, 7);
  assert.equal(new Set(templates.map((t) => t.id)).size, 7);
});
```

(replaces `'exports six templates with unique ids'`). Then add:

```js
test('porownanie wyrazen: the chosen candidate expression really equals p', () => {
  const template = templates.find((t) => t.id === 'arytmetyka_porownanie_wyrazen_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [a, b, c] = task.tresc.match(/-?\d+/g).map(Number);
      const p = a - b - c;
      const [x, y, z] = task.odpowiedz.match(/-?\d+/g).map(Number);
      assert.equal(x - y - z, p, `${task.odpowiedz} should equal p=${p}`);
    }
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/topics/arytmetykaEgzamin.test.js`
Expected: FAIL — count is still 6, and the new template doesn't exist.

- [ ] **Step 3: Update the implementation**

Add after `sumaKolejnychEgz`:

```js
const POROWNANIE_RANGES = {
  latwy: { max: 30 },
  sredni: { max: 60 },
  trudny: { max: 100 },
};

function porownanieWyrazen(difficulty, rng) {
  const { max } = POROWNANIE_RANGES[difficulty];
  const a = rng.int(10, max);
  const b = rng.int(1, Math.floor(max / 2));
  const c = rng.int(1, Math.floor(max / 2));
  const p = a - b - c;

  // A second, freshly sampled a-b-c triple that lands on the same value p —
  // this is the correct candidate, matching the real exam's "which of these
  // is equal to p" framing.
  const b2 = rng.int(1, Math.floor(max / 2));
  const c2 = rng.int(1, Math.floor(max / 2));
  const a2 = p + b2 + c2;
  const correct = `${a2} - ${b2} - ${c2}`;

  function freshWrong() {
    let x, y, z, val;
    do {
      x = rng.int(10, max);
      y = rng.int(1, Math.floor(max / 2));
      z = rng.int(1, Math.floor(max / 2));
      val = x - y - z;
    } while (val === p);
    return `${x} - ${y} - ${z}`;
  }

  // Typowe błędy: liczby dobrane tak, by wyrażenie dawało inną wartość niż p.
  const wrong = [freshWrong(), freshWrong(), freshWrong()];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'arytmetyka_porownanie_wyrazen_egz',
    type: 'zamkniete',
    tresc: `Liczba p jest równa ${a} - ${b} - ${c}. Która z podanych liczb jest równa p?`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `p = ${a} - ${b} - ${c} = ${p}.\n` +
      `Sprawdzamy: ${correct} = ${p}, więc ta liczba jest równa p.`,
  };
}
```

Update the `templates` export array to add `{ id: 'arytmetyka_porownanie_wyrazen_egz', generate: porownanieWyrazen },` after the suma_kolejnych entry.

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/arytmetykaEgzamin.test.js`
Expected: PASS, all tests.

- [ ] **Step 5: Run the full suite**

Run: `node --test`
Expected: PASS, every test in the project.

- [ ] **Step 6: Commit**

```bash
git add js/topics/arytmetykaEgzamin.js test/topics/arytmetykaEgzamin.test.js
git commit -m "feat: add arytmetyka_porownanie_wyrazen_egz template"
```

---

### Task 3: Add `arytmetyka_potega_iloczyn_egz`

**Files:**
- Modify: `js/topics/arytmetykaEgzamin.js`
- Modify: `test/topics/arytmetykaEgzamin.test.js`

**Interfaces:**
- Consumes: `formatNumber`, `buildOptions`
- Produces: `arytmetyka_potega_iloczyn_egz` (closed).

- [ ] **Step 1: Write the failing tests**

Update count test to 8 (replacing the 7-template test with the same pattern). Then add:

```js
test('potega iloczyn: the stated value equals a^(m+n) for the stated a, m, n', () => {
  const template = templates.find((t) => t.id === 'arytmetyka_potega_iloczyn_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const match = task.tresc.match(/(\d+)\^(\d+) · \1\^(\d+)/);
      assert.ok(match, `unexpected format: "${task.tresc}"`);
      const a = Number(match[1]);
      const m = Number(match[2]);
      const n = Number(match[3]);
      assert.equal(parsePl(task.odpowiedz), a ** (m + n), task.tresc);
    }
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/topics/arytmetykaEgzamin.test.js`
Expected: FAIL.

- [ ] **Step 3: Update the implementation**

Add after `porownanieWyrazen`:

```js
const POTEGA_ILOCZYN_RANGES = {
  latwy: { aMax: 4, expMax: 3 },
  sredni: { aMax: 6, expMax: 4 },
  trudny: { aMax: 8, expMax: 4 },
};

function potegaIloczyn(difficulty, rng) {
  const { aMax, expMax } = POTEGA_ILOCZYN_RANGES[difficulty];
  const a = rng.int(2, aMax);
  const m = rng.int(2, expMax);
  const n = rng.int(2, expMax);
  const correct = formatNumber(a ** (m + n));

  // Typowe błędy: pomnożenie wykładników zamiast dodania, dodanie samych
  // potęg zamiast zastosowania wzoru, podwojenie podstawy.
  const wrong = [
    formatNumber(a ** (m * n)),
    formatNumber(a ** m + a ** n),
    formatNumber((2 * a) ** (m + n)),
  ];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'arytmetyka_potega_iloczyn_egz',
    type: 'zamkniete',
    tresc: `Oblicz wartość wyrażenia: ${a}^${m} · ${a}^${n}.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Przy mnożeniu potęg o tej samej podstawie dodajemy wykładniki: ${a}^${m} · ${a}^${n} = ${a}^${m + n}.\n` +
      `${a}^${m + n} = ${correct}.`,
  };
}
```

Add `{ id: 'arytmetyka_potega_iloczyn_egz', generate: potegaIloczyn },` to the templates array.

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/arytmetykaEgzamin.test.js`
Expected: PASS.

- [ ] **Step 5: Run the full suite**

Run: `node --test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/topics/arytmetykaEgzamin.js test/topics/arytmetykaEgzamin.test.js
git commit -m "feat: add arytmetyka_potega_iloczyn_egz template"
```

---

### Task 4: Add `arytmetyka_zaokraglanie_egz`

**Files:**
- Modify: `js/topics/arytmetykaEgzamin.js`
- Modify: `test/topics/arytmetykaEgzamin.test.js`

**Interfaces:**
- Consumes: `formatNumber`, `buildOptions`
- Produces: `arytmetyka_zaokraglanie_egz` (closed).

- [ ] **Step 1: Write the failing tests**

Update count test to 9. Then add:

```js
test('zaokraglanie: the stated value is the independently rounded value to two decimal places', () => {
  const template = templates.find((t) => t.id === 'arytmetyka_zaokraglanie_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const match = task.tresc.match(/liczbę (-?\d+,\d+) do/);
      assert.ok(match, `unexpected format: "${task.tresc}"`);
      const value = Number(match[1].replace(',', '.'));
      const expected = Math.round(value * 100) / 100;
      assert.equal(parsePl(task.odpowiedz), expected, task.tresc);
    }
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/topics/arytmetykaEgzamin.test.js`
Expected: FAIL.

- [ ] **Step 3: Update the implementation**

Add after `potegaIloczyn`:

```js
const ZAOKRAGLANIE_RANGES = {
  latwy: { max: 999 },
  sredni: { max: 9999 },
  trudny: { max: 99999 },
};

function zaokraglanie(difficulty, rng) {
  const { max } = ZAOKRAGLANIE_RANGES[difficulty];
  const thousandths = rng.int(1, max);
  const value = thousandths / 1000;
  const correct = formatNumber(Math.round(value * 100) / 100);

  // Typowe błędy: obcięcie zamiast zaokrąglenia, zaokrąglenie do dziesiątych
  // zamiast setnych, błąd o jeden na ostatniej cyfrze.
  const wrong = [
    formatNumber(Math.floor(value * 100) / 100),
    formatNumber(Math.round(value * 10) / 10),
    formatNumber(Math.round(value * 100) / 100 + 0.01),
  ];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'arytmetyka_zaokraglanie_egz',
    type: 'zamkniete',
    tresc: `Zaokrąglij liczbę ${formatNumber(value)} do części setnych (do dwóch miejsc po przecinku).`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Trzecia cyfra po przecinku decyduje o zaokrągleniu drugiej.\n` +
      `${formatNumber(value)} zaokrąglone do setnych daje ${correct}.`,
  };
}
```

Add `{ id: 'arytmetyka_zaokraglanie_egz', generate: zaokraglanie },` to the templates array.

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/arytmetykaEgzamin.test.js`
Expected: PASS.

- [ ] **Step 5: Run the full suite**

Run: `node --test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/topics/arytmetykaEgzamin.js test/topics/arytmetykaEgzamin.test.js
git commit -m "feat: add arytmetyka_zaokraglanie_egz template"
```

---

### Task 5: Add `arytmetyka_kolejnosc_dzialan_egz`

**Files:**
- Modify: `js/topics/arytmetykaEgzamin.js`
- Modify: `test/topics/arytmetykaEgzamin.test.js`

**Interfaces:**
- Consumes: `formatNumber`, `buildOptions`
- Produces: `arytmetyka_kolejnosc_dzialan_egz` (closed).

- [ ] **Step 1: Write the failing tests**

Update count test to 10. Then add:

```js
test('kolejnosc dzialan: the stated value equals a + b*c - d evaluated with correct precedence', () => {
  const template = templates.find((t) => t.id === 'arytmetyka_kolejnosc_dzialan_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [a, b, c, d] = task.tresc.match(/-?\d+/g).map(Number);
      const expected = a + b * c - d;
      assert.equal(parsePl(task.odpowiedz), expected, task.tresc);
    }
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/topics/arytmetykaEgzamin.test.js`
Expected: FAIL.

- [ ] **Step 3: Update the implementation**

Add after `zaokraglanie`:

```js
const KOLEJNOSC_RANGES = {
  latwy: { max: 10 },
  sredni: { max: 15 },
  trudny: { max: 20 },
};

function kolejnoscDzialan(difficulty, rng) {
  const { max } = KOLEJNOSC_RANGES[difficulty];
  const a = rng.int(1, max);
  const b = rng.int(1, max);
  const c = rng.int(1, max);
  const d = rng.int(1, max);
  const correct = formatNumber(a + b * c - d);

  // Typowe błędy: wykonanie działań od lewej do prawej z pominięciem
  // kolejności działań, błędne pogrupowanie mnożenia, zły znak przy d.
  const wrong = [
    formatNumber((a + b) * c - d),
    formatNumber(a + b * (c - d)),
    formatNumber(a + b * c + d),
  ];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'arytmetyka_kolejnosc_dzialan_egz',
    type: 'zamkniete',
    tresc: `Oblicz wartość wyrażenia: ${a} + ${b} · ${c} - ${d}.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Najpierw mnożenie: ${b} · ${c} = ${b * c}.\n` +
      `Następnie dodawanie i odejmowanie od lewej: ${a} + ${b * c} - ${d} = ${correct}.`,
  };
}
```

Add `{ id: 'arytmetyka_kolejnosc_dzialan_egz', generate: kolejnoscDzialan },` to the templates array.

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/arytmetykaEgzamin.test.js`
Expected: PASS.

- [ ] **Step 5: Run the full suite**

Run: `node --test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/topics/arytmetykaEgzamin.js test/topics/arytmetykaEgzamin.test.js
git commit -m "feat: add arytmetyka_kolejnosc_dzialan_egz template"
```

---

### Task 6: Add `arytmetyka_ulamek_dziesietny_zamiana_egz`

**Files:**
- Modify: `js/topics/arytmetykaEgzamin.js`
- Modify: `test/topics/arytmetykaEgzamin.test.js`

**Interfaces:**
- Consumes: `formatNumber`, `buildOptions`
- Produces: `arytmetyka_ulamek_dziesietny_zamiana_egz` (closed).

- [ ] **Step 1: Write the failing tests**

Update count test to 11. Then add:

```js
test('ulamek dziesietny zamiana: the stated value equals m/n', () => {
  const template = templates.find((t) => t.id === 'arytmetyka_ulamek_dziesietny_zamiana_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const match = task.tresc.match(/ułamek (\d+)\/(\d+)/);
      assert.ok(match, `unexpected format: "${task.tresc}"`);
      const m = Number(match[1]);
      const n = Number(match[2]);
      assert.ok(Math.abs(parsePl(task.odpowiedz) - m / n) < 1e-6, task.tresc);
    }
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/topics/arytmetykaEgzamin.test.js`
Expected: FAIL.

- [ ] **Step 3: Update the implementation**

Add after `kolejnoscDzialan`:

```js
// Every denominator below divides some power of 10, so m/n always
// terminates within formatNumber's 4 decimal places.
const ZAMIANA_DENOMINATORY = [2, 4, 5, 8, 10, 20, 25, 50];

function ulamekDziesietnyZamiana(difficulty, rng) {
  const n = rng.pick(ZAMIANA_DENOMINATORY);
  const m = rng.int(1, 2 * n);
  const value = m / n;
  const correct = formatNumber(value);

  // Typowe błędy: odwrócenie ułamka, przesunięcie przecinka o jedno miejsce
  // w złą stronę.
  const wrong = [formatNumber(n / m), formatNumber(value * 10), formatNumber(value / 10)];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'arytmetyka_ulamek_dziesietny_zamiana_egz',
    type: 'zamkniete',
    tresc: `Zamień ułamek ${m}/${n} na liczbę dziesiętną.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie: `Dzielimy licznik przez mianownik: ${m} : ${n} = ${correct}.`,
  };
}
```

Add `{ id: 'arytmetyka_ulamek_dziesietny_zamiana_egz', generate: ulamekDziesietnyZamiana },` to the templates array.

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/arytmetykaEgzamin.test.js`
Expected: PASS.

- [ ] **Step 5: Run the full suite**

Run: `node --test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/topics/arytmetykaEgzamin.js test/topics/arytmetykaEgzamin.test.js
git commit -m "feat: add arytmetyka_ulamek_dziesietny_zamiana_egz template"
```

---

### Task 7: Add `arytmetyka_najwieksza_najmniejsza_egz`

**Files:**
- Modify: `js/topics/arytmetykaEgzamin.js`
- Modify: `test/topics/arytmetykaEgzamin.test.js`

**Interfaces:**
- Consumes: `formatNumber`, `buildOptions`
- Produces: `arytmetyka_najwieksza_najmniejsza_egz` (closed).

- [ ] **Step 1: Write the failing tests**

Update count test to 12. Then add:

```js
test('najwieksza najmniejsza: the stated answer is the largest of the four listed numbers', () => {
  const template = templates.find((t) => t.id === 'arytmetyka_najwieksza_najmniejsza_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const numbers = task.tresc
        .match(/liczby: ([^.]+)\./)[1]
        .split(',')
        .map((s) => Number(s.trim().replace(',', '.')));
      const expected = Math.max(...numbers);
      assert.ok(Math.abs(parsePl(task.odpowiedz) - expected) < 1e-6, task.tresc);
    }
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/topics/arytmetykaEgzamin.test.js`
Expected: FAIL.

- [ ] **Step 3: Update the implementation**

Add after `ulamekDziesietnyZamiana`:

```js
const NAJWIEKSZA_RANGES = {
  latwy: { max: 20, decimals: false },
  sredni: { max: 50, decimals: true },
  trudny: { max: 100, decimals: true },
};

function najwiekszaNajmniejsza(difficulty, rng) {
  const { max, decimals } = NAJWIEKSZA_RANGES[difficulty];
  const values = new Set();
  while (values.size < 4) {
    const whole = rng.int(-max, max);
    const value = decimals ? whole + rng.pick([0, 0.5]) : whole;
    values.add(value);
  }
  const numbers = [...values];
  const correct = formatNumber(Math.max(...numbers));
  const wrong = numbers.filter((v) => v !== Math.max(...numbers)).map((v) => formatNumber(v));

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'arytmetyka_najwieksza_najmniejsza_egz',
    type: 'zamkniete',
    tresc: `Dane są liczby: ${numbers.map((v) => formatNumber(v)).join(', ')}. Wybierz największą z podanych liczb.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie: `Porównując podane liczby na osi liczbowej, największa z nich to ${correct}.`,
  };
}
```

Add `{ id: 'arytmetyka_najwieksza_najmniejsza_egz', generate: najwiekszaNajmniejsza },` to the templates array.

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/arytmetykaEgzamin.test.js`
Expected: PASS.

- [ ] **Step 5: Run the full suite**

Run: `node --test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/topics/arytmetykaEgzamin.js test/topics/arytmetykaEgzamin.test.js
git commit -m "feat: add arytmetyka_najwieksza_najmniejsza_egz template"
```

---

### Task 8: Add `arytmetyka_dzielnik_pierwszy_egz`

**Files:**
- Modify: `js/topics/arytmetykaEgzamin.js`
- Modify: `test/topics/arytmetykaEgzamin.test.js`

**Interfaces:**
- Consumes: `buildOptions`
- Produces: `arytmetyka_dzielnik_pierwszy_egz` (closed).

- [ ] **Step 1: Write the failing tests**

Update count test to 13. Then add:

```js
const PRIMES_TEST = [2, 3, 5, 7, 11, 13, 17, 19, 23];
function isPrimeIndependent(x) {
  if (x < 2) return false;
  for (let d = 2; d * d <= x; d++) if (x % d === 0) return false;
  return true;
}

test('dzielnik pierwszy: the stated answer is prime and divides N', () => {
  const template = templates.find((t) => t.id === 'arytmetyka_dzielnik_pierwszy_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const match = task.tresc.match(/N = (\d+) · (\d+) = (\d+)/);
      assert.ok(match, `unexpected format: "${task.tresc}"`);
      const N = Number(match[3]);
      const answer = Number(task.odpowiedz);
      assert.ok(isPrimeIndependent(answer), `${answer} is not prime`);
      assert.equal(N % answer, 0, `${answer} does not divide ${N}`);
    }
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/topics/arytmetykaEgzamin.test.js`
Expected: FAIL.

- [ ] **Step 3: Update the implementation**

Add after `najwiekszaNajmniejsza`:

```js
const DZIELNIK_RANGES = {
  latwy: { primes: [2, 3, 5, 7] },
  sredni: { primes: [2, 3, 5, 7, 11, 13] },
  trudny: { primes: [2, 3, 5, 7, 11, 13, 17, 19] },
};

function dzielnikPierwszy(difficulty, rng) {
  const { primes } = DZIELNIK_RANGES[difficulty];
  let p, q, r;
  do {
    p = rng.pick(primes);
    q = rng.pick(primes);
  } while (p === q);
  do {
    r = rng.pick(primes);
  } while (r === p || r === q);
  const N = p * q;
  const correct = String(p);

  // Typowe błędy: podanie liczby N (złożonej), podanie jedynki (nie jest
  // liczbą pierwszą), podanie liczby pierwszej niebędącej dzielnikiem N.
  const wrong = [String(N), '1', String(r)];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'arytmetyka_dzielnik_pierwszy_egz',
    type: 'zamkniete',
    tresc: `Liczba N jest iloczynem dwóch liczb pierwszych: N = ${p} · ${q} = ${N}. Który z podanych dzielników liczby N jest liczbą pierwszą?`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Dzielnikami liczby N są: 1, ${p}, ${q}, ${N}.\n` +
      `Spośród podanych opcji liczbą pierwszą i jednocześnie dzielnikiem N jest ${correct}.`,
  };
}
```

Add `{ id: 'arytmetyka_dzielnik_pierwszy_egz', generate: dzielnikPierwszy },` to the templates array.

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/arytmetykaEgzamin.test.js`
Expected: PASS.

- [ ] **Step 5: Run the full suite**

Run: `node --test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/topics/arytmetykaEgzamin.js test/topics/arytmetykaEgzamin.test.js
git commit -m "feat: add arytmetyka_dzielnik_pierwszy_egz template"
```

---

### Task 9: Add `arytmetyka_procent_prosty_egz`

**Files:**
- Modify: `js/topics/arytmetykaEgzamin.js`
- Modify: `test/topics/arytmetykaEgzamin.test.js`

**Interfaces:**
- Consumes: `formatNumber`, `buildOptions`
- Produces: `arytmetyka_procent_prosty_egz` (closed).

- [ ] **Step 1: Write the failing tests**

Update count test to 14. Then add:

```js
test('procent prosty: the stated value equals X% of Y', () => {
  const template = templates.find((t) => t.id === 'arytmetyka_procent_prosty_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const match = task.tresc.match(/(\d+)% liczby (\d+)/);
      assert.ok(match, `unexpected format: "${task.tresc}"`);
      const p = Number(match[1]);
      const y = Number(match[2]);
      assert.ok(Math.abs(parsePl(task.odpowiedz) - (p * y) / 100) < 1e-6, task.tresc);
    }
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/topics/arytmetykaEgzamin.test.js`
Expected: FAIL.

- [ ] **Step 3: Update the implementation**

Add after `dzielnikPierwszy`:

```js
const PROCENT_PROSTY_RANGES = {
  latwy: { yMax: 200, pSet: [10, 20, 50] },
  sredni: { yMax: 500, pSet: [10, 20, 25, 40, 50] },
  trudny: { yMax: 1000, pSet: [5, 10, 15, 20, 25, 40, 50, 75] },
};

function procentProsty(difficulty, rng) {
  const { yMax, pSet } = PROCENT_PROSTY_RANGES[difficulty];
  const p = rng.pick(pSet);
  const y = rng.int(2, Math.floor(yMax / 20)) * 20;
  const correct = formatNumber((p * y) / 100);

  // Typowe błędy: pomnożenie zamiast podzielenia przez 100, podzielenie
  // zamiast pomnożenia, przesunięcie przecinka o jedno miejsce.
  const wrong = [formatNumber(p * y), formatNumber(y / p), formatNumber((p * y) / 1000)];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'arytmetyka_procent_prosty_egz',
    type: 'zamkniete',
    tresc: `Oblicz ${p}% liczby ${y}.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie: `${p}% liczby ${y} to ${p}/100 · ${y} = ${correct}.`,
  };
}
```

Add `{ id: 'arytmetyka_procent_prosty_egz', generate: procentProsty },` to the templates array.

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/arytmetykaEgzamin.test.js`
Expected: PASS.

- [ ] **Step 5: Run the full suite**

Run: `node --test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/topics/arytmetykaEgzamin.js test/topics/arytmetykaEgzamin.test.js
git commit -m "feat: add arytmetyka_procent_prosty_egz template"
```

---

### Task 10: Add `arytmetyka_reszta_z_dzielenia_egz`

**Files:**
- Modify: `js/topics/arytmetykaEgzamin.js`
- Modify: `test/topics/arytmetykaEgzamin.test.js`

**Interfaces:**
- Consumes: `formatNumber`, `buildOptions`
- Produces: `arytmetyka_reszta_z_dzielenia_egz` (closed).

- [ ] **Step 1: Write the failing tests**

Update count test to 15. Then add:

```js
test('reszta z dzielenia: the stated value equals n mod d', () => {
  const template = templates.find((t) => t.id === 'arytmetyka_reszta_z_dzielenia_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const match = task.tresc.match(/liczby (\d+) przez (\d+)/);
      assert.ok(match, `unexpected format: "${task.tresc}"`);
      const n = Number(match[1]);
      const d = Number(match[2]);
      assert.equal(parsePl(task.odpowiedz), n % d, task.tresc);
    }
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/topics/arytmetykaEgzamin.test.js`
Expected: FAIL.

- [ ] **Step 3: Update the implementation**

Add after `procentProsty`:

```js
const RESZTA_RANGES = {
  latwy: { dMax: 8, nMax: 60 },
  sredni: { dMax: 12, nMax: 150 },
  trudny: { dMax: 15, nMax: 300 },
};

function resztaZDzielenia(difficulty, rng) {
  const { dMax, nMax } = RESZTA_RANGES[difficulty];
  const d = rng.int(2, dMax);
  const n = rng.int(d + 1, nMax);
  const reszta = n % d;
  const iloraz = Math.floor(n / d);
  const correct = formatNumber(reszta);

  // Typowe błędy: podanie ilorazu zamiast reszty, odjęcie reszty od
  // dzielnika, użycie złego dzielnika.
  const wrong = [
    formatNumber(iloraz),
    formatNumber(d - reszta === d ? 0 : d - reszta),
    formatNumber(n % (d + 1)),
  ];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'arytmetyka_reszta_z_dzielenia_egz',
    type: 'zamkniete',
    tresc: `Oblicz resztę z dzielenia liczby ${n} przez ${d}.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `${n} : ${d} = ${iloraz} reszty ${reszta} (bo ${iloraz} · ${d} = ${iloraz * d}, a ${n} - ${iloraz * d} = ${reszta}).`,
  };
}
```

Add `{ id: 'arytmetyka_reszta_z_dzielenia_egz', generate: resztaZDzielenia },` to the templates array.

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/arytmetykaEgzamin.test.js`
Expected: PASS.

- [ ] **Step 5: Run the full suite**

Run: `node --test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/topics/arytmetykaEgzamin.js test/topics/arytmetykaEgzamin.test.js
git commit -m "feat: add arytmetyka_reszta_z_dzielenia_egz template"
```

---

### Task 11: Add `arytmetyka_parzystosc_kul_egz`

**Files:**
- Modify: `js/topics/arytmetykaEgzamin.js`
- Modify: `test/topics/arytmetykaEgzamin.test.js`

**Interfaces:**
- Consumes: `formatNumber`
- Produces: `arytmetyka_parzystosc_kul_egz` (open, compound P/parity + sum answer).

- [ ] **Step 1: Write the failing tests**

Update count test to 16. Then add:

```js
test('parzystosc kul: the stated parity and sum are independently correct', () => {
  const template = templates.find((t) => t.id === 'arytmetyka_parzystosc_kul_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const match = task.tresc.match(/było (\d+) kul[\s\S]*wylosowano (\d+) kul/);
      assert.ok(match, `unexpected format: "${task.tresc}"`);
      const N = Number(match[1]);
      const r = Number(match[2]);
      const oddCount = (N + 1) / 2;
      const evenCount = (N - 1) / 2;
      const kept = N - r;
      const keepOdd = kept === oddCount;
      assert.ok(keepOdd || kept === evenCount, `kept=${kept} matches neither parity count for N=${N}`);
      let expectedSum = 0;
      for (let k = 1; k <= N; k++) {
        if (k % 2 === 1 === keepOdd) expectedSum += k;
      }
      const ansMatch = task.odpowiedz.match(/Liczby (\w+), suma = (-?\d+(?:,\d+)?)/);
      assert.ok(ansMatch, `unexpected answer format: "${task.odpowiedz}"`);
      assert.equal(ansMatch[1], keepOdd ? 'nieparzystymi' : 'parzystymi');
      assert.equal(parsePl(ansMatch[2]), expectedSum, task.tresc);
    }
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/topics/arytmetykaEgzamin.test.js`
Expected: FAIL.

- [ ] **Step 3: Update the implementation**

Add after `resztaZDzielenia`:

```js
const PARZYSTOSC_RANGES = {
  latwy: { maxHalf: 5 },
  sredni: { maxHalf: 7 },
  trudny: { maxHalf: 10 },
};

function parzystoscKul(difficulty, rng) {
  const { maxHalf } = PARZYSTOSC_RANGES[difficulty];
  // N is always odd, so the odd-count and even-count of 1..N differ (by
  // exactly 1) and never collide — the "kept" count below always resolves
  // to a unique parity, avoiding the ambiguous case where both parities
  // would leave the same number of balls behind.
  const N = 2 * rng.int(3, maxHalf) + 1;
  const oddCount = (N + 1) / 2;
  const evenCount = (N - 1) / 2;
  const keepOdd = rng.bool();
  const kept = keepOdd ? oddCount : evenCount;
  const r = N - kept;
  let sum = 0;
  for (let k = 1; k <= N; k++) {
    if (k % 2 === 1 === keepOdd) sum += k;
  }
  const parityLabel = keepOdd ? 'nieparzystymi' : 'parzystymi';

  return {
    id: 'arytmetyka_parzystosc_kul_egz',
    type: 'otwarte',
    tresc:
      `W pudełku było ${N} kul ponumerowanych kolejnymi liczbami naturalnymi od 1 do ${N}. ` +
      `Z tego pudełka wylosowano ${r} kul. Suma liczb na dowolnych dwóch kulach, które ` +
      `pozostały w pudełku, jest parzysta. Podaj, jakimi liczbami (parzystymi czy ` +
      `nieparzystymi) są ponumerowane kule, które zostały w pudełku, oraz oblicz sumę ` +
      `liczb na tych kulach.`,
    odpowiedz: `Liczby ${parityLabel}, suma = ${formatNumber(sum)}`,
    rozwiazanie:
      `Suma dwóch liczb jest parzysta tylko wtedy, gdy obie są parzyste albo obie ` +
      `nieparzyste — gdyby wśród pozostałych kul była mieszanka obu parzystości, dałoby ` +
      `się znaleźć dwie kule o sumie nieparzystej. Zatem wszystkie pozostałe kule mają tę ` +
      `samą parzystość: ${parityLabel}.\n` +
      `Suma liczb ${parityLabel} od 1 do ${N}: ${formatNumber(sum)}.`,
  };
}
```

Add `{ id: 'arytmetyka_parzystosc_kul_egz', generate: parzystoscKul },` to the templates array.

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/arytmetykaEgzamin.test.js`
Expected: PASS.

- [ ] **Step 5: Run the full suite**

Run: `node --test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/topics/arytmetykaEgzamin.js test/topics/arytmetykaEgzamin.test.js
git commit -m "feat: add arytmetyka_parzystosc_kul_egz template"
```

---

### Task 12: Add `arytmetyka_dzialania_lancuchowe_egz`

**Files:**
- Modify: `js/topics/arytmetykaEgzamin.js`
- Modify: `test/topics/arytmetykaEgzamin.test.js`

**Interfaces:**
- Consumes: `formatNumber`
- Produces: `arytmetyka_dzialania_lancuchowe_egz` (open).

- [ ] **Step 1: Write the failing tests**

Update count test to 17. Then add:

```js
test('dzialania lancuchowe: the stated remainder is independently correct', () => {
  const template = templates.find((t) => t.id === 'arytmetyka_dzialania_lancuchowe_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const match = task.tresc.match(/miała (\d+) zł[\s\S]*1\/(\d+) na książkę[\s\S]*1\/(\d+) pozostałej/);
      assert.ok(match, `unexpected format: "${task.tresc}"`);
      const X = Number(match[1]);
      const d1 = Number(match[2]);
      const d2 = Number(match[3]);
      const step1 = X / d1;
      const pozostalo1 = X - step1;
      const step2 = pozostalo1 / d2;
      const expected = pozostalo1 - step2;
      assert.equal(parsePl(task.odpowiedz), expected, task.tresc);
    }
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/topics/arytmetykaEgzamin.test.js`
Expected: FAIL.

- [ ] **Step 3: Update the implementation**

Add after `parzystoscKul`:

```js
const LANCUCH_RANGES = {
  latwy: { d1: [2, 3], d2: [2, 4], kMax: 6 },
  sredni: { d1: [3, 4], d2: [3, 5], kMax: 10 },
  trudny: { d1: [4, 5], d2: [4, 6], kMax: 15 },
};

function dzialaniaLancuchowe(difficulty, rng) {
  const { d1: d1Choices, d2: d2Choices, kMax } = LANCUCH_RANGES[difficulty];
  const d1 = rng.pick(d1Choices);
  const d2 = rng.pick(d2Choices);
  const k = rng.int(2, kMax);
  // X = d1 * d2 * k guarantees both the first spend (X/d1) and the second
  // spend (a d2-th of the remainder) come out as exact integers, since the
  // remainder after the first spend is always d2*k*(d1-1).
  const X = d1 * d2 * k;
  const step1 = X / d1;
  const pozostalo1 = X - step1;
  const step2 = pozostalo1 / d2;
  const pozostalo2 = pozostalo1 - step2;

  return {
    id: 'arytmetyka_dzialania_lancuchowe_egz',
    type: 'otwarte',
    tresc:
      `Ola miała ${formatNumber(X)} zł. Wydała 1/${d1} tej kwoty na książkę, a następnie ` +
      `1/${d2} pozostałej kwoty na zeszyt. Oblicz, ile złotych zostało Oli.`,
    odpowiedz: formatNumber(pozostalo2),
    rozwiazanie:
      `Kwota wydana na książkę: ${formatNumber(X)} : ${d1} = ${formatNumber(step1)} zł.\n` +
      `Pozostało: ${formatNumber(X)} - ${formatNumber(step1)} = ${formatNumber(pozostalo1)} zł.\n` +
      `Kwota wydana na zeszyt: ${formatNumber(pozostalo1)} : ${d2} = ${formatNumber(step2)} zł.\n` +
      `Zostało: ${formatNumber(pozostalo1)} - ${formatNumber(step2)} = ${formatNumber(pozostalo2)} zł.`,
  };
}
```

Add `{ id: 'arytmetyka_dzialania_lancuchowe_egz', generate: dzialaniaLancuchowe },` to the templates array.

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/arytmetykaEgzamin.test.js`
Expected: PASS.

- [ ] **Step 5: Run the full suite**

Run: `node --test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/topics/arytmetykaEgzamin.js test/topics/arytmetykaEgzamin.test.js
git commit -m "feat: add arytmetyka_dzialania_lancuchowe_egz template"
```

---

### Task 13: Add `arytmetyka_szacowanie_egz`

**Files:**
- Modify: `js/topics/arytmetykaEgzamin.js`
- Modify: `test/topics/arytmetykaEgzamin.test.js`

**Interfaces:**
- Consumes: `formatNumber`
- Produces: `arytmetyka_szacowanie_egz` (open).

- [ ] **Step 1: Write the failing tests**

Update count test to 18. Then add:

```js
test('szacowanie: the stated number of vehicles is the independently computed ceiling', () => {
  const template = templates.find((t) => t.id === 'arytmetyka_szacowanie_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const match = task.tresc.match(/co najwyżej (\d+) osób[\s\S]*przewieźć (\d+) osób/);
      assert.ok(match, `unexpected format: "${task.tresc}"`);
      const cap = Number(match[1]);
      const n = Number(match[2]);
      assert.equal(parsePl(task.odpowiedz), Math.ceil(n / cap), task.tresc);
    }
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/topics/arytmetykaEgzamin.test.js`
Expected: FAIL.

- [ ] **Step 3: Update the implementation**

Add after `dzialaniaLancuchowe`:

```js
const SZACOWANIE_RANGES = {
  latwy: { capMax: 30, nMax: 200 },
  sredni: { capMax: 50, nMax: 500 },
  trudny: { capMax: 80, nMax: 1000 },
};

function szacowanie(difficulty, rng) {
  const { capMax, nMax } = SZACOWANIE_RANGES[difficulty];
  const cap = rng.int(10, capMax);
  let n = rng.int(cap + 1, nMax);
  if (n % cap === 0) n += 1; // keep the ceiling genuinely meaningful, not a clean division
  const vehicles = Math.ceil(n / cap);

  return {
    id: 'arytmetyka_szacowanie_egz',
    type: 'otwarte',
    tresc: `Jeden autobus może przewieźć co najwyżej ${cap} osób. Oblicz, ile co najmniej autobusów potrzeba, aby przewieźć ${n} osób.`,
    odpowiedz: formatNumber(vehicles),
    rozwiazanie:
      `${n} : ${cap} = ${formatNumber(Number((n / cap).toFixed(4)))}.\n` +
      `Liczba autobusów musi być liczbą całkowitą wystarczającą dla wszystkich osób, ` +
      `więc zaokrąglamy w górę: ${vehicles}.`,
  };
}
```

Add `{ id: 'arytmetyka_szacowanie_egz', generate: szacowanie },` to the templates array.

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/arytmetykaEgzamin.test.js`
Expected: PASS.

- [ ] **Step 5: Run the full suite**

Run: `node --test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/topics/arytmetykaEgzamin.js test/topics/arytmetykaEgzamin.test.js
git commit -m "feat: add arytmetyka_szacowanie_egz template"
```

---

### Task 14: Add `arytmetyka_czas_kalendarz_egz`

**Files:**
- Modify: `js/topics/arytmetykaEgzamin.js`
- Modify: `test/topics/arytmetykaEgzamin.test.js`

**Interfaces:**
- Consumes: nothing new
- Produces: `arytmetyka_czas_kalendarz_egz` (open).

- [ ] **Step 1: Write the failing tests**

Update count test to 19. Then add:

```js
test('czas kalendarz: the stated arrival time is independently correct modulo 24h', () => {
  const template = templates.find((t) => t.id === 'arytmetyka_czas_kalendarz_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const match = task.tresc.match(/godzinie (\d{2}):(\d{2})[\s\S]*przez (\d+) minut/);
      assert.ok(match, `unexpected format: "${task.tresc}"`);
      const H = Number(match[1]);
      const M = Number(match[2]);
      const D = Number(match[3]);
      const startTotal = H * 60 + M;
      const endTotal = (startTotal + D) % 1440;
      const expectedH = String(Math.floor(endTotal / 60)).padStart(2, '0');
      const expectedM = String(endTotal % 60).padStart(2, '0');
      assert.equal(task.odpowiedz, `${expectedH}:${expectedM}`, task.tresc);
    }
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/topics/arytmetykaEgzamin.test.js`
Expected: FAIL.

- [ ] **Step 3: Update the implementation**

Add after `szacowanie`:

```js
const CZAS_RANGES = {
  latwy: { dMax: 180 },
  sredni: { dMax: 400 },
  trudny: { dMax: 800 },
};

function czasKalendarz(difficulty, rng) {
  const { dMax } = CZAS_RANGES[difficulty];
  const H = rng.int(0, 23);
  const M = rng.int(0, 59);
  const D = rng.int(15, dMax);
  const startTotal = H * 60 + M;
  const endTotal = (startTotal + D) % 1440;
  const HH = String(H).padStart(2, '0');
  const MM = String(M).padStart(2, '0');
  const endHH = String(Math.floor(endTotal / 60)).padStart(2, '0');
  const endMM = String(endTotal % 60).padStart(2, '0');

  return {
    id: 'arytmetyka_czas_kalendarz_egz',
    type: 'otwarte',
    tresc: `Pociąg odjechał ze stacji o godzinie ${HH}:${MM} i jechał przez ${D} minut. Oblicz, o której godzinie dotarł do celu (podaj godzinę i minuty).`,
    odpowiedz: `${endHH}:${endMM}`,
    rozwiazanie:
      `Czas odjazdu w minutach od północy: ${H} · 60 + ${M} = ${startTotal}.\n` +
      `Czas przyjazdu w minutach: ${startTotal} + ${D} = ${startTotal + D}, ` +
      `co po uwzględnieniu doby daje ${endHH}:${endMM}.`,
  };
}
```

Add `{ id: 'arytmetyka_czas_kalendarz_egz', generate: czasKalendarz },` to the templates array.

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/arytmetykaEgzamin.test.js`
Expected: PASS.

- [ ] **Step 5: Run the full suite**

Run: `node --test`
Expected: PASS — `arytmetykaEgzamin.js` now exports 19 templates (13 closed, 6 open), matching the target.

- [ ] **Step 6: Commit**

```bash
git add js/topics/arytmetykaEgzamin.js test/topics/arytmetykaEgzamin.test.js
git commit -m "feat: add arytmetyka_czas_kalendarz_egz template"
```

---

## Part 2: New file `js/topics/rownaniaEgzamin.js` (target 10 closed / 4 open)

### Task 15: Create `rownaniaEgzamin.js`, migrate `rownania_srednia_arytmetyczna` and `rownania_podzial_na_grupy`

**Files:**
- Create: `js/topics/rownaniaEgzamin.js`
- Create: `test/topics/rownaniaEgzamin.test.js`
- Modify: `js/topicRegistry.js`

**Interfaces:**
- Consumes: `formatNumber` (`js/format.js`), `buildOptions` (`js/distractors.js`)
- Produces: `templates` array with `rownania_srednia_arytmetyczna_egz` (closed), `rownania_podzial_na_grupy_egz` (open) — exact duplicates of `rownania.js`'s `sredniaArytmetyczna`/`podzialNaGrupy`, renamed. Registers a new exam-exclusive topic key `rownania_osmoklasisty` in `js/topicRegistry.js`.

- [ ] **Step 1: Write the failing test**

Create `test/topics/rownaniaEgzamin.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { templates } from '../../js/topics/rownaniaEgzamin.js';
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

test('srednia arytmetyczna egz: c equals 3Y - 2X for the stated X and Y', () => {
  const template = templates.find((t) => t.id === 'rownania_srednia_arytmetyczna_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [X, Y] = task.tresc.match(/równa (\d+)/g).map((m) => Number(m.replace('równa ', '')));
      const expected = 3 * Y - 2 * X;
      assert.equal(parsePl(task.odpowiedz), expected, `X=${X} Y=${Y} -> ${task.odpowiedz}`);
    }
  }
});

test('podzial na grupy egz: the total splits exactly into the stated ratio/difference relationship', () => {
  const template = templates.find((t) => t.id === 'rownania_podzial_na_grupy_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const total = Number(task.tresc.match(/łącznie (\d+)/)[1]);
      const k = parsePl(task.tresc.match(/(\d+(?:,\d+)?) razy więcej/)[1]);
      const d = Number(task.tresc.match(/o (\d+) mniej/)[1]);
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

Run: `node --test test/topics/rownaniaEgzamin.test.js`
Expected: FAIL — `js/topics/rownaniaEgzamin.js` does not exist yet.

- [ ] **Step 3: Write the implementation**

Create `js/topics/rownaniaEgzamin.js`:

```js
// Równania — bank egzaminu ósmoklasisty. Exam-exclusive: this topic is
// registered in js/topicRegistry.js's TOPICS but deliberately listed under
// no grade's topicKeys, so it never appears in Ćwiczenia mode. Templates
// here are either migrated duplicates of js/topics/rownania.js's exam-style
// templates (kept self-contained rather than imported, so this pool stays
// immune to future changes in the shared Ćwiczenia file) or new templates
// covering algebra reasoning shapes the real egzamin ósmoklasisty tests.
//
// Poziomy trudności:
//   łatwy   - mniejsze wartości/współczynniki
//   średni  - większe wartości
//   trudny  - jeszcze większe wartości / szerszy zakres

import { formatNumber } from '../format.js';
import { buildOptions } from '../distractors.js';

const SREDNIA_RANGES = {
  latwy: { meanMax: 10 },
  sredni: { meanMax: 20 },
  trudny: { meanMax: 30 },
};

function sredniaArytmetycznaEgz(difficulty, rng) {
  const { meanMax } = SREDNIA_RANGES[difficulty];
  const Y = rng.int(1, meanMax);
  const X = rng.int(1, Math.floor((3 * Y - 1) / 2));
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
    id: 'rownania_srednia_arytmetyczna_egz',
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

const PODZIAL_RANGES = {
  latwy: { baseMax: 20, dMax: 5, ratios: [2, 3] },
  sredni: { baseMax: 30, dMax: 10, ratios: [2, 3, 1.5] },
  trudny: { baseMax: 40, dMax: 15, ratios: [1.5, 2, 2.5, 3] },
};

function podzialNaGrupyEgz(difficulty, rng) {
  const { baseMax, dMax, ratios } = PODZIAL_RANGES[difficulty];
  const k = rng.pick(ratios);
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
    id: 'rownania_podzial_na_grupy_egz',
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

export const templates = [
  { id: 'rownania_srednia_arytmetyczna_egz', generate: sredniaArytmetycznaEgz },
  { id: 'rownania_podzial_na_grupy_egz', generate: podzialNaGrupyEgz },
];
```

In `js/topicRegistry.js`, add the import near the other `_egzamin` imports:

```js
import { templates as rownaniaEgzamin } from './topics/rownaniaEgzamin.js';
```

And add the topic entry at the end of `TOPICS`, following the exam-exclusive comment pattern:

```js
  // Exam-exclusive: deliberately not listed under any grade's topicKeys.
  { key: 'rownania_osmoklasisty', label: 'Równania (egzamin ósmoklasisty)', templates: rownaniaEgzamin },
```

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/rownaniaEgzamin.test.js`
Expected: PASS, all tests.

- [ ] **Step 5: Run the full suite**

Run: `node --test`
Expected: PASS, every test in the project.

- [ ] **Step 6: Commit**

```bash
git add js/topics/rownaniaEgzamin.js test/topics/rownaniaEgzamin.test.js js/topicRegistry.js
git commit -m "feat: create rownaniaEgzamin.js, migrate srednia_arytmetyczna and podzial_na_grupy"
```

---

### Task 16: Add `rownania_wzor_przeksztalcenie_egz`

**Files:**
- Modify: `js/topics/rownaniaEgzamin.js`
- Modify: `test/topics/rownaniaEgzamin.test.js`

**Interfaces:**
- Consumes: `buildOptions`
- Produces: `rownania_wzor_przeksztalcenie_egz` (closed), built from a small fixed catalog — never a symbolic-algebra engine.

- [ ] **Step 1: Write the failing tests**

Update the count test:

```js
test('exports three templates with unique ids', () => {
  assert.equal(templates.length, 3);
  assert.equal(new Set(templates.map((t) => t.id)).size, 3);
});
```

(replaces `'exports two templates with unique ids'`). Then add:

```js
test('wzor przeksztalcenie: the stated answer is always one of the catalog\'s correct rearrangements', () => {
  const template = templates.find((t) => t.id === 'rownania_wzor_przeksztalcenie_egz');
  const knownCorrect = ['2S = n² + n', 'a = 2P : h', 'a = Obw : 2 - b', 'v = s : t', 'c = C : (1 + p : 100)'];
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 100; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      assert.ok(knownCorrect.includes(task.odpowiedz), `unexpected answer: "${task.odpowiedz}"`);
    }
  }
});

test('wzor przeksztalcenie: every catalog entry\'s correct rearrangement holds numerically and every wrong one does not', () => {
  // Independent, hand-derived numeric verification of the fixed catalog —
  // deliberately unaware of the template's own internal structure.

  // Entry 1: S = n(n+1)/2  =>  correct: 2S = n^2 + n
  for (const n of [3, 7, 12]) {
    const S = (n * (n + 1)) / 2;
    assert.equal(2 * S, n * n + n);
    assert.notEqual(2 * S, n * n);
    assert.notEqual(S, n * n + n);
    assert.notEqual(2 * S, n * n - n);
  }

  // Entry 2: P = a*h/2  =>  correct: a = 2P/h
  for (const [a, h] of [[4, 6], [10, 3], [7, 9]]) {
    const P = (a * h) / 2;
    assert.ok(Math.abs(a - (2 * P) / h) < 1e-9);
    assert.ok(Math.abs(a - P / (2 * h)) > 1e-9);
    assert.ok(Math.abs(a - 2 * P * h) > 1e-9);
    assert.ok(Math.abs(a - h / (2 * P)) > 1e-9);
  }

  // Entry 3: Obw = 2(a+b)  =>  correct: a = Obw/2 - b
  for (const [a, b] of [[3, 5], [8, 2], [6, 6]]) {
    const Obw = 2 * (a + b);
    assert.ok(Math.abs(a - (Obw / 2 - b)) < 1e-9);
    assert.ok(Math.abs(a - (Obw / 2 + b)) > 1e-9 || b === 0);
    assert.ok(Math.abs(a - (Obw - b)) > 1e-9 || b === Obw / 2);
    assert.ok(Math.abs(a - Obw / (2 * b)) > 1e-9);
  }

  // Entry 4: s = v*t  =>  correct: v = s/t
  for (const [v, t] of [[60, 2], [45, 3], [80, 4]]) {
    const s = v * t;
    assert.ok(Math.abs(v - s / t) < 1e-9);
    assert.ok(Math.abs(v - s * t) > 1e-9);
    assert.ok(Math.abs(v - t / s) > 1e-9);
    assert.ok(Math.abs(v - (s + t)) > 1e-9);
  }

  // Entry 5: C = c*(1+p/100)  =>  correct: c = C/(1+p/100)
  for (const [c, p] of [[100, 20], [50, 10], [200, 25]]) {
    const C = c * (1 + p / 100);
    assert.ok(Math.abs(c - C / (1 + p / 100)) < 1e-9);
    assert.ok(Math.abs(c - C * (1 + p / 100)) > 1e-9);
    assert.ok(Math.abs(c - (C - p / 100)) > 1e-9);
    assert.ok(Math.abs(c - C / (1 - p / 100)) > 1e-9);
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/topics/rownaniaEgzamin.test.js`
Expected: FAIL — count is still 2, and the new template doesn't exist (the numeric-catalog test passes immediately since it doesn't touch the template yet, but the count/answer tests fail).

- [ ] **Step 3: Update the implementation**

Add after `podzialNaGrupyEgz`:

```js
// Fixed, hand-verified catalog of (formula, correct rearrangement, 3 wrong
// rearrangements) — deliberately not a general symbolic-algebra engine, per
// this project's standing decision that generating/verifying arbitrary
// symbolic equivalence is too fragile. Every entry's correctness is
// independently re-derived in test/topics/rownaniaEgzamin.test.js.
const WZOR_KATALOG = [
  {
    formula: 'S = n · (n + 1) : 2  (suma n kolejnych liczb naturalnych)',
    poprawne: '2S = n² + n',
    bledne: ['2S = n²', 'S = n² + n', '2S = n² - n'],
  },
  {
    formula: 'P = a · h : 2  (pole trójkąta o podstawie a i wysokości h)',
    poprawne: 'a = 2P : h',
    bledne: ['a = P : (2h)', 'a = 2P · h', 'a = h : (2P)'],
  },
  {
    formula: 'Obw = 2 · (a + b)  (obwód prostokąta o bokach a i b)',
    poprawne: 'a = Obw : 2 - b',
    bledne: ['a = Obw : 2 + b', 'a = Obw - b', 'a = Obw : (2b)'],
  },
  {
    formula: 's = v · t  (droga przy stałej prędkości v i czasie t)',
    poprawne: 'v = s : t',
    bledne: ['v = s · t', 'v = t : s', 'v = s + t'],
  },
  {
    formula: 'C = c · (1 + p : 100)  (cena po podwyżce o p% z ceny początkowej c)',
    poprawne: 'c = C : (1 + p : 100)',
    bledne: ['c = C · (1 + p : 100)', 'c = C - p : 100', 'c = C : (1 - p : 100)'],
  },
];

function wzorPrzeksztalcenie(difficulty, rng) {
  const entry = rng.pick(WZOR_KATALOG);
  const { odpowiedzi, poprawna } = buildOptions(entry.poprawne, entry.bledne, rng);

  return {
    id: 'rownania_wzor_przeksztalcenie_egz',
    type: 'zamkniete',
    tresc: `Dany jest wzór: ${entry.formula}. Wzór ten po poprawnym przekształceniu ma postać:`,
    odpowiedzi,
    poprawna,
    odpowiedz: entry.poprawne,
    rozwiazanie: `Przekształcając wzór ${entry.formula.split('(')[0].trim()}, otrzymujemy ${entry.poprawne}.`,
  };
}
```

Add `{ id: 'rownania_wzor_przeksztalcenie_egz', generate: wzorPrzeksztalcenie },` to the templates array.

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/rownaniaEgzamin.test.js`
Expected: PASS, all tests.

- [ ] **Step 5: Run the full suite**

Run: `node --test`
Expected: PASS, every test in the project.

- [ ] **Step 6: Commit**

```bash
git add js/topics/rownaniaEgzamin.js test/topics/rownaniaEgzamin.test.js
git commit -m "feat: add rownania_wzor_przeksztalcenie_egz template"
```

---

### Task 17: Add `rownania_wyrazenie_algebraiczne_wartosc_egz`

**Files:**
- Modify: `js/topics/rownaniaEgzamin.js`
- Modify: `test/topics/rownaniaEgzamin.test.js`

**Interfaces:**
- Consumes: `formatNumber`, `buildOptions`
- Produces: `rownania_wyrazenie_algebraiczne_wartosc_egz` (closed).

- [ ] **Step 1: Write the failing tests**

Update count test to 4. Then add:

```js
test('wyrazenie algebraiczne wartosc: the stated value equals a*x+b for the stated a, x, b', () => {
  const template = templates.find((t) => t.id === 'rownania_wyrazenie_algebraiczne_wartosc_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const match = task.tresc.match(/(-?\d+)x \+ (-?\d+) dla x = (-?\d+)/);
      assert.ok(match, `unexpected format: "${task.tresc}"`);
      const a = Number(match[1]);
      const b = Number(match[2]);
      const x = Number(match[3]);
      assert.equal(parsePl(task.odpowiedz), a * x + b, task.tresc);
    }
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/topics/rownaniaEgzamin.test.js`
Expected: FAIL.

- [ ] **Step 3: Update the implementation**

Add after `wzorPrzeksztalcenie`:

```js
const WARTOSC_RANGES = {
  latwy: { max: 8 },
  sredni: { max: 15 },
  trudny: { max: 20 },
};

function wyrazenieAlgebraiczneWartosc(difficulty, rng) {
  const { max } = WARTOSC_RANGES[difficulty];
  const a = rng.int(2, max);
  const b = rng.int(-max, max);
  const x = rng.int(-10, 10);
  const correct = formatNumber(a * x + b);

  // Typowe błędy: zły znak przy b, dodanie x zamiast pomnożenia, złe
  // pogrupowanie (a · (x+b)).
  const wrong = [formatNumber(a * x - b), formatNumber(a + x + b), formatNumber(a * (x + b))];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'rownania_wyrazenie_algebraiczne_wartosc_egz',
    type: 'zamkniete',
    tresc: `Oblicz wartość wyrażenia ${a}x + ${b} dla x = ${x}.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie: `Podstawiamy x = ${x}: ${a} · ${x} + ${b} = ${a * x} + ${b} = ${correct}.`,
  };
}
```

Add `{ id: 'rownania_wyrazenie_algebraiczne_wartosc_egz', generate: wyrazenieAlgebraiczneWartosc },` to the templates array.

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/rownaniaEgzamin.test.js`
Expected: PASS.

- [ ] **Step 5: Run the full suite**

Run: `node --test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/topics/rownaniaEgzamin.js test/topics/rownaniaEgzamin.test.js
git commit -m "feat: add rownania_wyrazenie_algebraiczne_wartosc_egz template"
```

---

### Task 18: Add `rownania_uklad_dwoch_niewiadomych_egz`

**Files:**
- Modify: `js/topics/rownaniaEgzamin.js`
- Modify: `test/topics/rownaniaEgzamin.test.js`

**Interfaces:**
- Consumes: `formatNumber`, `buildOptions`
- Produces: `rownania_uklad_dwoch_niewiadomych_egz` (closed).

- [ ] **Step 1: Write the failing tests**

Update count test to 5. Then add:

```js
test('uklad dwoch niewiadomych: the stated x equals (S+D)/2 for the stated sum S and difference D', () => {
  const template = templates.find((t) => t.id === 'rownania_uklad_dwoch_niewiadomych_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const match = task.tresc.match(/x \+ y = (-?\d+)[\s\S]*x - y = (-?\d+)/);
      assert.ok(match, `unexpected format: "${task.tresc}"`);
      const S = Number(match[1]);
      const D = Number(match[2]);
      assert.equal(parsePl(task.odpowiedz), (S + D) / 2, task.tresc);
    }
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/topics/rownaniaEgzamin.test.js`
Expected: FAIL.

- [ ] **Step 3: Update the implementation**

Add after `wyrazenieAlgebraiczneWartosc`:

```js
const UKLAD_RANGES = {
  latwy: { xMax: 15 },
  sredni: { xMax: 25 },
  trudny: { xMax: 40 },
};

function ukladDwochNiewiadomych(difficulty, rng) {
  const { xMax } = UKLAD_RANGES[difficulty];
  const x = rng.int(2, xMax);
  const y = rng.int(1, xMax);
  const S = x + y;
  const D = x - y;
  const correct = formatNumber(x);

  // Typowe błędy: podanie y zamiast x, pominięcie dzielenia przez 2,
  // dodanie S i D bez podzielenia.
  const wrong = [formatNumber(y), formatNumber((S - D) / 2), formatNumber(S + D)];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'rownania_uklad_dwoch_niewiadomych_egz',
    type: 'zamkniete',
    tresc: `Dany jest układ równań: x + y = ${S}, x - y = ${D}. Oblicz wartość x.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Dodając stronami oba równania: 2x = ${S} + ${D} = ${S + D}.\n` +
      `x = ${S + D} : 2 = ${correct}.`,
  };
}
```

Add `{ id: 'rownania_uklad_dwoch_niewiadomych_egz', generate: ukladDwochNiewiadomych },` to the templates array.

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/rownaniaEgzamin.test.js`
Expected: PASS.

- [ ] **Step 5: Run the full suite**

Run: `node --test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/topics/rownaniaEgzamin.js test/topics/rownaniaEgzamin.test.js
git commit -m "feat: add rownania_uklad_dwoch_niewiadomych_egz template"
```

---

### Task 19: Add `rownania_nierownosc_egz`

**Files:**
- Modify: `js/topics/rownaniaEgzamin.js`
- Modify: `test/topics/rownaniaEgzamin.test.js`

**Interfaces:**
- Consumes: `formatNumber`, `buildOptions`
- Produces: `rownania_nierownosc_egz` (closed).

- [ ] **Step 1: Write the failing tests**

Update count test to 6. Then add:

```js
test('nierownosc: the stated x strictly satisfies a*x+b > c', () => {
  const template = templates.find((t) => t.id === 'rownania_nierownosc_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const match = task.tresc.match(/(\d+)x ([+-]) (\d+) > (-?\d+)/);
      assert.ok(match, `unexpected format: "${task.tresc}"`);
      const a = Number(match[1]);
      const b = match[2] === '+' ? Number(match[3]) : -Number(match[3]);
      const c = Number(match[4]);
      const x = parsePl(task.odpowiedz);
      assert.ok(a * x + b > c, `${task.tresc} -> x=${x} does not satisfy the inequality`);
    }
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/topics/rownaniaEgzamin.test.js`
Expected: FAIL.

- [ ] **Step 3: Update the implementation**

Add after `ukladDwochNiewiadomych`:

```js
const NIEROWNOSC_RANGES = {
  latwy: { aMax: 5, x0Max: 10 },
  sredni: { aMax: 8, x0Max: 15 },
  trudny: { aMax: 10, x0Max: 20 },
};

function nierownosc(difficulty, rng) {
  const { aMax, x0Max } = NIEROWNOSC_RANGES[difficulty];
  const a = rng.int(2, aMax);
  const b = rng.int(-10, 10);
  const x0 = rng.int(-x0Max, x0Max);
  const c = a * x0 + b;
  const correct = formatNumber(x0 + 1);

  // Typowe błędy: podanie rozwiązania nierówności nieostrej (x0, na
  // granicy), podanie wartości spoza rozwiązania, zmiana znaku.
  const wrong = [formatNumber(x0), formatNumber(x0 - 1), formatNumber(-(x0 + 1))];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'rownania_nierownosc_egz',
    type: 'zamkniete',
    tresc: `Dla której z podanych wartości x nierówność ${a}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)} > ${c} jest prawdziwa?`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Rozwiązaniem nierówności ${a}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)} > ${c} jest x > ${x0} ` +
      `(bo ${a} · ${x0} ${b >= 0 ? '+' : '-'} ${Math.abs(b)} = ${c}).\n` +
      `Spośród podanych wartości warunek x > ${x0} spełnia ${correct}.`,
  };
}
```

Add `{ id: 'rownania_nierownosc_egz', generate: nierownosc },` to the templates array.

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/rownaniaEgzamin.test.js`
Expected: PASS.

- [ ] **Step 5: Run the full suite**

Run: `node --test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/topics/rownaniaEgzamin.js test/topics/rownaniaEgzamin.test.js
git commit -m "feat: add rownania_nierownosc_egz template"
```

---

### Task 20: Add `rownania_wyrazenie_rownowazne_egz`

**Files:**
- Modify: `js/topics/rownaniaEgzamin.js`
- Modify: `test/topics/rownaniaEgzamin.test.js`

**Interfaces:**
- Consumes: `buildOptions`
- Produces: `rownania_wyrazenie_rownowazne_egz` (closed).

- [ ] **Step 1: Write the failing tests**

Update count test to 7. Then add:

```js
test('wyrazenie rownowazne: the stated coefficient equals a+b and the stated constant equals c', () => {
  const template = templates.find((t) => t.id === 'rownania_wyrazenie_rownowazne_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const match = task.tresc.match(/wyrażeniu (\d+)x \+ (\d+)x ([+-]) (\d+)\?/);
      assert.ok(match, `unexpected format: "${task.tresc}"`);
      const a = Number(match[1]);
      const b = Number(match[2]);
      const c = match[3] === '+' ? Number(match[4]) : -Number(match[4]);
      const ansMatch = task.odpowiedz.match(/(\d+)x ([+-]) (\d+)/);
      assert.ok(ansMatch, `unexpected answer format: "${task.odpowiedz}"`);
      const statedCoef = Number(ansMatch[1]);
      const statedConst = ansMatch[2] === '+' ? Number(ansMatch[3]) : -Number(ansMatch[3]);
      assert.equal(statedCoef, a + b, task.tresc);
      assert.equal(statedConst, c, task.tresc);
    }
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/topics/rownaniaEgzamin.test.js`
Expected: FAIL.

- [ ] **Step 3: Update the implementation**

Add after `nierownosc`:

```js
const ROWNOWAZNE_RANGES = {
  latwy: { max: 8 },
  sredni: { max: 15 },
  trudny: { max: 20 },
};

function wyrazenieRownowazne(difficulty, rng) {
  const { max } = ROWNOWAZNE_RANGES[difficulty];
  const a = rng.int(1, max);
  const b = rng.int(1, max);
  const c = rng.int(-max, max);
  const coefSum = a + b;
  const cSign = c >= 0 ? '+' : '-';
  const cAbs = Math.abs(c);
  const correct = `${coefSum}x ${cSign} ${cAbs}`;

  // Typowe błędy: pomnożenie zamiast dodania współczynników, zły znak
  // stałej, brak uproszczenia (wyrażenie pozostawione w wyjściowej postaci).
  const wrong = [
    `${a * b}x ${cSign} ${cAbs}`,
    `${coefSum}x ${cSign === '+' ? '-' : '+'} ${cAbs}`,
    `${a}x + ${b}x ${cSign} ${cAbs}`,
  ];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'rownania_wyrazenie_rownowazne_egz',
    type: 'zamkniete',
    tresc: `Które z podanych wyrażeń jest równe wyrażeniu ${a}x + ${b}x ${cSign} ${cAbs}?`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Grupujemy wyrazy podobne: ${a}x + ${b}x = ${coefSum}x.\n` +
      `Wyrażenie równoważne: ${correct}.`,
  };
}
```

Add `{ id: 'rownania_wyrazenie_rownowazne_egz', generate: wyrazenieRownowazne },` to the templates array.

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/rownaniaEgzamin.test.js`
Expected: PASS.

- [ ] **Step 5: Run the full suite**

Run: `node --test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/topics/rownaniaEgzamin.js test/topics/rownaniaEgzamin.test.js
git commit -m "feat: add rownania_wyrazenie_rownowazne_egz template"
```

---

### Task 21: Add `rownania_procent_z_rownania_egz`

**Files:**
- Modify: `js/topics/rownaniaEgzamin.js`
- Modify: `test/topics/rownaniaEgzamin.test.js`

**Interfaces:**
- Consumes: `formatNumber`, `buildOptions`
- Produces: `rownania_procent_z_rownania_egz` (closed).

- [ ] **Step 1: Write the failing tests**

Update count test to 8. Then add:

```js
test('procent z rownania: the stated x, increased by the stated p%, equals the stated y', () => {
  const template = templates.find((t) => t.id === 'rownania_procent_z_rownania_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const match = task.tresc.match(/zwiększona o (\d+)% jest równa ([\d,]+)/);
      assert.ok(match, `unexpected format: "${task.tresc}"`);
      const p = Number(match[1]);
      const y = parsePl(match[2]);
      const x = parsePl(task.odpowiedz);
      assert.ok(Math.abs(x * (1 + p / 100) - y) < 1e-6, task.tresc);
    }
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/topics/rownaniaEgzamin.test.js`
Expected: FAIL.

- [ ] **Step 3: Update the implementation**

Add after `wyrazenieRownowazne`:

```js
// Each percent maps to a denominator that keeps x*(100+p)/100 an exact
// integer for any integer multiple of that denominator.
const PROC_ROWNANIA_DENOM = { 10: 10, 20: 5, 25: 4, 50: 2 };

const PROC_ROWNANIA_RANGES = {
  latwy: { xMax: 50, pset: [10, 20] },
  sredni: { xMax: 100, pset: [10, 20, 25] },
  trudny: { xMax: 200, pset: [10, 20, 25, 50] },
};

function procentZRownania(difficulty, rng) {
  const { xMax, pset } = PROC_ROWNANIA_RANGES[difficulty];
  const p = rng.pick(pset);
  const denom = PROC_ROWNANIA_DENOM[p];
  const x = denom * rng.int(1, Math.floor(xMax / denom));
  const y = (x * (100 + p)) / 100;
  const correct = formatNumber(x);
  const mnoznik = formatNumber((100 + p) / 100);

  // Typowe błędy: podanie y zamiast x, pomnożenie zamiast podzielenia przez
  // mnożnik, odjęcie p zamiast podzielenia.
  const wrong = [formatNumber(y), formatNumber(y * (100 + p) / 100), formatNumber(y - p)];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'rownania_procent_z_rownania_egz',
    type: 'zamkniete',
    tresc: `Pewna liczba x zwiększona o ${p}% jest równa ${formatNumber(y)}. Oblicz liczbę x.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `x · (1 + ${p}/100) = ${formatNumber(y)}.\n` +
      `x · ${mnoznik} = ${formatNumber(y)}.\n` +
      `x = ${formatNumber(y)} : ${mnoznik} = ${correct}.`,
  };
}
```

Add `{ id: 'rownania_procent_z_rownania_egz', generate: procentZRownania },` to the templates array.

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/rownaniaEgzamin.test.js`
Expected: PASS.

- [ ] **Step 5: Run the full suite**

Run: `node --test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/topics/rownaniaEgzamin.js test/topics/rownaniaEgzamin.test.js
git commit -m "feat: add rownania_procent_z_rownania_egz template"
```

---

### Task 22: Add `rownania_dlugosc_boku_z_obwodu_egz`

**Files:**
- Modify: `js/topics/rownaniaEgzamin.js`
- Modify: `test/topics/rownaniaEgzamin.test.js`

**Interfaces:**
- Consumes: `formatNumber`, `buildOptions`
- Produces: `rownania_dlugosc_boku_z_obwodu_egz` (closed).

- [ ] **Step 1: Write the failing tests**

Update count test to 9. Then add:

```js
test('dlugosc boku z obwodu: the stated side equals Obw/2 - b for the stated perimeter and other side', () => {
  const template = templates.find((t) => t.id === 'rownania_dlugosc_boku_z_obwodu_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const match = task.tresc.match(/równy (\d+) cm[\s\S]*długość (\d+) cm/);
      assert.ok(match, `unexpected format: "${task.tresc}"`);
      const obw = Number(match[1]);
      const b = Number(match[2]);
      assert.equal(parsePl(task.odpowiedz), obw / 2 - b, task.tresc);
    }
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/topics/rownaniaEgzamin.test.js`
Expected: FAIL.

- [ ] **Step 3: Update the implementation**

Add after `procentZRownania`:

```js
const BOK_Z_OBWODU_RANGES = {
  latwy: { max: 20 },
  sredni: { max: 40 },
  trudny: { max: 60 },
};

function dlugoscBokuZObwodu(difficulty, rng) {
  const { max } = BOK_Z_OBWODU_RANGES[difficulty];
  const a = rng.int(2, max);
  const b = rng.int(2, max);
  const obw = 2 * (a + b);
  const correct = `${formatNumber(a)} cm`;

  // Typowe błędy: dodanie b zamiast odjęcia, brak podzielenia obwodu przez
  // 2, podzielenie obwodu przez podwojony bok b.
  const wrong = [`${formatNumber(obw / 2 + b)} cm`, `${formatNumber(obw - b)} cm`, `${formatNumber(obw / (2 * b))} cm`];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'rownania_dlugosc_boku_z_obwodu_egz',
    type: 'zamkniete',
    tresc: `Obwód prostokąta jest równy ${obw} cm, a jeden z jego boków ma długość ${b} cm. Oblicz długość drugiego boku.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Obw = 2 · (a + b), więc a = Obw : 2 - b.\n` +
      `a = ${obw} : 2 - ${b} = ${obw / 2} - ${b} = ${correct}.`,
  };
}
```

Add `{ id: 'rownania_dlugosc_boku_z_obwodu_egz', generate: dlugoscBokuZObwodu },` to the templates array.

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/rownaniaEgzamin.test.js`
Expected: PASS.

- [ ] **Step 5: Run the full suite**

Run: `node --test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/topics/rownaniaEgzamin.js test/topics/rownaniaEgzamin.test.js
git commit -m "feat: add rownania_dlugosc_boku_z_obwodu_egz template"
```

---

### Task 23: Add `rownania_wiek_zadanie_egz`

**Files:**
- Modify: `js/topics/rownaniaEgzamin.js`
- Modify: `test/topics/rownaniaEgzamin.test.js`

**Interfaces:**
- Consumes: `formatNumber`, `buildOptions`
- Produces: `rownania_wiek_zadanie_egz` (closed).

- [ ] **Step 1: Write the failing tests**

Update count test to 10. Then add:

```js
test('wiek zadanie: the stated age equals (suma - d) / 2 for the stated sum and difference', () => {
  const template = templates.find((t) => t.id === 'rownania_wiek_zadanie_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const match = task.tresc.match(/o (\d+) lat starsza[\s\S]*równa (\d+) lat/);
      assert.ok(match, `unexpected format: "${task.tresc}"`);
      const d = Number(match[1]);
      const suma = Number(match[2]);
      assert.equal(parsePl(task.odpowiedz), (suma - d) / 2, task.tresc);
    }
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/topics/rownaniaEgzamin.test.js`
Expected: FAIL.

- [ ] **Step 3: Update the implementation**

Add after `dlugoscBokuZObwodu`:

```js
const WIEK_RANGES = {
  latwy: { corkaMax: 12 },
  sredni: { corkaMax: 16 },
  trudny: { corkaMax: 20 },
};

function wiekZadanie(difficulty, rng) {
  const { corkaMax } = WIEK_RANGES[difficulty];
  const corka = rng.int(5, corkaMax);
  const d = rng.int(15, 35);
  const matka = corka + d;
  const suma = corka + matka;
  const correct = formatNumber(corka);

  // Typowe błędy: podanie wieku matki, pominięcie różnicy wieku, podanie
  // połowy sumy bez uwzględnienia różnicy.
  const wrong = [formatNumber(matka), formatNumber(suma - d), formatNumber(suma / 2)];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'rownania_wiek_zadanie_egz',
    type: 'zamkniete',
    tresc: `Matka jest o ${d} lat starsza od córki. Suma ich wieku wynosi ${suma} lat. Oblicz, ile lat ma córka.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Niech wiek córki wynosi x. Wtedy matka ma x + ${d} lat.\n` +
      `x + (x + ${d}) = ${suma}.\n` +
      `2x = ${suma - d}.\n` +
      `x = ${correct}.`,
  };
}
```

Add `{ id: 'rownania_wiek_zadanie_egz', generate: wiekZadanie },` to the templates array.

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/rownaniaEgzamin.test.js`
Expected: PASS.

- [ ] **Step 5: Run the full suite**

Run: `node --test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/topics/rownaniaEgzamin.js test/topics/rownaniaEgzamin.test.js
git commit -m "feat: add rownania_wiek_zadanie_egz template"
```

---

### Task 24: Add `rownania_predkosc_prosta_egz`

**Files:**
- Modify: `js/topics/rownaniaEgzamin.js`
- Modify: `test/topics/rownaniaEgzamin.test.js`

**Interfaces:**
- Consumes: `formatNumber`, `buildOptions`
- Produces: `rownania_predkosc_prosta_egz` (closed).

- [ ] **Step 1: Write the failing tests**

Update count test to 11. Then add:

```js
test('predkosc prosta: the stated time equals s / v for the stated distance and speed', () => {
  const template = templates.find((t) => t.id === 'rownania_predkosc_prosta_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const match = task.tresc.match(/przejechał (\d+) km ze stałą prędkością (\d+) km\/h/);
      assert.ok(match, `unexpected format: "${task.tresc}"`);
      const s = Number(match[1]);
      const v = Number(match[2]);
      assert.equal(parsePl(task.odpowiedz), s / v, task.tresc);
    }
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/topics/rownaniaEgzamin.test.js`
Expected: FAIL.

- [ ] **Step 3: Update the implementation**

Add after `wiekZadanie`:

```js
const PREDKOSC_PROSTA_RANGES = {
  latwy: { vSet: [40, 50, 60], tMax: 4 },
  sredni: { vSet: [40, 50, 60, 80, 90], tMax: 6 },
  trudny: { vSet: [40, 50, 60, 80, 90, 100, 120], tMax: 8 },
};

function predkoscProsta(difficulty, rng) {
  const { vSet, tMax } = PREDKOSC_PROSTA_RANGES[difficulty];
  const v = rng.pick(vSet);
  const t = rng.int(1, tMax);
  const s = v * t;
  const correct = `${formatNumber(t)} h`;

  // Typowe błędy: podzielenie prędkości przez drogę, pomnożenie drogi przez
  // prędkość, odjęcie prędkości od drogi.
  const wrong = [`${formatNumber(v / s)} h`, `${formatNumber(s * v)} h`, `${formatNumber(s - v)} h`];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'rownania_predkosc_prosta_egz',
    type: 'zamkniete',
    tresc: `Samochód przejechał ${s} km ze stałą prędkością ${v} km/h. Oblicz czas jazdy tego samochodu.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie: `t = s : v = ${s} : ${v} = ${correct}.`,
  };
}
```

Add `{ id: 'rownania_predkosc_prosta_egz', generate: predkoscProsta },` to the templates array.

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/rownaniaEgzamin.test.js`
Expected: PASS.

- [ ] **Step 5: Run the full suite**

Run: `node --test`
Expected: PASS — the 9 new closed templates are now all in place (10 closed total including the migrated `srednia_arytmetyczna_egz`).

- [ ] **Step 6: Commit**

```bash
git add js/topics/rownaniaEgzamin.js test/topics/rownaniaEgzamin.test.js
git commit -m "feat: add rownania_predkosc_prosta_egz template"
```

---

### Task 25: Add `rownania_predkosc_uzasadnij_egz`

**Files:**
- Modify: `js/topics/rownaniaEgzamin.js`
- Modify: `test/topics/rownaniaEgzamin.test.js`

**Interfaces:**
- Consumes: `formatNumber`
- Produces: `rownania_predkosc_uzasadnij_egz` (open).

- [ ] **Step 1: Write the failing tests**

Update count test to 12. Then add:

```js
test('predkosc uzasadnij: the stated speed, distance, time and dluzej/krocej judgment are independently correct', () => {
  const template = templates.find((t) => t.id === 'rownania_predkosc_uzasadnij_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const match = task.tresc.match(
        /długości (\d+(?:,\d+)?) km\. Droga z A do B ma długość (\d+(?:,\d+)?) km i samochód przejechał ją w czasie (\d+) minut/
      );
      assert.ok(match, `unexpected format: "${task.tresc}"`);
      const dTotal = parsePl(match[1]);
      const d1 = parsePl(match[2]);
      const t1 = Number(match[3]);
      const kmPerMin = d1 / t1;
      const d2 = dTotal - d1;
      const t2 = d2 / kmPerMin;
      const dluzej = t2 > 60;

      const ansMatch = task.odpowiedz.match(
        /Prędkość: (\d+(?:,\d+)?) km\/h\. Droga z B do C: (\d+(?:,\d+)?) km\. Czas: (\d+) minut, co jest (\w+) niż 60 minut\./
      );
      assert.ok(ansMatch, `unexpected answer format: "${task.odpowiedz}"`);
      assert.ok(Math.abs(parsePl(ansMatch[1]) - kmPerMin * 60) < 1e-6, task.tresc);
      assert.ok(Math.abs(parsePl(ansMatch[2]) - d2) < 1e-6, task.tresc);
      assert.equal(Number(ansMatch[3]), t2, task.tresc);
      assert.equal(ansMatch[4], dluzej ? 'więcej' : 'mniej', task.tresc);
    }
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/topics/rownaniaEgzamin.test.js`
Expected: FAIL.

- [ ] **Step 3: Update the implementation**

Add after `predkoscProsta`:

```js
// v is always a multiple of 60 km/h, so km-per-minute (v/60) is a clean
// fraction that keeps every distance below an exact integer number of
// minutes, avoiding fractional-minute answers.
const PREDKOSC_UZASADNIJ_V = {
  latwy: [60],
  sredni: [60, 90],
  trudny: [60, 90, 120],
};

const PREDKOSC_UZASADNIJ_T2 = {
  latwy: { min: 20, max: 100 },
  sredni: { min: 20, max: 120 },
  trudny: { min: 20, max: 150 },
};

function predkoscUzasadnij(difficulty, rng) {
  const v = rng.pick(PREDKOSC_UZASADNIJ_V[difficulty]);
  const kmPerMin = v / 60;
  const t1 = rng.int(20, 50);
  const d1 = kmPerMin * t1;
  const { min, max } = PREDKOSC_UZASADNIJ_T2[difficulty];
  const t2 = rng.int(min, max);
  const d2 = kmPerMin * t2;
  const dTotal = d1 + d2;
  const dluzej = t2 > 60;

  return {
    id: 'rownania_predkosc_uzasadnij_egz',
    type: 'otwarte',
    tresc:
      `Z miejscowości A do C przez B prowadzi droga o długości ${formatNumber(dTotal)} km. ` +
      `Droga z A do B ma długość ${formatNumber(d1)} km i samochód przejechał ją w czasie ${t1} minut. ` +
      `Drogę z B do C ten sam samochód pokonał z taką samą prędkością. ` +
      `Uzasadnij, że przejazd z B do C trwał ${dluzej ? 'dłużej' : 'krócej'} niż godzinę. Zapisz obliczenia.`,
    odpowiedz:
      `Prędkość: ${formatNumber(v)} km/h. Droga z B do C: ${formatNumber(d2)} km. ` +
      `Czas: ${t2} minut, co jest ${dluzej ? 'więcej' : 'mniej'} niż 60 minut.`,
    rozwiazanie:
      `Prędkość samochodu na odcinku A-B: v = ${formatNumber(d1)} km : ${t1} min = ${formatNumber(kmPerMin)} km/min ` +
      `= ${formatNumber(v)} km/h.\n` +
      `Droga z B do C: ${formatNumber(dTotal)} - ${formatNumber(d1)} = ${formatNumber(d2)} km.\n` +
      `Czas przejazdu B-C: ${formatNumber(d2)} : ${formatNumber(kmPerMin)} = ${t2} minut, ` +
      `co jest ${dluzej ? 'więcej' : 'mniej'} niż 60 minut.`,
  };
}
```

Add `{ id: 'rownania_predkosc_uzasadnij_egz', generate: predkoscUzasadnij },` to the templates array.

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/rownaniaEgzamin.test.js`
Expected: PASS.

- [ ] **Step 5: Run the full suite**

Run: `node --test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/topics/rownaniaEgzamin.js test/topics/rownaniaEgzamin.test.js
git commit -m "feat: add rownania_predkosc_uzasadnij_egz template"
```

---

### Task 26: Add `rownania_zadanie_tekstowe_dwie_niewiadome_egz`

**Files:**
- Modify: `js/topics/rownaniaEgzamin.js`
- Modify: `test/topics/rownaniaEgzamin.test.js`

**Interfaces:**
- Consumes: `formatNumber`
- Produces: `rownania_zadanie_tekstowe_dwie_niewiadome_egz` (open).

- [ ] **Step 1: Write the failing tests**

Update count test to 13. Then add:

```js
test('zadanie tekstowe dwie niewiadome: the stated ulgowy price satisfies 2(x+k)+3x = total', () => {
  const template = templates.find((t) => t.id === 'rownania_zadanie_tekstowe_dwie_niewiadome_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const match = task.tresc.match(/o (\d+) zł więcej[\s\S]*łącznie (\d+(?:,\d+)?) zł/);
      assert.ok(match, `unexpected format: "${task.tresc}"`);
      const k = Number(match[1]);
      const total = parsePl(match[2]);
      const x = parsePl(task.odpowiedz);
      assert.ok(Math.abs(2 * (x + k) + 3 * x - total) < 1e-6, task.tresc);
    }
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/topics/rownaniaEgzamin.test.js`
Expected: FAIL.

- [ ] **Step 3: Update the implementation**

Add after `predkoscUzasadnij`:

```js
const DWIE_NIEWIADOME_RANGES = {
  latwy: { uMax: 15, kMax: 5 },
  sredni: { uMax: 25, kMax: 10 },
  trudny: { uMax: 40, kMax: 15 },
};

function zadanieTekstoweDwieNiewiadome(difficulty, rng) {
  const { uMax, kMax } = DWIE_NIEWIADOME_RANGES[difficulty];
  const u = rng.int(5, uMax);
  const k = rng.int(2, kMax);
  const n = u + k;
  const total = 2 * n + 3 * u;

  return {
    id: 'rownania_zadanie_tekstowe_dwie_niewiadome_egz',
    type: 'otwarte',
    tresc:
      `Bilet normalny kosztuje o ${k} zł więcej niż bilet ulgowy. Rodzina kupiła 2 bilety ` +
      `normalne i 3 bilety ulgowe, płacąc łącznie ${formatNumber(total)} zł. Oblicz cenę biletu ulgowego.`,
    odpowiedz: `${formatNumber(u)} zł`,
    rozwiazanie:
      `Niech cena biletu ulgowego wynosi x. Wtedy bilet normalny kosztuje x + ${k}.\n` +
      `2(x + ${k}) + 3x = ${formatNumber(total)}.\n` +
      `5x + ${2 * k} = ${formatNumber(total)}.\n` +
      `5x = ${total - 2 * k}.\n` +
      `x = ${formatNumber(u)} zł.`,
  };
}
```

Add `{ id: 'rownania_zadanie_tekstowe_dwie_niewiadome_egz', generate: zadanieTekstoweDwieNiewiadome },` to the templates array.

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/rownaniaEgzamin.test.js`
Expected: PASS.

- [ ] **Step 5: Run the full suite**

Run: `node --test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/topics/rownaniaEgzamin.js test/topics/rownaniaEgzamin.test.js
git commit -m "feat: add rownania_zadanie_tekstowe_dwie_niewiadome_egz template"
```

---

### Task 27: Add `rownania_procent_zadanie_tekstowe_egz`

**Files:**
- Modify: `js/topics/rownaniaEgzamin.js`
- Modify: `test/topics/rownaniaEgzamin.test.js`

**Interfaces:**
- Consumes: `formatNumber`
- Produces: `rownania_procent_zadanie_tekstowe_egz` (open).

- [ ] **Step 1: Write the failing tests**

Update count test to 14. Then add:

```js
test('procent zadanie tekstowe: the stated original price, decreased by the stated p%, equals the stated current price', () => {
  const template = templates.find((t) => t.id === 'rownania_procent_zadanie_tekstowe_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const match = task.tresc.match(/o (\d+)% pewien towar kosztuje ([\d,]+) zł/);
      assert.ok(match, `unexpected format: "${task.tresc}"`);
      const p = Number(match[1]);
      const c = parsePl(match[2]);
      const x = parsePl(task.odpowiedz);
      assert.ok(Math.abs(x * (1 - p / 100) - c) < 1e-6, task.tresc);
    }
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/topics/rownaniaEgzamin.test.js`
Expected: FAIL.

- [ ] **Step 3: Update the implementation**

Add after `zadanieTekstoweDwieNiewiadome`:

```js
// Each percent maps to a denominator that keeps x*(100-p)/100 an exact
// integer for any integer multiple of that denominator.
const PROC_TEKST_DENOM = { 10: 10, 20: 5, 25: 4, 50: 2 };

const PROC_TEKST_RANGES = {
  latwy: { xMax: 50, pset: [10, 20] },
  sredni: { xMax: 100, pset: [10, 20, 25] },
  trudny: { xMax: 200, pset: [10, 20, 25, 50] },
};

function procentZadanieTekstowe(difficulty, rng) {
  const { xMax, pset } = PROC_TEKST_RANGES[difficulty];
  const p = rng.pick(pset);
  const denom = PROC_TEKST_DENOM[p];
  const x = denom * rng.int(2, Math.floor(xMax / denom));
  const c = (x * (100 - p)) / 100;
  const mnoznik = formatNumber((100 - p) / 100);

  return {
    id: 'rownania_procent_zadanie_tekstowe_egz',
    type: 'otwarte',
    tresc: `Po obniżce ceny o ${p}% pewien towar kosztuje ${formatNumber(c)} zł. Oblicz cenę tego towaru przed obniżką.`,
    odpowiedz: `${formatNumber(x)} zł`,
    rozwiazanie:
      `x · (1 - ${p}/100) = ${formatNumber(c)}.\n` +
      `x · ${mnoznik} = ${formatNumber(c)}.\n` +
      `x = ${formatNumber(c)} : ${mnoznik} = ${formatNumber(x)} zł.`,
  };
}
```

Add `{ id: 'rownania_procent_zadanie_tekstowe_egz', generate: procentZadanieTekstowe },` to the templates array.

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/rownaniaEgzamin.test.js`
Expected: PASS.

- [ ] **Step 5: Run the full suite**

Run: `node --test`
Expected: PASS — `rownaniaEgzamin.js` now exports 14 templates (10 closed, 4 open), matching the target.

- [ ] **Step 6: Commit**

```bash
git add js/topics/rownaniaEgzamin.js test/topics/rownaniaEgzamin.test.js
git commit -m "feat: add rownania_procent_zadanie_tekstowe_egz template"
```

---

## Part 3: `js/topics/statystykaEgzamin.js` (target 8 closed / 4 open)

### Task 28: Add `statystyka_tabela_niewiadoma_egz`

**Files:**
- Modify: `js/topics/statystykaEgzamin.js`
- Modify: `test/topics/statystykaEgzamin.test.js`

**Interfaces:**
- Consumes: `formatNumber`, `buildOptions`, the file's existing `SKLEP_RANGES` and `SKLEPY` constants
- Produces: `statystyka_tabela_niewiadoma_egz` (closed).

- [ ] **Step 1: Write the failing tests**

Replace the existing `'exports five templates with unique ids'` test in `test/topics/statystykaEgzamin.test.js` with:

```js
test('exports six templates with unique ids', () => {
  assert.equal(templates.length, 6);
  assert.equal(new Set(templates.map((t) => t.id)).size, 6);
});
```

Then add:

```js
test('tabela niewiadoma: the stated unknown value equals total minus the four known values', () => {
  const template = templates.find((t) => t.id === 'statystyka_tabela_niewiadoma_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const known = task.tresc.match(/Sklep [A-D] - (\d+)/g).map((m) => Number(m.match(/\d+/)[0]));
      const total = Number(task.tresc.match(/sprzedano (\d+) rowerów/)[1]);
      const expected = total - known.reduce((a, b) => a + b, 0);
      assert.equal(parsePl(task.odpowiedz), expected, task.tresc);
    }
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/topics/statystykaEgzamin.test.js`
Expected: FAIL — count is still 5, and the new template doesn't exist.

- [ ] **Step 3: Update the implementation**

Add after `tabelaEkstremum`:

```js
function tabelaNiewiadoma(difficulty, rng) {
  const { max } = SKLEP_RANGES[difficulty];
  const known = [rng.int(5, max), rng.int(5, max), rng.int(5, max), rng.int(5, max)];
  const x = rng.int(5, max);
  const total = known.reduce((a, b) => a + b, 0) + x;
  const tabela = SKLEPY.slice(0, 4).map((label, i) => `${label} - ${known[i]}`).join(', ');
  const correct = formatNumber(x);

  // Typowe błędy: podanie sumy całkowitej, podanie sumy samych znanych
  // wartości, odjęcie tylko jednej znanej wartości od sumy.
  const wrong = [
    formatNumber(total),
    formatNumber(known.reduce((a, b) => a + b, 0)),
    formatNumber(total - known[0]),
  ];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'statystyka_tabela_niewiadoma_egz',
    type: 'zamkniete',
    tresc:
      `W tabeli przedstawiono liczbę sprzedanych rowerów w czterech sklepach: ${tabela}. ` +
      `Łącznie we wszystkich pięciu sklepach (włącznie z ${SKLEPY[4]}) sprzedano ${total} rowerów. ` +
      `Oblicz, ile rowerów sprzedał ${SKLEPY[4]}.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `${SKLEPY[4]} sprzedał: ${total} - (${known.join(' + ')}) = ${total} - ${known.reduce((a, b) => a + b, 0)} = ${correct}.`,
  };
}
```

Update the `templates` export array to add `{ id: 'statystyka_tabela_niewiadoma_egz', generate: tabelaNiewiadoma },` at the end.

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/statystykaEgzamin.test.js`
Expected: PASS, all tests.

- [ ] **Step 5: Run the full suite**

Run: `node --test`
Expected: PASS, every test in the project.

- [ ] **Step 6: Commit**

```bash
git add js/topics/statystykaEgzamin.js test/topics/statystykaEgzamin.test.js
git commit -m "feat: add statystyka_tabela_niewiadoma_egz template"
```

---

### Task 29: Add `statystyka_diagram_kolowe_procent_egz`

**Files:**
- Modify: `js/topics/statystykaEgzamin.js`
- Modify: `test/topics/statystykaEgzamin.test.js`

**Interfaces:**
- Consumes: `formatNumber`, `buildOptions`, the file's existing `TABELA_RANGES` constant
- Produces: `statystyka_diagram_kolowe_procent_egz` (closed).

- [ ] **Step 1: Write the failing tests**

Update the count test to 7. Then add:

```js
test('diagram kolowe procent: the stated count equals (100 - sum of known percents) * total / 100', () => {
  const template = templates.find((t) => t.id === 'statystyka_diagram_kolowe_procent_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const total = Number(task.tresc.match(/z (\d+) zadań/)[1]);
      const knownPercents = task.tresc.match(/(\d+)%/g).map((s) => Number(s.replace('%', '')));
      const remainingPercent = 100 - knownPercents.reduce((a, b) => a + b, 0);
      const expected = (remainingPercent * total) / 100;
      assert.equal(parsePl(task.odpowiedz), expected, task.tresc);
    }
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/topics/statystykaEgzamin.test.js`
Expected: FAIL.

- [ ] **Step 3: Update the implementation**

Add after `tabelaNiewiadoma`:

```js
const KATEGORIE = ['algebry', 'planimetrii', 'stereometrii', 'arytmetyki', 'statystyki'];

function diagramKoloweProcent(difficulty, rng) {
  const { totals } = TABELA_RANGES[difficulty];
  const total = rng.pick(totals);

  // Four known percents (multiples of 5, summing to at most 95) leave a
  // clean remainder for the fifth (unlabeled) category, mirroring the real
  // exam's pie-chart framing exactly.
  const percents = [];
  let remaining = 100;
  for (let i = 0; i < 4; i++) {
    const maxP = remaining - 5 * (4 - i);
    const p = rng.int(1, Math.floor(maxP / 5)) * 5;
    percents.push(p);
    remaining -= p;
  }
  percents.push(remaining);

  const count5 = (percents[4] * total) / 100;
  const correct = formatNumber(count5);

  // Typowe błędy: podanie samego procentu zamiast liczby zadań, użycie
  // procentu innego działu, odjęcie liczby zadań od całości zamiast
  // przeliczenia procentu.
  const wrong = [
    formatNumber(percents[4]),
    formatNumber((percents[0] * total) / 100),
    formatNumber(total - count5),
  ];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  const opisy = KATEGORIE.slice(0, 4)
    .map((k, i) => `${percents[i]}% z ${k}`)
    .join(', ');

  return {
    id: 'statystyka_diagram_kolowe_procent_egz',
    type: 'zamkniete',
    tresc:
      `Test złożony z ${total} zadań podzielono na pięć działów. Na diagramie kołowym ` +
      `podano, że ${opisy}, a resztę zadań stanowiły zadania z ${KATEGORIE[4]}. ` +
      `Ile zadań z ${KATEGORIE[4]} zawierał ten test?`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Procent zadań z ${KATEGORIE[4]}: 100% - (${percents.slice(0, 4).join('% + ')}%) = ${percents[4]}%.\n` +
      `Liczba zadań: ${percents[4]}% z ${total} = ${correct}.`,
  };
}
```

Update the `templates` export array to add `{ id: 'statystyka_diagram_kolowe_procent_egz', generate: diagramKoloweProcent },`.

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/statystykaEgzamin.test.js`
Expected: PASS.

- [ ] **Step 5: Run the full suite**

Run: `node --test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/topics/statystykaEgzamin.js test/topics/statystykaEgzamin.test.js
git commit -m "feat: add statystyka_diagram_kolowe_procent_egz template"
```

---

### Task 30: Add `statystyka_srednia_wazona_egz`

**Files:**
- Modify: `js/topics/statystykaEgzamin.js`
- Modify: `test/topics/statystykaEgzamin.test.js`

**Interfaces:**
- Consumes: `formatNumber`, `buildOptions`
- Produces: `statystyka_srednia_wazona_egz` (closed).

- [ ] **Step 1: Write the failing tests**

Update the count test to 8. Then add:

```js
test('srednia wazona: the stated value equals (2*v1+v2+v3)/4 for the stated grades', () => {
  const template = templates.find((t) => t.id === 'statystyka_srednia_wazona_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const match = task.tresc.match(
        /ocenę (\d+) z klasówki[\s\S]*ocenę (\d+) z pierwszej kartkówki[\s\S]*ocenę (\d+) z drugiej kartkówki/
      );
      assert.ok(match, `unexpected format: "${task.tresc}"`);
      const [v1, v2, v3] = match.slice(1).map(Number);
      const expected = (2 * v1 + v2 + v3) / 4;
      assert.ok(Math.abs(parsePl(task.odpowiedz) - expected) < 1e-6, task.tresc);
    }
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/topics/statystykaEgzamin.test.js`
Expected: FAIL.

- [ ] **Step 3: Update the implementation**

Add after `diagramKoloweProcent`:

```js
function sredniaWazona(difficulty, rng) {
  const v1 = rng.int(1, 6);
  const v2 = rng.int(1, 6);
  const v3 = rng.int(1, 6);
  const suma = 2 * v1 + v2 + v3; // klasówka liczy się podwójnie
  const wagi = 4;
  const srednia = suma / wagi;
  const correct = formatNumber(srednia);

  // Typowe błędy: zwykła (nieważona) średnia trzech ocen, dzielenie sumy
  // ważonej przez 3 zamiast przez sumę wag, dzielenie przez wagi + 1.
  const wrong = [
    formatNumber((v1 + v2 + v3) / 3),
    formatNumber(suma / 3),
    formatNumber(suma / (wagi + 1)),
  ];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'statystyka_srednia_wazona_egz',
    type: 'zamkniete',
    tresc:
      `Uczeń otrzymał ocenę ${v1} z klasówki (licząca się podwójnie), ocenę ${v2} z ` +
      `pierwszej kartkówki i ocenę ${v3} z drugiej kartkówki. Oblicz średnią ważoną tych ocen.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Ocena z klasówki liczy się podwójnie, więc suma ważona wynosi: ` +
      `2 · ${v1} + ${v2} + ${v3} = ${suma}, a liczba wag: 2 + 1 + 1 = 4.\n` +
      `Średnia ważona: ${suma} : 4 = ${correct}.`,
  };
}
```

Update the `templates` export array to add `{ id: 'statystyka_srednia_wazona_egz', generate: sredniaWazona },`.

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/statystykaEgzamin.test.js`
Expected: PASS.

- [ ] **Step 5: Run the full suite**

Run: `node --test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/topics/statystykaEgzamin.js test/topics/statystykaEgzamin.test.js
git commit -m "feat: add statystyka_srednia_wazona_egz template"
```

---

### Task 31: Add `statystyka_czestosc_egz`

**Files:**
- Modify: `js/topics/statystykaEgzamin.js`
- Modify: `test/topics/statystykaEgzamin.test.js`

**Interfaces:**
- Consumes: `formatNumber`, `buildOptions`, the file's existing `SKLEP_RANGES` and `SKLEPY` constants
- Produces: `statystyka_czestosc_egz` (closed).

- [ ] **Step 1: Write the failing tests**

Update the count test to 9. Then add:

```js
test('czestosc: the stated difference equals max minus min of the table values', () => {
  const template = templates.find((t) => t.id === 'statystyka_czestosc_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const wartosci = task.tresc.match(/Sklep [A-E] - (\d+)/g).map((m) => Number(m.match(/\d+/)[0]));
      const expected = Math.max(...wartosci) - Math.min(...wartosci);
      assert.equal(parsePl(task.odpowiedz), expected, task.tresc);
    }
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/topics/statystykaEgzamin.test.js`
Expected: FAIL.

- [ ] **Step 3: Update the implementation**

Add after `sredniaWazona`:

```js
function czestosc(difficulty, rng) {
  const { max } = SKLEP_RANGES[difficulty];
  let wartosci;
  do {
    wartosci = SKLEPY.map(() => rng.int(5, max));
  } while (new Set(wartosci).size !== wartosci.length); // avoid ties at either extreme

  const najw = Math.max(...wartosci);
  const najm = Math.min(...wartosci);
  const roznica = najw - najm;
  const correct = formatNumber(roznica);
  const tabela = SKLEPY.map((label, i) => `${label} - ${wartosci[i]}`).join(', ');

  // Typowe błędy: podanie samej największej wartości, podanie samej
  // najmniejszej wartości, dodanie zamiast odjęcia.
  const wrong = [formatNumber(najw), formatNumber(najm), formatNumber(najw + najm)];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'statystyka_czestosc_egz',
    type: 'zamkniete',
    tresc:
      `W tabeli przedstawiono liczbę sprzedanych rowerów w kolejnych sklepach: ${tabela}. ` +
      `Oblicz różnicę między największą a najmniejszą liczbą sprzedanych rowerów spośród tych sklepów.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie: `Największa wartość: ${najw}. Najmniejsza wartość: ${najm}. Różnica: ${najw} - ${najm} = ${correct}.`,
  };
}
```

Update the `templates` export array to add `{ id: 'statystyka_czestosc_egz', generate: czestosc },`.

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/statystykaEgzamin.test.js`
Expected: PASS.

- [ ] **Step 5: Run the full suite**

Run: `node --test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/topics/statystykaEgzamin.js test/topics/statystykaEgzamin.test.js
git commit -m "feat: add statystyka_czestosc_egz template"
```

---

### Task 32: Add `statystyka_tabela_niewiadoma_procent_egz`

**Files:**
- Modify: `js/topics/statystykaEgzamin.js`
- Modify: `test/topics/statystykaEgzamin.test.js`

**Interfaces:**
- Consumes: `formatNumber`
- Produces: `statystyka_tabela_niewiadoma_procent_egz` (open).

- [ ] **Step 1: Write the failing tests**

Update the count test to 10. Then add:

```js
test('tabela niewiadoma procent: the stated percent is independently correct given the table constraints', () => {
  const template = templates.find((t) => t.id === 'statystyka_tabela_niewiadoma_procent_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const chlopcyMatch = task.tresc.match(/chłopców: (\d+), (\d+) i (\d+)/);
      const dziewczetaMatch = task.tresc.match(/dziewcząt: (\d+) i (\d+)/);
      const dMatch = task.tresc.match(/o (\d+) większa/);
      assert.ok(chlopcyMatch && dziewczetaMatch && dMatch, `unexpected format: "${task.tresc}"`);
      const chlopcy = chlopcyMatch.slice(1, 4).map(Number);
      const dziewczetaKnown = dziewczetaMatch.slice(1, 3).map(Number);
      const d = Number(dMatch[1]);
      const sumaChlopcow = chlopcy.reduce((a, b) => a + b, 0);
      const sumaDziewczatKnown = dziewczetaKnown.reduce((a, b) => a + b, 0);
      const trzeciaDziewczat = sumaChlopcow + d - sumaDziewczatKnown;
      const total = sumaChlopcow + sumaDziewczatKnown + trzeciaDziewczat;
      const expected = (trzeciaDziewczat / total) * 100;
      const stated = parsePl(task.odpowiedz);
      assert.ok(Math.abs(stated - expected) < 0.01, `${task.tresc} -> ${task.odpowiedz} (expected ${expected})`);
    }
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/topics/statystykaEgzamin.test.js`
Expected: FAIL.

- [ ] **Step 3: Update the implementation**

Add after `czestosc`:

```js
const TABELA_NIEWIADOMA_PROCENT_RANGES = {
  latwy: { max: 30, dMax: 10 },
  sredni: { max: 60, dMax: 15 },
  trudny: { max: 100, dMax: 20 },
};

function tabelaNiewiadomaProcent(difficulty, rng) {
  const { max, dMax } = TABELA_NIEWIADOMA_PROCENT_RANGES[difficulty];
  const chlopcy = [rng.int(10, max), rng.int(10, max), rng.int(10, max)];
  const dziewczetaKnown = [rng.int(10, max), rng.int(10, max)];
  const d = rng.int(5, dMax);
  const sumaChlopcow = chlopcy.reduce((a, b) => a + b, 0);
  const sumaDziewczatKnown = dziewczetaKnown.reduce((a, b) => a + b, 0);
  const trzeciaDziewczat = sumaChlopcow + d - sumaDziewczatKnown;
  const total = sumaChlopcow + sumaDziewczatKnown + trzeciaDziewczat;
  const procent = (trzeciaDziewczat / total) * 100;

  return {
    id: 'statystyka_tabela_niewiadoma_procent_egz',
    type: 'otwarte',
    tresc:
      `Podczas zawodów sportowych rozegrano trzy turnieje: piłki nożnej, tańca i tenisa ` +
      `stołowego. Liczba chłopców w tych turniejach wynosiła kolejno: ${chlopcy.join(', ')}. ` +
      `Liczba dziewcząt w pierwszych dwóch turniejach wynosiła kolejno: ${dziewczetaKnown.join(' i ')}. ` +
      `Łączna liczba dziewcząt była o ${d} większa od łącznej liczby chłopców. ` +
      `Oblicz, ile procent liczby wszystkich uczestników zawodów stanowiła liczba dziewcząt ` +
      `biorących udział w turnieju tenisa stołowego.`,
    odpowiedz: `${formatNumber(Number(procent.toFixed(4)))}%`,
    rozwiazanie:
      `Łączna liczba chłopców: ${chlopcy.join(' + ')} = ${sumaChlopcow}.\n` +
      `Łączna liczba dziewcząt: ${sumaChlopcow} + ${d} = ${sumaChlopcow + d}.\n` +
      `Dziewcząt w turnieju tenisa stołowego: ${sumaChlopcow + d} - (${dziewczetaKnown.join(' + ')}) = ${trzeciaDziewczat}.\n` +
      `Wszystkich uczestników: ${sumaChlopcow} + ${sumaChlopcow + d} = ${total}.\n` +
      `Procent: ${trzeciaDziewczat} : ${total} · 100% = ${formatNumber(Number(procent.toFixed(4)))}%.`,
  };
}
```

Update the `templates` export array to add `{ id: 'statystyka_tabela_niewiadoma_procent_egz', generate: tabelaNiewiadomaProcent },`.

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/statystykaEgzamin.test.js`
Expected: PASS.

- [ ] **Step 5: Run the full suite**

Run: `node --test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/topics/statystykaEgzamin.js test/topics/statystykaEgzamin.test.js
git commit -m "feat: add statystyka_tabela_niewiadoma_procent_egz template"
```

---

### Task 33: Add `statystyka_srednia_zadanie_egz`

**Files:**
- Modify: `js/topics/statystykaEgzamin.js`
- Modify: `test/topics/statystykaEgzamin.test.js`

**Interfaces:**
- Consumes: `formatNumber`, the file's existing `SREDNIA_RANGES` constant and `meanRangedList` helper
- Produces: `statystyka_srednia_zadanie_egz` (open).

- [ ] **Step 1: Write the failing tests**

Update the count test to 11. Then add:

```js
test('srednia zadanie: the stated mean equals the independently recomputed average of the listed heights', () => {
  const template = templates.find((t) => t.id === 'statystyka_srednia_zadanie_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const values = task.tresc.match(/uczniów: ([^.]+)\./)[1].split(',').map((s) => Number(s.trim()));
      const expected = values.reduce((a, b) => a + b, 0) / values.length;
      assert.ok(Math.abs(parsePl(task.odpowiedz) - expected) < 1e-6, task.tresc);
    }
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/topics/statystykaEgzamin.test.js`
Expected: FAIL.

- [ ] **Step 3: Update the implementation**

Add after `tabelaNiewiadomaProcent`:

```js
function sredniaZadanie(difficulty, rng) {
  const { n, meanMin, meanMax, delta } = SREDNIA_RANGES[difficulty];
  const mean = rng.int(meanMin, meanMax);
  const values = rng.shuffle(meanRangedList(rng, n, mean, delta));
  const total = values.reduce((a, b) => a + b, 0);

  return {
    id: 'statystyka_srednia_zadanie_egz',
    type: 'otwarte',
    tresc: `Zmierzono wzrost (w cm) ${n} uczniów: ${values.join(', ')}. Oblicz średni wzrost tych uczniów.`,
    odpowiedz: formatNumber(mean),
    rozwiazanie:
      `Średnia arytmetyczna to suma wartości podzielona przez ich liczbę.\n` +
      `(${values.join(' + ')}) : ${n} = ${total} : ${n} = ${formatNumber(mean)}.`,
  };
}
```

Update the `templates` export array to add `{ id: 'statystyka_srednia_zadanie_egz', generate: sredniaZadanie },`.

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/statystykaEgzamin.test.js`
Expected: PASS.

- [ ] **Step 5: Run the full suite**

Run: `node --test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/topics/statystykaEgzamin.js test/topics/statystykaEgzamin.test.js
git commit -m "feat: add statystyka_srednia_zadanie_egz template"
```

---

### Task 34: Add `statystyka_tabela_zestawienie_egz`

**Files:**
- Modify: `js/topics/statystykaEgzamin.js`
- Modify: `test/topics/statystykaEgzamin.test.js`

**Interfaces:**
- Consumes: `formatNumber`, the file's existing `SKLEP_RANGES` and `SKLEPY` constants
- Produces: `statystyka_tabela_zestawienie_egz` (open).

- [ ] **Step 1: Write the failing tests**

Update the count test to 12. Then add:

```js
test('tabela zestawienie: the stated total equals the sum of both rows of the table', () => {
  const template = templates.find((t) => t.id === 'statystyka_tabela_zestawienie_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [normalneText, ulgoweText] = task.tresc.split('W drugiej tabeli');
      const normalne = normalneText.match(/Sklep [A-E] - (\d+)/g).map((m) => Number(m.match(/\d+/)[0]));
      const ulgowe = ulgoweText.match(/Sklep [A-E] - (\d+)/g).map((m) => Number(m.match(/\d+/)[0]));
      const expected = normalne.reduce((a, b) => a + b, 0) + ulgowe.reduce((a, b) => a + b, 0);
      assert.equal(parsePl(task.odpowiedz), expected, task.tresc);
    }
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/topics/statystykaEgzamin.test.js`
Expected: FAIL.

- [ ] **Step 3: Update the implementation**

Add after `sredniaZadanie`:

```js
function tabelaZestawienie(difficulty, rng) {
  const { max } = SKLEP_RANGES[difficulty];
  const rowA = SKLEPY.map(() => rng.int(5, max));
  const rowB = SKLEPY.map(() => rng.int(5, max));
  const total = rowA.reduce((a, b) => a + b, 0) + rowB.reduce((a, b) => a + b, 0);
  const tabelaA = SKLEPY.map((label, i) => `${label} - ${rowA[i]}`).join(', ');
  const tabelaB = SKLEPY.map((label, i) => `${label} - ${rowB[i]}`).join(', ');

  return {
    id: 'statystyka_tabela_zestawienie_egz',
    type: 'otwarte',
    tresc:
      `W tabeli przedstawiono liczbę sprzedanych biletów normalnych w kolejnych kasach: ${tabelaA}. ` +
      `W drugiej tabeli przedstawiono liczbę sprzedanych biletów ulgowych w tych samych kasach: ${tabelaB}. ` +
      `Oblicz łączną liczbę sprzedanych biletów (normalnych i ulgowych razem).`,
    odpowiedz: formatNumber(total),
    rozwiazanie:
      `Suma biletów normalnych: ${rowA.join(' + ')} = ${rowA.reduce((a, b) => a + b, 0)}.\n` +
      `Suma biletów ulgowych: ${rowB.join(' + ')} = ${rowB.reduce((a, b) => a + b, 0)}.\n` +
      `Razem: ${rowA.reduce((a, b) => a + b, 0)} + ${rowB.reduce((a, b) => a + b, 0)} = ${formatNumber(total)}.`,
  };
}
```

Update the `templates` export array to add `{ id: 'statystyka_tabela_zestawienie_egz', generate: tabelaZestawienie },`.

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/statystykaEgzamin.test.js`
Expected: PASS.

- [ ] **Step 5: Run the full suite**

Run: `node --test`
Expected: PASS — `statystykaEgzamin.js` now exports 12 templates (8 closed, 4 open), matching the target.

- [ ] **Step 6: Commit**

```bash
git add js/topics/statystykaEgzamin.js test/topics/statystykaEgzamin.test.js
git commit -m "feat: add statystyka_tabela_zestawienie_egz template"
```

---

## Part 4: `js/topics/geometriaEgzamin.js` (target 7 closed / 3 open)

### Task 35: Migrate `geometria_trojkat_rownoboczny_prawda_falsz`, `geometria_czworokat_katy`, `pitagoras_mapa_odleglosc`

**Files:**
- Modify: `js/topics/geometriaEgzamin.js`
- Modify: `test/topics/geometriaEgzamin.test.js`

**Interfaces:**
- Consumes: `formatNumber`, `buildOptions` (already imported)
- Produces: `geometria_trojkat_rownoboczny_prawda_falsz_egz` (open, `figura` of `typ: 'trojkat'`), `geometria_czworokat_katy_egz` (closed, `figura` of `typ: 'czworokat'`), `pitagoras_mapa_odleglosc_egz` (open, `figura` of `typ: 'mapa'`) — exact duplicates of the originals in `geometriaPlaska.js`/`potegiPitagoras.js`, renamed.

- [ ] **Step 1: Write the failing tests**

Replace the existing `'exports five templates with unique ids'` test in `test/topics/geometriaEgzamin.test.js` with:

```js
test('exports eight templates with unique ids', () => {
  assert.equal(templates.length, 8);
  assert.equal(new Set(templates.map((t) => t.id)).size, 8);
});
```

Then add:

```js
test('trojkat rownoboczny prawda/falsz egz: both judgments are independently correct, and the figura matches the stated side', () => {
  const template = templates.find((t) => t.id === 'geometria_trojkat_rownoboczny_prawda_falsz_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [s] = task.tresc.match(/boku długości (\d+) cm/).slice(1).map(Number);
      assert.equal(task.figura.typ, 'trojkat');
      assert.equal(task.figura.bok, s);

      const k = s / 2;
      const trueHeightText = k === 1 ? '√3 cm' : `${k}√3 cm`;
      const trueAreaText = k === 1 ? '√3 cm²' : `${k * k}√3 cm²`;

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

test('czworokat katy egz: alpha satisfies the 360-degree sum and matches the stated relationships', () => {
  const template = templates.find((t) => t.id === 'geometria_czworokat_katy_egz');
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

test('pitagoras mapa odleglosc egz: the distance satisfies dx^2 + dy^2 = distance^2, and the figura matches', () => {
  const template = templates.find((t) => t.id === 'pitagoras_mapa_odleglosc_egz');
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

Run: `node --test test/topics/geometriaEgzamin.test.js`
Expected: FAIL — count is still 5, and none of the three new ids exist.

- [ ] **Step 3: Update the implementation**

Add after `pierscienKolowy`:

```js
// Pythagorean triples keep every hypotenuse a whole number.
const TRIPLES = [
  [3, 4, 5],
  [5, 12, 13],
  [8, 15, 17],
  [7, 24, 25],
  [20, 21, 29],
];

const TROJKAT_RB_RANGES = {
  latwy: { kMax: 5 },
  sredni: { kMax: 8 },
  trudny: { kMax: 12 },
};

function trojkatRownobocznyPrawdaFalszEgz(difficulty, rng) {
  const { kMax } = TROJKAT_RB_RANGES[difficulty];
  const k = rng.int(1, kMax);
  const s = 2 * k;

  const trueHeightText = k === 1 ? '√3 cm' : `${k}√3 cm`;
  const trueAreaText = k === 1 ? '√3 cm²' : `${k * k}√3 cm²`;
  const wrongHeightText = `${s}√3 cm`;
  const wrongAreaText = `${2 * k * k}√3 cm²`;

  const claim1True = rng.bool();
  const claim2True = rng.bool();
  const claimHeightText = claim1True ? trueHeightText : wrongHeightText;
  const claimAreaText = claim2True ? trueAreaText : wrongAreaText;

  return {
    id: 'geometria_trojkat_rownoboczny_prawda_falsz_egz',
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

const CZWOROKAT_RANGES = {
  latwy: { betaMax: 40, k: 2 },
  sredni: { betaMax: 50, k: 2 },
  trudny: { betaMax: 50, k: 3 },
};

function czworokatKatyEgz(difficulty, rng) {
  const { betaMax, k } = CZWOROKAT_RANGES[difficulty];
  const betaLimit = Math.min(betaMax, Math.floor(269 / (2 + k)));
  const beta = rng.int(10, betaLimit);
  const gamma = k * beta;
  const delta = 90;
  const alpha = 360 - beta - gamma - delta;
  const diff = alpha - beta;
  const mnoznik = k === 2 ? 'dwukrotnie' : 'trzykrotnie';

  const correct = `${alpha}°`;
  const wrong = [`${beta}°`, `${gamma}°`, `${360 - beta - gamma}°`];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'geometria_czworokat_katy_egz',
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

function pitagorasMapaOdlegloscEgz(difficulty, rng) {
  const scaleMax = { latwy: 1, sredni: 3, trudny: 6 }[difficulty];
  const [a0, b0, c0] = rng.pick(TRIPLES);
  const scale = rng.int(1, scaleMax);
  const dx = a0 * scale;
  const dy = b0 * scale;
  const distance = c0 * scale;

  return {
    id: 'pitagoras_mapa_odleglosc_egz',
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

(no separate `RANGES` constant needed — `scaleMax` is inlined since this file has no existing scale-range table to share).

Update the `templates` export array to add all three:

```js
  { id: 'geometria_trojkat_rownoboczny_prawda_falsz_egz', generate: trojkatRownobocznyPrawdaFalszEgz },
  { id: 'geometria_czworokat_katy_egz', generate: czworokatKatyEgz },
  { id: 'pitagoras_mapa_odleglosc_egz', generate: pitagorasMapaOdlegloscEgz },
```

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/geometriaEgzamin.test.js`
Expected: PASS, all tests.

- [ ] **Step 5: Run the full suite**

Run: `node --test`
Expected: PASS, every test in the project.

- [ ] **Step 6: Commit**

```bash
git add js/topics/geometriaEgzamin.js test/topics/geometriaEgzamin.test.js
git commit -m "feat: migrate trojkat prawda/falsz, czworokat katy, pitagoras mapa into geometriaEgzamin"
```

---

### Task 36: Extend `js/figura.js`'s `mapa` type with an optional third point

**Files:**
- Modify: `js/figura.js`
- Modify: `test/figura.test.js`
- Modify: `js/taskShape.js`
- Modify: `test/taskShape.test.js`

**Interfaces:**
- Consumes: `formatNumber` (already imported in `figura.js`)
- Produces: `figuraSvg({ typ: 'mapa', dx, dy, dx3, etykieta3 })` now optionally renders a third point due east of A when `dx3` is present. `checkFigura` in `js/taskShape.js` validates `dx3` as a finite number when present on a `mapa` figura (it stays optional — not added to the required-fields list).

- [ ] **Step 1: Write the failing tests**

In `test/figura.test.js`, add after the existing `mapa` test:

```js
test('mapa: optionally renders a third point with its own label and distance', () => {
  const svg = figuraSvg({ typ: 'mapa', dx: 4, dy: 3, dx3: 6, etykieta3: 'M' });
  assert.match(svg, />6 km</);
  assert.ok(svg.includes('>M<'), 'missing third-point label');
});

test('mapa: omits the third point when dx3 is not given', () => {
  const svg = figuraSvg({ typ: 'mapa', dx: 4, dy: 3 });
  assert.ok(!svg.includes('>M<'), 'third point rendered without dx3');
});
```

In `test/taskShape.test.js`, add after the existing `mapa`-related figura tests:

```js
test('accepts a mapa figura with a valid optional dx3', () => {
  assert.doesNotThrow(() =>
    assertValidTask({ ...validOpen, figura: { typ: 'mapa', dx: 3, dy: 4, dx3: 5, etykieta3: 'M' } })
  );
});

test('rejects a mapa figura with a non-finite dx3', () => {
  assert.throws(
    () => assertValidTask({ ...validOpen, figura: { typ: 'mapa', dx: 3, dy: 4, dx3: NaN } }),
    /figura\.dx3/
  );
});
```

(`validOpen` here follows the same fixture pattern already used by the existing figura tests earlier in this file.)

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/figura.test.js test/taskShape.test.js`
Expected: FAIL — the third point isn't rendered, and `dx3` isn't validated yet.

- [ ] **Step 3: Update the implementation**

In `js/figura.js`, replace `mapaSvg`:

```js
function mapaSvg({ dx, dy, dx3, etykieta3 }) {
  let svg =
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
    `<text class="etykieta-figury" x="30" y="12" text-anchor="middle">N</text>`;

  if (dx3 != null) {
    svg +=
      `<line class="ksztalt" x1="190" y1="190" x2="228" y2="190" />` +
      `<circle class="punkt" cx="228" cy="190" r="3" />` +
      `<text class="etykieta-figury" x="228" y="205" text-anchor="middle">${etykieta3 ?? 'C'}</text>` +
      `<text class="etykieta-figury" x="209" y="182" text-anchor="middle">${formatNumber(dx3)} km</text>`;
  }

  return svg + `</svg>`;
}
```

In `js/taskShape.js`, update `checkFigura` — add an optional-field check right after the existing required-fields loop:

```js
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
  if (figura.typ === 'mapa' && 'dx3' in figura) {
    if (typeof figura.dx3 !== 'number' || !Number.isFinite(figura.dx3)) {
      throw new Error('Pole figura.dx3 musi byc skonczona liczba.');
    }
  }
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/figura.test.js test/taskShape.test.js`
Expected: PASS, all tests.

- [ ] **Step 5: Run the full suite**

Run: `node --test`
Expected: PASS, every test in the project.

- [ ] **Step 6: Commit**

```bash
git add js/figura.js test/figura.test.js js/taskShape.js test/taskShape.test.js
git commit -m "feat: extend mapa figura with an optional third point"
```

---

### Task 37: Add `geometria_mapa_trzy_punkty_egz`

**Files:**
- Modify: `js/topics/geometriaEgzamin.js`
- Modify: `test/topics/geometriaEgzamin.test.js`

**Interfaces:**
- Consumes: `formatNumber`, the file's `TRIPLES` constant (added in Task 35), `figuraSvg`'s extended `mapa` type (Task 36, consumed indirectly via the task contract — this task just sets `dx3`/`etykieta3` on `task.figura`)
- Produces: `geometria_mapa_trzy_punkty_egz` (open, compound P/F answer).

- [ ] **Step 1: Write the failing tests**

Update the count test to 9. Then add:

```js
test('mapa trzy punkty: both judgments are independently correct given dx, dy, dx3 and the stated threshold', () => {
  const template = templates.find((t) => t.id === 'geometria_mapa_trzy_punkty_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const match = task.tresc.match(
        /(\d+) km na północ i (\d+) km na zachód[\s\S]*Muzeum znajduje się (\d+(?:,\d+)?) km na wschód[\s\S]*mniejsza niż (\d+) km/
      );
      assert.ok(match, `unexpected format: "${task.tresc}"`);
      const dy = Number(match[1]);
      const dx = Number(match[2]);
      const dx3 = parsePl(match[3]);
      const threshold = Number(match[4]);

      const abDist = Math.sqrt(dx * dx + dy * dy);
      const claim1Expected = Math.abs(dx3 - abDist) < 1e-6;
      const mbDist = Math.sqrt((dx3 + dx) ** 2 + dy ** 2);
      const claim2Expected = mbDist < threshold;

      const answerMatch = task.odpowiedz.match(/^1\. (Prawda|Fałsz), 2\. (Prawda|Fałsz)$/);
      assert.ok(answerMatch, `unexpected answer format: "${task.odpowiedz}"`);
      assert.equal(answerMatch[1] === 'Prawda', claim1Expected, task.tresc);
      assert.equal(answerMatch[2] === 'Prawda', claim2Expected, task.tresc);

      assert.equal(task.figura.typ, 'mapa');
      assert.equal(task.figura.dx, dx);
      assert.equal(task.figura.dy, dy);
      assert.equal(task.figura.dx3, dx3);
    }
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/topics/geometriaEgzamin.test.js`
Expected: FAIL — count is still 8, and the new template doesn't exist.

- [ ] **Step 3: Update the implementation**

Add after `pitagorasMapaOdlegloscEgz`:

```js
const MAPA_3PKT_RANGES = {
  latwy: { scaleMax: 2 },
  sredni: { scaleMax: 4 },
  trudny: { scaleMax: 6 },
};

function mapaTrzyPunkty(difficulty, rng) {
  const { scaleMax } = MAPA_3PKT_RANGES[difficulty];
  const [a0, b0, c0] = rng.pick(TRIPLES);
  const scale = rng.int(1, scaleMax);
  const dx = a0 * scale;
  const dy = b0 * scale;
  const abDist = c0 * scale;

  const claim1True = rng.bool();
  let dx3 = claim1True ? abDist : abDist + (rng.bool() ? 1 : -1) * rng.int(2, 10);
  if (dx3 <= 0) dx3 = abDist + 5;
  const claim1Actual = dx3 === abDist;

  const mbDistExact = Math.sqrt((dx3 + dx) ** 2 + dy ** 2);
  const roundedMb = Math.round(mbDistExact);
  const claim2Stated = rng.bool() ? roundedMb + rng.int(1, 5) : Math.max(1, roundedMb - rng.int(1, 5));
  const claim2Actual = mbDistExact < claim2Stated;

  return {
    id: 'geometria_mapa_trzy_punkty_egz',
    type: 'otwarte',
    figura: { typ: 'mapa', dx, dy, dx3, etykieta3: 'M' },
    tresc:
      `Na mapie zaznaczono trzy punkty: A (schronisko), B (wieża widokowa) oraz M (muzeum). ` +
      `Wieża widokowa znajduje się ${dy} km na północ i ${dx} km na zachód od schroniska. ` +
      `Muzeum znajduje się ${formatNumber(dx3)} km na wschód od schroniska.\n` +
      `1. Odległość w linii prostej schroniska od muzeum jest równa odległości w linii ` +
      `prostej schroniska od wieży widokowej.\n` +
      `2. Odległość w linii prostej muzeum od wieży widokowej jest mniejsza niż ${claim2Stated} km.\n` +
      `Oceń prawdziwość obu zdań.`,
    odpowiedz: `1. ${claim1Actual ? 'Prawda' : 'Fałsz'}, 2. ${claim2Actual ? 'Prawda' : 'Fałsz'}`,
    rozwiazanie:
      `Odległość schronisko-wieża: przeciwprostokątna trójkąta o przyprostokątnych ${dx} km ` +
      `i ${dy} km, czyli ${abDist} km (trójka pitagorejska).\n` +
      `Odległość schronisko-muzeum: ${formatNumber(dx3)} km (leżą na tej samej równoleżnikowej linii).\n` +
      `Zdanie 1: ${formatNumber(dx3)} km ${claim1Actual ? '=' : '≠'} ${abDist} km, więc zdanie jest ` +
      `${claim1Actual ? 'prawdziwe' : 'fałszywe'}.\n` +
      `Odległość muzeum-wieża: pierwiastek z ((${formatNumber(dx3)}+${dx})² + ${dy}²) ≈ ` +
      `${formatNumber(Number(mbDistExact.toFixed(4)))} km.\n` +
      `Zdanie 2: ${formatNumber(Number(mbDistExact.toFixed(4)))} km ${claim2Actual ? '<' : '≥'} ` +
      `${claim2Stated} km, więc zdanie jest ${claim2Actual ? 'prawdziwe' : 'fałszywe'}.`,
  };
}
```

Update the `templates` export array to add `{ id: 'geometria_mapa_trzy_punkty_egz', generate: mapaTrzyPunkty },`.

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/geometriaEgzamin.test.js`
Expected: PASS, all tests.

- [ ] **Step 5: Run the full suite**

Run: `node --test`
Expected: PASS, every test in the project.

- [ ] **Step 6: Commit**

```bash
git add js/topics/geometriaEgzamin.js test/topics/geometriaEgzamin.test.js
git commit -m "feat: add geometria_mapa_trzy_punkty_egz template"
```

---

### Task 38: Add `geometria_trojkat_prostokatny_pole_egz`

**Files:**
- Modify: `js/topics/geometriaEgzamin.js`
- Modify: `test/topics/geometriaEgzamin.test.js`

**Interfaces:**
- Consumes: `formatNumber`, `buildOptions`
- Produces: `geometria_trojkat_prostokatny_pole_egz` (closed).

- [ ] **Step 1: Write the failing tests**

Update the count test to 10. Then add:

```js
test('trojkat prostokatny pole: the stated area equals (a*b)/2 for the stated legs', () => {
  const template = templates.find((t) => t.id === 'geometria_trojkat_prostokatny_pole_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [a, b] = task.tresc.match(/\d+/g).map(Number);
      const expected = (a * b) / 2;
      assert.ok(Math.abs(parsePl(task.odpowiedz) - expected) < 1e-6, task.tresc);
    }
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/topics/geometriaEgzamin.test.js`
Expected: FAIL.

- [ ] **Step 3: Update the implementation**

Add after `mapaTrzyPunkty`:

```js
const TROJKAT_PROST_RANGES = {
  latwy: { max: 12 },
  sredni: { max: 20 },
  trudny: { max: 30 },
};

function trojkatProstokatnyPole(difficulty, rng) {
  const { max } = TROJKAT_PROST_RANGES[difficulty];
  const a = rng.int(2, max);
  const b = rng.int(2, max);
  const pole = (a * b) / 2;
  const correct = `${formatNumber(pole)} cm²`;

  // Typowe błędy: pominięcie dzielenia przez 2 (pole prostokąta), błędne
  // uśrednienie boków, dodanie zamiast pomnożenia.
  const wrong = [`${formatNumber(a * b)} cm²`, `${formatNumber((a + b) / 2)} cm²`, `${formatNumber(a + b)} cm²`];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'geometria_trojkat_prostokatny_pole_egz',
    type: 'zamkniete',
    tresc: `Przyprostokątne trójkąta prostokątnego mają długości ${a} cm i ${b} cm. Oblicz pole tego trójkąta.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie: `Pole trójkąta prostokątnego: P = (a · b) : 2 = (${a} · ${b}) : 2 = ${correct}.`,
  };
}
```

Update the `templates` export array to add `{ id: 'geometria_trojkat_prostokatny_pole_egz', generate: trojkatProstokatnyPole },`.

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/geometriaEgzamin.test.js`
Expected: PASS.

- [ ] **Step 5: Run the full suite**

Run: `node --test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/topics/geometriaEgzamin.js test/topics/geometriaEgzamin.test.js
git commit -m "feat: add geometria_trojkat_prostokatny_pole_egz template"
```

---

### Task 39: Add `geometria_romb_pole_z_przekatnych_egz`

**Files:**
- Modify: `js/topics/geometriaEgzamin.js`
- Modify: `test/topics/geometriaEgzamin.test.js`

**Interfaces:**
- Consumes: `formatNumber`, `buildOptions`, the file's `TROJKAT_PROST_RANGES` constant (Task 38)
- Produces: `geometria_romb_pole_z_przekatnych_egz` (closed).

- [ ] **Step 1: Write the failing tests**

Update the count test to 11. Then add:

```js
test('romb pole z przekatnych: the stated area equals (e*f)/2 for the stated diagonals', () => {
  const template = templates.find((t) => t.id === 'geometria_romb_pole_z_przekatnych_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [e, f] = task.tresc.match(/\d+/g).map(Number);
      const expected = (e * f) / 2;
      assert.ok(Math.abs(parsePl(task.odpowiedz) - expected) < 1e-6, task.tresc);
    }
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/topics/geometriaEgzamin.test.js`
Expected: FAIL.

- [ ] **Step 3: Update the implementation**

Add after `trojkatProstokatnyPole`:

```js
function rombPoleZPrzekatnych(difficulty, rng) {
  const { max } = TROJKAT_PROST_RANGES[difficulty];
  const e = rng.int(2, max);
  const f = rng.int(2, max);
  const pole = (e * f) / 2;
  const correct = `${formatNumber(pole)} cm²`;

  // Typowe błędy: pominięcie dzielenia przez 2, błędne uśrednienie
  // przekątnych, dodanie zamiast pomnożenia.
  const wrong = [`${formatNumber(e * f)} cm²`, `${formatNumber((e + f) / 2)} cm²`, `${formatNumber(e + f)} cm²`];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'geometria_romb_pole_z_przekatnych_egz',
    type: 'zamkniete',
    tresc: `Przekątne rombu mają długości ${e} cm i ${f} cm. Oblicz pole tego rombu.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie: `Pole rombu: P = (e · f) : 2 = (${e} · ${f}) : 2 = ${correct}.`,
  };
}
```

Update the `templates` export array to add `{ id: 'geometria_romb_pole_z_przekatnych_egz', generate: rombPoleZPrzekatnych },`.

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/geometriaEgzamin.test.js`
Expected: PASS.

- [ ] **Step 5: Run the full suite**

Run: `node --test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/topics/geometriaEgzamin.js test/topics/geometriaEgzamin.test.js
git commit -m "feat: add geometria_romb_pole_z_przekatnych_egz template"
```

---

### Task 40: Add `geometria_pieciokat_trojkat_kwadrat_egz`

**Files:**
- Modify: `js/topics/geometriaEgzamin.js`
- Modify: `test/topics/geometriaEgzamin.test.js`

**Interfaces:**
- Consumes: `formatNumber`, `buildOptions`
- Produces: `geometria_pieciokat_trojkat_kwadrat_egz` (closed).

- [ ] **Step 1: Write the failing tests**

Update the count test to 12. Then add:

```js
test('pieciokat trojkat kwadrat: the stated square area equals (2*pole/h)^2', () => {
  const template = templates.find((t) => t.id === 'geometria_pieciokat_trojkat_kwadrat_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const match = task.tresc.match(/równe (\d+), a wysokość[\s\S]*równa (\d+)\./);
      assert.ok(match, `unexpected format: "${task.tresc}"`);
      const pole = Number(match[1]);
      const h = Number(match[2]);
      const ab = (2 * pole) / h;
      const expected = ab * ab;
      assert.ok(Math.abs(parsePl(task.odpowiedz) - expected) < 1e-6, task.tresc);
    }
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/topics/geometriaEgzamin.test.js`
Expected: FAIL.

- [ ] **Step 3: Update the implementation**

Add after `rombPoleZPrzekatnych`:

```js
const PIECIOKAT_RANGES = {
  latwy: { hMax: 6, baseMax: 10 },
  sredni: { hMax: 10, baseMax: 14 },
  trudny: { hMax: 14, baseMax: 20 },
};

function pieciokatTrojkatKwadrat(difficulty, rng) {
  const { hMax, baseMax } = PIECIOKAT_RANGES[difficulty];
  const h = rng.int(2, hMax);
  // AB is kept even so the triangle's area (AB*h/2) is always an integer.
  const ab = 2 * rng.int(2, Math.floor(baseMax / 2));
  const pole = (ab * h) / 2;
  const kwadratPole = ab * ab;
  const correct = formatNumber(kwadratPole);

  // Typowe błędy: pomnożenie pola trójkąta przez wysokość zamiast obliczenia
  // AB, podniesienie samej wysokości do kwadratu, podwojenie pola kwadratu.
  const wrong = [formatNumber(pole * h), formatNumber(h * h), formatNumber(2 * kwadratPole)];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'geometria_pieciokat_trojkat_kwadrat_egz',
    type: 'zamkniete',
    tresc:
      `Przekątna BE dzieli pięciokąt ABCDE na trójkąt ABE i kwadrat BCDE, przy czym bok ` +
      `kwadratu ma taką samą długość jak podstawa AB trójkąta. Pole trójkąta ABE jest ` +
      `równe ${pole}, a wysokość poprowadzona z wierzchołka E na bok AB jest równa ${h}. ` +
      `Oblicz pole kwadratu BCDE.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Z pola trójkąta: pole = (AB · h) : 2, więc AB = 2 · pole : h = 2 · ${pole} : ${h} = ${ab}.\n` +
      `Bok kwadratu BCDE jest równy AB = ${ab}, więc pole kwadratu = ${ab}² = ${correct}.`,
  };
}
```

Update the `templates` export array to add `{ id: 'geometria_pieciokat_trojkat_kwadrat_egz', generate: pieciokatTrojkatKwadrat },`.

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/geometriaEgzamin.test.js`
Expected: PASS.

- [ ] **Step 5: Run the full suite**

Run: `node --test`
Expected: PASS — `geometriaEgzamin.js` now exports 12 templates (7 closed, 5 open), matching or exceeding the target.

- [ ] **Step 6: Commit**

```bash
git add js/topics/geometriaEgzamin.js test/topics/geometriaEgzamin.test.js
git commit -m "feat: add geometria_pieciokat_trojkat_kwadrat_egz template"
```

---

## Part 5: `js/topics/procentyEgzamin.js` (new open item, counted toward planimetria's weight)

### Task 41: Add `procenty_pakowanie_trapez_egz`

**Files:**
- Modify: `js/topics/procentyEgzamin.js`
- Modify: `test/topics/procentyEgzamin.test.js`

**Interfaces:**
- Consumes: `formatNumber`
- Produces: `procenty_pakowanie_trapez_egz` (open).

- [ ] **Step 1: Write the failing tests**

Replace the existing `'exports three templates with unique ids'` test in `test/topics/procentyEgzamin.test.js` with:

```js
test('exports four templates with unique ids', () => {
  assert.equal(templates.length, 4);
  assert.equal(new Set(templates.map((t) => t.id)).size, 4);
});
```

Then add:

```js
test('pakowanie trapez: the stated cost equals ceil(pole/pojemnosc) * cena', () => {
  const template = templates.find((t) => t.id === 'procenty_pakowanie_trapez_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const match = task.tresc.match(
        /długości (\d+) m i (\d+) m, a wysokość jest równa (\d+) m[\s\S]*(\d+) m² powierzchni i kosztuje ([\d,]+) zł/
      );
      assert.ok(match, `unexpected format: "${task.tresc}"`);
      const [a, b, h, pojemnosc] = match.slice(1, 5).map(Number);
      const cena = parsePl(match[5]);
      const pole = ((a + b) / 2) * h;
      const opakowania = Math.ceil(pole / pojemnosc);
      const expected = opakowania * cena;
      assert.ok(Math.abs(parsePl(task.odpowiedz) - expected) < 1e-6, task.tresc);
    }
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/topics/procentyEgzamin.test.js`
Expected: FAIL — count is still 3, and the new template doesn't exist.

- [ ] **Step 3: Update the implementation**

Add after `odsetki`:

```js
const PAKOWANIE_RANGES = {
  latwy: { aMax: 15, bMax: 12, hMax: 8, pojMax: 20, cenaMax: 15 },
  sredni: { aMax: 25, bMax: 20, hMax: 12, pojMax: 30, cenaMax: 25 },
  trudny: { aMax: 40, bMax: 30, hMax: 18, pojMax: 40, cenaMax: 40 },
};

function pakowanieTrapez(difficulty, rng) {
  const { aMax, bMax, hMax, pojMax, cenaMax } = PAKOWANIE_RANGES[difficulty];
  const a = rng.int(6, aMax);
  const b = rng.int(4, bMax);
  const h = rng.int(4, hMax);
  const pole = ((a + b) / 2) * h;
  const pojemnosc = rng.int(10, pojMax);
  const cena = rng.int(5, cenaMax);
  const opakowania = Math.ceil(pole / pojemnosc);
  const koszt = opakowania * cena;

  return {
    id: 'procenty_pakowanie_trapez_egz',
    type: 'otwarte',
    tresc:
      `Ogródek pani Anny ma kształt trapezu, którego podstawy mają długości ${a} m i ${b} m, ` +
      `a wysokość jest równa ${h} m. Jedno opakowanie z nasionami wystarcza na obsianie ${pojemnosc} m² ` +
      `powierzchni i kosztuje ${formatNumber(cena)} zł. Oblicz, ile złotych musi zapłacić pani Anna za ` +
      `najmniejszą liczbę opakowań z nasionami potrzebnych na obsianie całej powierzchni tego ogródka.`,
    odpowiedz: `${formatNumber(koszt)} zł`,
    rozwiazanie:
      `Pole trapezu: P = ((${a} + ${b}) : 2) · ${h} = ${pole} m².\n` +
      `Liczba opakowań: ${pole} : ${pojemnosc} = ${formatNumber(Number((pole / pojemnosc).toFixed(4)))}, ` +
      `zaokrąglamy w górę do ${opakowania}.\n` +
      `Koszt: ${opakowania} · ${formatNumber(cena)} zł = ${formatNumber(koszt)} zł.`,
  };
}
```

Update the `templates` export array to add `{ id: 'procenty_pakowanie_trapez_egz', generate: pakowanieTrapez },`.

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/procentyEgzamin.test.js`
Expected: PASS, all tests.

- [ ] **Step 5: Run the full suite**

Run: `node --test`
Expected: PASS, every test in the project — `procentyEgzamin.js` now exports 4 templates.

- [ ] **Step 6: Commit**

```bash
git add js/topics/procentyEgzamin.js test/topics/procentyEgzamin.test.js
git commit -m "feat: add procenty_pakowanie_trapez_egz template"
```

---

## Part 6: `js/topics/brylyEgzamin.js` (target 4 closed / 1 open)

### Task 42: Migrate `bryly_pole_powierzchni_prostopadloscianu` and `bryly_objetosc_prostopadloscianu`

**Files:**
- Modify: `js/topics/brylyEgzamin.js`
- Modify: `test/topics/brylyEgzamin.test.js`

**Interfaces:**
- Consumes: `formatNumber`, `buildOptions` (already imported)
- Produces: `bryly_pole_powierzchni_prostopadloscianu_egz` (closed, `figura` of `typ: 'prostopadloscian'`), `bryly_objetosc_prostopadloscianu_egz` (open, same `figura` type) — exact duplicates of `bryly.js`'s `polePowierzchni`/`objetosc`, renamed.

- [ ] **Step 1: Write the failing tests**

Replace the existing `'exports four templates with unique ids'` test in `test/topics/brylyEgzamin.test.js` with:

```js
test('exports six templates with unique ids', () => {
  assert.equal(templates.length, 6);
  assert.equal(new Set(templates.map((t) => t.id)).size, 6);
});
```

Then add:

```js
test('pole powierzchni prostopadloscianu egz: the stated area equals 2*(ab+bc+ac) for the stated dimensions', () => {
  const template = templates.find((t) => t.id === 'bryly_pole_powierzchni_prostopadloscianu_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [a, b, c] = task.tresc.match(/-?\d+(?:,\d+)?/g).map((s) => Number(s.replace(',', '.')));
      const expected = 2 * (a * b + b * c + a * c);
      assert.ok(Math.abs(parsePl(task.odpowiedz) - expected) < 1e-2, task.tresc);
      assert.deepEqual(task.figura, { typ: 'prostopadloscian', a, b, c });
    }
  }
});

test('objetosc prostopadloscianu egz: the stated volume equals a*b*c for the stated dimensions', () => {
  const template = templates.find((t) => t.id === 'bryly_objetosc_prostopadloscianu_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [a, b, c] = task.tresc.match(/-?\d+(?:,\d+)?/g).map((s) => Number(s.replace(',', '.')));
      const expected = a * b * c;
      assert.ok(Math.abs(parsePl(task.odpowiedz) - expected) < 1e-2, task.tresc);
      assert.deepEqual(task.figura, { typ: 'prostopadloscian', a, b, c });
    }
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/topics/brylyEgzamin.test.js`
Expected: FAIL — count is still 4, and neither new id exists.

- [ ] **Step 3: Update the implementation**

Add after `ostroslupPole`:

```js
const PROSTOPADLOSCIAN_RANGES = {
  latwy: { max: 12, decimal: false },
  sredni: { max: 25, decimal: false },
  trudny: { max: 25, decimal: true },
};

function wymiarProstopadloscianu(rng, difficulty) {
  const { max, decimal } = PROSTOPADLOSCIAN_RANGES[difficulty];
  return decimal ? rng.int(20, max * 10) / 10 : rng.int(2, max);
}

function wymiaryProstopadloscianu(rng, difficulty) {
  return [
    wymiarProstopadloscianu(rng, difficulty),
    wymiarProstopadloscianu(rng, difficulty),
    wymiarProstopadloscianu(rng, difficulty),
  ];
}

function polePowierzchniProstopadloscianuEgz(difficulty, rng) {
  const [a, b, c] = wymiaryProstopadloscianu(rng, difficulty);
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
    id: 'bryly_pole_powierzchni_prostopadloscianu_egz',
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

function objetoscProstopadloscianuEgz(difficulty, rng) {
  const [a, b, c] = wymiaryProstopadloscianu(rng, difficulty);
  const objetoscWartosc = Number((a * b * c).toFixed(4));

  return {
    id: 'bryly_objetosc_prostopadloscianu_egz',
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
```

Update the `templates` export array to add both:

```js
  { id: 'bryly_pole_powierzchni_prostopadloscianu_egz', generate: polePowierzchniProstopadloscianuEgz },
  { id: 'bryly_objetosc_prostopadloscianu_egz', generate: objetoscProstopadloscianuEgz },
```

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/brylyEgzamin.test.js`
Expected: PASS, all tests.

- [ ] **Step 5: Run the full suite**

Run: `node --test`
Expected: PASS, every test in the project.

- [ ] **Step 6: Commit**

```bash
git add js/topics/brylyEgzamin.js test/topics/brylyEgzamin.test.js
git commit -m "feat: migrate prostopadloscian pole/objetosc into brylyEgzamin"
```

---

### Task 43: Add `bryly_pole_podstawy_ostroslupa_egz`

**Files:**
- Modify: `js/topics/brylyEgzamin.js`
- Modify: `test/topics/brylyEgzamin.test.js`

**Interfaces:**
- Consumes: `formatNumber`, `buildOptions`
- Produces: `bryly_pole_podstawy_ostroslupa_egz` (closed).

- [ ] **Step 1: Write the failing tests**

Update the count test to 7. Then add:

```js
test('pole podstawy ostroslupa: the stated base area equals total minus lateral area', () => {
  const template = templates.find((t) => t.id === 'bryly_pole_podstawy_ostroslupa_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const match = task.tresc.match(/równe (\d+(?:,\d+)?) cm²[\s\S]*równe (\d+(?:,\d+)?) cm²/);
      assert.ok(match, `unexpected format: "${task.tresc}"`);
      const poleCalkowite = parsePl(match[1]);
      const poleBoczne = parsePl(match[2]);
      const expected = poleCalkowite - poleBoczne;
      assert.ok(Math.abs(parsePl(task.odpowiedz) - expected) < 1e-2, task.tresc);
    }
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/topics/brylyEgzamin.test.js`
Expected: FAIL.

- [ ] **Step 3: Update the implementation**

Add after `objetoscProstopadloscianuEgz`:

```js
const POLE_PODSTAWY_RANGES = {
  latwy: { aMax: 9 },
  sredni: { aMax: 15 },
  trudny: { aMax: 21 },
};

function polePodstawyOstroslupa(difficulty, rng) {
  const { aMax } = POLE_PODSTAWY_RANGES[difficulty];
  const a = 3 * rng.int(1, Math.floor(aMax / 3));
  const l = rng.int(Math.floor(a / 2) + 1, Math.floor(a / 2) + 10);
  const polePodstawy = a * a;
  const poleBoczne = 2 * a * l;
  const poleCalkowite = polePodstawy + poleBoczne;
  const correct = `${formatNumber(polePodstawy)} cm²`;

  // Typowe błędy: podanie pola całkowitego zamiast podstawy, podanie pola
  // bocznego zamiast podstawy, dodanie zamiast odjęcia.
  const wrong = [
    `${formatNumber(poleCalkowite)} cm²`,
    `${formatNumber(poleBoczne)} cm²`,
    `${formatNumber(poleCalkowite + poleBoczne)} cm²`,
  ];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'bryly_pole_podstawy_ostroslupa_egz',
    type: 'zamkniete',
    tresc:
      `Pole powierzchni całkowitej ostrosłupa prawidłowego czworokątnego jest równe ` +
      `${formatNumber(poleCalkowite)} cm², a pole powierzchni bocznej tego ostrosłupa jest ` +
      `równe ${formatNumber(poleBoczne)} cm². Oblicz pole podstawy tego ostrosłupa.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Pole podstawy = pole całkowite - pole boczne = ${formatNumber(poleCalkowite)} - ` +
      `${formatNumber(poleBoczne)} = ${correct}.`,
  };
}
```

Update the `templates` export array to add `{ id: 'bryly_pole_podstawy_ostroslupa_egz', generate: polePodstawyOstroslupa },`.

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/topics/brylyEgzamin.test.js`
Expected: PASS.

- [ ] **Step 5: Run the full suite**

Run: `node --test`
Expected: PASS — `brylyEgzamin.js` now exports 7 templates (4 closed, 3 open), matching or exceeding the target.

- [ ] **Step 6: Commit**

```bash
git add js/topics/brylyEgzamin.js test/topics/brylyEgzamin.test.js
git commit -m "feat: add bryly_pole_podstawy_ostroslupa_egz template"
```

---

## Part 7: Verification and cutover

### Task 44: Verify the exam-exclusive pool meets the 42 closed / 18 open floor

**Files:**
- Modify: `test/examModes.test.js`
- Modify: `js/topicRegistry.js` (only if this step reveals `rownania_osmoklasisty` was missed in Task 15 — it should already be present)

**Interfaces:**
- Consumes: `getTemplatesForTopics` (`js/examModes.js`, already exported and tested)
- Produces: nothing new — this task only adds a verifying test. `getTemplatesForTopics` works today without any `EXAM_MODES` entry declaring `examTopics`, so this test can run (and must pass) before the cutover in Task 45.

- [ ] **Step 1: Write the failing test**

In `test/examModes.test.js`, add:

```js
test('the six exam-exclusive topics together provide at least 42 closed and 18 open templates with unique ids', () => {
  const topicKeys = [
    'statystyka_osmoklasisty',
    'procenty_osmoklasisty',
    'geometria_osmoklasisty',
    'arytmetyka_osmoklasisty',
    'bryly_osmoklasisty',
    'rownania_osmoklasisty',
  ];
  const pool = getTemplatesForTopics(topicKeys);
  const ids = pool.map((t) => t.id);
  assert.equal(new Set(ids).size, ids.length, 'duplicate ids in the exam-exclusive pool');

  const rng = createRng(1);
  const closedCount = pool.filter((t) => t.generate('sredni', rng).type === 'zamkniete').length;
  const openCount = pool.length - closedCount;
  assert.ok(closedCount >= 42, `only ${closedCount} closed templates, need at least 42`);
  assert.ok(openCount >= 18, `only ${openCount} open templates, need at least 18`);
});
```

This requires importing `createRng` — add `import { createRng } from '../js/rng.js';` to the top of `test/examModes.test.js` alongside the existing imports.

- [ ] **Step 2: Run it to verify it fails or passes**

Run: `node --test test/examModes.test.js`
Expected: PASS already, since every template from Parts 1-6 above is committed. If it fails, it means one of the earlier tasks' template counts came in short — go back and check the failing topic file's actual `zamkniete`/`otwarte` split against its target table in the spec before proceeding.

- [ ] **Step 3: Run the full suite**

Run: `node --test`
Expected: PASS, every test in the project.

- [ ] **Step 4: Commit**

```bash
git add test/examModes.test.js
git commit -m "test: verify the exam-exclusive pool meets the 42 closed / 18 open floor"
```

---

### Task 45: Cut `osmoklasisty` over from `gradeKeys` to `examTopics`

**Files:**
- Modify: `js/examModes.js`
- Modify: `test/examModes.test.js`

**Interfaces:**
- Consumes: `getTemplatesForTopics` (already exported)
- Produces: `EXAM_MODES`'s `osmoklasisty` entry now declares `examTopics` instead of `gradeKeys`; `getTemplatesForExam('osmoklasisty')` now resolves via the exam-exclusive pool.

- [ ] **Step 1: Update the now-stale tests**

In `test/examModes.test.js`, replace the test `'no current EXAM_MODES entry declares examTopics yet (cutover not activated)'` with:

```js
test('osmoklasisty declares examTopics; matura still uses gradeKeys', () => {
  const osmoklasisty = EXAM_MODES.find((m) => m.key === 'osmoklasisty');
  const matura = EXAM_MODES.find((m) => m.key === 'matura');
  assert.ok('examTopics' in osmoklasisty, 'osmoklasisty should declare examTopics after the cutover');
  assert.ok(!('gradeKeys' in osmoklasisty), 'osmoklasisty should no longer declare gradeKeys');
  assert.ok('gradeKeys' in matura, 'matura should be unaffected by the cutover');
  assert.ok(!('examTopics' in matura));
});
```

And replace `'getTemplatesForExam still resolves osmoklasisty and matura via their existing gradeKeys pools'` with:

```js
test('getTemplatesForExam resolves osmoklasisty via examTopics with at least 42 closed / 18 open templates', () => {
  const pool = getTemplatesForExam('osmoklasisty');
  const ids = pool.map((t) => t.id);
  assert.equal(new Set(ids).size, ids.length, 'duplicate ids in getTemplatesForExam(osmoklasisty)');

  const rng = createRng(1);
  const closedCount = pool.filter((t) => t.generate('sredni', rng).type === 'zamkniete').length;
  assert.ok(closedCount >= 42, `only ${closedCount} closed templates`);
  assert.ok(pool.length - closedCount >= 18, `only ${pool.length - closedCount} open templates`);
});

test('getTemplatesForExam still resolves matura via its existing gradeKeys pool', () => {
  const pool = getTemplatesForExam('matura');
  assert.ok(pool.length > 0, 'matura resolved to an empty pool');
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/examModes.test.js`
Expected: FAIL — `osmoklasisty` still declares `gradeKeys`, not `examTopics`.

- [ ] **Step 3: Update the implementation**

In `js/examModes.js`, replace the file's leading comment and the `osmoklasisty` entry:

```js
// An exam mode's pool is either cumulative (gradeKeys: unions every grade
// in its stage's own Ćwiczenia topics — not from a single year) or
// exam-exclusive (examTopics: unions dedicated exam-only topics that are
// listed under no grade's topicKeys, so they never surface in Ćwiczenia
// mode). A mode declares exactly one of the two.
//
// osmoklasisty uses examTopics: the six exam-exclusive topic pools
// (statystyka/procenty/geometria/arytmetyka/bryly/rownania_osmoklasisty)
// together provide at least 42 closed / 18 open templates — see
// test/examModes.test.js's pool-size assertion — so the fixed 14/6
// structure no longer risks heavy repetition the way the old gradeKeys
// union (which pooled every sp4-sp8 Ćwiczenia template regardless of exam
// style or difficulty fit) did.

import { getTemplatesForGrade, TOPICS } from './topicRegistry.js';

export const EXAM_MODES = [
  {
    key: 'osmoklasisty',
    label: 'Egzamin ósmoklasisty',
    examTopics: [
      'statystyka_osmoklasisty',
      'procenty_osmoklasisty',
      'geometria_osmoklasisty',
      'arytmetyka_osmoklasisty',
      'bryly_osmoklasisty',
      'rownania_osmoklasisty',
    ],
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

(`getTemplatesForTopics` and `getTemplatesForExam` below this point are unchanged — `getTemplatesForExam` already branches on `mode.examTopics` vs `mode.gradeKeys`.)

- [ ] **Step 4: Run it to verify it passes**

Run: `node --test test/examModes.test.js`
Expected: PASS, all tests.

- [ ] **Step 5: Run the full suite**

Run: `node --test`
Expected: PASS, every test in the project.

- [ ] **Step 6: Manually verify in a browser**

Serve the site (`python -m http.server 8000`) and, using browser automation or by hand — **hard-reload the page** (the dev server sends no cache headers):

1. Select Tryb "Egzamin" → Egzamin "Egzamin ósmoklasisty". Generate several sheets back to back and confirm noticeably more variety than before (no repeating templates across generations at the pool sizes now in place) — this directly addresses the "~12 repeating tasks" report.
2. Confirm each generated sheet still has exactly 20 tasks: 14 closed (lettered options) followed by 6 open (no lettered options).
3. Spot-check a few of the new template types render correctly: the map-with-three-points P/F template (`geometria_mapa_trzy_punkty_egz` — confirm the third point, its label, and its distance appear on the diagram), the formula-rearrangement template (`rownania_wzor_przeksztalcenie_egz` — confirm the catalog formula and options render legibly), and a couple of the new arytmetyka/statystyka closed templates.
4. Switch the exam dropdown to "Matura (poziom podstawowy)" — confirm it still behaves exactly as before (unaffected by this cutover).
5. Go to Tryb "Ćwiczenia" and confirm none of the `_egz`-suffixed or exam-exclusive topic labels ("Statystyka (egzamin ósmoklasisty)", "Równania (egzamin ósmoklasisty)", etc.) appear in any grade's Dział dropdown — they must stay exam-exclusive.
6. Check print preview on an Egzamin ósmoklasisty sheet containing a few of the new diagram-bearing templates — confirm they print clearly.

- [ ] **Step 7: Fix anything that fails**

If any check in Step 6 fails, fix the relevant file and re-run both Step 5 and Step 6 before proceeding.

- [ ] **Step 8: Commit**

```bash
git add js/examModes.js test/examModes.test.js
git commit -m "feat: cut osmoklasisty exam mode over to the exam-exclusive template pool"
```

---

## Summary of new topic-file totals

| File | Closed | Open | Total |
|---|---|---|---|
| `arytmetykaEgzamin.js` | 13 | 6 | 19 |
| `rownaniaEgzamin.js` (new) | 10 | 4 | 14 |
| `statystykaEgzamin.js` | 8 | 4 | 12 |
| `geometriaEgzamin.js` | 7 | 5 | 12 |
| `procentyEgzamin.js` | 2 | 2 | 4 |
| `brylyEgzamin.js` | 4 | 3 | 7 |
| **Total exam-exclusive pool** | **44** | **24** | **68** |

Both floors (42 closed / 18 open) are cleared with a comfortable margin, matching the spec's "Resulting totals" projection.

