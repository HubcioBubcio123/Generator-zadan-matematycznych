import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildOptions } from '../js/distractors.js';
import { createRng } from '../js/rng.js';

test('produces four options containing the correct answer', () => {
  const rng = createRng(1);
  const { odpowiedzi, poprawna } = buildOptions('12', ['10', '14', '11'], rng);
  assert.equal(odpowiedzi.length, 4);
  assert.equal(odpowiedzi[poprawna], '12');
});

test('removes distractors equal to the correct answer', () => {
  const rng = createRng(2);
  const { odpowiedzi } = buildOptions('12', ['12', '10', '14', '11'], rng);
  assert.equal(odpowiedzi.filter((o) => o === '12').length, 1);
});

test('removes duplicate distractors', () => {
  const rng = createRng(3);
  const { odpowiedzi } = buildOptions('12', ['10', '10', '14', '11'], rng);
  assert.equal(new Set(odpowiedzi).size, 4);
});

test('pads with fallbacks when too few distractors survive', () => {
  const rng = createRng(4);
  const { odpowiedzi, poprawna } = buildOptions('12', ['10'], rng);
  assert.equal(odpowiedzi.length, 4);
  assert.equal(new Set(odpowiedzi).size, 4);
  assert.equal(odpowiedzi[poprawna], '12');
});

test('pads correctly with no distractors at all', () => {
  const rng = createRng(5);
  const { odpowiedzi, poprawna } = buildOptions('7', [], rng);
  assert.equal(odpowiedzi.length, 4);
  assert.equal(new Set(odpowiedzi).size, 4);
  assert.equal(odpowiedzi[poprawna], '7');
});

test('shuffles: the correct answer is not always at the same index', () => {
  const positions = new Set();
  for (let seed = 0; seed < 40; seed++) {
    const rng = createRng(seed);
    const { poprawna } = buildOptions('12', ['10', '14', '11'], rng);
    positions.add(poprawna);
  }
  assert.ok(positions.size > 1, 'correct answer never moved');
});

test('padded fallbacks never contain a decimal period', () => {
  const rng = createRng(6);
  const { odpowiedzi } = buildOptions('2,5', [], rng);
  for (const o of odpowiedzi) {
    assert.ok(!/\d\.\d/.test(o), `option "${o}" uses a period`);
  }
});
