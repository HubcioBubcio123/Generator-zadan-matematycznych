// Ułamki dziesiętne (klasy 5-6).
//
// Poziomy trudności:
//   łatwy   - jedno miejsce po przecinku, wartości do 20
//   średni  - dwa miejsca po przecinku, wartości do 100
//   trudny  - trzy miejsca po przecinku, wartości do 100, trzy składniki

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

  // Typowy błąd: źle wyrównany przecinek, zgubione przeniesienie.
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
      `Wyrównujemy liczby według przecinka i dodajemy kolumnami.\n` +
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
      `Mnożymy tak jak liczby naturalne, a następnie oddzielamy ${places} ` +
      `miejsc po przecinku.\n` +
      `${formatNumber(a)} · ${b} = ${formatNumber(product)}.`,
  };
}

export const templates = [
  { id: 'ulamki_dziesietne_dodawanie', generate: dodawanie },
  { id: 'ulamki_dziesietne_mnozenie', generate: mnozenie },
];
