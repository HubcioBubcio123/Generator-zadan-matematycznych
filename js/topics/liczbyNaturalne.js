// Działania na liczbach naturalnych (klasa 4).
//
// Poziomy trudności:
//   łatwy   - dodawanie: dwa składniki do 100, tylko dodawanie;
//             dzielenie: bez reszty
//   średni  - dodawanie: trzy składniki do 500, jedno odejmowanie w łańcuchu;
//             dzielenie: bez reszty, większe liczby
//   trudny  - dodawanie: cztery składniki do 2000, dwa odejmowania w łańcuchu
//             (wymusza pożyczanie); dzielenie: może wystąpić reszta

import { formatNumber } from '../format.js';
import { buildOptions } from '../distractors.js';

const RANGES = {
  latwy: {
    max: 100,
    count: 2,
    minusCount: 0,
    factorMax: 10,
    divisorMax: 10,
    quotientMax: 10,
    allowRemainder: false,
  },
  sredni: {
    max: 500,
    count: 3,
    minusCount: 1,
    factorMax: 30,
    divisorMax: 12,
    quotientMax: 20,
    allowRemainder: false,
  },
  trudny: {
    max: 2000,
    count: 4,
    minusCount: 2,
    factorMax: 90,
    divisorMax: 12,
    quotientMax: 50,
    allowRemainder: true,
  },
};

// Builds a chain like "120 + 45 - 30" where the running total never dips
// below zero, so klasa-4 students never have to reason about negatives.
function buildChain(rng, max, count, minusCount) {
  let total = rng.int(Math.max(10, Math.floor(max / 2)), max);
  const numbers = [total];
  const slots = Array.from({ length: count - 1 }, (_, i) => i);
  const minusSlots = new Set(rng.shuffle(slots).slice(0, minusCount));

  for (let i = 0; i < count - 1; i++) {
    const isMinus = minusSlots.has(i);
    let term;
    if (isMinus) {
      term = rng.int(1, Math.max(1, Math.min(max, total)));
      total -= term;
    } else {
      term = rng.int(1, max);
      total += term;
    }
    numbers.push(term);
  }

  return { numbers, minusSlots, total };
}

function dodawanie(difficulty, rng) {
  const { max, count, minusCount } = RANGES[difficulty];
  const { numbers, minusSlots, total } = buildChain(rng, max, count, minusCount);

  const parts = [String(numbers[0])];
  for (let i = 0; i < numbers.length - 1; i++) {
    parts.push(minusSlots.has(i) ? '-' : '+', String(numbers[i + 1]));
  }
  const expression = parts.join(' ');
  const correct = formatNumber(total);

  // Typowe błędy: zgubione przeniesienie/pożyczenie, dodanie zamiast odjęcia.
  const wrong = [
    formatNumber(total - 10),
    formatNumber(total + 1),
    formatNumber(total + numbers[numbers.length - 1] * 2),
  ].filter((w) => !w.startsWith('-'));

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'liczby_naturalne_dodawanie',
    type: 'zamkniete',
    tresc: `Oblicz: ${expression}`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie: `Wykonujemy działania kolejno, od lewej do prawej.\n${expression} = ${correct}.`,
  };
}

function mnozenie(difficulty, rng) {
  const { factorMax } = RANGES[difficulty];
  const a = rng.int(2, factorMax);
  const b = rng.int(2, factorMax);
  const product = a * b;

  return {
    id: 'liczby_naturalne_mnozenie',
    type: 'otwarte',
    tresc: `Oblicz: ${a} · ${b}`,
    odpowiedz: formatNumber(product),
    rozwiazanie:
      `Mnożymy liczby przez siebie.\n` +
      `${a} · ${b} = ${formatNumber(product)}.`,
  };
}

function dzielenie(difficulty, rng) {
  const { divisorMax, quotientMax, allowRemainder } = RANGES[difficulty];
  const divisor = rng.int(2, divisorMax);
  const quotient = rng.int(2, quotientMax);
  const remainder = allowRemainder ? rng.int(0, divisor - 1) : 0;
  const dividend = divisor * quotient + remainder;
  const correct = remainder === 0 ? formatNumber(quotient) : `${quotient} reszta ${remainder}`;

  return {
    id: 'liczby_naturalne_dzielenie',
    type: 'otwarte',
    tresc: `Oblicz: ${dividend} : ${divisor}`,
    odpowiedz: correct,
    rozwiazanie:
      remainder === 0
        ? `Dzielimy: ${dividend} : ${divisor} = ${quotient}.`
        : `Największa wielokrotność ${divisor} nieprzekraczająca ${dividend} to ${divisor * quotient}.\n` +
          `${dividend} : ${divisor} = ${quotient} reszta ${remainder}, ` +
          `bo ${divisor} · ${quotient} + ${remainder} = ${dividend}.`,
  };
}

export const templates = [
  { id: 'liczby_naturalne_dodawanie', generate: dodawanie },
  { id: 'liczby_naturalne_mnozenie', generate: mnozenie },
  { id: 'liczby_naturalne_dzielenie', generate: dzielenie },
];
