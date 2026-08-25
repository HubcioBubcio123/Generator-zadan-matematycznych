import { test } from 'node:test';
import assert from 'node:assert/strict';
import { templates } from '../../js/topics/funkcje.js';
import { assertValidTask } from '../../js/taskShape.js';
import { createRng } from '../../js/rng.js';

const LEVELS = ['latwy', 'sredni', 'trudny'];

function parsePl(text) {
  return Number(text.replace(/[^\d,-]/g, '').replace(',', '.'));
}

test('exports six templates with unique ids', () => {
  assert.equal(templates.length, 6);
  assert.equal(new Set(templates.map((t) => t.id)).size, 6);
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

test('miejsce zerowe: f(answer) equals zero', () => {
  const template = templates.find((t) => t.id === 'funkcja_liniowa_miejsce_zerowe');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 300; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const body = task.tresc.match(/f\(x\) = ([^.]+)\./)[1];
      const js = body.replace(/,/g, '.').replace(/(\d)x/g, '$1*x');
      const x = parsePl(task.odpowiedz);
      const value = Function('x', `return ${js};`)(x);
      assert.ok(Math.abs(value) < 1e-6, `f(${x}) = ${value} for ${body}`);
    }
  }
});

test('delta: the answer equals b squared minus 4ac', () => {
  const template = templates.find((t) => t.id === 'funkcja_kwadratowa_delta');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 300; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const body = task.tresc.match(/f\(x\) = ([^.]+)\./)[1];
      const a = Number((body.match(/(-?\d*)x²/) ?? [])[1] || 1);
      const bMatch = body.match(/([+-]\s*\d+)x(?!²)/);
      const b = bMatch ? Number(bMatch[1].replace(/\s/g, '')) : 0;
      const cMatch = body.match(/([+-]\s*\d+)\s*$/);
      const c = cMatch ? Number(cMatch[1].replace(/\s/g, '')) : 0;
      assert.equal(parsePl(task.odpowiedz), b * b - 4 * a * c, body);
    }
  }
});

test('pierwiastki: both stated roots satisfy the equation', () => {
  const template = templates.find((t) => t.id === 'funkcja_kwadratowa_pierwiastki');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 300; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const body = task.tresc.match(/f\(x\) = ([^.]+)\./)[1];
      const js = body
        .replace(/,/g, '.')
        .replace(/x²/g, '(x*x)')
        .replace(/(\d)\(x\*x\)/g, '$1*(x*x)')
        .replace(/(\d)x/g, '$1*x');
      const roots = task.odpowiedz.match(/-?\d+(?:,\d+)?/g).map((r) => parsePl(r));
      assert.equal(roots.length, 2, task.odpowiedz);
      for (const r of roots) {
        const value = Function('x', `return ${js};`)(r);
        assert.ok(Math.abs(value) < 1e-6, `f(${r}) = ${value} for ${body}`);
      }
    }
  }
});

test('wierzcholek: q equals f(p), and p is genuinely the extremum of f', () => {
  const template = templates.find((t) => t.id === 'funkcja_kwadratowa_wierzcholek');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 300; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const body = task.tresc.match(/f\(x\) = ([^.]+)\./)[1];
      const js = body
        .replace(/,/g, '.')
        .replace(/x²/g, '(x*x)')
        .replace(/(\d)\(x\*x\)/g, '$1*(x*x)')
        .replace(/(\d)x/g, '$1*x');
      const f = (x) => Function('x', `return ${js};`)(x);
      const [pText, qText] = task.odpowiedz.replace(/[()]/g, '').split(',').map((s) => s.trim());
      const p = parsePl(pText);
      const q = parsePl(qText);
      assert.ok(Math.abs(f(p) - q) < 1e-6, `f(${p}) != ${q} for ${body}`);
      const left = f(p - 1);
      const right = f(p + 1);
      const isMin = left >= q - 1e-6 && right >= q - 1e-6;
      const isMax = left <= q + 1e-6 && right <= q + 1e-6;
      assert.ok(isMin || isMax, `p=${p} is not an extremum for ${body}`);
    }
  }
});

test('pierwiastki tasks always have a positive discriminant', () => {
  const template = templates.find((t) => t.id === 'funkcja_kwadratowa_pierwiastki');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const roots = task.odpowiedz.match(/-?\d+(?:,\d+)?/g).map(parsePl);
      assert.notEqual(roots[0], roots[1], 'roots coincided; delta was zero');
    }
  }
});

test('narysuj wykres liniowy: wykres describes the same function as tresc, and the zero lies inside the drawn domain', () => {
  const template = templates.find((t) => t.id === 'funkcja_liniowa_narysuj_wykres');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const body = task.tresc.match(/f\(x\) = ([^.]+)\./)[1];
      const js = body.replace(/,/g, '.').replace(/(\d)x/g, '$1*x');
      const fFromTresc = (x) => Function('x', `return ${js};`)(x);
      const { rownanie, a, b, xMin, xMax } = task.wykres;
      const fFromWykres = (x) => a * x + b;
      assert.equal(rownanie, 'liniowa');
      for (const x of [-3, 0, 2, 7.5]) {
        assert.ok(
          Math.abs(fFromTresc(x) - fFromWykres(x)) < 1e-6,
          `tresc and wykres disagree at x=${x}: ${fFromTresc(x)} vs ${fFromWykres(x)}`
        );
      }
      const root = -b / a;
      assert.ok(Math.abs(fFromWykres(root)) < 1e-9, `f(${root}) != 0`);
      assert.ok(xMin < root && root < xMax, `root ${root} not inside domain [${xMin}, ${xMax}]`);
      assert.match(task.tresc, /^Narysuj wykres funkcji f\(x\)/);
    }
  }
});

test('narysuj wykres kwadratowy: wykres describes the same function as tresc, and the vertex lies inside the drawn domain', () => {
  const template = templates.find((t) => t.id === 'funkcja_kwadratowa_narysuj_wykres');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const body = task.tresc.match(/f\(x\) = ([^.]+)\./)[1];
      const js = body
        .replace(/,/g, '.')
        .replace(/x²/g, '(x*x)')
        .replace(/(\d)\(x\*x\)/g, '$1*(x*x)')
        .replace(/(\d)x/g, '$1*x');
      const fFromTresc = (x) => Function('x', `return ${js};`)(x);
      const { rownanie, a, b, c, xMin, xMax } = task.wykres;
      const fFromWykres = (x) => a * x * x + b * x + c;
      assert.equal(rownanie, 'kwadratowa');
      for (const x of [-3, 0, 2, 7.5]) {
        assert.ok(
          Math.abs(fFromTresc(x) - fFromWykres(x)) < 1e-6,
          `tresc and wykres disagree at x=${x}: ${fFromTresc(x)} vs ${fFromWykres(x)}`
        );
      }
      const p = -b / (2 * a);
      const q = fFromWykres(p);
      const left = fFromWykres(p - 1);
      const right = fFromWykres(p + 1);
      const isMin = left >= q - 1e-6 && right >= q - 1e-6;
      const isMax = left <= q + 1e-6 && right <= q + 1e-6;
      assert.ok(isMin || isMax, `p=${p} is not an extremum for ${body}`);
      assert.ok(xMin < p && p < xMax, `vertex x=${p} not inside domain [${xMin}, ${xMax}]`);
      assert.match(task.tresc, /^Narysuj wykres funkcji f\(x\)/);
    }
  }
});
