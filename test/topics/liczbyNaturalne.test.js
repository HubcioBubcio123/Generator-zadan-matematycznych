import { test } from 'node:test';
import assert from 'node:assert/strict';
import { templates } from '../../js/topics/liczbyNaturalne.js';
import { assertValidTask } from '../../js/taskShape.js';
import { createRng } from '../../js/rng.js';

const LEVELS = ['latwy', 'sredni', 'trudny'];

function parsePl(text) {
  return Number(text.replace(/\s/g, '').replace(',', '.'));
}

// Parses "120 + 45 - 30" into its running total, independently of the
// template's own arithmetic.
function evalChain(tresc) {
  const expr = tresc.replace('Oblicz: ', '').trim();
  const tokens = expr.split(' ');
  let total = Number(tokens[0]);
  for (let i = 1; i < tokens.length; i += 2) {
    const op = tokens[i];
    const value = Number(tokens[i + 1]);
    total = op === '+' ? total + value : total - value;
  }
  return total;
}

test('exports at least three templates with unique ids', () => {
  assert.ok(templates.length >= 3);
  const ids = templates.map((t) => t.id);
  assert.equal(new Set(ids).size, ids.length);
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

test('dodawanie: the stated answer equals the independently recomputed chain total', () => {
  const template = templates.find((t) => t.id === 'liczby_naturalne_dodawanie');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const expected = evalChain(task.tresc);
      assert.equal(
        parsePl(task.odpowiedz),
        expected,
        `seed ${seed} ${difficulty}: "${task.tresc}" -> ${task.odpowiedz}`
      );
    }
  }
});

test('dodawanie: trudny always mixes in subtraction', () => {
  const template = templates.find((t) => t.id === 'liczby_naturalne_dodawanie');
  for (let seed = 0; seed < 100; seed++) {
    const task = template.generate('trudny', createRng(seed));
    assert.ok(task.tresc.includes(' - '), `trudny had no subtraction: "${task.tresc}"`);
  }
});

test('dodawanie: latwy stays pure addition', () => {
  const template = templates.find((t) => t.id === 'liczby_naturalne_dodawanie');
  for (let seed = 0; seed < 100; seed++) {
    const task = template.generate('latwy', createRng(seed));
    assert.ok(!task.tresc.includes(' - '), `latwy had subtraction: "${task.tresc}"`);
  }
});

test('mnozenie: the stated answer equals the independently recomputed product', () => {
  const template = templates.find((t) => t.id === 'liczby_naturalne_mnozenie');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const numbers = task.tresc.match(/\d+/g).map(Number);
      const expected = numbers.reduce((a, b) => a * b, 1);
      assert.equal(parsePl(task.odpowiedz), expected, `seed ${seed} ${difficulty}`);
    }
  }
});

test('dzielenie: quotient and remainder match independent division', () => {
  const template = templates.find((t) => t.id === 'liczby_naturalne_dzielenie');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [dividend, divisor] = task.tresc.match(/\d+/g).map(Number);
      const expectedQuotient = Math.floor(dividend / divisor);
      const expectedRemainder = dividend % divisor;
      const m = task.odpowiedz.match(/^(\d+)(?: reszta (\d+))?$/);
      assert.ok(m, `unexpected answer format: "${task.odpowiedz}"`);
      assert.equal(Number(m[1]), expectedQuotient, `seed ${seed} ${difficulty}`);
      assert.equal(Number(m[2] ?? 0), expectedRemainder, `seed ${seed} ${difficulty}`);
    }
  }
});

test('dzielenie: latwy and sredni divide exactly, trudny may have a remainder', () => {
  const template = templates.find((t) => t.id === 'liczby_naturalne_dzielenie');
  for (const difficulty of ['latwy', 'sredni']) {
    for (let seed = 0; seed < 100; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      assert.ok(!task.odpowiedz.includes('reszta'), `${difficulty} had a remainder: ${task.odpowiedz}`);
    }
  }
  let sawRemainder = false;
  for (let seed = 0; seed < 100; seed++) {
    const task = template.generate('trudny', createRng(seed));
    if (task.odpowiedz.includes('reszta')) sawRemainder = true;
  }
  assert.ok(sawRemainder, 'trudny never produced a remainder across 100 seeds');
});

test('difficulty scales the operand magnitude', () => {
  const template = templates.find((t) => t.id === 'liczby_naturalne_dodawanie');
  const maxFor = (difficulty) => {
    let max = 0;
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      for (const n of task.tresc.match(/\d+/g).map(Number)) {
        max = Math.max(max, n);
      }
    }
    return max;
  };
  assert.ok(maxFor('latwy') < maxFor('sredni'), 'latwy is not easier than sredni');
  assert.ok(maxFor('sredni') < maxFor('trudny'), 'sredni is not easier than trudny');
});

test('results are never negative for this klasa-4 topic', () => {
  for (const template of templates) {
    for (const difficulty of LEVELS) {
      for (let seed = 0; seed < 100; seed++) {
        const task = template.generate(difficulty, createRng(seed));
        const value = parsePl(task.odpowiedz.split(' ')[0]);
        assert.ok(value >= 0, `negative result: ${task.odpowiedz}`);
      }
    }
  }
});
