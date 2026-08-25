import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateSheet, clampCount } from '../js/sheetGenerator.js';
import { assertValidTask } from '../js/taskShape.js';
import { GRADES } from '../js/topicRegistry.js';

const LEVELS = ['latwy', 'sredni', 'trudny'];

test('clampCount coerces anything into 1-12', () => {
  assert.equal(clampCount(6), 6);
  assert.equal(clampCount(1), 1);
  assert.equal(clampCount(12), 12);
  assert.equal(clampCount(0), 1);
  assert.equal(clampCount(-5), 1);
  assert.equal(clampCount(13), 12);
  assert.equal(clampCount(999), 12);
  assert.equal(clampCount(3.7), 3);
  assert.equal(clampCount('8'), 8);
  assert.equal(clampCount(''), 1);
  assert.equal(clampCount('abc'), 1);
  assert.equal(clampCount(null), 1);
  assert.equal(clampCount(undefined), 1);
  assert.equal(clampCount(NaN), 1);
});

test('returns exactly the requested number of tasks, for every count', () => {
  for (let count = 1; count <= 12; count++) {
    const sheet = generateSheet({
      mode: 'cwiczenia',
      gradeKey: 'sp6',
      topicKey: null,
      difficulty: 'sredni',
      count,
      seed: count,
    });
    assert.equal(sheet.length, count);
  }
});

test('every task in every grade and difficulty is contract-valid', () => {
  for (const grade of GRADES) {
    for (const difficulty of LEVELS) {
      const sheet = generateSheet({
        mode: 'cwiczenia',
        gradeKey: grade.key,
        topicKey: null,
        difficulty,
        count: 12,
        seed: 5,
      });
      assert.equal(sheet.length, 12, grade.key);
      sheet.forEach((task) => assertValidTask(task));
    }
  }
});

test('no two tasks in a sheet share identical tresc', () => {
  for (const grade of GRADES) {
    for (let seed = 0; seed < 30; seed++) {
      const sheet = generateSheet({
        mode: 'cwiczenia',
        gradeKey: grade.key,
        topicKey: null,
        difficulty: 'sredni',
        count: 12,
        seed,
      });
      const texts = sheet.map((t) => t.tresc);
      assert.equal(new Set(texts).size, texts.length, `${grade.key} seed ${seed}`);
    }
  }
});

test('the same seed reproduces the same sheet', () => {
  const options = {
    mode: 'cwiczenia',
    gradeKey: 'sp7',
    topicKey: null,
    difficulty: 'trudny',
    count: 8,
    seed: 123,
  };
  assert.deepEqual(generateSheet(options), generateSheet(options));
});

test('different seeds produce different sheets', () => {
  const base = {
    mode: 'cwiczenia',
    gradeKey: 'sp7',
    topicKey: null,
    difficulty: 'sredni',
    count: 8,
  };
  const a = generateSheet({ ...base, seed: 1 }).map((t) => t.tresc);
  const b = generateSheet({ ...base, seed: 2 }).map((t) => t.tresc);
  assert.notDeepEqual(a, b);
});

test('topic filtering restricts the sheet to that topic', () => {
  const sheet = generateSheet({
    mode: 'cwiczenia',
    gradeKey: 'sp6',
    topicKey: 'procenty',
    difficulty: 'sredni',
    count: 6,
    seed: 9,
  });
  assert.equal(sheet.length, 6);
  for (const task of sheet) {
    assert.ok(task.id.startsWith('procenty_'), task.id);
  }
});

test('exam mode produces valid tasks for both exams', () => {
  for (const examKey of ['osmoklasisty', 'matura']) {
    const sheet = generateSheet({
      mode: 'egzamin',
      examKey,
      difficulty: 'sredni',
      count: 12,
      seed: 3,
    });
    assert.equal(sheet.length, 12);
    sheet.forEach((task) => assertValidTask(task));
  }
});

test('exam mode includes both closed and open tasks on a full sheet', () => {
  for (const examKey of ['osmoklasisty', 'matura']) {
    const sheet = generateSheet({
      mode: 'egzamin',
      examKey,
      difficulty: 'sredni',
      count: 12,
      seed: 4,
    });
    const types = new Set(sheet.map((t) => t.type));
    assert.ok(types.has('zamkniete'), `${examKey} had no closed tasks`);
    assert.ok(types.has('otwarte'), `${examKey} had no open tasks`);
  }
});

test('an out-of-range count is clamped rather than rejected', () => {
  const sheet = generateSheet({
    mode: 'cwiczenia',
    gradeKey: 'sp5',
    topicKey: null,
    difficulty: 'latwy',
    count: 50,
    seed: 2,
  });
  assert.equal(sheet.length, 12);
});

test('an empty pool throws a Polish error', () => {
  assert.throws(
    () =>
      generateSheet({
        mode: 'cwiczenia',
        gradeKey: 'nieistniejaca',
        topicKey: null,
        difficulty: 'latwy',
        count: 3,
        seed: 1,
      }),
    /Brak zadan/
  );
});

test('tasks repeat templates with different parameters when the pool is small', () => {
  const sheet = generateSheet({
    mode: 'cwiczenia',
    gradeKey: 'sp4',
    topicKey: 'liczby_naturalne',
    difficulty: 'trudny',
    count: 12,
    seed: 6,
  });
  assert.equal(sheet.length, 12);
  assert.equal(new Set(sheet.map((t) => t.tresc)).size, 12);
});
