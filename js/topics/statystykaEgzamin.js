// Statystyka — bank egzaminu ósmoklasisty. Exam-exclusive: this topic is
// registered in js/topicRegistry.js's TOPICS but deliberately listed under
// no grade's topicKeys, so it never appears in Ćwiczenia mode. A future
// Klasa 8 statystyka unit will get its own, entirely separate templates —
// never these ones — per the project's per-grade exclusivity rule.
//
// Poziomy trudności:
//   łatwy   - mniejsze zbiory liczb, mniejsze wartości
//   średni  - większe wartości
//   trudny  - większe zbiory (7 elementów), większe wartości

import { formatNumber } from '../format.js';
import { buildOptions } from '../distractors.js';

const SREDNIA_RANGES = {
  latwy: { n: 5, meanMin: 20, meanMax: 60, delta: 6 },
  sredni: { n: 5, meanMin: 30, meanMax: 90, delta: 10 },
  trudny: { n: 7, meanMin: 30, meanMax: 120, delta: 12 },
};

// Builds a list of n values whose mean is exactly `mean`: n-1 values wobble
// by a random delta around the mean, and the last value absorbs whatever
// the running sum needs to land exactly on n*mean.
function meanRangedList(rng, n, mean, delta) {
  const values = [];
  let sum = 0;
  for (let i = 0; i < n - 1; i++) {
    const d = rng.int(-delta, delta);
    values.push(mean + d);
    sum += d;
  }
  values.push(mean - sum);
  return values;
}

function srednia(difficulty, rng) {
  const { n, meanMin, meanMax, delta } = SREDNIA_RANGES[difficulty];
  const mean = rng.int(meanMin, meanMax);
  const values = rng.shuffle(meanRangedList(rng, n, mean, delta));
  const correct = formatNumber(mean);
  const total = values.reduce((a, b) => a + b, 0);

  // Typowe błędy: podanie największej/najmniejszej liczby zamiast średniej,
  // pominięcie jednej z wartości przy liczeniu.
  const wrong = [
    formatNumber(Math.max(...values)),
    formatNumber(Math.min(...values)),
    formatNumber(mean + delta),
  ];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'statystyka_srednia_egz',
    type: 'zamkniete',
    tresc: `Oblicz średnią arytmetyczną liczb: ${values.join(', ')}.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Średnia arytmetyczna to suma liczb podzielona przez ich ilość.\n` +
      `(${values.join(' + ')}) : ${n} = ${total} : ${n} = ${correct}.`,
  };
}

const MEDIANA_RANGES = {
  latwy: { n: 5, max: 50 },
  sredni: { n: 5, max: 100 },
  trudny: { n: 7, max: 150 },
};

function mediana(difficulty, rng) {
  const { n, max } = MEDIANA_RANGES[difficulty];
  const values = Array.from({ length: n }, () => rng.int(1, max));
  const sorted = [...values].sort((a, b) => a - b);
  const median = sorted[(n - 1) / 2];

  return {
    id: 'statystyka_mediana_egz',
    type: 'otwarte',
    tresc: `Oblicz medianę liczb: ${values.join(', ')}.`,
    odpowiedz: formatNumber(median),
    rozwiazanie:
      `Porządkujemy liczby rosnąco: ${sorted.join(', ')}.\n` +
      `Mediana to liczba znajdująca się na środkowej pozycji: ${formatNumber(median)}.`,
  };
}

const DOMINANTA_RANGES = {
  latwy: { max: 20 },
  sredni: { max: 40 },
  trudny: { max: 60 },
};

function dominanta(difficulty, rng) {
  const { max } = DOMINANTA_RANGES[difficulty];
  const mode = rng.int(1, max);
  const others = [];
  while (others.length < 4) {
    const candidate = rng.int(1, max);
    if (candidate !== mode && !others.includes(candidate)) others.push(candidate);
  }
  const all = [mode, mode, mode, ...others];
  const values = rng.shuffle(all);
  const correct = formatNumber(mode);

  // Typowe błędy: podanie innej liczby ze zbioru, podanie średniej zamiast
  // wartości najczęściej występującej.
  const wrong = [
    formatNumber(others[0]),
    formatNumber(others[1]),
    formatNumber(Math.round(all.reduce((a, b) => a + b, 0) / all.length)),
  ];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'statystyka_dominanta_egz',
    type: 'zamkniete',
    tresc: `Oblicz dominantę (wartość najczęściej występującą) w zbiorze liczb: ${values.join(', ')}.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Dominanta to wartość, która występuje najczęściej.\n` +
      `Liczba ${correct} występuje 3 razy, pozostałe liczby występują tylko raz, więc dominanta = ${correct}.`,
  };
}

const ROZSTEP_RANGES = {
  latwy: { n: 5, max: 50 },
  sredni: { n: 6, max: 100 },
  trudny: { n: 7, max: 150 },
};

function rozstep(difficulty, rng) {
  const { n, max } = ROZSTEP_RANGES[difficulty];
  const values = Array.from({ length: n }, () => rng.int(1, max));
  const najwieksza = Math.max(...values);
  const najmniejsza = Math.min(...values);
  const rozstepWartosc = najwieksza - najmniejsza;

  return {
    id: 'statystyka_rozstep_egz',
    type: 'otwarte',
    tresc: `Oblicz rozstęp zbioru liczb: ${values.join(', ')}.`,
    odpowiedz: formatNumber(rozstepWartosc),
    rozwiazanie:
      `Rozstęp to różnica między największą a najmniejszą wartością w zbiorze.\n` +
      `${najwieksza} - ${najmniejsza} = ${formatNumber(rozstepWartosc)}.`,
  };
}

const TABELA_RANGES = {
  latwy: { totals: [20, 40] },
  sredni: { totals: [40, 60, 80] },
  trudny: { totals: [60, 80, 100] },
};

const PRZEDMIOTY_MIANOWNIK = ['matematyka', 'informatyka', 'fizyka'];
const PRZEDMIOTY_BIERNIK = ['matematykę', 'informatykę', 'fizykę'];

// Polish count-noun agreement: 1 osoba, 2-4 osoby, 5+ osób — except the
// teens (12-14), which take osób despite ending in 2-4.
function osobaForma(n) {
  if (n === 1) return 'osoba';
  const lastDigit = n % 10;
  const lastTwo = n % 100;
  if (lastDigit >= 2 && lastDigit <= 4 && !(lastTwo >= 12 && lastTwo <= 14)) return 'osoby';
  return 'osób';
}

function procentZTabeli(difficulty, rng) {
  const { totals } = TABELA_RANGES[difficulty];
  const total = rng.pick(totals);

  // Percentages are chosen in multiples of 5 (and made to sum to exactly
  // 100) so the derived counts always come out as clean integers, and the
  // resulting percentages read like the real exam's own round figures.
  const percents = [];
  let remaining = 100;
  for (let i = 0; i < 2; i++) {
    const maxP = remaining - 5 * (2 - i);
    const p = rng.int(1, Math.floor(maxP / 5)) * 5;
    percents.push(p);
    remaining -= p;
  }
  percents.push(remaining);

  const counts = percents.map((p) => (p * total) / 100);
  const askIndex = rng.int(0, 2);
  const correct = `${percents[askIndex]}%`;

  // Typowe błędy: procent innej kategorii, liczba osób pomylona z procentem.
  const wrong = [
    ...percents.filter((_, i) => i !== askIndex).map((p) => `${p}%`),
    `${formatNumber(counts[askIndex])}%`,
  ];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  const wiersze = PRZEDMIOTY_MIANOWNIK.map(
    (label, i) => `${label} - ${counts[i]} ${osobaForma(counts[i])}`
  ).join(', ');

  return {
    id: 'statystyka_procent_z_tabeli_egz',
    type: 'zamkniete',
    tresc:
      `W ankiecie przeprowadzonej wśród ${total} uczniów zapytano o ulubiony przedmiot. ` +
      `Wyniki: ${wiersze}. ` +
      `Jaki procent uczniów wybrał ${PRZEDMIOTY_BIERNIK[askIndex]} jako ulubiony przedmiot?`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Procent = (liczba uczniów, którzy wybrali ${PRZEDMIOTY_BIERNIK[askIndex]}) : ` +
      `(liczba wszystkich uczniów) · 100%.\n` +
      `${counts[askIndex]} : ${total} · 100% = ${correct}.`,
  };
}

export const templates = [
  { id: 'statystyka_srednia_egz', generate: srednia },
  { id: 'statystyka_mediana_egz', generate: mediana },
  { id: 'statystyka_dominanta_egz', generate: dominanta },
  { id: 'statystyka_rozstep_egz', generate: rozstep },
  { id: 'statystyka_procent_z_tabeli_egz', generate: procentZTabeli },
];
