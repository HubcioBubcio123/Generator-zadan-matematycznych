// Geometria — bank egzaminu ósmoklasisty. Exam-exclusive: this topic is
// registered in js/topicRegistry.js's TOPICS but deliberately listed under
// no grade's topicKeys, so it never appears in Ćwiczenia mode.
//
// Covers "Długość okręgu i pole koła" (podstawa programowa: circumference
// in klasa 7, area — including pierścień kołowy — in klasa 8), currently
// uncovered anywhere in the app. js/topics/geometriaPlaska.js's existing
// pole/obwód templates (rectangle, triangle, trapezoid) stay untouched —
// this file is deliberately circle-only, not a duplicate of that content.
//
// The real exam always specifies π ≈ 3.14, so every template here does too.
//
// Poziomy trudności:
//   łatwy   - mniejsze promienie
//   średni  - większe promienie
//   trudny  - jeszcze większe promienie / większa różnica promieni w pierścieniu

import { formatNumber } from '../format.js';
import { buildOptions } from '../distractors.js';

const PI = 3.14;

const OKRAG_RANGES = {
  latwy: { rMin: 2, rMax: 20 },
  sredni: { rMin: 5, rMax: 40 },
  trudny: { rMin: 10, rMax: 80 },
};

function okragDlugosc(difficulty, rng) {
  const { rMin, rMax } = OKRAG_RANGES[difficulty];
  const r = rng.int(rMin, rMax);
  const obwod = Number((2 * PI * r).toFixed(4));

  return {
    id: 'geometria_okrag_dlugosc_egz',
    type: 'otwarte',
    tresc: `Okrąg ma promień długości ${r} cm. Oblicz długość tego okręgu. Przyjmij π ≈ 3,14.`,
    odpowiedz: `${formatNumber(obwod)} cm`,
    rozwiazanie:
      `Długość okręgu: L = 2 · π · r.\n` +
      `L = 2 · 3,14 · ${r} = ${formatNumber(obwod)} cm.`,
  };
}

function okragPromienZDlugosci(difficulty, rng) {
  const { rMin, rMax } = OKRAG_RANGES[difficulty];
  const r = rng.int(rMin, rMax);
  const obwod = Number((2 * PI * r).toFixed(4));
  const correct = `${r} cm`;

  // Typowe błędy: pomylenie promienia ze średnicą (obwód : π = średnica),
  // pomnożenie zamiast podzielenia, użycie złego przybliżenia liczby π.
  const wrong = [
    `${formatNumber(Number((obwod / PI).toFixed(4)))} cm`,
    `${formatNumber(Number((obwod * 2).toFixed(4)))} cm`,
    `${formatNumber(Number((obwod / 6).toFixed(4)))} cm`,
  ];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'geometria_okrag_promien_z_dlugosci_egz',
    type: 'zamkniete',
    tresc: `Długość pewnego okręgu jest równa ${formatNumber(obwod)} cm. Oblicz promień tego okręgu. Przyjmij π ≈ 3,14.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Z wzoru L = 2 · π · r wyznaczamy r = L : (2 · π).\n` +
      `r = ${formatNumber(obwod)} : (2 · 3,14) = ${correct}.`,
  };
}

const KOLO_RANGES = {
  latwy: { rMin: 2, rMax: 15 },
  sredni: { rMin: 5, rMax: 25 },
  trudny: { rMin: 8, rMax: 40 },
};

function poleKola(difficulty, rng) {
  const { rMin, rMax } = KOLO_RANGES[difficulty];
  const r = rng.int(rMin, rMax);
  const pole = Number((PI * r * r).toFixed(4));
  const correct = `${formatNumber(pole)} cm²`;

  // Typowe błędy: pomylenie pola z obwodem, użycie średnicy zamiast
  // promienia we wzorze, zapomnienie o podniesieniu promienia do kwadratu.
  const wrong = [
    `${formatNumber(Number((2 * PI * r).toFixed(4)))} cm²`,
    `${formatNumber(Number((PI * (2 * r) * (2 * r)).toFixed(4)))} cm²`,
    `${formatNumber(Number((PI * r).toFixed(4)))} cm²`,
  ];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'geometria_pole_kola_egz',
    type: 'zamkniete',
    tresc: `Koło ma promień długości ${r} cm. Oblicz pole tego koła. Przyjmij π ≈ 3,14.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Pole koła: P = π · r².\n` +
      `P = 3,14 · ${r}² = 3,14 · ${r * r} = ${correct}.`,
  };
}

function promienZPolaKola(difficulty, rng) {
  const { rMin, rMax } = KOLO_RANGES[difficulty];
  const r = rng.int(rMin, rMax);
  const pole = Number((PI * r * r).toFixed(4));

  return {
    id: 'geometria_promien_z_pola_kola_egz',
    type: 'otwarte',
    tresc: `Pole pewnego koła jest równe ${formatNumber(pole)} cm². Oblicz promień tego koła. Przyjmij π ≈ 3,14.`,
    odpowiedz: `${r} cm`,
    rozwiazanie:
      `Z wzoru P = π · r² wyznaczamy r² = P : π, a następnie r = pierwiastek z (P : π).\n` +
      `r² = ${formatNumber(pole)} : 3,14 = ${r * r}, więc r = ${r} cm.`,
  };
}

function pierscienKolowy(difficulty, rng) {
  const { rMin, rMax } = KOLO_RANGES[difficulty];
  const rWewnetrzny = rng.int(rMin, rMax);
  const rZewnetrzny = rWewnetrzny + rng.int(2, 10);
  const pole = Number((PI * (rZewnetrzny * rZewnetrzny - rWewnetrzny * rWewnetrzny)).toFixed(4));
  const correct = `${formatNumber(pole)} cm²`;

  // Typowe błędy: policzenie pola tylko dużego lub tylko małego koła,
  // odjęcie promieni przed podniesieniem do kwadratu.
  const wrong = [
    `${formatNumber(Number((PI * rZewnetrzny * rZewnetrzny).toFixed(4)))} cm²`,
    `${formatNumber(Number((PI * rWewnetrzny * rWewnetrzny).toFixed(4)))} cm²`,
    `${formatNumber(
      Number((PI * (rZewnetrzny - rWewnetrzny) * (rZewnetrzny - rWewnetrzny)).toFixed(4))
    )} cm²`,
  ];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'geometria_pierscien_kolowy_egz',
    type: 'zamkniete',
    tresc:
      `Pierścień kołowy powstał z dwóch okręgów współśrodkowych o promieniach ${rWewnetrzny} cm i ${rZewnetrzny} cm. ` +
      `Oblicz pole tego pierścienia. Przyjmij π ≈ 3,14.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Pole pierścienia to różnica pól kół: P = π · R² - π · r² = π · (R² - r²).\n` +
      `P = 3,14 · (${rZewnetrzny}² - ${rWewnetrzny}²) = ` +
      `3,14 · (${rZewnetrzny * rZewnetrzny} - ${rWewnetrzny * rWewnetrzny}) = ${correct}.`,
  };
}

export const templates = [
  { id: 'geometria_okrag_dlugosc_egz', generate: okragDlugosc },
  { id: 'geometria_okrag_promien_z_dlugosci_egz', generate: okragPromienZDlugosci },
  { id: 'geometria_pole_kola_egz', generate: poleKola },
  { id: 'geometria_promien_z_pola_kola_egz', generate: promienZPolaKola },
  { id: 'geometria_pierscien_kolowy_egz', generate: pierscienKolowy },
];
