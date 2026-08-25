import { test } from 'node:test';
import assert from 'node:assert/strict';
import { templates } from '../../js/topics/potegiPitagoras.js';
import { assertValidTask } from '../../js/taskShape.js';
import { createRng } from '../../js/rng.js';

const LEVELS = ['latwy', 'sredni', 'trudny'];

function parsePl(text) {
  return Number(text.replace(/[^\d,-]/g, '').replace(',', '.'));
}

function isSquareFree(n) {
  for (let d = 2; d * d <= n; d++) {
    if (n % (d * d) === 0) return false;
  }
  return true;
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

test('potegi: the answer equals base to the exponent', () => {
  const template = templates.find((t) => t.id === 'potegi_obliczanie');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [base, exponent] = task.tresc.match(/\d+/g).map(Number);
      assert.equal(parsePl(task.odpowiedz), base ** exponent, task.tresc);
    }
  }
});

test('pierwiastki: the answer squared equals the radicand', () => {
  const template = templates.find((t) => t.id === 'pierwiastki_obliczanie');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [radicand] = task.tresc.match(/\d+/g).map(Number);
      const answer = parsePl(task.odpowiedz);
      assert.equal(answer * answer, radicand, task.tresc);
    }
  }
});

test('pierwszastki radicands are always perfect squares', () => {
  const template = templates.find((t) => t.id === 'pierwiastki_obliczanie');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [radicand] = task.tresc.match(/\d+/g).map(Number);
      assert.ok(Number.isInteger(Math.sqrt(radicand)), `${radicand} is not a square`);
    }
  }
});

test('pierwiastki uproszczenie: k times k times m equals the radicand', () => {
  const template = templates.find((t) => t.id === 'pierwiastki_uproszczenie');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [radicand] = task.tresc.match(/√(\d+)/).slice(1).map(Number);
      const [, k, m] = task.odpowiedz.match(/^(\d+)√(\d+)$/).map(Number);
      assert.equal(k * k * m, radicand, `${task.tresc} -> ${task.odpowiedz}`);
    }
  }
});

test('pierwiastki uproszczenie: the remaining radicand is fully reduced', () => {
  const template = templates.find((t) => t.id === 'pierwiastki_uproszczenie');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [, , m] = task.odpowiedz.match(/^(\d+)√(\d+)$/).map(Number);
      assert.ok(isSquareFree(m), `${task.odpowiedz} is not fully simplified`);
    }
  }
});

test('pitagoras latwy/sredni: given both legs, hypotenuse satisfies a2 + b2 = c2', () => {
  const template = templates.find((t) => t.id === 'pitagoras_przeciwprostokatna');
  for (const difficulty of ['latwy', 'sredni']) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [a, b] = task.tresc.match(/\d+/g).map(Number);
      const c = parsePl(task.odpowiedz);
      assert.equal(a * a + b * b, c * c, `${a},${b} -> ${c}`);
    }
  }
});

test('pitagoras trudny: given hypotenuse and one leg, the missing leg satisfies a2 + b2 = c2', () => {
  const template = templates.find((t) => t.id === 'pitagoras_przeciwprostokatna');
  for (let seed = 0; seed < 200; seed++) {
    const task = template.generate('trudny', createRng(seed));
    const [c, known] = task.tresc.match(/\d+/g).map(Number);
    const missing = parsePl(task.odpowiedz);
    assert.equal(known * known + missing * missing, c * c, `${c},${known} -> ${missing}`);
  }
});

test('pitagoras answers are whole numbers with a unit', () => {
  const template = templates.find((t) => t.id === 'pitagoras_przeciwprostokatna');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 100; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      assert.ok(task.odpowiedz.includes('cm'), task.odpowiedz);
      assert.ok(Number.isInteger(parsePl(task.odpowiedz)), task.odpowiedz);
    }
  }
});
