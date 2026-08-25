// Funkcja liniowa i kwadratowa (liceum/technikum 1-2).
//
// Poziomy trudności:
//   łatwy   - współczynniki do 6, pierwiastki całkowite z zakresu -5..5
//   średni  - współczynniki do 10, pierwiastki całkowite z zakresu -9..9
//   trudny  - współczynniki do 15, a może być różne od 1

import { formatNumber } from '../format.js';
import { buildOptions } from '../distractors.js';

const RANGES = {
  latwy: { coefMax: 6, rootRange: 5, leadingOne: true },
  sredni: { coefMax: 10, rootRange: 9, leadingOne: true },
  trudny: { coefMax: 15, rootRange: 9, leadingOne: false },
};

function signed(value, suffix) {
  const sign = value >= 0 ? '+' : '-';
  return `${sign} ${Math.abs(value)}${suffix}`;
}

function miejsceZerowe(difficulty, rng) {
  const { coefMax } = RANGES[difficulty];
  const a = rng.int(1, coefMax) * (rng.bool() ? 1 : -1);
  const root = rng.int(-9, 9);
  const b = -a * root; // guarantees f(root) === 0

  const correct = `x = ${formatNumber(root)}`;
  // Typowe błędy: zapomniany znak minus, podstawienie b zamiast -b/a.
  const wrong = [
    `x = ${formatNumber(-root)}`,
    `x = ${formatNumber(b)}`,
    `x = ${formatNumber(a)}`,
  ];
  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'funkcja_liniowa_miejsce_zerowe',
    type: 'zamkniete',
    tresc: `Dana jest funkcja f(x) = ${a}x ${signed(b, '')}. Wyznacz miejsce zerowe tej funkcji.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Miejsce zerowe to rozwiązanie równania f(x) = 0.\n` +
      `${a}x ${signed(b, '')} = 0, zatem ${a}x = ${formatNumber(-b)}.\n` +
      `x = ${formatNumber(-b)} : ${a} = ${formatNumber(root)}.`,
  };
}

function delta(difficulty, rng) {
  const { coefMax, leadingOne } = RANGES[difficulty];
  const a = leadingOne ? 1 : rng.int(1, 4);
  const b = rng.int(-coefMax, coefMax);
  const c = rng.int(-coefMax, coefMax);
  const value = b * b - 4 * a * c;

  return {
    id: 'funkcja_kwadratowa_delta',
    type: 'otwarte',
    tresc:
      `Dana jest funkcja f(x) = ${a === 1 ? '' : a}x² ${signed(b, 'x')} ` +
      `${signed(c, '')}. Oblicz wyróżnik (deltę) tej funkcji.`,
    odpowiedz: formatNumber(value),
    rozwiazanie:
      `Korzystamy ze wzoru Δ = b² - 4ac.\n` +
      `a = ${a}, b = ${b}, c = ${c}.\n` +
      `Δ = ${b}² - 4 · ${a} · ${c} = ${b * b} - ${4 * a * c} = ${formatNumber(value)}.`,
  };
}

function pierwiastki(difficulty, rng) {
  const { rootRange } = RANGES[difficulty];
  // Build the quadratic from its roots so both roots are exact integers.
  let r1 = rng.int(-rootRange, rootRange);
  let r2 = rng.int(-rootRange, rootRange);
  if (r1 === r2) r2 = r1 + 1; // keep delta strictly positive
  if (r1 > r2) [r1, r2] = [r2, r1];

  const b = -(r1 + r2);
  const c = r1 * r2;
  const discriminant = b * b - 4 * c;

  return {
    id: 'funkcja_kwadratowa_pierwiastki',
    type: 'otwarte',
    tresc:
      `Dana jest funkcja f(x) = x² ${signed(b, 'x')} ${signed(c, '')}. ` +
      `Wyznacz miejsca zerowe tej funkcji.`,
    odpowiedz: `x₁ = ${formatNumber(r1)}, x₂ = ${formatNumber(r2)}`,
    rozwiazanie:
      `Δ = ${b}² - 4 · 1 · ${c} = ${discriminant}.\n` +
      `Pierwiastek z Δ wynosi ${formatNumber(Math.sqrt(discriminant))}.\n` +
      `x₁ = (${-b} - ${formatNumber(Math.sqrt(discriminant))}) : 2 = ${formatNumber(r1)}, ` +
      `x₂ = (${-b} + ${formatNumber(Math.sqrt(discriminant))}) : 2 = ${formatNumber(r2)}.`,
  };
}

export const templates = [
  { id: 'funkcja_liniowa_miejsce_zerowe', generate: miejsceZerowe },
  { id: 'funkcja_kwadratowa_delta', generate: delta },
  { id: 'funkcja_kwadratowa_pierwiastki', generate: pierwiastki },
];
