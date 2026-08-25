import { test } from 'node:test';
import assert from 'node:assert/strict';
import { templates } from '../../js/topics/procenty.js';
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

test('dwie zmiany: the final price equals two successive percent changes applied in order', () => {
  const template = templates.find((t) => t.id === 'procenty_dwie_zmiany');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const base = parsePl(task.tresc.match(/wynosiła ([\d,]+) zł/)[1]);
      const [, verb1, p1raw] = task.tresc.match(/cena (wzrosła|spadła) o (\d+(?:,\d+)?)%/);
      const [, verb2, p2raw] = task.tresc.match(/następnie nowa cena (wzrosła|spadła) o (\d+(?:,\d+)?)%/);
      const p1 = parsePl(p1raw);
      const p2 = parsePl(p2raw);
      const afterFirst = base * (1 + (verb1 === 'wzrosła' ? p1 : -p1) / 100);
      const expected = afterFirst * (1 + (verb2 === 'wzrosła' ? p2 : -p2) / 100);
      assert.ok(
        Math.abs(parsePl(task.odpowiedz) - expected) < 1e-4,
        `${task.tresc} -> ${task.odpowiedz}, expected ${expected}`
      );
    }
  }
});

test('dwie zmiany: naively netting the two percentages gives the wrong answer', () => {
  const template = templates.find((t) => t.id === 'procenty_dwie_zmiany');
  let sawMismatch = false;
  for (let seed = 0; seed < 100; seed++) {
    const task = template.generate('trudny', createRng(seed));
    const base = parsePl(task.tresc.match(/wynosiła ([\d,]+) zł/)[1]);
    const [, verb1, p1raw] = task.tresc.match(/cena (wzrosła|spadła) o (\d+(?:,\d+)?)%/);
    const [, verb2, p2raw] = task.tresc.match(/następnie nowa cena (wzrosła|spadła) o (\d+(?:,\d+)?)%/);
    const p1 = parsePl(p1raw) * (verb1 === 'wzrosła' ? 1 : -1);
    const p2 = parsePl(p2raw) * (verb2 === 'wzrosła' ? 1 : -1);
    const naiveTrap = base * (1 + (p1 + p2) / 100);
    if (Math.abs(naiveTrap - parsePl(task.odpowiedz)) > 1e-4) sawMismatch = true;
  }
  assert.ok(sawMismatch, 'the naive net-percentage trap matched the correct answer every time');
});

test('liczba z procentu: dividing the result by the change factor recovers the original value', () => {
  const template = templates.find((t) => t.id === 'procenty_liczba_z_procentu');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [, verb, percentRaw, resultRaw] = task.tresc.match(
        /(wzrosła|spadła) o (\d+(?:,\d+)?)%, wynosi ona ([\d,]+) zł/
      );
      const percent = parsePl(percentRaw);
      const result = parsePl(resultRaw);
      const factor = 1 + (verb === 'wzrosła' ? percent : -percent) / 100;
      const expected = result / factor;
      assert.ok(
        Math.abs(parsePl(task.odpowiedz) - expected) < 1e-4,
        `${task.tresc} -> ${task.odpowiedz}, expected ${expected}`
      );
    }
  }
});
