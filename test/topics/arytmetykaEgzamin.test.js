import { test } from 'node:test';
import assert from 'node:assert/strict';
import { templates } from '../../js/topics/arytmetykaEgzamin.js';
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
