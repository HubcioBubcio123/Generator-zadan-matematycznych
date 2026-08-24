// Ulamki dziesietne (klasy 5-6).
//
// Poziomy trudnosci:
//   latwy   - jedno miejsce po przecinku, wartosci do 20
//   sredni  - dwa miejsca po przecinku, wartosci do 100
//   trudny  - trzy miejsca po przecinku, wartosci do 100, trzy skladniki

import { formatNumber } from '../format.js';
import { buildOptions } from '../distractors.js';

const RANGES = {
  latwy: { places: 1, max: 20, count: 2 },
  sredni: { places: 2, max: 100, count: 2 },
  trudny: { places: 3, max: 100, count: 3 },
};

function decimalValue(rng, places, max) {
  const scale = 10 ** places;
  return rng.int(1, max * scale) / scale;
}

function dodawanie(difficulty, rng) {
  const { places, max, count } = RANGES[difficulty];
  const numbers = Array.from({ length: count }, () => decimalValue(rng, places, max));
  const sum = Number(numbers.reduce((a, b) => a + b, 0).toFixed(places));
  const correct = formatNumber(sum);

  // Typowy blad: zle wyrownany przecinek, zgubione przeniesienie.
  const wrong = [
    formatNumber(Number((sum * 10).toFixed(places))),
    formatNumber(Number((sum + 0.1).toFixed(places))),
    formatNumber(Number((sum - 1).toFixed(places))),
  ].filter((w) => !w.startsWith('-'));

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'ulamki_dziesietne_dodawanie',
    type: 'zamkniete',
    tresc: `Oblicz: ${numbers.map(formatNumber).join(' + ')}`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Wyrownujemy liczby wedlug przecinka i dodajemy kolumnami.\n` +
      `${numbers.map(formatNumber).join(' + ')} = ${correct}.`,
  };
}

function mnozenie(difficulty, rng) {
  const { places, max } = RANGES[difficulty];
  const a = decimalValue(rng, places, max);
  const b = rng.int(2, 12);
  const product = Number((a * b).toFixed(places));

  return {
    id: 'ulamki_dziesietne_mnozenie',
    type: 'otwarte',
    tresc: `Oblicz: ${formatNumber(a)} · ${b}`,
    odpowiedz: formatNumber(product),
    rozwiazanie:
      `Mnozymy tak jak liczby naturalne, a nastepnie oddzielamy ${places} ` +
      `miejsc po przecinku.\n` +
      `${formatNumber(a)} · ${b} = ${formatNumber(product)}.`,
  };
}

export const templates = [
  { id: 'ulamki_dziesietne_dodawanie', generate: dodawanie },
  { id: 'ulamki_dziesietne_mnozenie', generate: mnozenie },
];
