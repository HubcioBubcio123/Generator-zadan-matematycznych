import { test } from 'node:test';
import assert from 'node:assert/strict';
import { templates } from '../../js/topics/ulamki.js';
import { assertValidTask } from '../../js/taskShape.js';
import { createRng } from '../../js/rng.js';

const LEVELS = ['latwy', 'sredni', 'trudny'];

function gcd(a, b) {
  while (b) [a, b] = [b, a % b];
  return Math.abs(a);
}

// '3/4' -> 0.75 ; '2 1/2' -> 2.5 ; '3' -> 3
function fractionValue(text) {
  const mixed = text.match(/^(-?\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) {
    const sign = mixed[1].startsWith('-') ? -1 : 1;
    return Number(mixed[1]) + sign * (Number(mixed[2]) / Number(mixed[3]));
  }
  const simple = text.match(/^(-?\d+)\/(\d+)$/);
  if (simple) return Number(simple[1]) / Number(simple[2]);
  return Number(text.replace(',', '.'));
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

test('dodawanie: the answer equals the independently recomputed sum', () => {
  const template = templates.find((t) => t.id === 'ulamki_dodawanie');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const parts = task.tresc.match(/(\d+)\/(\d+)/g);
      const expected = parts.reduce((acc, p) => {
        const [n, d] = p.split('/').map(Number);
        return acc + n / d;
      }, 0);
      assert.ok(
        Math.abs(fractionValue(task.odpowiedz) - expected) < 1e-9,
        `${task.tresc} -> ${task.odpowiedz}, expected ${expected}`
      );
    }
  }
});

test('mnozenie: the answer equals the independently recomputed product', () => {
  const template = templates.find((t) => t.id === 'ulamki_mnozenie');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const parts = task.tresc.match(/(\d+)\/(\d+)/g);
      const expected = parts.reduce((acc, p) => {
        const [n, d] = p.split('/').map(Number);
        return acc * (n / d);
      }, 1);
      assert.ok(Math.abs(fractionValue(task.odpowiedz) - expected) < 1e-9);
    }
  }
});

test('answers are always in lowest terms', () => {
  for (const template of templates) {
    for (const difficulty of LEVELS) {
      for (let seed = 0; seed < 200; seed++) {
        const task = template.generate(difficulty, createRng(seed));
        const m = task.odpowiedz.match(/(\d+)\/(\d+)/);
        if (m) {
          assert.equal(
            gcd(Number(m[1]), Number(m[2])),
            1,
            `${task.odpowiedz} is not reduced`
          );
        }
      }
    }
  }
});

test('porownanie answers with one of the comparison symbols', () => {
  const template = templates.find((t) => t.id === 'ulamki_porownanie');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 100; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      assert.ok(['<', '>', '='].includes(task.odpowiedz), `got "${task.odpowiedz}"`);
    }
  }
});

test('porownanie: the stated relation is actually true', () => {
  const template = templates.find((t) => t.id === 'ulamki_porownanie');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [left, right] = task.tresc.match(/(\d+)\/(\d+)/g).map((p) => {
        const [n, d] = p.split('/').map(Number);
        return n / d;
      });
      const actual = left < right ? '<' : left > right ? '>' : '=';
      assert.equal(task.odpowiedz, actual, `${task.tresc}`);
    }
  }
});

test('denominators grow with difficulty', () => {
  const template = templates.find((t) => t.id === 'ulamki_dodawanie');
  const maxDen = (difficulty) => {
    let max = 0;
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      for (const p of task.tresc.match(/(\d+)\/(\d+)/g)) {
        max = Math.max(max, Number(p.split('/')[1]));
      }
    }
    return max;
  };
  assert.ok(maxDen('latwy') < maxDen('trudny'));
});
