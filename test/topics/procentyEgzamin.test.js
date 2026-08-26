import { test } from 'node:test';
import assert from 'node:assert/strict';
import { templates } from '../../js/topics/procentyEgzamin.js';
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
        const task = template.generate(difficulty, createRng(seed));
        assert.equal(task.id, template.id);
        assertValidTask(task);
      }
    }
  }
});

test('vat: brutto equals netto times (1 + stawka/100), independently, whichever direction is asked', () => {
  const template = templates.find((t) => t.id === 'procenty_vat_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const stawka = Number(task.tresc.match(/Stawka VAT wynosi (\d+)%/)[1]);
      const answer = parsePl(task.odpowiedz);
      assert.ok(task.odpowiedz.includes('zł'), task.odpowiedz);

      if (task.tresc.includes('Cena brutto')) {
        const brutto = Number(task.tresc.match(/Cena brutto pewnego towaru wynosi ([\d,]+) zł/)[1].replace(',', '.'));
        const expectedNetto = brutto / (1 + stawka / 100);
        assert.ok(
          Math.abs(answer - expectedNetto) < 0.02,
          `${task.tresc} -> ${task.odpowiedz} (expected netto ${expectedNetto})`
        );
      } else {
        const netto = Number(task.tresc.match(/Cena netto pewnego towaru wynosi ([\d,]+) zł/)[1].replace(',', '.'));
        const expectedBrutto = netto * (1 + stawka / 100);
        assert.ok(
          Math.abs(answer - expectedBrutto) < 0.02,
          `${task.tresc} -> ${task.odpowiedz} (expected brutto ${expectedBrutto})`
        );
      }
    }
  }
});

test('vat: both directions (ask for netto, ask for brutto) occur across many seeds', () => {
  const template = templates.find((t) => t.id === 'procenty_vat_egz');
  let sawNettoAsk = false;
  let sawBruttoAsk = false;
  for (let seed = 0; seed < 100; seed++) {
    const task = template.generate('sredni', createRng(seed));
    if (task.tresc.includes('Oblicz cenę netto')) sawNettoAsk = true;
    if (task.tresc.includes('Oblicz cenę brutto')) sawBruttoAsk = true;
  }
  assert.ok(sawNettoAsk, 'never asked for netto across 100 seeds');
  assert.ok(sawBruttoAsk, 'never asked for brutto across 100 seeds');
});

function punktForma(n) {
  if (n === 1) return 'punkt procentowy';
  const lastDigit = n % 10;
  const lastTwo = n % 100;
  if (lastDigit >= 2 && lastDigit <= 4 && !(lastTwo >= 12 && lastTwo <= 14)) return 'punkty procentowe';
  return 'punktów procentowych';
}

test('punkty procentowe: the stated difference is the plain difference of the two percentages, not the relative growth, with correct Polish pluralization', () => {
  const template = templates.find((t) => t.id === 'procenty_punkty_procentowe_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [p1, p2] = task.tresc.match(/z (\d+)% do (\d+)%/).slice(1).map(Number);
      const expectedDelta = p2 - p1;
      const m = task.odpowiedz.match(/^(\d+) (punkt procentowy|punkty procentowe|punktów procentowych)$/);
      assert.ok(m, `unexpected answer format: "${task.odpowiedz}"`);
      assert.equal(Number(m[1]), expectedDelta, `${task.tresc} -> ${task.odpowiedz}`);
      assert.equal(m[2], punktForma(expectedDelta), `wrong pluralization in "${task.odpowiedz}"`);
      // The classic trap this question tests: the relative percent-increase
      // formula must NOT equal the correct percentage-point difference,
      // otherwise the distractor wouldn't actually distinguish the concepts.
      const relativeGrowth = Math.round(((p2 - p1) / p1) * 100);
      assert.notEqual(relativeGrowth, expectedDelta, `trap distractor coincides with the correct answer in "${task.tresc}"`);
    }
  }
});

test('odsetki: the stated total equals the independently recomputed kwota plus interest', () => {
  const template = templates.find((t) => t.id === 'procenty_odsetki_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [kwota, oprocentowanie] = task.tresc
        .match(/wpłacono ([\d,]+) zł na lokatę roczną oprocentowaną w wysokości (\d+)%/)
        .slice(1);
      const kwotaNum = Number(kwota.replace(',', '.'));
      const expected = kwotaNum + (kwotaNum * Number(oprocentowanie)) / 100;
      assert.ok(
        Math.abs(parsePl(task.odpowiedz) - expected) < 0.01,
        `${task.tresc} -> ${task.odpowiedz} (expected ${expected})`
      );
    }
  }
});
