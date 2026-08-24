import { test } from 'node:test';
import assert from 'node:assert/strict';
import { templates } from '../../js/topics/ulamkiDziesietne.js';
import { assertValidTask } from '../../js/taskShape.js';
import { createRng } from '../../js/rng.js';

const LEVELS = ['latwy', 'sredni', 'trudny'];

function parsePl(text) {
  return Number(text.replace(',', '.'));
}

function numbersIn(text) {
  return text.match(/\d+(?:,\d+)?/g).map(parsePl);
}

test('exports two templates with unique ids', () => {
  assert.equal(templates.length, 2);
  assert.equal(new Set(templates.map((t) => t.id)).size, 2);
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

test('dodawanie: the answer equals the independently recomputed sum', () => {
  const template = templates.find((t) => t.id === 'ulamki_dziesietne_dodawanie');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const expected = numbersIn(task.tresc).reduce((a, b) => a + b, 0);
      assert.ok(
        Math.abs(parsePl(task.odpowiedz) - expected) < 1e-9,
        `${task.tresc} -> ${task.odpowiedz}, expected ${expected}`
      );
    }
  }
});

test('mnozenie: the answer equals the independently recomputed product', () => {
  const template = templates.find((t) => t.id === 'ulamki_dziesietne_mnozenie');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const expected = numbersIn(task.tresc).reduce((a, b) => a * b, 1);
      assert.ok(Math.abs(parsePl(task.odpowiedz) - expected) < 1e-9);
    }
  }
});

test('decimal places grow with difficulty', () => {
  const template = templates.find((t) => t.id === 'ulamki_dziesietne_dodawanie');
  const maxPlaces = (difficulty) => {
    let max = 0;
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      for (const m of task.tresc.match(/\d+,\d+/g) ?? []) {
        max = Math.max(max, m.split(',')[1].length);
      }
    }
    return max;
  };
  assert.ok(maxPlaces('latwy') <= maxPlaces('sredni'));
  assert.ok(maxPlaces('sredni') < maxPlaces('trudny'));
});

test('no answer suffers visible floating point noise', () => {
  for (const template of templates) {
    for (const difficulty of LEVELS) {
      for (let seed = 0; seed < 200; seed++) {
        const task = template.generate(difficulty, createRng(seed));
        const decimals = task.odpowiedz.split(',')[1];
        assert.ok(
          !decimals || decimals.length <= 4,
          `noisy answer: ${task.odpowiedz}`
        );
      }
    }
  }
});
