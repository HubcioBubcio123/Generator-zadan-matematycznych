import { test } from 'node:test';
import assert from 'node:assert/strict';
import { templates } from '../../js/topics/liceumZaawansowane.js';
import { assertValidTask } from '../../js/taskShape.js';
import { createRng } from '../../js/rng.js';

const LEVELS = ['latwy', 'sredni', 'trudny'];

function parsePl(text) {
  return Number(text.replace(/[^\d,-]/g, '').replace(',', '.'));
}

function gcd(a, b) {
  return b ? gcd(b, a % b) : a;
}

function countTwoDice(predicate) {
  let count = 0;
  for (let i = 1; i <= 6; i++) {
    for (let j = 1; j <= 6; j++) {
      if (predicate(i, j)) count++;
    }
  }
  return count;
}

test('exports five templates with unique ids', () => {
  assert.equal(templates.length, 5);
  assert.equal(new Set(templates.map((t) => t.id)).size, 5);
});

test('every template produces contract-valid tasks at every difficulty', () => {
  for (const template of templates) {
    for (const difficulty of LEVELS) {
      for (let seed = 0; seed < 100; seed++) {
        assertValidTask(template.generate(difficulty, createRng(seed)));
      }
    }
  }
});

test('ciag arytmetyczny: answer equals a1 + (n-1)*r', () => {
  const template = templates.find((t) => t.id === 'ciag_arytmetyczny_wyraz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [a1, r, n] = task.tresc.match(/-?\d+/g).map(Number);
      assert.equal(parsePl(task.odpowiedz), a1 + (n - 1) * r, task.tresc);
    }
  }
});

test('ciag suma: Sn equals (n/2) times (2a1 + (n-1)r)', () => {
  const template = templates.find((t) => t.id === 'ciag_arytmetyczny_suma');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [a1, r, n] = task.tresc.match(/-?\d+/g).map(Number);
      const expected = (n / 2) * (2 * a1 + (n - 1) * r);
      assert.equal(parsePl(task.odpowiedz), expected, task.tresc);
    }
  }
});

test('trygonometria latwy/sredni: sin of the angle equals opposite over hypotenuse', () => {
  const template = templates.find((t) => t.id === 'trygonometria_trojkat_prostokatny');
  for (const difficulty of ['latwy', 'sredni']) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [opposite, hypotenuse] = task.tresc.match(/\d+/g).map(Number);
      const expected = opposite / hypotenuse;
      assert.ok(
        Math.abs(parsePl(task.odpowiedz) - expected) < 5e-3,
        `${task.tresc} -> ${task.odpowiedz}, expected ${expected}`
      );
    }
  }
});

test('trygonometria trudny: side length matches the exact special-angle ratio', () => {
  const template = templates.find((t) => t.id === 'trygonometria_trojkat_prostokatny');
  for (let seed = 0; seed < 200; seed++) {
    const task = template.generate('trudny', createRng(seed));
    const [angle, hypotenuse] = task.tresc.match(/\d+/g).map(Number);
    const isOpposite = task.tresc.includes('naprzeciw');
    const radians = (angle * Math.PI) / 180;
    const ratio = isOpposite ? Math.sin(radians) : Math.cos(radians);
    const expected = hypotenuse * ratio;
    assert.ok(
      Math.abs(parsePl(task.odpowiedz) - expected) < 1e-3,
      `${task.tresc} -> ${task.odpowiedz}, expected ${expected}`
    );
  }
});

test('trygonometria trudny: only uses the special angles 30, 45, 60', () => {
  const template = templates.find((t) => t.id === 'trygonometria_trojkat_prostokatny');
  for (let seed = 0; seed < 200; seed++) {
    const task = template.generate('trudny', createRng(seed));
    const [angle] = task.tresc.match(/\d+/g).map(Number);
    assert.ok([30, 45, 60].includes(angle), `unexpected angle: ${angle}`);
  }
});

test('odleglosc punktow: answer matches the distance formula', () => {
  const template = templates.find((t) => t.id === 'geometria_analityczna_odleglosc');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [x1, y1, x2, y2] = task.tresc.match(/-?\d+/g).map(Number);
      const expected = Math.hypot(x2 - x1, y2 - y1);
      assert.ok(
        Math.abs(parsePl(task.odpowiedz) - expected) < 1e-6,
        `${task.tresc} -> ${task.odpowiedz}, expected ${expected}`
      );
    }
  }
});

test('odleglosc results are whole numbers, never irrational', () => {
  const template = templates.find((t) => t.id === 'geometria_analityczna_odleglosc');
  for (let seed = 0; seed < 200; seed++) {
    const task = template.generate('trudny', createRng(seed));
    assert.ok(Number.isInteger(parsePl(task.odpowiedz)), task.odpowiedz);
  }
});

test('prawdopodobienstwo latwy/sredni: answer is a fraction between 0 and 1', () => {
  const template = templates.find((t) => t.id === 'prawdopodobienstwo_kostka');
  for (const difficulty of ['latwy', 'sredni']) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const m = task.odpowiedz.match(/^(\d+)\/(\d+)$/);
      assert.ok(m, `not a fraction: ${task.odpowiedz}`);
      const value = Number(m[1]) / Number(m[2]);
      assert.ok(value > 0 && value <= 1, `${task.odpowiedz} out of range`);
    }
  }
});

test('prawdopodobienstwo trudny: two-dice favourable counts are enumerated correctly', () => {
  const template = templates.find((t) => t.id === 'prawdopodobienstwo_kostka');
  const PREDICATES = {
    'suma oczek wynosi 7': (i, j) => i + j === 7,
    'suma oczek jest parzysta': (i, j) => (i + j) % 2 === 0,
    'suma oczek jest większa od 9': (i, j) => i + j > 9,
    'na obu kostkach wypadnie ta sama liczba oczek': (i, j) => i === j,
    'suma oczek jest mniejsza od 5': (i, j) => i + j < 5,
  };
  for (let seed = 0; seed < 300; seed++) {
    const task = template.generate('trudny', createRng(seed));
    const key = Object.keys(PREDICATES).find((k) => task.tresc.includes(k));
    assert.ok(key, `unrecognized event: ${task.tresc}`);
    const expectedCount = countTwoDice(PREDICATES[key]);
    const [num, den] = task.odpowiedz.split('/').map(Number);
    const divisor = gcd(expectedCount, 36) || 1;
    assert.equal(num, expectedCount / divisor, task.odpowiedz);
    assert.equal(den, 36 / divisor, task.odpowiedz);
  }
});
