// Bryły — bank egzaminu ósmoklasisty. Exam-exclusive: this topic is
// registered in js/topicRegistry.js's TOPICS but deliberately listed under
// no grade's topicKeys, so it never appears in Ćwiczenia mode. It never
// duplicates js/topics/bryly.js's prostopadłościan templates (shared with
// klasa 6/8 Ćwiczenia) — this file is deliberately prism/pyramid-only.
//
// Scope verified against the official CKE podstawa programowa PDF
// (Dział XI, "Geometria przestrzenna", klasy VII-VIII):
//   - graniastosłupy proste, prawidłowe i takie, które nie są prawidłowe:
//     pole powierzchni i objętość (pkt 1-2);
//   - ostrosłupy prawidłowe i takie, które nie są prawidłowe: pole
//     powierzchni i objętość (pkt 3).
// Walec, stożek i kula ("bryły obrotowe") are explicitly listed in the
// same document's commentary (section 7c, "Zagadnienia przesunięte do
// szkoły ponadpodstawowej") as moved to liceum — so this file intentionally
// never covers them.
//
// Poziomy trudności:
//   łatwy   - mniejsze wymiary
//   średni  - większe wymiary
//   trudny  - jeszcze większe wymiary

import { formatNumber } from '../format.js';
import { buildOptions } from '../distractors.js';

// Pythagorean triples keep every hypotenuse (and therefore every derived
// area) a whole number, matching js/topics/potegiPitagoras.js's convention
// for CKE-style tasks. One leg of every triple below is always a multiple
// of 3, which keeps the triangular-prism templates in this file exact too.
const TRIPLES = [
  [3, 4, 5],
  [5, 12, 13],
  [8, 15, 17],
  [7, 24, 25],
  [20, 21, 29],
];

const GRANIASTOSLUP_RANGES = {
  latwy: { scaleMax: 1, hMax: 8 },
  sredni: { scaleMax: 2, hMax: 15 },
  trudny: { scaleMax: 3, hMax: 25 },
};

function graniastoslupTrojkat(rng, difficulty) {
  const { scaleMax, hMax } = GRANIASTOSLUP_RANGES[difficulty];
  const [a0, b0, c0] = rng.pick(TRIPLES);
  const scale = rng.int(1, scaleMax);
  const a = a0 * scale;
  const b = b0 * scale;
  const c = c0 * scale;
  const h = rng.int(2, hMax);
  return { a, b, c, h };
}

function graniastoslupObjetosc(difficulty, rng) {
  const { a, b, h } = graniastoslupTrojkat(rng, difficulty);
  const objetoscWartosc = ((a * b) / 2) * h;

  return {
    id: 'bryly_graniastoslup_trojkatny_objetosc_egz',
    type: 'otwarte',
    tresc:
      `Podstawą graniastosłupa prostego jest trójkąt prostokątny o przyprostokątnych ` +
      `długości ${a} cm i ${b} cm. Wysokość tego graniastosłupa jest równa ${h} cm. ` +
      `Oblicz objętość tej bryły.`,
    odpowiedz: `${formatNumber(objetoscWartosc)} cm³`,
    rozwiazanie:
      `Pole podstawy (trójkąta prostokątnego): P_p = (${a} · ${b}) : 2 = ${(a * b) / 2} cm².\n` +
      `Objętość: V = P_p · h = ${(a * b) / 2} · ${h} = ${formatNumber(objetoscWartosc)} cm³.`,
  };
}

function graniastoslupPole(difficulty, rng) {
  const { a, b, c, h } = graniastoslupTrojkat(rng, difficulty);
  const polePodstawy = a * b; // 2 * (a*b/2), the two triangular bases together
  const poleBoczne = (a + b + c) * h;
  const poleWartosc = polePodstawy + poleBoczne;
  const correct = `${formatNumber(poleWartosc)} cm²`;

  // Typowe błędy: policzenie tylko jednej podstawy zamiast dwóch, pominięcie
  // przeciwprostokątnej w obwodzie podstawy, pomylenie wzoru z objętością.
  const wrong = [
    `${formatNumber(a * b / 2 + poleBoczne)} cm²`,
    `${formatNumber(polePodstawy + (a + b) * h)} cm²`,
    `${formatNumber(((a * b) / 2) * h)} cm²`,
  ];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'bryly_graniastoslup_trojkatny_pole_egz',
    type: 'zamkniete',
    tresc:
      `Podstawą graniastosłupa prostego jest trójkąt prostokątny o przyprostokątnych ` +
      `długości ${a} cm i ${b} cm oraz przeciwprostokątnej ${c} cm. Wysokość tego ` +
      `graniastosłupa jest równa ${h} cm. Oblicz pole powierzchni całkowitej tej bryły.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Pole dwóch podstaw: 2 · (${a} · ${b} : 2) = ${a} · ${b} = ${polePodstawy} cm².\n` +
      `Pole boczne: obwód podstawy razy wysokość = (${a} + ${b} + ${c}) · ${h} = ${poleBoczne} cm².\n` +
      `Pole całkowite: ${polePodstawy} + ${poleBoczne} = ${correct}.`,
  };
}

const OSTROSLUP_OBJETOSC_RANGES = {
  latwy: { kMax: 4, hMax: 8 },
  sredni: { kMax: 6, hMax: 15 },
  trudny: { kMax: 8, hMax: 20 },
};

function ostroslupObjetosc(difficulty, rng) {
  const { kMax, hMax } = OSTROSLUP_OBJETOSC_RANGES[difficulty];
  // a is a multiple of 3 so a*a is a multiple of 9, keeping (a*a*h)/3 exact
  // for every h, without needing a Pythagorean relationship here.
  const a = 3 * rng.int(1, kMax);
  const h = rng.int(2, hMax);
  const objetoscWartosc = (a * a * h) / 3;

  return {
    id: 'bryly_ostroslup_czworokatny_objetosc_egz',
    type: 'otwarte',
    tresc:
      `Podstawą ostrosłupa prawidłowego czworokątnego jest kwadrat o boku ${a} cm. ` +
      `Wysokość tego ostrosłupa jest równa ${h} cm. Oblicz objętość tej bryły.`,
    odpowiedz: `${formatNumber(objetoscWartosc)} cm³`,
    rozwiazanie:
      `Pole podstawy (kwadratu): P_p = ${a}² = ${a * a} cm².\n` +
      `Objętość: V = (1/3) · P_p · h = (1/3) · ${a * a} · ${h} = ${formatNumber(objetoscWartosc)} cm³.`,
  };
}

const OSTROSLUP_POLE_RANGES = {
  latwy: { aMax: 12, extraMax: 6 },
  sredni: { aMax: 18, extraMax: 10 },
  trudny: { aMax: 24, extraMax: 15 },
};

function ostroslupPole(difficulty, rng) {
  const { aMax, extraMax } = OSTROSLUP_POLE_RANGES[difficulty];
  const a = 3 * rng.int(1, Math.floor(aMax / 3));
  // The slant height (wysokość ściany bocznej) is the hypotenuse of a right
  // triangle with legs h and a/2, so it must exceed a/2 for the pyramid to
  // be geometrically valid — never sampled independently of a.
  const minL = Math.floor(a / 2) + 1;
  const l = rng.int(minL, minL + extraMax);
  const polePodstawy = a * a;
  const poleBoczne = 2 * a * l;
  const poleWartosc = polePodstawy + poleBoczne;
  const correct = `${formatNumber(poleWartosc)} cm²`;

  // Typowe błędy: pominięcie mnożnika 2 przy polu bocznym, policzenie
  // samego pola bocznego bez podstawy, podwojenie pola bocznego.
  const wrong = [
    `${formatNumber(polePodstawy + a * l)} cm²`,
    `${formatNumber(poleBoczne)} cm²`,
    `${formatNumber(polePodstawy + 4 * a * l)} cm²`,
  ];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'bryly_ostroslup_czworokatny_pole_egz',
    type: 'zamkniete',
    tresc:
      `Podstawą ostrosłupa prawidłowego czworokątnego jest kwadrat o boku ${a} cm. ` +
      `Wysokość ściany bocznej tego ostrosłupa jest równa ${l} cm. ` +
      `Oblicz pole powierzchni całkowitej tej bryły.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Pole podstawy: P_p = ${a}² = ${polePodstawy} cm².\n` +
      `Pole powierzchni bocznej: 4 ściany trójkątne, każda o polu (${a} · ${l}) : 2, ` +
      `razem 2 · ${a} · ${l} = ${poleBoczne} cm².\n` +
      `Pole całkowite: ${polePodstawy} + ${poleBoczne} = ${correct}.`,
  };
}

export const templates = [
  { id: 'bryly_graniastoslup_trojkatny_objetosc_egz', generate: graniastoslupObjetosc },
  { id: 'bryly_graniastoslup_trojkatny_pole_egz', generate: graniastoslupPole },
  { id: 'bryly_ostroslup_czworokatny_objetosc_egz', generate: ostroslupObjetosc },
  { id: 'bryly_ostroslup_czworokatny_pole_egz', generate: ostroslupPole },
];
