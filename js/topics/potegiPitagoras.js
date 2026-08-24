// Potegi, pierwiastki i twierdzenie Pitagorasa (klasy 7-8).
//
// Poziomy trudnosci:
//   latwy   - podstawy do 5, wykladniki 2-3; trojki pitagorejskie bez skalowania
//   sredni  - podstawy do 9, wykladniki 2-4; trojki skalowane do x3
//   trudny  - podstawy do 12, wykladniki 2-5; trojki skalowane do x6

import { formatNumber } from '../format.js';
import { buildOptions } from '../distractors.js';

// Pythagorean triples keep every answer a whole number, as CKE tasks do.
const TRIPLES = [
  [3, 4, 5],
  [5, 12, 13],
  [8, 15, 17],
  [7, 24, 25],
  [20, 21, 29],
];

const RANGES = {
  latwy: { baseMax: 5, expMax: 3, rootMax: 12, scaleMax: 1 },
  sredni: { baseMax: 9, expMax: 4, rootMax: 20, scaleMax: 3 },
  trudny: { baseMax: 12, expMax: 5, rootMax: 30, scaleMax: 6 },
};

function potegi(difficulty, rng) {
  const { baseMax, expMax } = RANGES[difficulty];
  const base = rng.int(2, baseMax);
  const exponent = rng.int(2, expMax);
  const value = base ** exponent;
  const correct = formatNumber(value);

  // Typowy blad: pomnozenie podstawy przez wykladnik.
  const wrong = [
    formatNumber(base * exponent),
    formatNumber(base ** (exponent - 1)),
    formatNumber(base ** (exponent + 1)),
  ];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'potegi_obliczanie',
    type: 'zamkniete',
    tresc: `Oblicz wartosc potegi ${base}^${exponent}.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Potegę obliczamy mnozac podstawe przez siebie ${exponent} razy.\n` +
      `${Array(exponent).fill(base).join(' · ')} = ${correct}.`,
  };
}

function pierwiastki(difficulty, rng) {
  const { rootMax } = RANGES[difficulty];
  const root = rng.int(2, rootMax);
  const radicand = root * root;

  return {
    id: 'pierwiastki_obliczanie',
    type: 'otwarte',
    tresc: `Oblicz pierwiastek kwadratowy z liczby ${radicand}.`,
    odpowiedz: formatNumber(root),
    rozwiazanie:
      `Szukamy liczby, ktora podniesiona do kwadratu daje ${radicand}.\n` +
      `${root} · ${root} = ${radicand}, wiec wynik to ${root}.`,
  };
}

function pitagoras(difficulty, rng) {
  const { scaleMax } = RANGES[difficulty];
  const [a0, b0, c0] = rng.pick(TRIPLES);
  const scale = rng.int(1, scaleMax);
  const a = a0 * scale;
  const b = b0 * scale;
  const c = c0 * scale;

  return {
    id: 'pitagoras_przeciwprostokatna',
    type: 'otwarte',
    tresc:
      `W trojkacie prostokatnym przyprostokatne maja dlugosci ${a} cm i ${b} cm. ` +
      `Oblicz dlugosc przeciwprostokatnej.`,
    odpowiedz: `${formatNumber(c)} cm`,
    rozwiazanie:
      `Z twierdzenia Pitagorasa: a² + b² = c².\n` +
      `${a}² + ${b}² = ${a * a} + ${b * b} = ${c * c}.\n` +
      `c = pierwiastek z ${c * c} = ${c} cm.`,
  };
}

export const templates = [
  { id: 'potegi_obliczanie', generate: potegi },
  { id: 'pierwiastki_obliczanie', generate: pierwiastki },
  { id: 'pitagoras_przeciwprostokatna', generate: pitagoras },
];
