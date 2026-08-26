import { test } from 'node:test';
import assert from 'node:assert/strict';
import { templates } from '../../js/topics/liczbyNaturalnePowtorka.js';
import { assertValidTask } from '../../js/taskShape.js';
import { createRng } from '../../js/rng.js';

const LEVELS = ['latwy', 'sredni', 'trudny'];

function parsePl(text) {
  return Number(text.replace(/\s/g, '').replace(',', '.'));
}

function gcdIndependent(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

function lcmIndependent(a, b) {
  return (a * b) / gcdIndependent(a, b);
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

test('nwd_nww: the stated NWD and NWW are independently correct', () => {
  const template = templates.find((t) => t.id === 'liczby_naturalne_nwd_nww');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const numbers = task.tresc.match(/\d+/g).map(Number);
      const [x, y, p, q] = numbers;
      const m = task.odpowiedz.match(/^NWD = (\d+), NWW = (\d+)$/);
      assert.ok(m, `unexpected answer format: "${task.odpowiedz}"`);
      assert.equal(Number(m[1]), gcdIndependent(x, y), task.tresc);
      assert.equal(Number(m[2]), lcmIndependent(p, q), task.tresc);
    }
  }
});

test('suma_kolejnych: the stated sum equals n(n+1)/2 for the stated n', () => {
  const template = templates.find((t) => t.id === 'liczby_naturalne_suma_kolejnych');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [n] = task.tresc.match(/do (\d+)\./).slice(1).map(Number);
      const expected = (n * (n + 1)) / 2;
      assert.equal(parsePl(task.odpowiedz), expected, `n=${n} -> ${task.odpowiedz}`);
    }
  }
});
