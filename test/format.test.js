import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatNumber, formatFraction, formatMixed } from '../js/format.js';

test('integers render without a decimal separator', () => {
  assert.equal(formatNumber(5), '5');
  assert.equal(formatNumber(-12), '-12');
  assert.equal(formatNumber(0), '0');
});

test('decimals use a comma and drop trailing zeros', () => {
  assert.equal(formatNumber(3.4), '3,4');
  assert.equal(formatNumber(2.75), '2,75');
  assert.equal(formatNumber(6.10), '6,1');
  assert.equal(formatNumber(0.5), '0,5');
  assert.equal(formatNumber(-1.25), '-1,25');
});

test('floating point noise is rounded away', () => {
  assert.equal(formatNumber(0.1 + 0.2), '0,3');
});

test('formatFraction renders a slash and collapses whole numbers', () => {
  assert.equal(formatFraction(3, 4), '3/4');
  assert.equal(formatFraction(6, 3), '2');
  assert.equal(formatFraction(5, 1), '5');
});

test('formatFraction reduces to lowest terms', () => {
  assert.equal(formatFraction(2, 4), '1/2');
  assert.equal(formatFraction(6, 8), '3/4');
});

test('formatMixed renders whole plus proper fraction', () => {
  assert.equal(formatMixed(5, 2), '2 1/2');
  assert.equal(formatMixed(3, 4), '3/4');
  assert.equal(formatMixed(8, 4), '2');
});

test('no formatted output ever contains a period', () => {
  const samples = [1.5, 22.25, 0.125, -3.75, 100.0];
  for (const s of samples) {
    assert.ok(!formatNumber(s).includes('.'), `${s} rendered with a period`);
  }
});
