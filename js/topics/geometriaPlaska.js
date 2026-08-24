// Geometria plaska: pola i obwody figur (klasy 4-6).
//
// Poziomy trudnosci:
//   latwy   - wymiary calkowite do 12
//   sredni  - wymiary calkowite do 40
//   trudny  - wymiary z jednym miejscem po przecinku, do 40

import { formatNumber } from '../format.js';
import { buildOptions } from '../distractors.js';

const RANGES = {
  latwy: { max: 12, decimal: false },
  sredni: { max: 40, decimal: false },
  trudny: { max: 40, decimal: true },
};

function dimension(rng, difficulty) {
  const { max, decimal } = RANGES[difficulty];
  return decimal ? rng.int(20, max * 10) / 10 : rng.int(2, max);
}

function poleProstokata(difficulty, rng) {
  const a = dimension(rng, difficulty);
  const b = dimension(rng, difficulty);
  const area = Number((a * b).toFixed(4));
  const correct = `${formatNumber(area)} cm²`;

  // Typowy blad: policzony obwod zamiast pola.
  const wrong = [
    `${formatNumber(Number((2 * (a + b)).toFixed(4)))} cm²`,
    `${formatNumber(Number((a + b).toFixed(4)))} cm²`,
    `${formatNumber(Number((area / 2).toFixed(4)))} cm²`,
  ];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'geometria_pole_prostokata',
    type: 'zamkniete',
    tresc:
      `Prostokat ma boki dlugosci ${formatNumber(a)} cm i ${formatNumber(b)} cm. ` +
      `Oblicz jego pole.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Pole prostokata to iloczyn dlugosci jego bokow: P = a · b.\n` +
      `P = ${formatNumber(a)} · ${formatNumber(b)} = ${formatNumber(area)} cm².`,
  };
}

function obwodProstokata(difficulty, rng) {
  const a = dimension(rng, difficulty);
  const b = dimension(rng, difficulty);
  const perimeter = Number((2 * (a + b)).toFixed(4));

  return {
    id: 'geometria_obwod_prostokata',
    type: 'otwarte',
    tresc:
      `Prostokat ma boki dlugosci ${formatNumber(a)} cm i ${formatNumber(b)} cm. ` +
      `Oblicz jego obwod.`,
    odpowiedz: `${formatNumber(perimeter)} cm`,
    rozwiazanie:
      `Obwod prostokata to Ob = 2 · (a + b).\n` +
      `Ob = 2 · (${formatNumber(a)} + ${formatNumber(b)}) = ` +
      `${formatNumber(perimeter)} cm.`,
  };
}

function poleTrojkata(difficulty, rng) {
  const base = dimension(rng, difficulty);
  const height = dimension(rng, difficulty);
  const area = Number(((base * height) / 2).toFixed(4));

  return {
    id: 'geometria_pole_trojkata',
    type: 'otwarte',
    tresc:
      `Trojkat ma podstawe dlugosci ${formatNumber(base)} cm ` +
      `i wysokosc ${formatNumber(height)} cm. Oblicz jego pole.`,
    odpowiedz: `${formatNumber(area)} cm²`,
    rozwiazanie:
      `Pole trojkata to P = (a · h) : 2.\n` +
      `P = (${formatNumber(base)} · ${formatNumber(height)}) : 2 = ` +
      `${formatNumber(area)} cm².`,
  };
}

export const templates = [
  { id: 'geometria_pole_prostokata', generate: poleProstokata },
  { id: 'geometria_obwod_prostokata', generate: obwodProstokata },
  { id: 'geometria_pole_trojkata', generate: poleTrojkata },
];
