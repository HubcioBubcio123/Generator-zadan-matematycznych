import { test } from 'node:test';
import assert from 'node:assert/strict';
import { templates } from '../../js/topics/geometriaPlaska.js';
import { assertValidTask } from '../../js/taskShape.js';
import { createRng } from '../../js/rng.js';

const LEVELS = ['latwy', 'sredni', 'trudny'];

function parsePl(text) {
  return Number(text.replace(/[^\d,-]/g, '').replace(',', '.'));
}

test('exports three templates with unique ids', () => {
  assert.equal(templates.length, 3);
  assert.equal(new Set(templates.map((t) => t.id)).size, 3);
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
      assert.ok(Math.abs(parsePl(task.odpowiedz) - a * b) < 1e-6, task.tresc);
    }
  }
});

test('obwod prostokata: answer equals 2*(a+b)', () => {
  const template = templates.find((t) => t.id === 'geometria_obwod_prostokata');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [a, b] = task.tresc.match(/\d+(?:,\d+)?/g).map(parsePl);
      assert.ok(Math.abs(parsePl(task.odpowiedz) - 2 * (a + b)) < 1e-6, task.tresc);
    }
  }
});

test('pole trojkata: answer equals half of base times height', () => {
  const template = templates.find((t) => t.id === 'geometria_pole_trojkata');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [base, height] = task.tresc.match(/\d+(?:,\d+)?/g).map(parsePl);
      assert.ok(
        Math.abs(parsePl(task.odpowiedz) - (base * height) / 2) < 1e-6,
        task.tresc
      );
    }
  }
});

test('area answers carry squared units and perimeter answers do not', () => {
  const area = templates.filter((t) => t.id.startsWith('geometria_pole'));
  for (const template of area) {
    for (let seed = 0; seed < 50; seed++) {
      const task = template.generate('sredni', createRng(seed));
      assert.ok(task.odpowiedz.includes('cm²'), `missing cm2: ${task.odpowiedz}`);
    }
  }
  const perimeter = templates.find((t) => t.id === 'geometria_obwod_prostokata');
  for (let seed = 0; seed < 50; seed++) {
    const task = perimeter.generate('sredni', createRng(seed));
    assert.ok(task.odpowiedz.includes('cm'), `missing cm: ${task.odpowiedz}`);
    assert.ok(!task.odpowiedz.includes('cm²'), `perimeter got cm2`);
  }
});

test('dimensions grow with difficulty', () => {
  const template = templates.find((t) => t.id === 'geometria_pole_prostokata');
  const maxDim = (difficulty) => {
    let max = 0;
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      for (const n of task.tresc.match(/\d+(?:,\d+)?/g).map(parsePl)) {
        max = Math.max(max, n);
      }
    }
    return max;
  };
  assert.ok(maxDim('latwy') < maxDim('trudny'));
});
