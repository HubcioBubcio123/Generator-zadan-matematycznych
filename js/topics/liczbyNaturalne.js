// Działania na liczbach naturalnych (klasa 4).
//
// Poziomy trudności:
//   łatwy   - dwa składniki do 100, jedno działanie
//   średni  - dwa składniki do 1000
//   trudny  - trzy składniki do 10000

import { formatNumber } from '../format.js';
import { buildOptions } from '../distractors.js';

const RANGES = {
  latwy: { max: 100, count: 2, factorMax: 10 },
  sredni: { max: 1000, count: 2, factorMax: 30 },
  trudny: { max: 10000, count: 3, factorMax: 90 },
};

function dodawanie(difficulty, rng) {
  const { max, count } = RANGES[difficulty];
  const numbers = Array.from({ length: count }, () => rng.int(10, max));
  const sum = numbers.reduce((a, b) => a + b, 0);
  const correct = formatNumber(sum);

  // Typowe błędy: zgubione przeniesienie, dodanie zamiast odjęcia ostatniej cyfry.
  const wrong = [
    formatNumber(sum - 10),
    formatNumber(sum + 1),
    formatNumber(sum - numbers[numbers.length - 1] * 2),
  ].filter((w) => !w.startsWith('-'));

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'liczby_naturalne_dodawanie',
    type: 'zamkniete',
    tresc: `Oblicz: ${numbers.join(' + ')}`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Dodajemy kolejno składniki.\n` +
      `${numbers.join(' + ')} = ${correct}.`,
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

export const templates = [
  { id: 'liczby_naturalne_dodawanie', generate: dodawanie },
  { id: 'liczby_naturalne_mnozenie', generate: mnozenie },
];
