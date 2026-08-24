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

test('fallback for a prefixed answer like "x = -1" nudges the number, not the whole string', () => {
  const rng = createRng(7);
  const { odpowiedzi, poprawna } = buildOptions('x = -1', [], rng);
  assert.equal(odpowiedzi.length, 4);
  assert.equal(new Set(odpowiedzi).size, 4);
  assert.equal(odpowiedzi[poprawna], 'x = -1');
  for (const o of odpowiedzi) {
    assert.ok(!o.includes('('), `option "${o}" contains a literal "("`);
    assert.ok(!o.includes(')'), `option "${o}" contains a literal ")"`);
    assert.match(o, /^x = -?\d+(,\d+)?$/, `option "${o}" does not look like "x = <number>"`);
  }
});

test('fallback for a prefixed answer still dedupes correctly when some distractors collide', () => {
  const rng = createRng(8);
  // All three "wrong" candidates collide with correct or each other, forcing
  // the fallback path to pad out every remaining slot.
  const { odpowiedzi, poprawna } = buildOptions('x = -1', ['x = -1', 'x = -1', 'x = -1'], rng);
  assert.equal(odpowiedzi.length, 4);
  assert.equal(new Set(odpowiedzi).size, 4);
  assert.equal(odpowiedzi[poprawna], 'x = -1');
  for (const o of odpowiedzi) {
    assert.ok(!o.includes('('), `option "${o}" contains a literal "("`);
  }
});

test('fallback for a unit-suffixed answer like "28 cm" produces four distinct options without crashing', () => {
  const rng = createRng(9);
  const { odpowiedzi, poprawna } = buildOptions('28 cm', [], rng);
  assert.equal(odpowiedzi.length, 4);
  assert.equal(new Set(odpowiedzi).size, 4);
  assert.equal(odpowiedzi[poprawna], '28 cm');
});

test('fallback for a genuinely non-numeric answer (comparison operator) keeps the "(offset)" padding', () => {
  const rng = createRng(10);
  const { odpowiedzi, poprawna } = buildOptions('<', [], rng);
  assert.equal(odpowiedzi.length, 4);
  assert.equal(new Set(odpowiedzi).size, 4);
  assert.equal(odpowiedzi[poprawna], '<');
});
