// Procenty (klasy 6-7).
//
// Poziomy trudności:
//   łatwy   - procenty wielokrotności 10, podstawa do 200
//   średni  - procenty wielokrotności 5, podstawa do 1000
//   trudny  - dowolne procenty 1-99, podstawa do 5000
//
// dwie_zmiany i liczba_z_procentu celowo stawiają najczęstszą pułapkę
// egzaminacyjną: procentów zmian nie wolno po prostu dodawać, odejmować
// ani traktować symetrycznie w drugą stronę.

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

function niceBase(difficulty, rng) {
  const { baseMax } = RANGES[difficulty];
  return rng.int(1, baseMax / 20) * 20;
}

function procentZLiczby(difficulty, rng) {
  const percent = choosePercent(difficulty, rng);
  const base = niceBase(difficulty, rng);
  const result = Number(((percent / 100) * base).toFixed(4));
  const correct = formatNumber(result);

  // Typowe błędy: przesunięty przecinek, procent potraktowany jako ułamek dziesiętny.
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
  const percent = choosePercent(difficulty, rng);
  const base = niceBase(difficulty, rng);
  const result = Number((base * (1 + percent / 100)).toFixed(4));

  return {
    id: 'procenty_podwyzka',
    type: 'otwarte',
    tresc:
      `Cena towaru wynosiła ${formatNumber(base)} zł i wzrosła o ${percent}%. ` +
      `Ile wynosi nowa cena?`,
    odpowiedz: `${formatNumber(result)} zł`,
    rozwiazanie:
      `Podwyżka wynosi ${percent}% z ${formatNumber(base)} zł, ` +
      `czyli ${formatNumber(Number(((percent / 100) * base).toFixed(4)))} zł.\n` +
      `Nowa cena: ${formatNumber(base)} + ` +
      `${formatNumber(Number(((percent / 100) * base).toFixed(4)))} = ` +
      `${formatNumber(result)} zł.`,
  };
}

function dwieZmiany(difficulty, rng) {
  const p1 = choosePercent(difficulty, rng);
  const p2 = choosePercent(difficulty, rng);
  const base = niceBase(difficulty, rng);
  const firstUp = rng.bool();
  const secondUp = rng.bool();

  const afterFirst = Number((base * (1 + (firstUp ? p1 : -p1) / 100)).toFixed(4));
  const final = Number((afterFirst * (1 + (secondUp ? p2 : -p2) / 100)).toFixed(4));
  const correct = `${formatNumber(final)} zł`;

  const verb1 = firstUp ? 'wzrosła' : 'spadła';
  const verb2 = secondUp ? 'wzrosła' : 'spadła';
  const znak1 = firstUp ? '+' : '-';
  const znak2 = secondUp ? '+' : '-';

  return {
    id: 'procenty_dwie_zmiany',
    type: 'otwarte',
    tresc:
      `Cena towaru wynosiła ${formatNumber(base)} zł. Najpierw cena ${verb1} o ${p1}%, ` +
      `a następnie nowa cena ${verb2} o ${p2}%. Oblicz cenę końcową.`,
    odpowiedz: correct,
    rozwiazanie:
      `Zmian procentowych nie można dodawać ani odejmować – liczymy je kolejno.\n` +
      `Po pierwszej zmianie: ${formatNumber(base)} · (1 ${znak1} ${formatNumber(p1 / 100)}) = ${formatNumber(afterFirst)} zł.\n` +
      `Po drugiej zmianie: ${formatNumber(afterFirst)} · (1 ${znak2} ${formatNumber(p2 / 100)}) = ${correct}.`,
  };
}

function liczbaZProcentu(difficulty, rng) {
  const percent = choosePercent(difficulty, rng);
  const original = niceBase(difficulty, rng);
  const up = rng.bool();
  const factor = 1 + (up ? percent : -percent) / 100;
  const result = Number((original * factor).toFixed(4));
  const correct = formatNumber(original);
  const verb = up ? 'wzrosła' : 'spadła';

  // Typowa pułapka: odwrócenie zmiany przez odjęcie/dodanie tego samego
  // procentu od wyniku, zamiast podzielenia przez współczynnik zmiany.
  const trap = Number((result * (1 + (up ? -percent : percent) / 100)).toFixed(4));
  const wrong = [
    formatNumber(trap),
    formatNumber(Number((result - percent).toFixed(4))),
    formatNumber(Number((result + (up ? percent : -percent)).toFixed(4))),
  ];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'procenty_liczba_z_procentu',
    type: 'zamkniete',
    tresc:
      `Po tym, jak cena pewnego towaru ${verb} o ${percent}%, wynosi ona ${formatNumber(result)} zł. ` +
      `Jaka była cena przed zmianą?`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Cena końcowa to ${formatNumber(factor)} ceny początkowej (nie wolno odejmować ${percent}% od wyniku).\n` +
      `${formatNumber(result)} : ${formatNumber(factor)} = ${correct} zł.`,
  };
}

export const templates = [
  { id: 'procenty_z_liczby', generate: procentZLiczby },
  { id: 'procenty_podwyzka', generate: podwyzka },
  { id: 'procenty_dwie_zmiany', generate: dwieZmiany },
  { id: 'procenty_liczba_z_procentu', generate: liczbaZProcentu },
];
