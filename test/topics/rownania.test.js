import { test } from 'node:test';
import assert from 'node:assert/strict';
import { templates } from '../../js/topics/rownania.js';
import { assertValidTask } from '../../js/taskShape.js';
import { createRng } from '../../js/rng.js';

const LEVELS = ['latwy', 'sredni', 'trudny'];

function parsePl(text) {
  return Number(text.replace('x = ', '').replace(',', '.'));
}

const toJs = (s) => s.replace(/,/g, '.').replace(/(\d)x/g, '$1*x').replace(/(\d)\(/g, '$1*(');

function evaluateAt(expr, x) {
  return Function('x', `return ${toJs(expr)};`)(x);
}

test('exports five templates with unique ids', () => {
  assert.equal(templates.length, 5);
  assert.equal(new Set(templates.map((t) => t.id)).size, 5);
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

test('rownania liniowe: substituting the answer satisfies the equation', () => {
  const template = templates.find((t) => t.id === 'rownania_liniowe');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 300; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const equation = task.tresc.replace('Rozwiąż równanie: ', '');
      const [lhs, rhs] = equation.split('=');
      const x = parsePl(task.odpowiedz);
      assert.ok(
        Math.abs(evaluateAt(lhs, x) - evaluateAt(rhs, x)) < 1e-6,
        `${equation} with ${task.odpowiedz} does not balance`
      );
    }
  }
});

test('rownania liniowe answers are stated in the form "x = ..."', () => {
  const template = templates.find((t) => t.id === 'rownania_liniowe');
  for (let seed = 0; seed < 100; seed++) {
    const task = template.generate('sredni', createRng(seed));
    assert.match(task.odpowiedz, /^x = -?\d+(,\d+)?$/, task.odpowiedz);
  }
});

test('uproszczenie: the simplified expression matches at sample x values', () => {
  const template = templates.find((t) => t.id === 'rownania_uproszczenie');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const original = task.tresc.replace('Uprość wyrażenie: ', '');
      for (const x of [-3, 0, 2, 7.5]) {
        assert.ok(
          Math.abs(evaluateAt(original, x) - evaluateAt(task.odpowiedz, x)) < 1e-6,
          `${original} != ${task.odpowiedz} at x=${x}`
        );
      }
    }
  }
});

test('easy equations have integer solutions', () => {
  const template = templates.find((t) => t.id === 'rownania_liniowe');
  for (let seed = 0; seed < 200; seed++) {
    const task = template.generate('latwy', createRng(seed));
    assert.ok(Number.isInteger(parsePl(task.odpowiedz)), task.odpowiedz);
  }
});

test('nawiasy: substituting the answer satisfies the equation after expanding brackets', () => {
  const template = templates.find((t) => t.id === 'rownania_nawiasy');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 300; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const equation = task.tresc.replace('Rozwiąż równanie: ', '');
      const [lhs, rhs] = equation.split('=');
      const x = parsePl(task.odpowiedz);
      assert.ok(
        Math.abs(evaluateAt(lhs, x) - evaluateAt(rhs, x)) < 1e-6,
        `${equation} with ${task.odpowiedz} does not balance`
      );
    }
  }
});

test('nawiasy: every task actually contains a bracket to expand', () => {
  const template = templates.find((t) => t.id === 'rownania_nawiasy');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 100; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      assert.ok(task.tresc.includes('('), `no bracket in: ${task.tresc}`);
    }
  }
});

test('nawiasy: trudny puts x on both sides of the equation', () => {
  const template = templates.find((t) => t.id === 'rownania_nawiasy');
  for (const difficulty of ['latwy', 'sredni']) {
    for (let seed = 0; seed < 100; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [, rhs] = task.tresc.split('=');
      assert.ok(!rhs.includes('x'), `${difficulty} rhs should have no x: ${task.tresc}`);
    }
  }
  for (let seed = 0; seed < 100; seed++) {
    const task = template.generate('trudny', createRng(seed));
    const [, rhs] = task.tresc.split('=');
    assert.ok(rhs.includes('x'), `trudny rhs should contain x: ${task.tresc}`);
  }
});

test('nawiasy answers are stated in the form "x = ..."', () => {
  const template = templates.find((t) => t.id === 'rownania_nawiasy');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 100; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      assert.match(task.odpowiedz, /^x = -?\d+(,\d+)?$/, task.odpowiedz);
    }
  }
});

test('srednia arytmetyczna: c equals 3Y - 2X for the stated X and Y', () => {
  const template = templates.find((t) => t.id === 'rownania_srednia_arytmetyczna');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [X, Y] = task.tresc.match(/równa (\d+)/g).map((m) => Number(m.replace('równa ', '')));
      const expected = 3 * Y - 2 * X;
      assert.equal(parsePl(task.odpowiedz), expected, `X=${X} Y=${Y} -> ${task.odpowiedz}`);
    }
  }
});

function parsePlComma(text) {
  return Number(text.replace(',', '.'));
}

test('podzial na grupy: the total splits exactly into the stated ratio/difference relationship', () => {
  const template = templates.find((t) => t.id === 'rownania_podzial_na_grupy');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const total = Number(task.tresc.match(/łącznie (\d+)/)[1]);
      const k = parsePlComma(task.tresc.match(/(\d+(?:,\d+)?) razy więcej/)[1]);
      const d = Number(task.tresc.match(/o (\d+) mniej/)[1]);
      // total = cat1 + k*cat1 + (cat1 - d)  =>  cat1 = (total + d) / (2 + k)
      const cat1 = (total + d) / (2 + k);
      const expectedCat2 = k * cat1;
      assert.ok(
        Math.abs(parsePl(task.odpowiedz) - expectedCat2) < 1e-6,
        `${task.tresc} -> ${task.odpowiedz} (expected ${expectedCat2})`
      );
    }
  }
});
