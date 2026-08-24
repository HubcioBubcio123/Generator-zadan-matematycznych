// Procenty (klasy 6-7).
//
// Poziomy trudnosci:
//   latwy   - procenty wielokrotnosci 10, podstawa do 200
//   sredni  - procenty wielokrotnosci 5, podstawa do 1000
//   trudny  - dowolne procenty 1-99, podstawa do 5000

import { formatNumber } from '../format.js';
import { buildOptions } from '../distractors.js';

const RANGES = {
  latwy: { percents: [10, 20, 30, 40, 50, 60, 70, 80, 90], baseMax: 200 },
  sredni: { percents: [5, 15, 25, 35, 45, 55, 65, 75, 85, 95], baseMax: 1000 },
  trudny: { percents: null, baseMax: 5000 },
};

function choosePercent(difficulty, rng) {
  const { percents } = RANGES[difficulty];
  return percents ? rng.pick(percents) : rng.int(1, 99);
}

function procentZLiczby(difficulty, rng) {
  const { baseMax } = RANGES[difficulty];
  const percent = choosePercent(difficulty, rng);
  // Base is a multiple of 20 so answers stay tidy at every level.
  const base = rng.int(1, baseMax / 20) * 20;
  const result = Number(((percent / 100) * base).toFixed(4));
  const correct = formatNumber(result);

  // Typowe bledy: przesuniety przecinek, procent potraktowany jako ulamek dziesietny.
  const wrong = [
    formatNumber(Number((result * 10).toFixed(4))),
    formatNumber(Number((result / 10).toFixed(4))),
    formatNumber(Number((base - result).toFixed(4))),
  ];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'procenty_z_liczby',
    type: 'zamkniete',
    tresc: `Oblicz ${percent}% liczby ${formatNumber(base)}.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `${percent}% to ${formatNumber(percent / 100)}.\n` +
      `${formatNumber(percent / 100)} · ${formatNumber(base)} = ${correct}.`,
  };
}

function podwyzka(difficulty, rng) {
  const { baseMax } = RANGES[difficulty];
  const percent = choosePercent(difficulty, rng);
  const base = rng.int(1, baseMax / 20) * 20;
  const result = Number((base * (1 + percent / 100)).toFixed(4));

  return {
    id: 'procenty_podwyzka',
    type: 'otwarte',
    tresc:
      `Cena towaru wynosila ${formatNumber(base)} zl i wzrosla o ${percent}%. ` +
      `Ile wynosi nowa cena?`,
    odpowiedz: `${formatNumber(result)} zl`,
    rozwiazanie:
      `Podwyzka wynosi ${percent}% z ${formatNumber(base)} zl, ` +
      `czyli ${formatNumber(Number(((percent / 100) * base).toFixed(4)))} zl.\n` +
      `Nowa cena: ${formatNumber(base)} + ` +
      `${formatNumber(Number(((percent / 100) * base).toFixed(4)))} = ` +
      `${formatNumber(result)} zl.`,
  };
}

export const templates = [
  { id: 'procenty_z_liczby', generate: procentZLiczby },
  { id: 'procenty_podwyzka', generate: podwyzka },
];
