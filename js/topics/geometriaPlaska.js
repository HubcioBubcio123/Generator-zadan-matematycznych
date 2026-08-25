// Geometria płaska: pola i obwody figur (klasy 4-6).
//
// Poziomy trudności:
//   łatwy   - wymiary całkowite do 12
//   średni  - wymiary całkowite do 40
//   trudny  - wymiary z jednym miejscem po przecinku, do 40; figura złożona
//             wymaga odjęcia pola wyciętego prostokąta od pola dużego

import { formatNumber } from '../format.js';
import { buildOptions } from '../distractors.js';

const RANGES = {
  latwy: { max: 12, decimal: false },
  sredni: { max: 40, decimal: false },
  trudny: { max: 40, decimal: true },
};

const COMPOSITE_MAX = { latwy: 10, sredni: 20, trudny: 30 };

function dimension(rng, difficulty) {
  const { max, decimal } = RANGES[difficulty];
  return decimal ? rng.int(20, max * 10) / 10 : rng.int(2, max);
}

function poleProstokata(difficulty, rng) {
  const a = dimension(rng, difficulty);
  const b = dimension(rng, difficulty);
  const area = Number((a * b).toFixed(4));
  const correct = `${formatNumber(area)} cm²`;

  // Typowy błąd: policzony obwód zamiast pola.
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
      `Prostokąt ma boki długości ${formatNumber(a)} cm i ${formatNumber(b)} cm. ` +
      `Oblicz jego pole.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Pole prostokąta to iloczyn długości jego boków: P = a · b.\n` +
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
      `Prostokąt ma boki długości ${formatNumber(a)} cm i ${formatNumber(b)} cm. ` +
      `Oblicz jego obwód.`,
    odpowiedz: `${formatNumber(perimeter)} cm`,
    rozwiazanie:
      `Obwód prostokąta to Ob = 2 · (a + b).\n` +
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
      `Trójkąt ma podstawę długości ${formatNumber(base)} cm ` +
      `i wysokość ${formatNumber(height)} cm. Oblicz jego pole.`,
    odpowiedz: `${formatNumber(area)} cm²`,
    rozwiazanie:
      `Pole trójkąta to P = (a · h) : 2.\n` +
      `P = (${formatNumber(base)} · ${formatNumber(height)}) : 2 = ` +
      `${formatNumber(area)} cm².`,
  };
}

function poleTrapezu(difficulty, rng) {
  let a = dimension(rng, difficulty);
  let b = dimension(rng, difficulty);
  if (b > a) [a, b] = [b, a];
  const h = dimension(rng, difficulty);
  const area = Number((((a + b) / 2) * h).toFixed(4));
  const correct = `${formatNumber(area)} cm²`;

  // Typowe błędy: zapomniane dzielenie przez 2, pomnożenie wszystkich wymiarów.
  const wrong = [
    `${formatNumber(Number(((a + b) * h).toFixed(4)))} cm²`,
    `${formatNumber(Number((a * b * h).toFixed(4)))} cm²`,
    `${formatNumber(Number((area * 2).toFixed(4)))} cm²`,
  ];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'geometria_pole_trapezu',
    type: 'zamkniete',
    tresc:
      `Trapez ma podstawy długości ${formatNumber(a)} cm i ${formatNumber(b)} cm ` +
      `oraz wysokość ${formatNumber(h)} cm. Oblicz jego pole.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Pole trapezu to P = ((a + b) : 2) · h.\n` +
      `P = ((${formatNumber(a)} + ${formatNumber(b)}) : 2) · ${formatNumber(h)} = ${correct}.`,
  };
}

function figuraZlozona(difficulty, rng) {
  const max = COMPOSITE_MAX[difficulty];
  const W = rng.int(6, max);
  const H = rng.int(6, max);
  const w = rng.int(1, Math.max(1, Math.floor(W / 2)));
  const h = rng.int(1, Math.max(1, Math.floor(H / 2)));
  const bigArea = W * H;
  const cutArea = w * h;
  const area = bigArea - cutArea;
  const correct = `${formatNumber(area)} cm²`;

  // Typowe błędy: pominięcie odjęcia wyciętego fragmentu, dodanie zamiast odjęcia.
  const wrong = [
    `${formatNumber(bigArea)} cm²`,
    `${formatNumber(bigArea + cutArea)} cm²`,
    `${formatNumber(area + w + h)} cm²`,
  ];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'geometria_figura_zlozona',
    type: 'zamkniete',
    tresc:
      `Z prostokąta o wymiarach ${W} cm na ${H} cm wycięto w rogu mniejszy ` +
      `prostokąt o wymiarach ${w} cm na ${h} cm. Oblicz pole pozostałej figury.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Pole dużego prostokąta: ${W} · ${H} = ${bigArea} cm².\n` +
      `Pole wyciętego prostokąta: ${w} · ${h} = ${cutArea} cm².\n` +
      `Pole figury złożonej: ${bigArea} - ${cutArea} = ${area} cm².`,
  };
}

export const templates = [
  { id: 'geometria_pole_prostokata', generate: poleProstokata },
  { id: 'geometria_obwod_prostokata', generate: obwodProstokata },
  { id: 'geometria_pole_trojkata', generate: poleTrojkata },
  { id: 'geometria_pole_trapezu', generate: poleTrapezu },
  { id: 'geometria_figura_zlozona', generate: figuraZlozona },
];
