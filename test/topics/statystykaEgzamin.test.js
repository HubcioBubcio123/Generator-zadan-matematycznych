import { test } from 'node:test';
import assert from 'node:assert/strict';
import { templates } from '../../js/topics/statystykaEgzamin.js';
import { assertValidTask } from '../../js/taskShape.js';
import { createRng } from '../../js/rng.js';

const LEVELS = ['latwy', 'sredni', 'trudny'];
const SKLEPY = ['Sklep A', 'Sklep B', 'Sklep C', 'Sklep D', 'Sklep E'];

function parsePl(text) {
  return Number(text.replace(/[^\d,-]/g, '').replace(',', '.'));
}

function parseSklepyTable(tresc) {
  const match = tresc.match(
    /Sklep A - (\d+), Sklep B - (\d+), Sklep C - (\d+), Sklep D - (\d+), Sklep E - (\d+)/
  );
  assert.ok(match, `unexpected table format: "${tresc}"`);
  return match.slice(1).map(Number);
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

function polishOsobaForm(n) {
  if (n === 1) return 'osoba';
  const lastDigit = n % 10;
  const lastTwo = n % 100;
  if (lastDigit >= 2 && lastDigit <= 4 && !(lastTwo >= 12 && lastTwo <= 14)) return 'osoby';
  return 'osób';
}

test('procent z tabeli: each count uses grammatically correct Polish pluralization', () => {
  const template = templates.find((t) => t.id === 'statystyka_procent_z_tabeli_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const matches = [...task.tresc.matchAll(/(\d+) (osoba|osoby|osób)/g)];
      assert.equal(matches.length, 3, `expected 3 count phrases in "${task.tresc}"`);
      for (const [, countText, word] of matches) {
        const expected = polishOsobaForm(Number(countText));
        assert.equal(
          word,
          expected,
          `"${countText} ${word}" should be "${countText} ${expected}" in "${task.tresc}"`
        );
      }
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
        /matematyka - (\d+) (?:osoba|osoby|osób), informatyka - (\d+) (?:osoba|osoby|osób), fizyka - (\d+) (?:osoba|osoby|osób)/
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

test('tabela porownanie: the stated difference equals the independently recomputed larger-minus-smaller value', () => {
  const template = templates.find((t) => t.id === 'statystyka_tabela_porownanie_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const wartosci = parseSklepyTable(task.tresc);
      const question = task.tresc.match(/Ile więcej rowerów sprzedał (Sklep [A-E]) niż (Sklep [A-E])\?/);
      assert.ok(question, `unexpected question format: "${task.tresc}"`);
      const [, labelA, labelB] = question;
      const iA = SKLEPY.indexOf(labelA);
      const iB = SKLEPY.indexOf(labelB);
      const expected = wartosci[iA] - wartosci[iB];
      assert.ok(expected > 0, `A should be strictly larger than B in "${task.tresc}"`);
      assert.equal(parsePl(task.odpowiedz), expected, `${task.tresc} -> ${task.odpowiedz}`);
    }
  }
});

test('tabela suma: the stated total equals the independently recomputed sum of the table', () => {
  const template = templates.find((t) => t.id === 'statystyka_tabela_suma_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const wartosci = parseSklepyTable(task.tresc);
      const expected = wartosci.reduce((a, b) => a + b, 0);
      assert.equal(parsePl(task.odpowiedz), expected, `${task.tresc} -> ${task.odpowiedz}`);
    }
  }
});

test('tabela ekstremum: the stated shop independently has the strictly largest value in the table', () => {
  const template = templates.find((t) => t.id === 'statystyka_tabela_ekstremum_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const wartosci = parseSklepyTable(task.tresc);
      const maxValue = Math.max(...wartosci);
      const maxCount = wartosci.filter((v) => v === maxValue).length;
      assert.equal(maxCount, 1, `ambiguous tie for maximum in "${task.tresc}"`);
      const expectedIndex = wartosci.indexOf(maxValue);
      assert.equal(task.odpowiedz, SKLEPY[expectedIndex], `${task.tresc} -> ${task.odpowiedz}`);
    }
  }
});
