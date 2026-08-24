import { test } from 'node:test';
import assert from 'node:assert/strict';
import { templates } from '../../js/topics/liceumZaawansowane.js';
import { assertValidTask } from '../../js/taskShape.js';
import { createRng } from '../../js/rng.js';

const LEVELS = ['latwy', 'sredni', 'trudny'];

function parsePl(text) {
  return Number(text.replace(/[^\d,-]/g, '').replace(',', '.'));
}

test('exports four templates with unique ids', () => {
  assert.equal(templates.length, 4);
  assert.equal(new Set(templates.map((t) => t.id)).size, 4);
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

test('trygonometria: sin of the angle equals opposite over hypotenuse', () => {
  const template = templates.find((t) => t.id === 'trygonometria_trojkat_prostokatny');
  for (const difficulty of LEVELS) {
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

test('prawdopodobienstwo: answer is a fraction between 0 and 1', () => {
  const template = templates.find((t) => t.id === 'prawdopodobienstwo_kostka');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const m = task.odpowiedz.match(/^(\d+)\/(\d+)$/);
      assert.ok(m, `not a fraction: ${task.odpowiedz}`);
      const value = Number(m[1]) / Number(m[2]);
      assert.ok(value > 0 && value <= 1, `${task.odpowiedz} out of range`);
    }
  }
});
