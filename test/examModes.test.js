import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EXAM_MODES, getTemplatesForExam, getTemplatesForTopics } from '../js/examModes.js';
import { TOPICS } from '../js/topicRegistry.js';

test('getTemplatesForTopics unions templates from the given topic keys, deduped by id', () => {
  const templates = getTemplatesForTopics(['statystyka_osmoklasisty']);
  const expected = TOPICS.find((t) => t.key === 'statystyka_osmoklasisty').templates;
  assert.equal(templates.length, expected.length);
  assert.deepEqual(
    templates.map((t) => t.id),
    expected.map((t) => t.id)
  );
});

test('getTemplatesForTopics ignores an unknown topic key rather than throwing', () => {
  assert.doesNotThrow(() => getTemplatesForTopics(['nie_istnieje']));
  assert.deepEqual(getTemplatesForTopics(['nie_istnieje']), []);
});

test('getTemplatesForTopics dedupes when the same topic key is listed twice', () => {
  const once = getTemplatesForTopics(['statystyka_osmoklasisty']);
  const twice = getTemplatesForTopics(['statystyka_osmoklasisty', 'statystyka_osmoklasisty']);
  assert.equal(twice.length, once.length);
});

test('no current EXAM_MODES entry declares examTopics yet (cutover not activated)', () => {
  for (const mode of EXAM_MODES) {
    assert.ok(!('examTopics' in mode), `${mode.key} unexpectedly declares examTopics`);
  }
});

test('getTemplatesForExam still resolves osmoklasisty and matura via their existing gradeKeys pools', () => {
  for (const examKey of ['osmoklasisty', 'matura']) {
    const templates = getTemplatesForExam(examKey);
    assert.ok(templates.length > 0, `${examKey} resolved to an empty pool`);
  }
});
