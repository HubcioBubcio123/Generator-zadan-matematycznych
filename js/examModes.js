// An exam mode's pool is either cumulative (gradeKeys: unions every grade
// in its stage's own Ćwiczenia topics — not from a single year) or
// exam-exclusive (examTopics: unions dedicated exam-only topics that are
// listed under no grade's topicKeys, so they never surface in Ćwiczenia
// mode). A mode declares exactly one of the two.
//
// osmoklasisty still uses gradeKeys today; the exam-exclusive path exists
// and is tested (see getTemplatesForTopics) but isn't wired to any mode
// yet — the cutover is deliberately held off until enough exam-exclusive
// topics exist to fill 14 closed/6 open slots without heavy repetition.

import { getTemplatesForGrade, TOPICS } from './topicRegistry.js';

export const EXAM_MODES = [
  {
    key: 'osmoklasisty',
    label: 'Egzamin ósmoklasisty',
    gradeKeys: ['sp4', 'sp5', 'sp6', 'sp7', 'sp8'],
    fixedStructure: { closedCount: 14, openCount: 6 },
  },
  {
    key: 'matura',
    label: 'Matura (poziom podstawowy)',
    gradeKeys: ['lo1', 'lo2', 'lo3', 'lo4'],
    closedRatio: 0.6,
  },
];

// Unions templates from a fixed list of exam-exclusive topic keys, deduped
// by id. Exported so exam-exclusive topic pools can be exercised directly
// before any EXAM_MODES entry actually declares an examTopics field.
export function getTemplatesForTopics(topicKeys) {
  const seen = new Set();
  const out = [];
  for (const key of topicKeys) {
    const topic = TOPICS.find((t) => t.key === key);
    if (!topic) continue;
    for (const template of topic.templates) {
      if (seen.has(template.id)) continue;
      seen.add(template.id);
      out.push(template);
    }
  }
  return out;
}

export function getTemplatesForExam(examKey) {
  const mode = EXAM_MODES.find((m) => m.key === examKey);
  if (!mode) return [];
  if (mode.examTopics) return getTemplatesForTopics(mode.examTopics);
  const seen = new Set();
  const out = [];
  for (const gradeKey of mode.gradeKeys) {
    for (const template of getTemplatesForGrade(gradeKey, null)) {
      if (seen.has(template.id)) continue;
      seen.add(template.id);
      out.push(template);
    }
  }
  return out;
}
