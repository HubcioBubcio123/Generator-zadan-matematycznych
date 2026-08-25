import { test } from 'node:test';
import assert from 'node:assert/strict';
import { templates } from '../../js/topics/ulamkiDziesietne.js';
import { assertValidTask } from '../../js/taskShape.js';
import { createRng } from '../../js/rng.js';

const LEVELS = ['latwy', 'sredni', 'trudny'];

function parsePl(text) {
  return Number(text.replace(',', '.'));
}

// Parses "12,5 + 3,75 - 0,125" into its running total, independently of the
// template's own arithmetic.
function evalChain(tresc) {
  const expr = tresc.replace('Oblicz: ', '').trim();
  const tokens = expr.split(' ');
  let total = parsePl(tokens[0]);
  for (let i = 1; i < tokens.length; i += 2) {
    const op = tokens[i];
    const value = parsePl(tokens[i + 1]);
    total = op === '+' ? total + value : total - value;
  }
  return total;
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

test('dodawanie: the answer equals the independently recomputed chain total', () => {
  const template = templates.find((t) => t.id === 'ulamki_dziesietne_dodawanie');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const expected = evalChain(task.tresc);
      assert.ok(
        Math.abs(parsePl(task.odpowiedz) - expected) < 1e-6,
        `${task.tresc} -> ${task.odpowiedz}, expected ${expected}`
      );
    }
  }
});

test('dodawanie: trudny mixes subtraction into the chain', () => {
  const template = templates.find((t) => t.id === 'ulamki_dziesietne_dodawanie');
  for (let seed = 0; seed < 100; seed++) {
    const task = template.generate('trudny', createRng(seed));
    assert.ok(task.tresc.includes(' - '), `trudny had no subtraction: "${task.tresc}"`);
  }
});

test('mnozenie: the answer equals the independently recomputed product', () => {
  const template = templates.find((t) => t.id === 'ulamki_dziesietne_mnozenie');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const expected = task.tresc
        .match(/\d+(?:,\d+)?/g)
        .map(parsePl)
        .reduce((a, b) => a * b, 1);
      assert.ok(Math.abs(parsePl(task.odpowiedz) - expected) < 1e-6);
    }
  }
});

test('dzielenie: the answer equals the independently recomputed quotient', () => {
  const template = templates.find((t) => t.id === 'ulamki_dziesietne_dzielenie');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [dividend, divisor] = task.tresc.match(/\d+(?:,\d+)?/g).map(parsePl);
      const expected = dividend / divisor;
      assert.ok(
        Math.abs(parsePl(task.odpowiedz) - expected) < 1e-6,
        `${task.tresc} -> ${task.odpowiedz}, expected ${expected}`
      );
    }
  }
});

test('dzielenie: trudny divides by a decimal, not just a whole number', () => {
  const template = templates.find((t) => t.id === 'ulamki_dziesietne_dzielenie');
  for (let seed = 0; seed < 100; seed++) {
    const task = template.generate('trudny', createRng(seed));
    const [, divisorText] = task.tresc.match(/: ([\d,]+) : ([\d,]+)/).slice(1);
    assert.ok(divisorText.includes(','), `trudny divisor was a whole number: "${task.tresc}"`);
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
