import { test } from 'node:test';
import assert from 'node:assert/strict';
import { templates } from '../../js/topics/statystykaEgzamin.js';
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
        const task = template.generate(difficulty, createRng(seed));
        assert.equal(task.id, template.id);
        assertValidTask(task);
      }
    }
  }
});

test('srednia: the stated mean equals the independently recomputed sum/n', () => {
  const template = templates.find((t) => t.id === 'statystyka_srednia_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const nums = task.tresc.match(/-?\d+/g).map(Number);
      const expected = nums.reduce((a, b) => a + b, 0) / nums.length;
      assert.ok(
        Math.abs(parsePl(task.odpowiedz) - expected) < 1e-6,
        `${task.tresc} -> ${task.odpowiedz} (expected ${expected})`
      );
    }
  }
});

test('mediana: the stated median equals the independently recomputed middle of the sorted list', () => {
  const template = templates.find((t) => t.id === 'statystyka_mediana_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const nums = task.tresc.match(/-?\d+/g).map(Number);
      const sorted = [...nums].sort((a, b) => a - b);
      const expected = sorted[(sorted.length - 1) / 2];
      assert.equal(parsePl(task.odpowiedz), expected, `${task.tresc} -> ${task.odpowiedz}`);
    }
  }
});

test('dominanta: the stated mode is independently the most frequent value in the list', () => {
  const template = templates.find((t) => t.id === 'statystyka_dominanta_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const nums = task.tresc.match(/-?\d+/g).map(Number);
      const counts = new Map();
      for (const n of nums) counts.set(n, (counts.get(n) ?? 0) + 1);
      let expected = nums[0];
      let expectedCount = 0;
      for (const [value, count] of counts) {
        if (count > expectedCount) {
          expected = value;
          expectedCount = count;
        }
      }
      assert.equal(parsePl(task.odpowiedz), expected, `${task.tresc} -> ${task.odpowiedz}`);
      assert.ok(expectedCount > 1, `no repeated value found in ${task.tresc}`);
    }
  }
});

test('rozstep: the stated range equals the independently recomputed max minus min', () => {
  const template = templates.find((t) => t.id === 'statystyka_rozstep_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const nums = task.tresc.match(/-?\d+/g).map(Number);
      const expected = Math.max(...nums) - Math.min(...nums);
      assert.equal(parsePl(task.odpowiedz), expected, `${task.tresc} -> ${task.odpowiedz}`);
    }
  }
});

test('procent z tabeli: the stated percent equals the independently recomputed count/total, and counts sum to the total', () => {
  const template = templates.find((t) => t.id === 'statystyka_procent_z_tabeli_egz');
  const BIERNIK = ['matematykę', 'informatykę', 'fizykę'];
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const total = Number(task.tresc.match(/wśród (\d+) uczniów/)[1]);
      const rowMatch = task.tresc.match(
        /matematyka - (\d+) osób, informatyka - (\d+) osób, fizyka - (\d+) osób/
      );
      assert.ok(rowMatch, `unexpected table format: "${task.tresc}"`);
      const counts = rowMatch.slice(1).map(Number);
      assert.equal(counts.reduce((a, b) => a + b, 0), total, `counts do not sum to total in "${task.tresc}"`);

      const askedLabel = task.tresc.match(/wybrał (matematykę|informatykę|fizykę) jako/)[1];
      const askIndex = BIERNIK.indexOf(askedLabel);
      const expectedPercent = Math.round((counts[askIndex] / total) * 100);
      const statedPercent = Number(task.odpowiedz.replace('%', ''));
      assert.equal(statedPercent, expectedPercent, `${task.tresc} -> ${task.odpowiedz}`);
    }
  }
});
