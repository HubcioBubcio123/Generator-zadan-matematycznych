import { formatNumber } from './format.js';

// Builds the four options for a closed task. Templates supply plausible
// mistake-based distractors; this dedupes, pads, and shuffles them.

function fallbackOptions(correct, needed, taken) {
  // Only used when a template supplied too few usable distractors. Nudges the
  // numeric value so the padding still looks like an answer, not filler.
  //
  // `correct` is usually a bare number ("12", "2,5") but some templates
  // prepend a prefix ("x = -1") or append a unit suffix ("28 cm"). In those
  // cases we nudge the embedded number and re-attach the prefix/suffix, so
  // padding still reads like a real answer instead of "x = -1 (1)".
  const out = [];

  const asNumber = Number(correct.replace(',', '.'));
  const numeric = Number.isFinite(asNumber);

  // Trailing number, optionally preceded by a non-numeric prefix, e.g.
  // "x = -1" -> prefix "x = ", tail "-1". Also matches plain numbers like
  // "12" or "2,5" (empty prefix).
  const trailingMatch = !numeric && correct.match(/^(.*?)(-?\d+(?:,\d+)?)$/);
  // Leading number followed by a non-numeric suffix, e.g. "28 cm" -> number
  // "28", suffix " cm". Only tried when there's no trailing number to nudge.
  const leadingMatch = !numeric && !trailingMatch && correct.match(/^(-?\d+(?:,\d+)?)(.*)$/);

  let offset = 1;
  while (out.length < needed) {
    let candidate;
    if (numeric) {
      candidate = formatNumber(asNumber + offset);
    } else if (trailingMatch) {
      const [, prefix, tail] = trailingMatch;
      const tailNumber = Number(tail.replace(',', '.'));
      candidate = `${prefix}${formatNumber(tailNumber + offset)}`;
    } else if (leadingMatch) {
      const [, head, suffix] = leadingMatch;
      const headNumber = Number(head.replace(',', '.'));
      candidate = `${formatNumber(headNumber + offset)}${suffix}`;
    } else {
      candidate = `${correct} (${offset})`;
    }
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
