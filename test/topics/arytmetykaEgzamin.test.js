import { test } from 'node:test';
import assert from 'node:assert/strict';
import { templates } from '../../js/topics/arytmetykaEgzamin.js';
import { assertValidTask } from '../../js/taskShape.js';
import { createRng } from '../../js/rng.js';

const LEVELS = ['latwy', 'sredni', 'trudny'];

function parsePl(text) {
  return Number(text.replace(/[^\d,-]/g, '').replace(',', '.'));
}

test('exports sixteen templates with unique ids', () => {
  assert.equal(templates.length, 16);
  assert.equal(new Set(templates.map((t) => t.id)).size, 16);
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

test('proporcja wartosc: the stated y2 is independently consistent with the same ratio as the given (x1,y1) pair', () => {
  const template = templates.find((t) => t.id === 'arytmetyka_proporcja_wartosc_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [x1, y1, x2] = task.tresc.match(/-?\d+/g).map(Number);
      const expected = (y1 / x1) * x2;
      assert.ok(
        Math.abs(parsePl(task.odpowiedz) - expected) < 1e-6,
        `${task.tresc} -> ${task.odpowiedz} (expected ${expected})`
      );
    }
  }
});

test('proporcja zadanie: the stated cost equals the independently recomputed unit-rate cost', () => {
  const template = templates.find((t) => t.id === 'arytmetyka_proporcja_zadanie_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [n1, w1, n2] = task.tresc.match(/-?\d+(?:,\d+)?/g).map((s) => Number(s.replace(',', '.')));
      const expected = (w1 / n1) * n2;
      assert.ok(
        Math.abs(parsePl(task.odpowiedz) - expected) < 1e-6,
        `${task.tresc} -> ${task.odpowiedz} (expected ${expected})`
      );
    }
  }
});

test('podzial proporcjonalny: the stated larger part is independently consistent with the stated ratio and total', () => {
  const template = templates.find((t) => t.id === 'arytmetyka_podzial_proporcjonalny_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const match = task.tresc.match(/liczbę (\d+) na dwie części w stosunku (\d+):(\d+)/);
      assert.ok(match, `unexpected format: "${task.tresc}"`);
      const [, totalText, aText, bText] = match;
      const total = Number(totalText);
      const a = Number(aText);
      const b = Number(bText);
      const jednostka = total / (a + b);
      const expectedLarger = Math.max(a, b) * jednostka;
      assert.ok(
        Math.abs(parsePl(task.odpowiedz) - expectedLarger) < 1e-6,
        `${task.tresc} -> ${task.odpowiedz} (expected ${expectedLarger})`
      );
    }
  }
});

test('dzialania calkowite: the stated value is the independently recomputed a^2 + b*c - d', () => {
  const template = templates.find((t) => t.id === 'arytmetyka_dzialania_calkowite_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [a, b, c, d] = task.tresc.match(/\d+/g).map(Number);
      const expected = a * a + b * c - d;
      assert.equal(parsePl(task.odpowiedz), expected, `${task.tresc} -> ${task.odpowiedz}`);
    }
  }
});

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

test('najwieksza najmniejsza: the stated answer is the largest of the four listed numbers', () => {
  const template = templates.find((t) => t.id === 'arytmetyka_najwieksza_najmniejsza_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const numbers = task.tresc
        .match(/liczby: ([^.]+)\./)[1]
        .split(';')
        .map((s) => Number(s.trim().replace(',', '.')));
      const expected = Math.max(...numbers);
      assert.ok(Math.abs(parsePl(task.odpowiedz) - expected) < 1e-6, task.tresc);
    }
  }
});

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
