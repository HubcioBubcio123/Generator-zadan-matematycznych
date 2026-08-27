// Równania — bank egzaminu ósmoklasisty. Exam-exclusive: this topic is
// registered in js/topicRegistry.js's TOPICS but deliberately listed under
// no grade's topicKeys, so it never appears in Ćwiczenia mode. Templates
// here are either migrated duplicates of js/topics/rownania.js's exam-style
// templates (kept self-contained rather than imported, so this pool stays
// immune to future changes in the shared Ćwiczenia file) or new templates
// covering algebra reasoning shapes the real egzamin ósmoklasisty tests.
//
// Poziomy trudności:
//   łatwy   - mniejsze wartości/współczynniki
//   średni  - większe wartości
//   trudny  - jeszcze większe wartości / szerszy zakres

import { formatNumber } from '../format.js';
import { buildOptions } from '../distractors.js';

const SREDNIA_RANGES = {
  latwy: { meanMax: 10 },
  sredni: { meanMax: 20 },
  trudny: { meanMax: 30 },
};

function sredniaArytmetycznaEgz(difficulty, rng) {
  const { meanMax } = SREDNIA_RANGES[difficulty];
  const Y = rng.int(1, meanMax);
  const X = rng.int(1, Math.floor((3 * Y - 1) / 2));
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
    id: 'rownania_srednia_arytmetyczna_egz',
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

function podzialNaGrupyEgz(difficulty, rng) {
  const { baseMax, dMax, ratios } = PODZIAL_RANGES[difficulty];
  const k = rng.pick(ratios);
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
    id: 'rownania_podzial_na_grupy_egz',
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
  { id: 'rownania_srednia_arytmetyczna_egz', generate: sredniaArytmetycznaEgz },
  { id: 'rownania_podzial_na_grupy_egz', generate: podzialNaGrupyEgz },
];
