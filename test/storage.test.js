import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadPreferences, savePreferences } from '../js/storage.js';

function withStorage(impl, fn) {
  const previous = globalThis.localStorage;
  Object.defineProperty(globalThis, 'localStorage', {
    value: impl,
    configurable: true,
    writable: true,
  });
  try {
    fn();
  } finally {
    Object.defineProperty(globalThis, 'localStorage', {
      value: previous,
      configurable: true,
      writable: true,
    });
  }
}

function memoryStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
  };
}

test('saves and reloads preferences', () => {
  withStorage(memoryStorage(), () => {
    savePreferences({ tryb: 'egzamin', trudnosc: 'trudny', liczba: 9 });
    assert.deepEqual(loadPreferences(), {
      tryb: 'egzamin',
      trudnosc: 'trudny',
      liczba: 9,
    });
  });
});

test('returns null when nothing has been saved', () => {
  withStorage(memoryStorage(), () => {
    assert.equal(loadPreferences(), null);
  });
});

test('returns null instead of throwing on corrupt stored data', () => {
  const storage = memoryStorage();
  storage.setItem('generator-zadan-preferencje', '{nie-json');
  withStorage(storage, () => {
    assert.equal(loadPreferences(), null);
  });
});

test('swallows a throwing storage on read', () => {
  const throwing = {
    getItem() {
      throw new Error('storage disabled');
    },
    setItem() {},
  };
  withStorage(throwing, () => {
    assert.equal(loadPreferences(), null);
  });
});

test('swallows a throwing storage on write', () => {
  const throwing = {
    getItem: () => null,
    setItem() {
      throw new Error('quota exceeded');
    },
  };
  withStorage(throwing, () => {
    assert.doesNotThrow(() => savePreferences({ tryb: 'cwiczenia' }));
  });
});

test('survives localStorage being absent entirely', () => {
  withStorage(undefined, () => {
    assert.equal(loadPreferences(), null);
    assert.doesNotThrow(() => savePreferences({ tryb: 'cwiczenia' }));
  });
});
