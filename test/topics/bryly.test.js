import { test } from 'node:test';
import assert from 'node:assert/strict';
import { templates } from '../../js/topics/bryly.js';
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

test('pole powierzchni: the answer equals 2(ab + bc + ac), and the figura matches the stated dimensions', () => {
  const template = templates.find((t) => t.id === 'bryly_pole_powierzchni_prostopadloscianu');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [a, b, c] = task.tresc.match(/\d+(?:,\d+)?/g).map(parsePl);
      const expected = 2 * (a * b + b * c + a * c);
      assert.ok(
        Math.abs(parsePl(task.odpowiedz) - expected) < 1e-6,
        `${task.tresc} -> ${task.odpowiedz}`
      );
      assert.equal(task.figura.typ, 'prostopadloscian');
      assert.equal(task.figura.a, a);
      assert.equal(task.figura.b, b);
      assert.equal(task.figura.c, c);
    }
  }
});

test('objetosc: the answer equals a * b * c, and the figura matches the stated dimensions', () => {
  const template = templates.find((t) => t.id === 'bryly_objetosc_prostopadloscianu');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [a, b, c] = task.tresc.match(/\d+(?:,\d+)?/g).map(parsePl);
      const expected = a * b * c;
      assert.ok(
        Math.abs(parsePl(task.odpowiedz) - expected) < 1e-6,
        `${task.tresc} -> ${task.odpowiedz}`
      );
      assert.equal(task.figura.typ, 'prostopadloscian');
      assert.equal(task.figura.a, a);
      assert.equal(task.figura.b, b);
      assert.equal(task.figura.c, c);
    }
  }
});
