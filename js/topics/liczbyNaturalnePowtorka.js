// Liczby naturalne — powtórka do egzaminu ósmoklasisty (klasa 8): NWD/NWW
// i zastosowanie wzoru na sumę kolejnych liczb naturalnych. Deliberately
// kept separate from js/topics/liczbyNaturalne.js's klasa-4 arithmetic
// (dodawanie/mnożenie/dzielenie) — those templates are pitched for klasy
// 4-6 and must not surface when a Klasa 8 sheet is generated, per this
// project's per-grade content-exclusivity rule.

import { formatNumber } from '../format.js';
import { buildOptions } from '../distractors.js';

function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

function lcm(a, b) {
  return (a * b) / gcd(a, b);
}

const NWD_NWW_RANGES = {
  latwy: { gMax: 6, mMax: 6, pqMax: 8 },
  sredni: { gMax: 9, mMax: 8, pqMax: 10 },
  trudny: { gMax: 12, mMax: 10, pqMax: 12 },
};

function coprimePair(rng, max) {
  let m1, m2;
  do {
    m1 = rng.int(2, max);
    m2 = rng.int(2, max);
  } while (gcd(m1, m2) !== 1 || m1 === m2);
  return [m1, m2];
}

function nwdNww(difficulty, rng) {
  const { gMax, mMax, pqMax } = NWD_NWW_RANGES[difficulty];
  const g = rng.int(2, gMax);
  const [m1, m2] = coprimePair(rng, mMax);
  const x = g * m1;
  const y = g * m2;

  let p, q;
  do {
    p = rng.int(2, pqMax);
    q = rng.int(2, pqMax);
  } while (p === q);
  const w = lcm(p, q);

  const correct = `NWD = ${g}, NWW = ${w}`;

  // Typowe błędy: zamiana miejscami NWD i NWW, pominięcie dzielenia przez
  // NWD przy liczeniu NWW, użycie mnożnika zamiast NWD.
  const wrong = [
    `NWD = ${w}, NWW = ${g}`,
    `NWD = ${g}, NWW = ${p * q}`,
    `NWD = ${m1}, NWW = ${w}`,
  ];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'liczby_naturalne_nwd_nww',
    type: 'zamkniete',
    tresc:
      `Liczba A to największy wspólny dzielnik liczb ${x} i ${y}, ` +
      `a liczba B to najmniejsza wspólna wielokrotność liczb ${p} i ${q}. ` +
      `Wybierz właściwą odpowiedź spośród podanych.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `NWD(${x}, ${y}) = ${g} (największa liczba, przez którą dzielą się obie liczby).\n` +
      `NWW(${p}, ${q}) = (${p} · ${q}) : NWD(${p}, ${q}) = ${p * q} : ${gcd(p, q)} = ${w}.\n` +
      `${correct}.`,
  };
}

const SUMA_KOLEJNYCH_RANGES = {
  latwy: { nMax: 30 },
  sredni: { nMax: 100 },
  trudny: { nMax: 500 },
};

function sumaKolejnych(difficulty, rng) {
  const { nMax } = SUMA_KOLEJNYCH_RANGES[difficulty];
  const n = rng.int(5, nMax);
  const suma = (n * (n + 1)) / 2;

  return {
    id: 'liczby_naturalne_suma_kolejnych',
    type: 'otwarte',
    tresc:
      `Sumę S kolejnych liczb naturalnych od 1 do n można obliczyć ze wzoru ` +
      `S = n · (n + 1) : 2. Oblicz sumę kolejnych liczb naturalnych od 1 do ${n}.`,
    odpowiedz: formatNumber(suma),
    rozwiazanie:
      `Podstawiamy n = ${n} do wzoru: S = ${n} · (${n} + 1) : 2.\n` +
      `S = ${n} · ${n + 1} : 2 = ${n * (n + 1)} : 2 = ${formatNumber(suma)}.`,
  };
}

export const templates = [
  { id: 'liczby_naturalne_nwd_nww', generate: nwdNww },
  { id: 'liczby_naturalne_suma_kolejnych', generate: sumaKolejnych },
];
