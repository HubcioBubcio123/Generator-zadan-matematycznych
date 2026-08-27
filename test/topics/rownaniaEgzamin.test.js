import { test } from 'node:test';
import assert from 'node:assert/strict';
import { templates } from '../../js/topics/rownaniaEgzamin.js';
import { assertValidTask } from '../../js/taskShape.js';
import { createRng } from '../../js/rng.js';

const LEVELS = ['latwy', 'sredni', 'trudny'];

function parsePl(text) {
  return Number(text.replace(/[^\d,-]/g, '').replace(',', '.'));
}

test('exports nine templates with unique ids', () => {
  assert.equal(templates.length, 9);
  assert.equal(new Set(templates.map((t) => t.id)).size, 9);
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

test('wyrazenie algebraiczne wartosc: the stated value equals a*x+b for the stated a, x, b', () => {
  const template = templates.find((t) => t.id === 'rownania_wyrazenie_algebraiczne_wartosc_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const match = task.tresc.match(/(-?\d+)x\s*([+-])\s*(\d+) dla x = (-?\d+)/);
      assert.ok(match, `unexpected format: "${task.tresc}"`);
      const a = Number(match[1]);
      const sign = match[2];
      const bAbs = Number(match[3]);
      const b = sign === '+' ? bAbs : -bAbs;
      const x = Number(match[4]);
      assert.equal(parsePl(task.odpowiedz), a * x + b, task.tresc);
    }
  }
});

test('wyrazenie algebraiczne wartosc: the arithmetic in rozwiazanie is correct', () => {
  const template = templates.find((t) => t.id === 'rownania_wyrazenie_algebraiczne_wartosc_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      // Parse the solution to extract the intermediate value (a*x) and verify arithmetic
      const matchRozwiazan = task.rozwiazanie.match(/(\d+) · (-?\d+)\s*([+-])\s*(\d+) = (-?\d+) ([+-]) (\d+) = (-?\d+)/);
      assert.ok(matchRozwiazan, `unexpected rozwiazanie format: "${task.rozwiazanie}"`);
      const a = Number(matchRozwiazan[1]);
      const x = Number(matchRozwiazan[2]);
      const bSign = matchRozwiazan[3];
      const bAbs = Number(matchRozwiazan[4]);
      const intermediate = Number(matchRozwiazan[5]);
      const secondSign = matchRozwiazan[6];
      const secondAbs = Number(matchRozwiazan[7]);
      const final = Number(matchRozwiazan[8]);

      // Verify intermediate = a * x
      assert.equal(intermediate, a * x, `intermediate: ${a} · ${x} should equal ${a * x}, got ${intermediate}`);

      // Verify the final addition/subtraction is arithmetically correct
      const b = bSign === '+' ? bAbs : -bAbs;
      const arithmeticCheck = secondSign === '+' ? intermediate + secondAbs : intermediate - secondAbs;
      assert.equal(arithmeticCheck, final, `${intermediate} ${secondSign} ${secondAbs} should equal ${final}, got ${arithmeticCheck}`);
    }
  }
});

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
