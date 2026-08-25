import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertValidTask } from '../js/taskShape.js';

const validOpen = {
  id: 'test_open',
  type: 'otwarte',
  tresc: 'Oblicz 2 + 2.',
  odpowiedz: '4',
  rozwiazanie: 'Dodajemy: 2 + 2 = 4.',
};

const validClosed = {
  id: 'test_closed',
  type: 'zamkniete',
  tresc: 'Oblicz 2 + 2.',
  odpowiedzi: ['3', '4', '5', '6'],
  poprawna: 1,
  odpowiedz: '4',
  rozwiazanie: 'Dodajemy: 2 + 2 = 4.',
};

test('accepts a valid open task', () => {
  assert.doesNotThrow(() => assertValidTask(validOpen));
});

test('accepts a valid closed task', () => {
  assert.doesNotThrow(() => assertValidTask(validClosed));
});

test('rejects a missing id', () => {
  assert.throws(() => assertValidTask({ ...validOpen, id: undefined }), /id/);
});

test('rejects an unknown type', () => {
  assert.throws(() => assertValidTask({ ...validOpen, type: 'inne' }), /type/);
});

test('rejects an open task carrying odpowiedzi', () => {
  assert.throws(
    () => assertValidTask({ ...validOpen, odpowiedzi: ['1', '2', '3', '4'] }),
    /odpowiedzi/
  );
});

test('rejects a closed task without four options', () => {
  assert.throws(
    () => assertValidTask({ ...validClosed, odpowiedzi: ['3', '4', '5'] }),
    /cztery/
  );
});

test('rejects a closed task with duplicate options', () => {
  assert.throws(
    () => assertValidTask({ ...validClosed, odpowiedzi: ['4', '4', '5', '6'] }),
    /powtarzaj/
  );
});

test('rejects a closed task where the marked option is not the answer', () => {
  assert.throws(() => assertValidTask({ ...validClosed, poprawna: 0 }), /poprawna/);
});

test('rejects NaN, undefined, or Infinity leaking into text', () => {
  assert.throws(() => assertValidTask({ ...validOpen, tresc: 'Oblicz NaN + 2.' }), /NaN/);
  assert.throws(() => assertValidTask({ ...validOpen, odpowiedz: 'undefined' }), /undefined/);
  assert.throws(() => assertValidTask({ ...validOpen, odpowiedz: 'Infinity' }), /Infinity/);
});

test('rejects a decimal period in rendered text', () => {
  assert.throws(() => assertValidTask({ ...validOpen, tresc: 'Oblicz 3.4 + 1.' }), /kropk/);
});

test('allows a period that ends a sentence', () => {
  assert.doesNotThrow(() =>
    assertValidTask({ ...validOpen, tresc: 'Oblicz 3,4 + 1. Podaj wynik.' })
  );
});

test('rejects an empty rozwiazanie', () => {
  assert.throws(() => assertValidTask({ ...validOpen, rozwiazanie: '' }), /rozwiazanie/);
});
