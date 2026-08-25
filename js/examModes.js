// Exam pools are cumulative: an exam draws from every grade in its stage,
// not from a single year.

import { getTemplatesForGrade } from './topicRegistry.js';

export const EXAM_MODES = [
  {
    key: 'osmoklasisty',
    label: 'Egzamin ósmoklasisty',
    gradeKeys: ['sp4', 'sp5', 'sp6', 'sp7', 'sp8'],
    closedRatio: 0.6,
  },
  {
    key: 'matura',
    label: 'Matura (poziom podstawowy)',
    gradeKeys: ['lo1', 'lo2', 'lo3', 'lo4'],
    closedRatio: 0.6,
  },
];

export function getTemplatesForExam(examKey) {
  const mode = EXAM_MODES.find((m) => m.key === examKey);
  if (!mode) return [];
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
