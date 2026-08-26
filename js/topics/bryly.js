// Bryły: pole powierzchni i objętość prostopadłościanu (klasy 6, 8).
//
// Poziomy trudności:
//   łatwy   - wymiary całkowite do 12
//   średni  - wymiary całkowite do 25
//   trudny  - wymiary z jednym miejscem po przecinku, do 25

import { formatNumber } from '../format.js';
import { buildOptions } from '../distractors.js';

const RANGES = {
  latwy: { max: 12, decimal: false },
  sredni: { max: 25, decimal: false },
  trudny: { max: 25, decimal: true },
};

function wymiar(rng, difficulty) {
  const { max, decimal } = RANGES[difficulty];
  return decimal ? rng.int(20, max * 10) / 10 : rng.int(2, max);
}

function wymiary(rng, difficulty) {
  return [wymiar(rng, difficulty), wymiar(rng, difficulty), wymiar(rng, difficulty)];
}

function polePowierzchni(difficulty, rng) {
  const [a, b, c] = wymiary(rng, difficulty);
  const pole = Number((2 * (a * b + b * c + a * c)).toFixed(4));
  const correct = `${formatNumber(pole)} cm²`;

  // Typowe błędy: policzona objętość zamiast pola, brak podwojenia sumy pól
  // ścian, podwojenie tylko jednej pary ścian.
  const wrong = [
    `${formatNumber(Number((a * b * c).toFixed(4)))} cm²`,
    `${formatNumber(Number((a * b + b * c + a * c).toFixed(4)))} cm²`,
    `${formatNumber(Number((4 * a * b).toFixed(4)))} cm²`,
  ];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'bryly_pole_powierzchni_prostopadloscianu',
    type: 'zamkniete',
    figura: { typ: 'prostopadloscian', a, b, c },
    tresc:
      `Prostopadłościan ma wymiary ${formatNumber(a)} cm, ${formatNumber(b)} cm ` +
      `oraz ${formatNumber(c)} cm. Oblicz pole powierzchni całkowitej tej bryły.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Pole powierzchni całkowitej: P = 2 · (a·b + b·c + a·c).\n` +
      `P = 2 · (${formatNumber(a)} · ${formatNumber(b)} + ${formatNumber(b)} · ${formatNumber(c)} + ` +
      `${formatNumber(a)} · ${formatNumber(c)}) = ${correct}.`,
  };
}

function objetosc(difficulty, rng) {
  const [a, b, c] = wymiary(rng, difficulty);
  const objetoscWartosc = Number((a * b * c).toFixed(4));

  return {
    id: 'bryly_objetosc_prostopadloscianu',
    type: 'otwarte',
    figura: { typ: 'prostopadloscian', a, b, c },
    tresc:
      `Prostopadłościan ma wymiary ${formatNumber(a)} cm, ${formatNumber(b)} cm ` +
      `oraz ${formatNumber(c)} cm. Oblicz objętość tej bryły.`,
    odpowiedz: `${formatNumber(objetoscWartosc)} cm³`,
    rozwiazanie:
      `Objętość prostopadłościanu: V = a · b · c.\n` +
      `V = ${formatNumber(a)} · ${formatNumber(b)} · ${formatNumber(c)} = ` +
      `${formatNumber(objetoscWartosc)} cm³.`,
  };
}

export const templates = [
  { id: 'bryly_pole_powierzchni_prostopadloscianu', generate: polePowierzchni },
  { id: 'bryly_objetosc_prostopadloscianu', generate: objetosc },
];
