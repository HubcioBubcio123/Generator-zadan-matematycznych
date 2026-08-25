// Funkcja liniowa i kwadratowa (liceum/technikum 1-2).
//
// Poziomy trudności:
//   łatwy   - współczynniki do 6, pierwiastki całkowite z zakresu -5..5
//   średni  - współczynniki do 10, pierwiastki całkowite z zakresu -9..9
//   trudny  - współczynniki do 15, a może być różne od 1
//
// wierzcholek wymaga połączenia dwóch wzorów (p = -b/(2a), q = f(p)), co
// jest osobnym, trudniejszym krokiem w stosunku do samej delty czy miejsc
// zerowych.

import { formatNumber } from '../format.js';
import { buildOptions } from '../distractors.js';

const RANGES = {
  latwy: { coefMax: 6, rootRange: 5, leadingOne: true },
  sredni: { coefMax: 10, rootRange: 9, leadingOne: true },
  trudny: { coefMax: 15, rootRange: 9, leadingOne: false },
};

const VERTEX_RANGES = {
  latwy: { pRange: 5, cMax: 10, leadingOne: true, aMax: 1 },
  sredni: { pRange: 8, cMax: 20, leadingOne: true, aMax: 1 },
  trudny: { pRange: 10, cMax: 30, leadingOne: false, aMax: 4 },
};

// Ranges tuned for visual legibility of the drawn graph, not for algebraic
// difficulty — deliberately separate from RANGES/VERTEX_RANGES above. See
// the design spec's "Known Follow-ups": these specific numbers are
// provisional pending a general difficulty recalibration pass.
const GRAPH_RANGES = {
  liniowa: {
    latwy: { coefMax: 3, rootRange: 5, halfStep: false },
    sredni: { coefMax: 4, rootRange: 7, halfStep: false },
    trudny: { coefMax: 4, rootRange: 7, halfStep: true },
  },
  kwadratowa: {
    latwy: { pRange: 4, cMax: 6, aMax: 1 },
    sredni: { pRange: 5, cMax: 8, aMax: 1 },
    trudny: { pRange: 5, cMax: 8, aMax: 2 },
  },
};

const GRAPH_DOMAIN_MARGIN = 5;

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

function wierzcholek(difficulty, rng) {
  const { pRange, cMax, leadingOne, aMax } = VERTEX_RANGES[difficulty];
  const a = (leadingOne ? 1 : rng.int(1, aMax)) * (rng.bool() ? 1 : -1);
  const p = rng.int(-pRange, pRange);
  const b = -2 * a * p;
  const c = rng.int(-cMax, cMax);
  const q = a * p * p + b * p + c;

  return {
    id: 'funkcja_kwadratowa_wierzcholek',
    type: 'otwarte',
    tresc:
      `Dana jest funkcja f(x) = ${a === 1 ? '' : a === -1 ? '-' : a}x² ${signed(b, 'x')} ${signed(c, '')}. ` +
      `Wyznacz współrzędne wierzchołka paraboli będącej wykresem tej funkcji.`,
    odpowiedz: `(${formatNumber(p)}, ${formatNumber(q)})`,
    rozwiazanie:
      `Współrzędne wierzchołka wyznaczamy ze wzorów p = -b/(2a) oraz q = f(p).\n` +
      `p = -(${b}) : (2 · ${a}) = ${p}.\n` +
      `q = ${a} · ${p}² + (${b}) · ${p} + (${c}) = ${a * p * p} + ${b * p} + ${c} = ${q}.\n` +
      `Wierzchołek: W = (${p}, ${q}).`,
  };
}

function wykresMiejsceZerowe(difficulty, rng) {
  const { coefMax, rootRange, halfStep } = GRAPH_RANGES.liniowa[difficulty];
  const a = rng.int(1, coefMax) * (rng.bool() ? 1 : -1);
  const rootWhole = rng.int(-rootRange, rootRange);
  const root = halfStep && rng.bool() ? rootWhole + 0.5 : rootWhole;
  const b = -a * root;
  const xMin = Math.floor(root - GRAPH_DOMAIN_MARGIN);
  const xMax = Math.ceil(root + GRAPH_DOMAIN_MARGIN);

  return {
    id: 'funkcja_liniowa_wykres_miejsce_zerowe',
    type: 'otwarte',
    tresc:
      'Na wykresie przedstawiono funkcję liniową. ' +
      'Odczytaj z wykresu miejsce zerowe tej funkcji.',
    wykres: { rownanie: 'liniowa', a, b, xMin, xMax },
    odpowiedz: `x = ${formatNumber(root)}`,
    rozwiazanie:
      'Miejsce zerowe to punkt przecięcia wykresu z osią OX.\n' +
      `Wykres przecina oś OX w punkcie x = ${formatNumber(root)}.`,
  };
}

function wykresWierzcholek(difficulty, rng) {
  const { pRange, cMax, aMax } = GRAPH_RANGES.kwadratowa[difficulty];
  const a = rng.int(1, aMax) * (rng.bool() ? 1 : -1);
  const p = rng.int(-pRange, pRange);
  const b = -2 * a * p;
  const c = rng.int(-cMax, cMax);
  const q = a * p * p + b * p + c;
  const xMin = p - GRAPH_DOMAIN_MARGIN;
  const xMax = p + GRAPH_DOMAIN_MARGIN;

  return {
    id: 'funkcja_kwadratowa_wykres_wierzcholek',
    type: 'otwarte',
    tresc:
      'Na wykresie przedstawiono funkcję kwadratową. ' +
      'Odczytaj z wykresu współrzędne wierzchołka paraboli.',
    wykres: { rownanie: 'kwadratowa', a, b, c, xMin, xMax },
    odpowiedz: `(${formatNumber(p)}, ${formatNumber(q)})`,
    rozwiazanie:
      'Wierzchołek paraboli to najniższy (dla a > 0) lub najwyższy ' +
      '(dla a < 0) punkt wykresu.\n' +
      `Odczytujemy współrzędne z wykresu: W = (${formatNumber(p)}, ${formatNumber(q)}).`,
  };
}

export const templates = [
  { id: 'funkcja_liniowa_miejsce_zerowe', generate: miejsceZerowe },
  { id: 'funkcja_kwadratowa_delta', generate: delta },
  { id: 'funkcja_kwadratowa_pierwiastki', generate: pierwiastki },
  { id: 'funkcja_kwadratowa_wierzcholek', generate: wierzcholek },
  { id: 'funkcja_liniowa_wykres_miejsce_zerowe', generate: wykresMiejsceZerowe },
  { id: 'funkcja_kwadratowa_wykres_wierzcholek', generate: wykresWierzcholek },
];
