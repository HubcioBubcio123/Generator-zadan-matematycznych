import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../js/rng.js';

test('same seed produces same sequence', () => {
  const a = createRng(42);
  const b = createRng(42);
  const seqA = [a.int(1, 100), a.int(1, 100), a.int(1, 100)];
  const seqB = [b.int(1, 100), b.int(1, 100), b.int(1, 100)];
  assert.deepEqual(seqA, seqB);
});

test('different seeds produce different sequences', () => {
  const a = createRng(1);
  const b = createRng(2);
  const seqA = Array.from({ length: 10 }, () => a.int(1, 1000));
  const seqB = Array.from({ length: 10 }, () => b.int(1, 1000));
  assert.notDeepEqual(seqA, seqB);
});

test('int stays within inclusive bounds and hits both ends', () => {
  const rng = createRng(7);
  const seen = new Set();
  for (let i = 0; i < 2000; i++) {
    const v = rng.int(3, 6);
    assert.ok(Number.isInteger(v), `expected integer, got ${v}`);
    assert.ok(v >= 3 && v <= 6, `${v} out of range`);
    seen.add(v);
  }
  assert.deepEqual([...seen].sort(), [3, 4, 5, 6]);
});

test('int handles a single-value range', () => {
  const rng = createRng(9);
  assert.equal(rng.int(5, 5), 5);
});

test('pick returns an element of the array', () => {
  const rng = createRng(11);
  const arr = ['a', 'b', 'c'];
  for (let i = 0; i < 100; i++) {
    assert.ok(arr.includes(rng.pick(arr)));
  }
});

test('shuffle preserves elements and does not mutate the input', () => {
  const rng = createRng(13);
  const input = [1, 2, 3, 4, 5];
  const copy = [...input];
  const out = rng.shuffle(input);
  assert.deepEqual(input, copy, 'input was mutated');
  assert.deepEqual([...out].sort((x, y) => x - y), copy);
});

test('bool returns both values over many draws', () => {
  const rng = createRng(17);
  const seen = new Set();
  for (let i = 0; i < 200; i++) seen.add(rng.bool());
  assert.equal(seen.size, 2);
});
