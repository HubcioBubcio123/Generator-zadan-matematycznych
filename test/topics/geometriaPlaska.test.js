import { test } from 'node:test';
import assert from 'node:assert/strict';
import { templates } from '../../js/topics/geometriaPlaska.js';
import { assertValidTask } from '../../js/taskShape.js';
import { createRng } from '../../js/rng.js';

const LEVELS = ['latwy', 'sredni', 'trudny'];

function parsePl(text) {
  return Number(text.replace(/[^\d,-]/g, '').replace(',', '.'));
}

test('exports seven templates with unique ids', () => {
  assert.equal(templates.length, 7);
  assert.equal(new Set(templates.map((t) => t.id)).size, 7);
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

test('pole prostokata: answer equals a times b', () => {
  const template = templates.find((t) => t.id === 'geometria_pole_prostokata');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [a, b] = task.tresc.match(/\d+(?:,\d+)?/g).map(parsePl);
      assert.ok(
        Math.abs(parsePl(task.odpowiedz) - a * b) < 1e-6,
        `${task.tresc} -> ${task.odpowiedz}`
      );
    }
  }
});

test('obwod prostokata: answer equals 2*(a+b)', () => {
  const template = templates.find((t) => t.id === 'geometria_obwod_prostokata');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [a, b] = task.tresc.match(/\d+(?:,\d+)?/g).map(parsePl);
      assert.ok(Math.abs(parsePl(task.odpowiedz) - 2 * (a + b)) < 1e-6);
    }
  }
});

test('pole trojkata: answer equals half of base times height', () => {
  const template = templates.find((t) => t.id === 'geometria_pole_trojkata');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [base, height] = task.tresc.match(/\d+(?:,\d+)?/g).map(parsePl);
      assert.ok(Math.abs(parsePl(task.odpowiedz) - (base * height) / 2) < 1e-6);
    }
  }
});

test('pole trapezu: answer equals ((a+b)/2) times h', () => {
  const template = templates.find((t) => t.id === 'geometria_pole_trapezu');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [a, b, h] = task.tresc.match(/\d+(?:,\d+)?/g).map(parsePl);
      const expected = ((a + b) / 2) * h;
      assert.ok(
        Math.abs(parsePl(task.odpowiedz) - expected) < 1e-6,
        `${task.tresc} -> ${task.odpowiedz}, expected ${expected}`
      );
    }
  }
});

test('figura zlozona: answer equals the big rectangle area minus the cut-out area', () => {
  const template = templates.find((t) => t.id === 'geometria_figura_zlozona');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [W, H, w, h] = task.tresc.match(/\d+/g).map(Number);
      const expected = W * H - w * h;
      assert.equal(
        parsePl(task.odpowiedz),
        expected,
        `${task.tresc} -> ${task.odpowiedz}, expected ${expected}`
      );
    }
  }
});

test('figura zlozona: the cut-out never exceeds the outer rectangle', () => {
  const template = templates.find((t) => t.id === 'geometria_figura_zlozona');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [W, H, w, h] = task.tresc.match(/\d+/g).map(Number);
      assert.ok(w < W && h < H, `cutout not smaller than outer rectangle: ${task.tresc}`);
    }
  }
});

test('trojkat rownoboczny prawda/falsz: both judgments are independently correct, and the figura matches the stated side', () => {
  const template = templates.find((t) => t.id === 'geometria_trojkat_rownoboczny_prawda_falsz');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      const [s] = task.tresc.match(/boku długości (\d+) cm/).slice(1).map(Number);
      assert.equal(task.figura.typ, 'trojkat');
      assert.equal(task.figura.bok, s);

      const k = s / 2;
      const trueHeightText = k === 1 ? '√3 cm' : `${k}√3 cm`;
      const trueAreaText = k === 1 ? '√3 cm²' : `${k * k}√3 cm²`;

      const heightClaim = task.tresc.match(/Wysokość tego trójkąta jest równa ([^.]+)\./)[1];
      const areaClaim = task.tresc.match(/Pole tego trójkąta jest równe ([^.]+)\./)[1];
      const answerMatch = task.odpowiedz.match(/^1\. (Prawda|Fałsz), 2\. (Prawda|Fałsz)$/);
      assert.ok(answerMatch, `unexpected answer format: "${task.odpowiedz}"`);

      const heightJudgedTrue = answerMatch[1] === 'Prawda';
      const areaJudgedTrue = answerMatch[2] === 'Prawda';
      assert.equal(heightClaim === trueHeightText, heightJudgedTrue, task.tresc);
      assert.equal(areaClaim === trueAreaText, areaJudgedTrue, task.tresc);
    }
  }
});

test('czworokat katy: alpha satisfies the 360-degree sum and matches the stated relationships', () => {
  const template = templates.find((t) => t.id === 'geometria_czworokat_katy');
  for (const difficulty of LEVELS) {
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      assert.equal(task.figura.typ, 'czworokat');

      const diff = Number(task.tresc.match(/o (\d+)° większa/)[1]);
      const mnoznik = task.tresc.includes('dwukrotnie') ? 2 : 3;
      const alpha = Number(task.odpowiedz.replace('°', ''));
      const beta = alpha - diff;
      const gamma = mnoznik * beta;
      const delta = 90;
      assert.equal(alpha + beta + gamma + delta, 360, task.tresc);
      assert.ok(beta > 0 && gamma > 0 && alpha > 0, `non-positive angle: ${task.tresc}`);
    }
  }
});

test('area answers carry squared units and perimeter answers do not', () => {
  for (const id of [
    'geometria_pole_prostokata',
    'geometria_pole_trojkata',
    'geometria_pole_trapezu',
    'geometria_figura_zlozona',
  ]) {
    const template = templates.find((t) => t.id === id);
    const task = template.generate('sredni', createRng(1));
    assert.ok(task.odpowiedz.includes('cm²'), `${id} missing cm²: ${task.odpowiedz}`);
  }
  const perimeter = templates.find((t) => t.id === 'geometria_obwod_prostokata');
  const task = perimeter.generate('sredni', createRng(1));
  assert.ok(!task.odpowiedz.includes('cm²'), `perimeter had cm²: ${task.odpowiedz}`);
});

test('dimensions grow with difficulty', () => {
  const template = templates.find((t) => t.id === 'geometria_pole_prostokata');
  const maxFor = (difficulty) => {
    let max = 0;
    for (let seed = 0; seed < 200; seed++) {
      const task = template.generate(difficulty, createRng(seed));
      for (const n of task.tresc.match(/\d+(?:,\d+)?/g).map(parsePl)) {
        max = Math.max(max, n);
      }
    }
    return max;
  };
  assert.ok(maxFor('latwy') < maxFor('trudny'));
});
