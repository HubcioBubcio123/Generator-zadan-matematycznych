import { test } from 'node:test';
import assert from 'node:assert/strict';
import { templates } from '../../js/topics/brylyEgzamin.js';
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

test('graniastoslup objetosc: the stated volume equals (a*b/2)*h for the stated dimensions', () => {
  const template = templates.find((t) => t.id === 'bryly_graniastoslup_trojkatny_objetosc_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [a, b, h] = task.tresc.match(/\d+/g).map(Number);
      const expected = (a * b) / 2 * h;
      assert.ok(
        Math.abs(parsePl(task.odpowiedz) - expected) < 1e-6,
        `${task.tresc} -> ${task.odpowiedz} (expected ${expected})`
      );
    }
  }
});

test('graniastoslup pole: the stated total surface area equals a*b + (a+b+c)*h for the stated dimensions', () => {
  const template = templates.find((t) => t.id === 'bryly_graniastoslup_trojkatny_pole_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [a, b, c, h] = task.tresc.match(/\d+/g).map(Number);
      const expected = a * b + (a + b + c) * h;
      assert.ok(
        Math.abs(parsePl(task.odpowiedz) - expected) < 1e-6,
        `${task.tresc} -> ${task.odpowiedz} (expected ${expected})`
      );
    }
  }
});

test('ostroslup objetosc: the stated volume equals (a*a*h)/3 for the stated dimensions', () => {
  const template = templates.find((t) => t.id === 'bryly_ostroslup_czworokatny_objetosc_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [a, h] = task.tresc.match(/\d+/g).map(Number);
      const expected = (a * a * h) / 3;
      assert.ok(
        Math.abs(parsePl(task.odpowiedz) - expected) < 1e-6,
        `${task.tresc} -> ${task.odpowiedz} (expected ${expected})`
      );
    }
  }
});

test('ostroslup pole: the stated total surface area equals a*a + 2*a*l for the stated dimensions', () => {
  const template = templates.find((t) => t.id === 'bryly_ostroslup_czworokatny_pole_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [a, l] = task.tresc.match(/\d+/g).map(Number);
      const expected = a * a + 2 * a * l;
      assert.ok(
        Math.abs(parsePl(task.odpowiedz) - expected) < 1e-6,
        `${task.tresc} -> ${task.odpowiedz} (expected ${expected})`
      );
    }
  }
});
