import { test } from 'node:test';
import assert from 'node:assert/strict';
import { templates } from '../../js/topics/procenty.js';
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
        assertValidTask(template.generate(difficulty, createRng(seed)));
      }
    }
  }
});

test('procent z liczby: the answer equals the recomputed percentage', () => {
  const template = templates.find((t) => t.id === 'procenty_z_liczby');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [percent, base] = task.tresc.match(/\d+(?:,\d+)?/g).map(parsePl);
      const expected = (percent / 100) * base;
      assert.ok(
        Math.abs(parsePl(task.odpowiedz) - expected) < 1e-6,
        `${task.tresc} -> ${task.odpowiedz}, expected ${expected}`
      );
    }
  }
});

test('podwyzka: the answer equals base increased by the percentage', () => {
  const template = templates.find((t) => t.id === 'procenty_podwyzka');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [base, percent] = task.tresc.match(/\d+(?:,\d+)?/g).map(parsePl);
      const expected = base * (1 + percent / 100);
      assert.ok(
        Math.abs(parsePl(task.odpowiedz) - expected) < 1e-6,
        `${task.tresc} -> ${task.odpowiedz}, expected ${expected}`
      );
    }
  }
});

test('percentages used are sensible values between 1 and 100', () => {
  const template = templates.find((t) => t.id === 'procenty_z_liczby');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [percent] = task.tresc.match(/\d+(?:,\d+)?/g).map(parsePl);
      assert.ok(percent >= 1 && percent <= 100, `percent out of range: ${percent}`);
    }
  }
});

test('easy percentages are round numbers', () => {
  const template = templates.find((t) => t.id === 'procenty_z_liczby');
  for (let seed = 0; seed < 200; seed++) {
    const task = template.generate('latwy', createRng(seed));
    const [percent] = task.tresc.match(/\d+(?:,\d+)?/g).map(parsePl);
    assert.equal(percent % 10, 0, `latwy used a non-round percent: ${percent}`);
  }
});
