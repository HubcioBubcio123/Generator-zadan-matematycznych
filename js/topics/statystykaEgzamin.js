// Statystyka — bank egzaminu ósmoklasisty. Exam-exclusive: this topic is
// registered in js/topicRegistry.js's TOPICS but deliberately listed under
// no grade's topicKeys, so it never appears in Ćwiczenia mode. A future
// Klasa 8 statystyka unit will get its own, entirely separate templates —
// never these ones — per the project's per-grade exclusivity rule.
//
// Scope is deliberately limited to what CKE's own podstawa programowa
// (Dział XIII, "Odczytywanie danych i elementy statystyki opisowej",
// klasy VII-VIII) actually requires: interpreting data from tables and
// charts, and computing the arithmetic mean. Mediana, dominanta, and
// rozstęp are NOT part of szkoła podstawowa's curriculum — they belong to
// szkoła ponadpodstawowa (liceum) probability/statistics — so this file
// intentionally does not cover them.
//
// Poziomy trudności:
//   łatwy   - mniejsze wartości w tabelach/zbiorach liczb
//   średni  - większe wartości
//   trudny  - jeszcze większe wartości / większe zbiory

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

const SKLEP_RANGES = {
  latwy: { max: 30 },
  sredni: { max: 60 },
  trudny: { max: 100 },
};

// All three table templates below use the same "Sklep A/B/C/D/E sold N
// bikes" framing so every label stays in subject position (mianownik) in
// every sentence, deliberately avoiding Polish's day-of-week-style
// locative declension traps (e.g. "w środę", not "w środa").
const SKLEPY = ['Sklep A', 'Sklep B', 'Sklep C', 'Sklep D', 'Sklep E'];

function tabelaPorownanie(difficulty, rng) {
  const { max } = SKLEP_RANGES[difficulty];
  const wartosci = SKLEPY.map(() => rng.int(5, max));
  let iA;
  let iB;
  do {
    iA = rng.int(0, SKLEPY.length - 1);
    iB = rng.int(0, SKLEPY.length - 1);
  } while (iA === iB || wartosci[iA] === wartosci[iB]); // "ile więcej" needs a genuine, nonzero difference
  if (wartosci[iA] < wartosci[iB]) [iA, iB] = [iB, iA]; // iA is now the larger value
  const roznica = wartosci[iA] - wartosci[iB];
  const correct = formatNumber(roznica);
  const tabela = SKLEPY.map((label, i) => `${label} - ${wartosci[i]}`).join(', ');

  // Typowe błędy: podanie jednej z wartości zamiast różnicy, dodanie zamiast odjęcia.
  const wrong = [
    formatNumber(wartosci[iA]),
    formatNumber(wartosci[iB]),
    formatNumber(wartosci[iA] + wartosci[iB]),
  ];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'statystyka_tabela_porownanie_egz',
    type: 'zamkniete',
    tresc:
      `W tabeli przedstawiono liczbę sprzedanych rowerów w kolejnych sklepach: ${tabela}. ` +
      `Ile więcej rowerów sprzedał ${SKLEPY[iA]} niż ${SKLEPY[iB]}?`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Odczytujemy z tabeli: ${SKLEPY[iA]} - ${wartosci[iA]}, ${SKLEPY[iB]} - ${wartosci[iB]}.\n` +
      `Różnica: ${wartosci[iA]} - ${wartosci[iB]} = ${correct}.`,
  };
}

function tabelaSuma(difficulty, rng) {
  const { max } = SKLEP_RANGES[difficulty];
  const wartosci = SKLEPY.map(() => rng.int(5, max));
  const suma = wartosci.reduce((a, b) => a + b, 0);
  const tabela = SKLEPY.map((label, i) => `${label} - ${wartosci[i]}`).join(', ');

  return {
    id: 'statystyka_tabela_suma_egz',
    type: 'otwarte',
    tresc:
      `W tabeli przedstawiono liczbę sprzedanych rowerów w kolejnych sklepach: ${tabela}. ` +
      `Oblicz łączną liczbę sprzedanych rowerów.`,
    odpowiedz: formatNumber(suma),
    rozwiazanie: `Łączna liczba: ${wartosci.join(' + ')} = ${suma}.`,
  };
}

function tabelaEkstremum(difficulty, rng) {
  const { max } = SKLEP_RANGES[difficulty];
  let wartosci;
  let liczbaMaksimow;
  do {
    wartosci = SKLEPY.map(() => rng.int(5, max));
    const najwieksza = Math.max(...wartosci);
    liczbaMaksimow = wartosci.filter((v) => v === najwieksza).length;
  } while (liczbaMaksimow > 1); // avoid an ambiguous tie for first place
  const maxIndex = wartosci.indexOf(Math.max(...wartosci));
  const correct = SKLEPY[maxIndex];
  const tabela = SKLEPY.map((label, i) => `${label} - ${wartosci[i]}`).join(', ');

  const wrong = SKLEPY.filter((_, i) => i !== maxIndex).slice(0, 3);

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'statystyka_tabela_ekstremum_egz',
    type: 'zamkniete',
    tresc:
      `W tabeli przedstawiono liczbę sprzedanych rowerów w kolejnych sklepach: ${tabela}. ` +
      `Który sklep sprzedał najwięcej rowerów?`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie: `Największa wartość w tabeli to ${wartosci[maxIndex]}, co odpowiada: ${correct}.`,
  };
}

export const templates = [
  { id: 'statystyka_srednia_egz', generate: srednia },
  { id: 'statystyka_procent_z_tabeli_egz', generate: procentZTabeli },
  { id: 'statystyka_tabela_porownanie_egz', generate: tabelaPorownanie },
  { id: 'statystyka_tabela_suma_egz', generate: tabelaSuma },
  { id: 'statystyka_tabela_ekstremum_egz', generate: tabelaEkstremum },
];
