import { test } from 'node:test';
import assert from 'node:assert/strict';
import { templates } from '../../js/topics/geometriaEgzamin.js';
import { assertValidTask } from '../../js/taskShape.js';
import { createRng } from '../../js/rng.js';

const LEVELS = ['latwy', 'sredni', 'trudny'];
const PI = 3.14;

function parsePl(text) {
  return Number(text.replace(/[^\d,-]/g, '').replace(',', '.'));
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

test('okrag dlugosc: the stated circumference equals 2*pi*r for the stated radius', () => {
  const template = templates.find((t) => t.id === 'geometria_okrag_dlugosc_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const r = Number(task.tresc.match(/promień długości (\d+) cm/)[1]);
      const expected = 2 * PI * r;
      assert.ok(
        Math.abs(parsePl(task.odpowiedz) - expected) < 0.01,
        `${task.tresc} -> ${task.odpowiedz} (expected ${expected})`
      );
    }
  }
});

test('okrag promien z dlugosci: the stated radius independently satisfies obwod = 2*pi*r', () => {
  const template = templates.find((t) => t.id === 'geometria_okrag_promien_z_dlugosci_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const obwod = Number(task.tresc.match(/równa ([\d,]+) cm/)[1].replace(',', '.'));
      const r = parsePl(task.odpowiedz);
      const expectedObwod = 2 * PI * r;
      assert.ok(
        Math.abs(obwod - expectedObwod) < 0.02,
        `${task.tresc} -> ${task.odpowiedz} (r=${r} gives obwod ${expectedObwod}, stated ${obwod})`
      );
    }
  }
});

test('pole kola: the stated area equals pi*r^2 for the stated radius', () => {
  const template = templates.find((t) => t.id === 'geometria_pole_kola_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const r = Number(task.tresc.match(/promień długości (\d+) cm/)[1]);
      const expected = PI * r * r;
      assert.ok(
        Math.abs(parsePl(task.odpowiedz) - expected) < 0.01,
        `${task.tresc} -> ${task.odpowiedz} (expected ${expected})`
      );
    }
  }
});

test('promien z pola kola: the stated radius independently satisfies pole = pi*r^2', () => {
  const template = templates.find((t) => t.id === 'geometria_promien_z_pola_kola_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const pole = Number(task.tresc.match(/równe ([\d,]+) cm²/)[1].replace(',', '.'));
      const r = parsePl(task.odpowiedz);
      const expectedPole = PI * r * r;
      assert.ok(
        Math.abs(pole - expectedPole) < 0.05,
        `${task.tresc} -> ${task.odpowiedz} (r=${r} gives pole ${expectedPole}, stated ${pole})`
      );
    }
  }
});

test('pierscien kolowy: the stated area equals pi*(R^2 - r^2) for the two stated radii', () => {
  const template = templates.find((t) => t.id === 'geometria_pierscien_kolowy_egz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [rWewnetrzny, rZewnetrzny] = task.tresc
        .match(/promieniach (\d+) cm i (\d+) cm/)
        .slice(1)
        .map(Number);
      assert.ok(rZewnetrzny > rWewnetrzny, `radii out of order in "${task.tresc}"`);
      const expected = PI * (rZewnetrzny * rZewnetrzny - rWewnetrzny * rWewnetrzny);
      assert.ok(
        Math.abs(parsePl(task.odpowiedz) - expected) < 0.05,
        `${task.tresc} -> ${task.odpowiedz} (expected ${expected})`
      );
    }
  }
});
