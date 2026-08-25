// Równania liniowe i wyrażenia algebraiczne (klasy 7-8, liceum 1).
//
// Poziomy trudności:
//   łatwy   - ax + b = c, rozwiązanie całkowite, współczynniki do 10
//   średni  - ax + b = cx + d, rozwiązanie całkowite, współczynniki do 20
//   trudny  - ax + b = cx + d, rozwiązanie może być ułamkiem dziesiętnym

import { formatNumber } from '../format.js';
import { buildOptions } from '../distractors.js';

const RANGES = {
  latwy: { coefMax: 10, bothSides: false, integerRoot: true },
  sredni: { coefMax: 20, bothSides: true, integerRoot: true },
  trudny: { coefMax: 20, bothSides: true, integerRoot: false },
};

// Renders "3x + 5" / "3x - 5" / "-3x" correctly, never "3x + -5".
function linearSide(coefficient, constant) {
  const parts = [];
  if (coefficient !== 0) parts.push(`${coefficient === 1 ? '' : coefficient === -1 ? '-' : coefficient}x`);
  if (constant !== 0 || coefficient === 0) {
    if (parts.length === 0) parts.push(String(constant));
    else parts.push(`${constant > 0 ? '+' : '-'} ${Math.abs(constant)}`);
  }
  return parts.join(' ');
}

function rownaniaLiniowe(difficulty, rng) {
  const { coefMax, bothSides, integerRoot } = RANGES[difficulty];

  let a, c, b, d, root;

  if (integerRoot) {
    a = rng.int(2, coefMax);
    c = bothSides ? rng.int(1, coefMax) : 0;
    if (a === c) a += 1; // keep the equation solvable

    root = rng.int(-10, 10);
    b = rng.int(-coefMax, coefMax);
    // Choose d so that a*root + b = c*root + d holds exactly.
    d = a * root + b - c * root;
  } else {
    // trudny: derive the equation from an integer coefficient difference
    // whose only prime factors are 2 and 5, so root = constDiff / coefDiff
    // always terminates within formatNumber's 4 decimal places. Building it
    // the other way (picking a decimal root first, like latwy/sredni do)
    // can produce a non-integer d and a raw decimal point in the rendered
    // equation text, which assertValidTask rejects.
    const trudnyCoefDiffs = [2, 4, 5, 8, 10];
    const coefDiffPick = rng.pick(trudnyCoefDiffs);
    c = rng.int(1, coefMax - coefDiffPick);
    a = c + coefDiffPick;
    const constDiff = rng.int(-4 * coefMax, 4 * coefMax);
    b = rng.int(-coefMax, coefMax);
    d = b + constDiff;
    root = constDiff / coefDiffPick;
  }

  const correct = `x = ${formatNumber(root)}`;

  // Typowe błędy: znak przy przenoszeniu, dzielenie przez zły współczynnik.
  const wrong = [
    `x = ${formatNumber(-root)}`,
    `x = ${formatNumber(Number((root + 1).toFixed(4)))}`,
    `x = ${formatNumber(Number(((b - d) / (a - c || 1)).toFixed(4)))}`,
  ];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);
  const constantDiff = d - b;
  const coefDiff = a - c;

  return {
    id: 'rownania_liniowe',
    type: 'zamkniete',
    tresc: `Rozwiąż równanie: ${linearSide(a, b)} = ${linearSide(c, d)}`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Przenosimy niewiadome na lewą stronę, a liczby na prawą.\n` +
      `${coefDiff}x = ${constantDiff}.\n` +
      `Dzielimy obie strony przez ${coefDiff}: x = ${formatNumber(root)}.`,
  };
}

function uproszczenie(difficulty, rng) {
  const { coefMax } = RANGES[difficulty];
  const a = rng.int(1, coefMax);
  const b = rng.int(-coefMax, coefMax);
  const c = rng.int(1, coefMax);
  const d = rng.int(-coefMax, coefMax);

  const coefSum = a + c;
  const constSum = b + d;
  const simplified = linearSide(coefSum, constSum);

  return {
    id: 'rownania_uproszczenie',
    type: 'otwarte',
    tresc: `Uprość wyrażenie: ${linearSide(a, b)} + ${linearSide(c, d)}`,
    odpowiedz: simplified,
    rozwiazanie:
      `Grupujemy wyrazy podobne.\n` +
      `Wyrazy z x: ${a}x + ${c}x = ${coefSum}x.\n` +
      `Wyrazy wolne: ${b} + ${d} = ${constSum}.\n` +
      `Wynik: ${simplified}.`,
  };
}

export const templates = [
  { id: 'rownania_liniowe', generate: rownaniaLiniowe },
  { id: 'rownania_uproszczenie', generate: uproszczenie },
];
