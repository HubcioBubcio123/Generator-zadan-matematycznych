// Równania liniowe i wyrażenia algebraiczne (klasy 7-8, liceum 1).
//
// Poziomy trudności:
//   łatwy   - ax + b = c, rozwiązanie całkowite, współczynniki do 10
//   średni  - ax + b = cx + d, rozwiązanie całkowite, współczynniki do 20
//   trudny  - ax + b = cx + d, rozwiązanie może być ułamkiem dziesiętnym
//
// rownania_nawiasy wymaga dodatkowo rozwinięcia nawiasu przed rozwiązaniem:
//   łatwy   - p(x + m) = c
//   średni  - p(x + m) + b = c
//   trudny  - p(x + m) + b = qx + d (niewiadoma po obu stronach)

import { formatNumber } from '../format.js';
import { buildOptions } from '../distractors.js';

const RANGES = {
  latwy: { coefMax: 10, bothSides: false, integerRoot: true },
  sredni: { coefMax: 20, bothSides: true, integerRoot: true },
  trudny: { coefMax: 20, bothSides: true, integerRoot: false },
};

const BRACKET_RANGES = {
  latwy: { pMax: 5, mMax: 10, bMax: 0, bothSides: false },
  sredni: { pMax: 8, mMax: 15, bMax: 20, bothSides: false },
  trudny: { pMax: 8, mMax: 15, bMax: 20, bothSides: true },
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

function nonZero(rng, max) {
  const v = rng.int(-max, max);
  return v === 0 ? 1 : v;
}

function trailingTerm(value) {
  if (value === 0) return '';
  return value > 0 ? ` + ${value}` : ` - ${Math.abs(value)}`;
}

function rownaniaNawiasy(difficulty, rng) {
  const { pMax, mMax, bMax, bothSides } = BRACKET_RANGES[difficulty];
  const root = rng.int(-10, 10);
  const p = nonZero(rng, pMax);
  const m = nonZero(rng, mMax);
  const b = bMax > 0 ? rng.int(-bMax, bMax) : 0;

  const lhs = `${p}(${linearSide(1, m)})${trailingTerm(b)}`;

  let rhs, wrongRoot;
  if (bothSides) {
    let q = nonZero(rng, pMax);
    if (q === p) q += p > 0 ? 1 : -1;
    if (q === 0) q += 1;
    const d = p * (root + m) + b - q * root;
    rhs = linearSide(q, d);
    // Typowy błąd: pominięcie mnożenia m przez p przy rozwijaniu nawiasu.
    wrongRoot = (d - m - b) / (p - q);
  } else {
    const c = p * (root + m) + b;
    rhs = formatNumber(c);
    wrongRoot = (c - m - b) / p;
  }

  const correct = `x = ${formatNumber(root)}`;
  const wrong = [
    `x = ${formatNumber(-root)}`,
    `x = ${formatNumber(Number((root + 1).toFixed(4)))}`,
    `x = ${formatNumber(Number(wrongRoot.toFixed(4)))}`,
  ];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);
  const expandedLhs = linearSide(p, p * m + b);

  return {
    id: 'rownania_nawiasy',
    type: 'zamkniete',
    tresc: `Rozwiąż równanie: ${lhs} = ${rhs}`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Rozwijamy nawias, mnożąc każdy składnik przez ${p}.\n` +
      `${expandedLhs} = ${rhs}.\n` +
      `Przenosimy niewiadome na lewą stronę, a liczby na prawą, i dzielimy, ` +
      `otrzymując ${correct}.`,
  };
}

const SREDNIA_RANGES = {
  latwy: { meanMax: 10 },
  sredni: { meanMax: 20 },
  trudny: { meanMax: 30 },
};

function sredniaArytmetyczna(difficulty, rng) {
  const { meanMax } = SREDNIA_RANGES[difficulty];
  const X = rng.int(1, meanMax);
  const Y = rng.int(1, meanMax);
  const c = 3 * Y - 2 * X;
  const correct = formatNumber(c);

  // Typowe błędy: brak podwojenia X, odjęcie średnich wprost, zamiana ról X i Y.
  const wrong = [
    formatNumber(3 * Y - X),
    formatNumber(Y - X),
    formatNumber(3 * X - 2 * Y),
  ];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'rownania_srednia_arytmetyczna',
    type: 'zamkniete',
    tresc:
      `Średnia arytmetyczna dwóch liczb a i b jest równa ${X}, ` +
      `a średnia arytmetyczna trzech liczb a, b i c jest równa ${Y}. ` +
      `Oblicz liczbę c.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Z pierwszej średniej: a + b = 2 · ${X} = ${2 * X}.\n` +
      `Z drugiej średniej: a + b + c = 3 · ${Y} = ${3 * Y}.\n` +
      `c = ${3 * Y} - ${2 * X} = ${correct}.`,
  };
}

const PODZIAL_RANGES = {
  latwy: { baseMax: 20, dMax: 5, ratios: [2, 3] },
  sredni: { baseMax: 30, dMax: 10, ratios: [2, 3, 1.5] },
  trudny: { baseMax: 40, dMax: 15, ratios: [1.5, 2, 2.5, 3] },
};

function podzialNaGrupy(difficulty, rng) {
  const { baseMax, dMax, ratios } = PODZIAL_RANGES[difficulty];
  const k = rng.pick(ratios);
  // Keep k * base an integer even when k is fractional (e.g. 1.5, 2.5) by
  // always picking an even base.
  const base = Number.isInteger(k)
    ? rng.int(5, baseMax)
    : rng.int(3, Math.floor(baseMax / 2)) * 2;
  const d = rng.int(1, Math.min(dMax, base - 1));

  const cat1 = base;
  const cat2 = k * base;
  const cat3 = base - d;
  const total = cat1 + cat2 + cat3;
  const kLabel = formatNumber(k);

  return {
    id: 'rownania_podzial_na_grupy',
    type: 'otwarte',
    tresc:
      `W pudełku jest łącznie ${formatNumber(total)} kulek w trzech kolorach: ` +
      `czerwone, niebieskie i zielone. Kulek niebieskich jest ${kLabel} razy ` +
      `więcej niż czerwonych, a kulek zielonych jest o ${d} mniej niż czerwonych. ` +
      `Oblicz, ile jest kulek niebieskich.`,
    odpowiedz: formatNumber(cat2),
    rozwiazanie:
      `Niech liczba kulek czerwonych będzie równa x. Wtedy niebieskich jest ${kLabel}x, ` +
      `a zielonych x - ${d}.\n` +
      `x + ${kLabel}x + (x - ${d}) = ${formatNumber(total)}.\n` +
      `x = ${cat1}, więc kulek niebieskich jest ${kLabel} · ${cat1} = ${formatNumber(cat2)}.`,
  };
}

export const templates = [
  { id: 'rownania_liniowe', generate: rownaniaLiniowe },
  { id: 'rownania_uproszczenie', generate: uproszczenie },
  { id: 'rownania_nawiasy', generate: rownaniaNawiasy },
  { id: 'rownania_srednia_arytmetyczna', generate: sredniaArytmetyczna },
  { id: 'rownania_podzial_na_grupy', generate: podzialNaGrupy },
];
