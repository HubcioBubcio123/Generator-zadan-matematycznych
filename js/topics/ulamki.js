// Ulamki zwykle (klasy 4-5).
//
// Poziomy trudnosci:
//   latwy   - mianowniki do 8, ten sam mianownik przy dodawaniu
//   sredni  - mianowniki do 12, rozne mianowniki
//   trudny  - mianowniki do 20, rozne mianowniki, wynik moze byc liczba mieszana

import { formatFraction, formatMixed } from '../format.js';
import { buildOptions } from '../distractors.js';

const RANGES = {
  latwy: { denMax: 8, sameDenominator: true },
  sredni: { denMax: 12, sameDenominator: false },
  trudny: { denMax: 20, sameDenominator: false },
};

function gcd(a, b) {
  while (b) [a, b] = [b, a % b];
  return Math.abs(a);
}

function properFraction(rng, denMax) {
  const den = rng.int(2, denMax);
  const num = rng.int(1, den - 1);
  return { num, den };
}

function dodawanie(difficulty, rng) {
  const { denMax, sameDenominator } = RANGES[difficulty];
  const a = properFraction(rng, denMax);
  const b = sameDenominator
    ? { num: rng.int(1, a.den - 1), den: a.den }
    : properFraction(rng, denMax);

  const num = a.num * b.den + b.num * a.den;
  const den = a.den * b.den;
  const correct = formatMixed(num, den);

  // Typowy blad: dodanie licznikow i mianownikow osobno.
  const wrong = [
    formatMixed(a.num + b.num, a.den + b.den),
    formatMixed(num + 1, den),
    formatMixed(a.num * b.num, a.den * b.den),
  ];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);
  const divisor = gcd(num, den);

  return {
    id: 'ulamki_dodawanie',
    type: 'zamkniete',
    tresc: `Oblicz: ${formatFraction(a.num, a.den)} + ${formatFraction(b.num, b.den)}`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Sprowadzamy ulamki do wspolnego mianownika ${den}.\n` +
      `${a.num}/${a.den} = ${a.num * b.den}/${den}, ${b.num}/${b.den} = ${b.num * a.den}/${den}.\n` +
      `Dodajemy liczniki: ${a.num * b.den} + ${b.num * a.den} = ${num}, czyli ${num}/${den}.\n` +
      `Skracamy przez ${divisor}: wynik to ${correct}.`,
  };
}

function mnozenie(difficulty, rng) {
  const { denMax } = RANGES[difficulty];
  const a = properFraction(rng, denMax);
  const b = properFraction(rng, denMax);
  const num = a.num * b.num;
  const den = a.den * b.den;
  const correct = formatFraction(num, den);

  return {
    id: 'ulamki_mnozenie',
    type: 'otwarte',
    tresc: `Oblicz: ${formatFraction(a.num, a.den)} · ${formatFraction(b.num, b.den)}`,
    odpowiedz: correct,
    rozwiazanie:
      `Mnozymy licznik przez licznik i mianownik przez mianownik.\n` +
      `${a.num} · ${b.num} = ${num}, ${a.den} · ${b.den} = ${den}.\n` +
      `Po skroceniu otrzymujemy ${correct}.`,
  };
}

function porownanie(difficulty, rng) {
  const { denMax } = RANGES[difficulty];
  const a = properFraction(rng, denMax);
  const b = properFraction(rng, denMax);
  const left = a.num * b.den;
  const right = b.num * a.den;
  const correct = left < right ? '<' : left > right ? '>' : '=';

  return {
    id: 'ulamki_porownanie',
    type: 'otwarte',
    tresc:
      `Wstaw znak <, > lub = miedzy ulamki: ` +
      `${formatFraction(a.num, a.den)} ... ${formatFraction(b.num, b.den)}`,
    odpowiedz: correct,
    rozwiazanie:
      `Sprowadzamy do wspolnego mianownika ${a.den * b.den}.\n` +
      `${a.num}/${a.den} = ${left}/${a.den * b.den}, ${b.num}/${b.den} = ${right}/${a.den * b.den}.\n` +
      `Poniewaz ${left} ${correct} ${right}, wstawiamy znak ${correct}.`,
  };
}

export const templates = [
  { id: 'ulamki_dodawanie', generate: dodawanie },
  { id: 'ulamki_mnozenie', generate: mnozenie },
  { id: 'ulamki_porownanie', generate: porownanie },
];
