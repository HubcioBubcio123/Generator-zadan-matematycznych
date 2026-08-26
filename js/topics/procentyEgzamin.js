// Procenty — bank egzaminu ósmoklasisty. Exam-exclusive: this topic is
// registered in js/topicRegistry.js's TOPICS but deliberately listed under
// no grade's topicKeys, so it never appears in Ćwiczenia mode.
//
// Covers three skills CKE's podstawa programowa names explicitly for
// klasy VII-VIII (Dział "Obliczenia procentowe") that js/topics/procenty.js
// — already shared across sp6/sp7/sp8/lo1/lo4 — does not: VAT (cena
// netto/brutto), punkty procentowe (percentage points, distinct from a
// relative percent change — a classic exam trap), and odsetki od lokaty
// rocznej (simple annual deposit interest). Deliberately does not repeat
// procenty.js's own skills (procent z liczby, podwyżka/obniżka, dwie
// zmiany, liczba z procentu) — those are already covered elsewhere.
//
// Poziomy trudności:
//   łatwy   - mniejsze kwoty/wartości procentowe
//   średni  - większe kwoty
//   trudny  - jeszcze większe kwoty, szerszy wybór stawek/oprocentowań

import { formatNumber } from '../format.js';
import { buildOptions } from '../distractors.js';

const VAT_RANGES = {
  latwy: { nettoMin: 10, nettoMax: 200, stawki: [23] },
  sredni: { nettoMin: 20, nettoMax: 500, stawki: [23, 8] },
  trudny: { nettoMin: 50, nettoMax: 2000, stawki: [23, 8, 5] },
};

function vat(difficulty, rng) {
  const { nettoMin, nettoMax, stawki } = VAT_RANGES[difficulty];
  const stawka = rng.pick(stawki);
  const netto = rng.int(nettoMin, nettoMax);
  const mnoznik = 1 + stawka / 100;
  const brutto = Number((netto * mnoznik).toFixed(4));
  const pytajONetto = rng.bool();

  if (pytajONetto) {
    return {
      id: 'procenty_vat_egz',
      type: 'otwarte',
      tresc:
        `Cena brutto pewnego towaru wynosi ${formatNumber(brutto)} zł. Stawka VAT wynosi ${stawka}%. ` +
        `Oblicz cenę netto tego towaru.`,
      odpowiedz: `${formatNumber(netto)} zł`,
      rozwiazanie:
        `Cena brutto to ${formatNumber(mnoznik)} ceny netto (netto + VAT).\n` +
        `Cena netto = ${formatNumber(brutto)} : ${formatNumber(mnoznik)} = ${formatNumber(netto)} zł.`,
    };
  }
  return {
    id: 'procenty_vat_egz',
    type: 'otwarte',
    tresc:
      `Cena netto pewnego towaru wynosi ${formatNumber(netto)} zł. Stawka VAT wynosi ${stawka}%. ` +
      `Oblicz cenę brutto tego towaru.`,
    odpowiedz: `${formatNumber(brutto)} zł`,
    rozwiazanie:
      `Cena brutto = cena netto + VAT = cena netto · ${formatNumber(mnoznik)}.\n` +
      `${formatNumber(netto)} · ${formatNumber(mnoznik)} = ${formatNumber(brutto)} zł.`,
  };
}

const PUNKTY_RANGES = {
  latwy: { min: 10, max: 50, deltaMin: 5, deltaMax: 15 },
  sredni: { min: 10, max: 70, deltaMin: 5, deltaMax: 20 },
  trudny: { min: 5, max: 80, deltaMin: 5, deltaMax: 25 },
};

// Polish count-noun agreement for "punkt": 1 punkt procentowy, 2-4 punkty
// procentowe, 5+ punktów procentowych — except the teens (12-14), which
// take the 5+ form despite ending in 2-4.
function punktForma(n) {
  if (n === 1) return 'punkt procentowy';
  const lastDigit = n % 10;
  const lastTwo = n % 100;
  if (lastDigit >= 2 && lastDigit <= 4 && !(lastTwo >= 12 && lastTwo <= 14)) return 'punkty procentowe';
  return 'punktów procentowych';
}

function punktyProcentowe(difficulty, rng) {
  const { min, max, deltaMin, deltaMax } = PUNKTY_RANGES[difficulty];
  const p1 = rng.int(min, max - deltaMax);
  const delta = rng.int(deltaMin, deltaMax);
  const p2 = p1 + delta;
  const correct = `${delta} ${punktForma(delta)}`;

  // Typowy błąd: pomylenie punktów procentowych ze względnym wzrostem
  // procentowym, podanie jednej z wartości zamiast różnicy.
  const relativeGrowth = Math.round(((p2 - p1) / p1) * 100);
  const wrong = [
    `${relativeGrowth} ${punktForma(relativeGrowth)}`,
    `${p2} ${punktForma(p2)}`,
    `${p1} ${punktForma(p1)}`,
  ];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'procenty_punkty_procentowe_egz',
    type: 'zamkniete',
    tresc:
      `Udział pewnej firmy w rynku wzrósł z ${p1}% do ${p2}%. ` +
      `O ile punktów procentowych wzrósł udział tej firmy w rynku?`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Różnica punktów procentowych to zwykła różnica podanych wartości procentowych ` +
      `(nie mylimy jej ze względnym wzrostem procentowym).\n` +
      `${p2}% - ${p1}% = ${correct}.`,
  };
}

const ODSETKI_RANGES = {
  latwy: { kwotaMin: 500, kwotaMax: 5000, oprocentowania: [2, 3, 4, 5] },
  sredni: { kwotaMin: 1000, kwotaMax: 10000, oprocentowania: [2, 3, 4, 5, 6] },
  trudny: { kwotaMin: 2000, kwotaMax: 20000, oprocentowania: [2, 3, 4, 5, 6, 7] },
};

function odsetki(difficulty, rng) {
  const { kwotaMin, kwotaMax, oprocentowania } = ODSETKI_RANGES[difficulty];
  const kwota = rng.int(kwotaMin / 100, kwotaMax / 100) * 100;
  const oprocentowanie = rng.pick(oprocentowania);
  const odsetkiWartosc = (kwota * oprocentowanie) / 100;
  const razem = kwota + odsetkiWartosc;
  const correct = `${formatNumber(razem)} zł`;

  // Typowe błędy: podanie samych odsetek zamiast całej kwoty na koncie,
  // zapomnienie o doliczeniu odsetek, pomylenie procentu z ułamkiem (np.
  // pomnożenie przez samo oprocentowanie zamiast przez ułamek dziesiętny).
  const wrong = [
    `${formatNumber(odsetkiWartosc)} zł`,
    `${formatNumber(kwota)} zł`,
    `${formatNumber(kwota * (1 + oprocentowanie))} zł`,
  ];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'procenty_odsetki_egz',
    type: 'zamkniete',
    tresc:
      `Do banku wpłacono ${formatNumber(kwota)} zł na lokatę roczną oprocentowaną w wysokości ${oprocentowanie}% ` +
      `w skali roku. Ile pieniędzy będzie na koncie po roku (bez uwzględniania podatków)?`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Odsetki: ${formatNumber(kwota)} · ${oprocentowanie}% = ${formatNumber(kwota)} · ${formatNumber(oprocentowanie / 100)} = ${formatNumber(odsetkiWartosc)} zł.\n` +
      `Kwota po roku: ${formatNumber(kwota)} + ${formatNumber(odsetkiWartosc)} = ${correct}.`,
  };
}

export const templates = [
  { id: 'procenty_vat_egz', generate: vat },
  { id: 'procenty_punkty_procentowe_egz', generate: punktyProcentowe },
  { id: 'procenty_odsetki_egz', generate: odsetki },
];
