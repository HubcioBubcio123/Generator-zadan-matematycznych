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

// Fixed, hand-verified catalog of (formula, correct rearrangement, 3 wrong
// rearrangements) — deliberately not a general symbolic-algebra engine, per
// this project's standing decision that generating/verifying arbitrary
// symbolic equivalence is too fragile. Every entry's correctness is
// independently re-derived in test/topics/rownaniaEgzamin.test.js.
const WZOR_KATALOG = [
  {
    formula: 'S = n · (n + 1) : 2',
    opis: 'suma n kolejnych liczb naturalnych',
    poprawne: '2S = n² + n',
    bledne: ['2S = n²', 'S = n² + n', '2S = n² - n'],
  },
  {
    formula: 'P = a · h : 2',
    opis: 'pole trójkąta o podstawie a i wysokości h',
    poprawne: 'a = 2P : h',
    bledne: ['a = P : (2h)', 'a = 2P · h', 'a = h : (2P)'],
  },
  {
    formula: 'Obw = 2 · (a + b)',
    opis: 'obwód prostokąta o bokach a i b',
    poprawne: 'a = Obw : 2 - b',
    bledne: ['a = Obw : 2 + b', 'a = Obw - b', 'a = Obw : (2b)'],
  },
  {
    formula: 's = v · t',
    opis: 'droga przy stałej prędkości v i czasie t',
    poprawne: 'v = s : t',
    bledne: ['v = s · t', 'v = t : s', 'v = s + t'],
  },
  {
    formula: 'C = c · (1 + p : 100)',
    opis: 'cena po podwyżce o p% z ceny początkowej c',
    poprawne: 'c = C : (1 + p : 100)',
    bledne: ['c = C · (1 + p : 100)', 'c = C - p : 100', 'c = C : (1 - p : 100)'],
  },
];

function wzorPrzeksztalcenie(difficulty, rng) {
  const entry = rng.pick(WZOR_KATALOG);
  const { odpowiedzi, poprawna } = buildOptions(entry.poprawne, entry.bledne, rng);
  const formulaDisplay = `${entry.formula}  (${entry.opis})`;

  return {
    id: 'rownania_wzor_przeksztalcenie_egz',
    type: 'zamkniete',
    tresc: `Dany jest wzór: ${formulaDisplay}. Wzór ten po poprawnym przekształceniu ma postać:`,
    odpowiedzi,
    poprawna,
    odpowiedz: entry.poprawne,
    rozwiazanie: `Przekształcając wzór ${entry.formula}, otrzymujemy ${entry.poprawne}.`,
  };
}

const WARTOSC_RANGES = {
  latwy: { max: 8 },
  sredni: { max: 15 },
  trudny: { max: 20 },
};

function wyrazenieAlgebraiczneWartosc(difficulty, rng) {
  const { max } = WARTOSC_RANGES[difficulty];
  const a = rng.int(2, max);
  const b = rng.int(-max, max);
  const x = rng.int(-10, 10);
  const correct = formatNumber(a * x + b);

  // Typowe błędy: zły znak przy b, dodanie x zamiast pomnożenia, złe
  // pogrupowanie (a · (x+b)).
  const wrong = [formatNumber(a * x - b), formatNumber(a + x + b), formatNumber(a * (x + b))];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  // Sign-guard b for proper Polish notation (+ 5 or - 5, never + -5)
  const bSign = b >= 0 ? `+ ${b}` : `- ${Math.abs(b)}`;
  const intermediate = a * x;

  return {
    id: 'rownania_wyrazenie_algebraiczne_wartosc_egz',
    type: 'zamkniete',
    tresc: `Oblicz wartość wyrażenia ${a}x ${bSign} dla x = ${x}.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie: `Podstawiamy x = ${x}: ${a} · ${x} ${bSign} = ${intermediate} ${bSign} = ${correct}.`,
  };
}

const UKLAD_RANGES = {
  latwy: { xMax: 15 },
  sredni: { xMax: 25 },
  trudny: { xMax: 40 },
};

function ukladDwochNiewiadomych(difficulty, rng) {
  const { xMax } = UKLAD_RANGES[difficulty];
  const x = rng.int(2, xMax);
  const y = rng.int(1, xMax);
  const S = x + y;
  const D = x - y;
  const correct = formatNumber(x);

  // Typowe błędy: podanie y zamiast x, pominięcie dzielenia przez 2,
  // dodanie S i D bez podzielenia.
  const wrong = [formatNumber(y), formatNumber(S - D), formatNumber(S + D)];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'rownania_uklad_dwoch_niewiadomych_egz',
    type: 'zamkniete',
    tresc: `Dany jest układ równań: x + y = ${S}, x - y = ${D}. Oblicz wartość x.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Dodając stronami oba równania: 2x = ${S} + ${D} = ${S + D}.\n` +
      `x = ${S + D} : 2 = ${correct}.`,
  };
}

const NIEROWNOSC_RANGES = {
  latwy: { aMax: 5, x0Max: 10 },
  sredni: { aMax: 8, x0Max: 15 },
  trudny: { aMax: 10, x0Max: 20 },
};

function nierownosc(difficulty, rng) {
  const { aMax, x0Max } = NIEROWNOSC_RANGES[difficulty];
  const a = rng.int(2, aMax);
  const b = rng.int(-10, 10);
  const x0 = rng.int(-x0Max, x0Max);
  const c = a * x0 + b;
  const correct = formatNumber(x0 + 1);

  // Typowe błędy: podanie rozwiązania nierówności nieostrej (x0, na
  // granicy), podanie wartości spoza rozwiązania, wartość poniżej granicy.
  const wrong = [formatNumber(x0), formatNumber(x0 - 1), formatNumber(x0 - 2)];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'rownania_nierownosc_egz',
    type: 'zamkniete',
    tresc: `Dla której z podanych wartości x nierówność ${a}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)} > ${c} jest prawdziwa?`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Rozwiązaniem nierówności ${a}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)} > ${c} jest x > ${x0} ` +
      `(bo ${a} · ${x0} ${b >= 0 ? '+' : '-'} ${Math.abs(b)} = ${c}).\n` +
      `Spośród podanych wartości warunek x > ${x0} spełnia ${correct}.`,
  };
}

const ROWNOWAZNE_RANGES = {
  latwy: { max: 8 },
  sredni: { max: 15 },
  trudny: { max: 20 },
};

function wyrazenieRownowazne(difficulty, rng) {
  const { max } = ROWNOWAZNE_RANGES[difficulty];
  const a = rng.int(1, max);
  const b = rng.int(1, max);
  const c = rng.int(-max, max);
  const coefSum = a + b;
  const cSign = c >= 0 ? '+' : '-';
  const cAbs = Math.abs(c);
  const correct = `${coefSum}x ${cSign} ${cAbs}`;

  // Typowe błędy: pomnożenie zamiast dodania współczynników, zły znak
  // stałej, zły znak współczynnika.
  const wrong = [
    `${a * b}x ${cSign} ${cAbs}`,
    `${coefSum}x ${cSign === '+' ? '-' : '+'} ${cAbs}`,
    `-${coefSum}x ${cSign} ${cAbs}`,
  ];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'rownania_wyrazenie_rownowazne_egz',
    type: 'zamkniete',
    tresc: `Które z podanych wyrażeń jest równe wyrażeniu ${a}x + ${b}x ${cSign} ${cAbs}?`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Grupujemy wyrazy podobne: ${a}x + ${b}x = ${coefSum}x.\n` +
      `Wyrażenie równoważne: ${correct}.`,
  };
}

// Each percent maps to a denominator that keeps x*(100+p)/100 an exact
// integer for any integer multiple of that denominator.
const PROC_ROWNANIA_DENOM = { 10: 10, 20: 5, 25: 4, 50: 2 };

const PROC_ROWNANIA_RANGES = {
  latwy: { xMax: 50, pset: [10, 20] },
  sredni: { xMax: 100, pset: [10, 20, 25] },
  trudny: { xMax: 200, pset: [10, 20, 25, 50] },
};

function procentZRownania(difficulty, rng) {
  const { xMax, pset } = PROC_ROWNANIA_RANGES[difficulty];
  const p = rng.pick(pset);
  const denom = PROC_ROWNANIA_DENOM[p];
  const x = denom * rng.int(1, Math.floor(xMax / denom));
  const y = (x * (100 + p)) / 100;
  const correct = formatNumber(x);
  const mnoznik = formatNumber((100 + p) / 100);

  // Typowe błędy: podanie y zamiast x, pomnożenie zamiast podzielenia przez
  // mnożnik, odjęcie p zamiast podzielenia.
  const wrong = [formatNumber(y), formatNumber(y * (100 + p) / 100), formatNumber(y - p)];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'rownania_procent_z_rownania_egz',
    type: 'zamkniete',
    tresc: `Pewna liczba x zwiększona o ${p}% jest równa ${formatNumber(y)}. Oblicz liczbę x.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `x · (1 + ${p}/100) = ${formatNumber(y)}.\n` +
      `x · ${mnoznik} = ${formatNumber(y)}.\n` +
      `x = ${formatNumber(y)} : ${mnoznik} = ${correct}.`,
  };
}

const BOK_Z_OBWODU_RANGES = {
  latwy: { max: 20 },
  sredni: { max: 40 },
  trudny: { max: 60 },
};

function dlugoscBokuZObwodu(difficulty, rng) {
  const { max } = BOK_Z_OBWODU_RANGES[difficulty];
  const a = rng.int(2, max);
  const b = rng.int(2, max);
  const obw = 2 * (a + b);
  const correct = `${formatNumber(a)} cm`;

  // Typowe błędy: dodanie b zamiast odjęcia, brak podzielenia obwodu przez
  // 2, niepoprawna kolejność operacji (dzielenie przed odejmowaniem).
  const wrong = [`${formatNumber(obw / 2 + b)} cm`, `${formatNumber(obw - b)} cm`, `${formatNumber((obw - b) / 2)} cm`];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'rownania_dlugosc_boku_z_obwodu_egz',
    type: 'zamkniete',
    tresc: `Obwód prostokąta jest równy ${obw} cm, a jeden z jego boków ma długość ${b} cm. Oblicz długość drugiego boku.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Obw = 2 · (a + b), więc a = Obw : 2 - b.\n` +
      `a = ${obw} : 2 - ${b} = ${obw / 2} - ${b} = ${correct}.`,
  };
}

const WIEK_RANGES = {
  latwy: { corkaMax: 12 },
  sredni: { corkaMax: 16 },
  trudny: { corkaMax: 20 },
};

function wiekZadanie(difficulty, rng) {
  const { corkaMax } = WIEK_RANGES[difficulty];
  const corka = rng.int(5, corkaMax);
  const d = rng.int(15, 35);
  const matka = corka + d;
  const suma = corka + matka;
  const correct = formatNumber(corka);

  // Typowe błędy: podanie wieku matki, pominięcie różnicy wieku, podanie
  // połowy sumy bez uwzględnienia różnicy.
  const wrong = [formatNumber(matka), formatNumber(suma - d), formatNumber(suma / 2)];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'rownania_wiek_zadanie_egz',
    type: 'zamkniete',
    tresc: `Matka jest o ${d} lat starsza od córki. Suma ich wieku wynosi ${suma} lat. Oblicz, ile lat ma córka.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Niech wiek córki wynosi x. Wtedy matka ma x + ${d} lat.\n` +
      `x + (x + ${d}) = ${suma}.\n` +
      `2x = ${suma - d}.\n` +
      `x = ${correct}.`,
  };
}

const PREDKOSC_PROSTA_RANGES = {
  latwy: { vSet: [40, 50, 60], tMax: 4 },
  sredni: { vSet: [40, 50, 60, 80, 90], tMax: 6 },
  trudny: { vSet: [40, 50, 60, 80, 90, 100, 120], tMax: 8 },
};

function predkoscProsta(difficulty, rng) {
  const { vSet, tMax } = PREDKOSC_PROSTA_RANGES[difficulty];
  const v = rng.pick(vSet);
  const t = rng.int(1, tMax);
  const s = v * t;
  const correct = `${formatNumber(t)} h`;

  // Typowe błędy: podzielenie drogi przez 2*prędkość (błąd przy anulowaniu),
  // pomnożenie drogi przez prędkość, odjęcie prędkości od drogi.
  const wrong = [`${formatNumber(s / (2 * v))} h`, `${formatNumber(s * v)} h`, `${formatNumber(s - v)} h`];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'rownania_predkosc_prosta_egz',
    type: 'zamkniete',
    tresc: `Samochód przejechał ${s} km ze stałą prędkością ${v} km/h. Oblicz czas jazdy tego samochodu.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie: `t = s : v = ${s} : ${v} = ${correct}.`,
  };
}

export const templates = [
  { id: 'rownania_srednia_arytmetyczna_egz', generate: sredniaArytmetycznaEgz },
  { id: 'rownania_podzial_na_grupy_egz', generate: podzialNaGrupyEgz },
  { id: 'rownania_wzor_przeksztalcenie_egz', generate: wzorPrzeksztalcenie },
  { id: 'rownania_wyrazenie_algebraiczne_wartosc_egz', generate: wyrazenieAlgebraiczneWartosc },
  { id: 'rownania_uklad_dwoch_niewiadomych_egz', generate: ukladDwochNiewiadomych },
  { id: 'rownania_nierownosc_egz', generate: nierownosc },
  { id: 'rownania_wyrazenie_rownowazne_egz', generate: wyrazenieRownowazne },
  { id: 'rownania_procent_z_rownania_egz', generate: procentZRownania },
  { id: 'rownania_dlugosc_boku_z_obwodu_egz', generate: dlugoscBokuZObwodu },
  { id: 'rownania_wiek_zadanie_egz', generate: wiekZadanie },
  { id: 'rownania_predkosc_prosta_egz', generate: predkoscProsta },
];
