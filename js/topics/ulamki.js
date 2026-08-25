// Ułamki zwykłe (klasy 4-5).
//
// Poziomy trudności:
//   łatwy   - mianowniki do 8, ten sam mianownik, dwa składniki
//   średni  - mianowniki do 12, różne mianowniki, dwa składniki
//   trudny  - mianowniki do 20, różne mianowniki, dodawanie trzech ułamków
//             (podwójne sprowadzanie do wspólnego mianownika)

import { formatFraction, formatMixed } from '../format.js';
import { buildOptions } from '../distractors.js';

const RANGES = {
  latwy: { denMax: 8, sameDenominator: true, termCount: 2 },
  sredni: { denMax: 12, sameDenominator: false, termCount: 2 },
  trudny: { denMax: 20, sameDenominator: false, termCount: 3 },
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
  const { denMax, sameDenominator, termCount } = RANGES[difficulty];
  const fractions = [properFraction(rng, denMax)];
  for (let i = 1; i < termCount; i++) {
    fractions.push(
      sameDenominator
        ? { num: rng.int(1, fractions[0].den - 1), den: fractions[0].den }
        : properFraction(rng, denMax)
    );
  }

  const den = fractions.reduce((acc, f) => acc * f.den, 1);
  const num = fractions.reduce((acc, f) => acc + f.num * (den / f.den), 0);
  const correct = formatMixed(num, den);

  // Typowy błąd: dodanie liczników i mianowników osobno.
  const wrong = [
    formatMixed(
      fractions.reduce((acc, f) => acc + f.num, 0),
      fractions.reduce((acc, f) => acc + f.den, 0)
    ),
    formatMixed(num + 1, den),
    formatMixed(
      fractions.reduce((acc, f) => acc * f.num, 1),
      fractions.reduce((acc, f) => acc * f.den, 1)
    ),
  ];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);
  const divisor = gcd(num, den);
  const conversions = fractions
    .map((f) => `${f.num}/${f.den} = ${f.num * (den / f.den)}/${den}`)
    .join(', ');
  const numeratorSum = fractions.map((f) => f.num * (den / f.den)).join(' + ');

  return {
    id: 'ulamki_dodawanie',
    type: 'zamkniete',
    tresc: `Oblicz: ${fractions.map((f) => formatFraction(f.num, f.den)).join(' + ')}`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Sprowadzamy ułamki do wspólnego mianownika ${den}.\n` +
      `${conversions}.\n` +
      `Dodajemy liczniki: ${numeratorSum} = ${num}, czyli ${num}/${den}.\n` +
      `Skracamy przez ${divisor}: wynik to ${correct}.`,
  };
}

function odejmowanie(difficulty, rng) {
  const { denMax, sameDenominator } = RANGES[difficulty];
  let a = properFraction(rng, denMax);
  let b = sameDenominator
    ? { num: rng.int(1, a.den - 1), den: a.den }
    : properFraction(rng, denMax);
  if (a.num / a.den < b.num / b.den) [a, b] = [b, a];

  const den = a.den * b.den;
  const num = a.num * b.den - b.num * a.den;
  const correct = formatFraction(num, den);

  // Typowy błąd: odjęcie liczników i mianowników osobno, pominięcie sprowadzenia.
  const denDiff = Math.max(1, a.den - b.den);
  const wrong = [
    formatFraction(Math.max(0, a.num - b.num), denDiff),
    formatFraction(num + 1, den),
    formatFraction(a.num * b.den, den),
  ];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);
  const divisor = gcd(Math.max(num, 1), den);

  return {
    id: 'ulamki_odejmowanie',
    type: 'zamkniete',
    tresc: `Oblicz: ${formatFraction(a.num, a.den)} - ${formatFraction(b.num, b.den)}`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Sprowadzamy ułamki do wspólnego mianownika ${den}.\n` +
      `${a.num}/${a.den} = ${a.num * b.den}/${den}, ${b.num}/${b.den} = ${b.num * a.den}/${den}.\n` +
      `Odejmujemy liczniki: ${a.num * b.den} - ${b.num * a.den} = ${num}, czyli ${num}/${den}.\n` +
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
      `Mnożymy licznik przez licznik i mianownik przez mianownik.\n` +
      `${a.num} · ${b.num} = ${num}, ${a.den} · ${b.den} = ${den}.\n` +
      `Po skróceniu otrzymujemy ${correct}.`,
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
      `Wstaw znak <, > lub = między ułamki: ` +
      `${formatFraction(a.num, a.den)} ... ${formatFraction(b.num, b.den)}`,
    odpowiedz: correct,
    rozwiazanie:
      `Sprowadzamy do wspólnego mianownika ${a.den * b.den}.\n` +
      `${a.num}/${a.den} = ${left}/${a.den * b.den}, ${b.num}/${b.den} = ${right}/${a.den * b.den}.\n` +
      `Ponieważ ${left} ${correct} ${right}, wstawiamy znak ${correct}.`,
  };
}

export const templates = [
  { id: 'ulamki_dodawanie', generate: dodawanie },
  { id: 'ulamki_odejmowanie', generate: odejmowanie },
  { id: 'ulamki_mnozenie', generate: mnozenie },
  { id: 'ulamki_porownanie', generate: porownanie },
];
