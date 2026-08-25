import { test } from 'node:test';
import assert from 'node:assert/strict';
import { templates } from '../../js/topics/geometriaPlaska.js';
import { assertValidTask } from '../../js/taskShape.js';
import { createRng } from '../../js/rng.js';

const LEVELS = ['latwy', 'sredni', 'trudny'];

function parsePl(text) {
  return Number(text.replace(/[^\d,-]/g, '').replace(',', '.'));
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

test('pole prostokata: answer equals a times b', () => {
  const template = templates.find((t) => t.id === 'geometria_pole_prostokata');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [a, b] = task.tresc.match(/\d+(?:,\d+)?/g).map(parsePl);
      assert.ok(
        Math.abs(parsePl(task.odpowiedz) - a * b) < 1e-6,
        `${task.tresc} -> ${task.odpowiedz}`
      );
    }
  }
});

test('obwod prostokata: answer equals 2*(a+b)', () => {
  const template = templates.find((t) => t.id === 'geometria_obwod_prostokata');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [a, b] = task.tresc.match(/\d+(?:,\d+)?/g).map(parsePl);
      assert.ok(Math.abs(parsePl(task.odpowiedz) - 2 * (a + b)) < 1e-6);
    }
  }
});

test('pole trojkata: answer equals half of base times height', () => {
  const template = templates.find((t) => t.id === 'geometria_pole_trojkata');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [base, height] = task.tresc.match(/\d+(?:,\d+)?/g).map(parsePl);
      assert.ok(Math.abs(parsePl(task.odpowiedz) - (base * height) / 2) < 1e-6);
    }
  }
});

test('pole trapezu: answer equals ((a+b)/2) times h', () => {
  const template = templates.find((t) => t.id === 'geometria_pole_trapezu');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [a, b, h] = task.tresc.match(/\d+(?:,\d+)?/g).map(parsePl);
      const expected = ((a + b) / 2) * h;
      assert.ok(
        Math.abs(parsePl(task.odpowiedz) - expected) < 1e-6,
        `${task.tresc} -> ${task.odpowiedz}, expected ${expected}`
      );
    }
  }
});

test('figura zlozona: answer equals the big rectangle area minus the cut-out area', () => {
  const template = templates.find((t) => t.id === 'geometria_figura_zlozona');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [W, H, w, h] = task.tresc.match(/\d+/g).map(Number);
      const expected = W * H - w * h;
      assert.equal(
        parsePl(task.odpowiedz),
        expected,
        `${task.tresc} -> ${task.odpowiedz}, expected ${expected}`
      );
    }
  }
});

test('figura zlozona: the cut-out never exceeds the outer rectangle', () => {
  const template = templates.find((t) => t.id === 'geometria_figura_zlozona');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [W, H, w, h] = task.tresc.match(/\d+/g).map(Number);
      assert.ok(w < W && h < H, `cutout not smaller than outer rectangle: ${task.tresc}`);
    }
  }
});

test('area answers carry squared units and perimeter answers do not', () => {
  for (const id of [
    'geometria_pole_prostokata',
    'geometria_pole_trojkata',
    'geometria_pole_trapezu',
    'geometria_figura_zlozona',
  ]) {
    const template = templates.find((t) => t.id === id);
    const task = template.generate('sredni', createRng(1));
    assert.ok(task.odpowiedz.includes('cm²'), `${id} missing cm²: ${task.odpowiedz}`);
  }
  const perimeter = templates.find((t) => t.id === 'geometria_obwod_prostokata');
  const task = perimeter.generate('sredni', createRng(1));
  assert.ok(!task.odpowiedz.includes('cm²'), `perimeter had cm²: ${task.odpowiedz}`);
});

test('dimensions grow with difficulty', () => {
  const template = templates.find((t) => t.id === 'geometria_pole_prostokata');
  const maxFor = (difficulty) => {
    let max = 0;
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      for (const n of task.tresc.match(/\d+(?:,\d+)?/g).map(parsePl)) {
        max = Math.max(max, n);
      }
    }
    return max;
  };
  assert.ok(maxFor('latwy') < maxFor('trudny'));
});
