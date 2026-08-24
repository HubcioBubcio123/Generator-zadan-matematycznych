import { formatNumber } from './format.js';

// Builds the four options for a closed task. Templates supply plausible
// mistake-based distractors; this dedupes, pads, and shuffles them.

function fallbackOptions(correct, needed, taken) {
  // Only used when a template supplied too few usable distractors. Nudges the
  // numeric value so the padding still looks like an answer, not filler.
  const out = [];
  const asNumber = Number(correct.replace(',', '.'));
  const numeric = Number.isFinite(asNumber);
  let offset = 1;
  while (out.length < needed) {
    const candidate = numeric
      ? formatNumber(asNumber + offset)
      : `${correct} (${offset})`;
    if (!taken.has(candidate)) {
      out.push(candidate);
      taken.add(candidate);
    }
    offset = offset > 0 ? -offset : -offset + 1;
  }
  return out;
}

export function buildOptions(correct, wrong, rng) {
  const taken = new Set([correct]);
  const distractors = [];
  for (const w of wrong) {
    if (distractors.length === 3) break;
    if (taken.has(w)) continue;
    taken.add(w);
    distractors.push(w);
  }
  if (distractors.length < 3) {
    distractors.push(...fallbackOptions(correct, 3 - distractors.length, taken));
  }

  const odpowiedzi = rng.shuffle([correct, ...distractors]);
  return { odpowiedzi, poprawna: odpowiedzi.indexOf(correct) };
}
