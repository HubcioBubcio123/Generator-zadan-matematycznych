import { test } from 'node:test';
import assert from 'node:assert/strict';
import { templates } from '../../js/topics/rownaniaEgzamin.js';
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
