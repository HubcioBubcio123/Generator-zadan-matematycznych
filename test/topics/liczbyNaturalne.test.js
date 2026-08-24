import { test } from 'node:test';
import assert from 'node:assert/strict';
import { templates } from '../../js/topics/liczbyNaturalne.js';
import { assertValidTask } from '../../js/taskShape.js';
import { createRng } from '../../js/rng.js';

const LEVELS = ['latwy', 'sredni', 'trudny'];

// Parses a Polish-formatted number back to a JS number, so the test can
// recompute the answer independently of the template.
function parsePl(text) {
  return Number(text.replace(/\s/g, '').replace(',', '.'));
}

test('exports at least two templates with unique ids', () => {
  assert.ok(templates.length >= 2);
  const ids = templates.map((t) => t.id);
  assert.equal(new Set(ids).size, ids.length);
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

test('dodawanie: the stated answer equals the independently recomputed sum', () => {
  const template = templates.find((t) => t.id === 'liczby_naturalne_dodawanie');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const numbers = task.tresc.match(/\d+/g).map(Number);
      const expected = numbers.reduce((a, b) => a + b, 0);
      assert.equal(
        parsePl(task.odpowiedz),
        expected,
        `seed ${seed} ${difficulty}: "${task.tresc}" -> ${task.odpowiedz}`
      );
    }
  }
});

test('mnozenie: the stated answer equals the independently recomputed product', () => {
  const template = templates.find((t) => t.id === 'liczby_naturalne_mnozenie');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const numbers = task.tresc.match(/\d+/g).map(Number);
      const expected = numbers.reduce((a, b) => a * b, 1);
      assert.equal(parsePl(task.odpowiedz), expected, `seed ${seed} ${difficulty}`);
    }
  }
});

test('difficulty scales the operand magnitude', () => {
  const template = templates.find((t) => t.id === 'liczby_naturalne_dodawanie');
  const maxFor = (difficulty) => {
    let max = 0;
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      for (const n of task.tresc.match(/\d+/g).map(Number)) {
        max = Math.max(max, n);
      }
    }
    return max;
  };
  assert.ok(maxFor('latwy') < maxFor('sredni'), 'latwy is not easier than sredni');
  assert.ok(maxFor('sredni') < maxFor('trudny'), 'sredni is not easier than trudny');
});

test('results are never negative for this klasa-4 topic', () => {
  for (const template of templates) {
    for (const difficulty of LEVELS) {
      for (let seed = 0; seed < 100; seed++) {
        const task = template.generate(difficulty, createRng(seed));
        assert.ok(parsePl(task.odpowiedz) >= 0, `negative result: ${task.odpowiedz}`);
      }
    }
  }
});
