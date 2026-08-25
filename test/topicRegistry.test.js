import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  GRADES,
  TOPICS,
  getTopicsForGrade,
  getTemplatesForGrade,
} from '../js/topicRegistry.js';
import { EXAM_MODES, getTemplatesForExam } from '../js/examModes.js';

test('declares all nine grades in curriculum order', () => {
  assert.equal(GRADES.length, 9);
  assert.deepEqual(
    GRADES.map((g) => g.key),
    ['sp4', 'sp5', 'sp6', 'sp7', 'sp8', 'lo1', 'lo2', 'lo3', 'lo4']
  );
});

test('grades carry Polish labels and a valid etap', () => {
  for (const grade of GRADES) {
    assert.ok(grade.label.startsWith('Klasa'), grade.label);
    assert.ok(['podstawowa', 'ponadpodstawowa'].includes(grade.etap), grade.etap);
  }
});

test('every grade has at least two topics', () => {
  for (const grade of GRADES) {
    const topics = getTopicsForGrade(grade.key);
    assert.ok(topics.length >= 2, `${grade.key} has ${topics.length} topics`);
  }
});

test('every grade resolves to at least four templates', () => {
  for (const grade of GRADES) {
    const templates = getTemplatesForGrade(grade.key, null);
    assert.ok(templates.length >= 4, `${grade.key} has ${templates.length} templates`);
  }
});

test('every template in the registry is callable and has an id', () => {
  for (const topic of TOPICS) {
    assert.ok(topic.templates.length > 0, `${topic.key} is empty`);
    for (const template of topic.templates) {
      assert.equal(typeof template.generate, 'function', topic.key);
      assert.equal(typeof template.id, 'string', topic.key);
    }
  }
});

test('topic keys and template ids are globally unique', () => {
  const topicKeys = TOPICS.map((t) => t.key);
  assert.equal(new Set(topicKeys).size, topicKeys.length);
  const ids = TOPICS.flatMap((t) => t.templates.map((x) => x.id));
  assert.equal(new Set(ids).size, ids.length, 'duplicate template id');
});

test('filtering by topic returns only that topic templates', () => {
  const topics = getTopicsForGrade('sp6');
  const chosen = topics[0];
  const filtered = getTemplatesForGrade('sp6', chosen.key);
  assert.deepEqual(
    filtered.map((t) => t.id).sort(),
    chosen.templates.map((t) => t.id).sort()
  );
});

test('an unknown grade key returns no templates rather than throwing', () => {
  assert.deepEqual(getTemplatesForGrade('nieistniejaca', null), []);
});

test('declares both exam modes with Polish labels', () => {
  assert.deepEqual(EXAM_MODES.map((m) => m.key), ['osmoklasisty', 'matura']);
  for (const mode of EXAM_MODES) {
    assert.ok(mode.label.length > 0);
    assert.ok(mode.closedRatio > 0 && mode.closedRatio < 1);
  }
});

test('osmoklasisty pool draws from primary school grades only', () => {
  const spTemplates = new Set(
    ['sp4', 'sp5', 'sp6', 'sp7', 'sp8'].flatMap((g) =>
      getTemplatesForGrade(g, null).map((t) => t.id)
    )
  );
  for (const template of getTemplatesForExam('osmoklasisty')) {
    assert.ok(spTemplates.has(template.id), `${template.id} is not an SP template`);
  }
});

test('matura pool draws from secondary school grades only', () => {
  const loTemplates = new Set(
    ['lo1', 'lo2', 'lo3', 'lo4'].flatMap((g) =>
      getTemplatesForGrade(g, null).map((t) => t.id)
    )
  );
  for (const template of getTemplatesForExam('matura')) {
    assert.ok(loTemplates.has(template.id), `${template.id} is not an LO template`);
  }
});

test('exam pools contain no duplicate templates', () => {
  for (const mode of EXAM_MODES) {
    const ids = getTemplatesForExam(mode.key).map((t) => t.id);
    assert.equal(new Set(ids).size, ids.length, `${mode.key} has duplicates`);
  }
});

test('each exam pool has enough templates to fill a twelve-task sheet variety', () => {
  for (const mode of EXAM_MODES) {
    assert.ok(getTemplatesForExam(mode.key).length >= 6, mode.key);
  }
});
