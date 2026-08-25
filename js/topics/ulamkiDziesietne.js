// Ułamki dziesiętne (klasy 5-6).
//
// Poziomy trudności:
//   łatwy   - dodawanie: dwa składniki, jedno miejsce po przecinku;
//             dzielenie: dzielnik całkowity
//   średni  - dodawanie: dwa składniki mieszające 1-2 miejsca po przecinku;
//             dzielenie: dzielnik całkowity, większe liczby
//   trudny  - dodawanie: cztery składniki (2-3 miejsca po przecinku), dwa
//             odejmowania w łańcuchu; dzielenie: dzielnik jest ułamkiem
//             dziesiętnym (wymaga przesunięcia przecinka)

import { formatNumber } from '../format.js';
import { buildOptions } from '../distractors.js';

const RANGES = {
  latwy: {
    max: 20,
    count: 2,
    minusCount: 0,
    placesChoices: [1],
    quotientPlaces: 1,
    divisorMax: 9,
    decimalDivisor: false,
  },
  sredni: {
    max: 100,
    count: 2,
    minusCount: 0,
    placesChoices: [1, 2],
    quotientPlaces: 2,
    divisorMax: 12,
    decimalDivisor: false,
  },
  trudny: {
    max: 100,
    count: 4,
    minusCount: 2,
    placesChoices: [2, 3],
    quotientPlaces: 2,
    divisorMax: 9,
    decimalDivisor: true,
  },
};

function decimalValue(rng, places, max) {
  const scale = 10 ** places;
  return rng.int(1, max * scale) / scale;
}

// Builds a chain like "12,5 + 3,75 - 0,2" mixing decimal-place counts, with
// the running total kept non-negative and rounded to avoid float noise.
function buildChain(rng, max, count, minusCount, placesChoices) {
  const firstPlaces = rng.pick(placesChoices);
  let total = decimalValue(rng, firstPlaces, max);
  const numbers = [total];
  const slots = Array.from({ length: count - 1 }, (_, i) => i);
  const minusSlots = new Set(rng.shuffle(slots).slice(0, minusCount));

  for (let i = 0; i < count - 1; i++) {
    const places = rng.pick(placesChoices);
    const scale = 10 ** places;
    const isMinus = minusSlots.has(i);
    let term;
    if (isMinus) {
      const maxUnits = Math.max(1, Math.min(max * scale, Math.floor(total * scale)));
      term = rng.int(1, maxUnits) / scale;
      total = Number((total - term).toFixed(3));
    } else {
      term = decimalValue(rng, places, max);
      total = Number((total + term).toFixed(3));
    }
    numbers.push(term);
  }

  return { numbers, minusSlots, total };
}

function dodawanie(difficulty, rng) {
  const { max, count, minusCount, placesChoices } = RANGES[difficulty];
  const { numbers, minusSlots, total } = buildChain(rng, max, count, minusCount, placesChoices);

  const parts = [formatNumber(numbers[0])];
  for (let i = 0; i < numbers.length - 1; i++) {
    parts.push(minusSlots.has(i) ? '-' : '+', formatNumber(numbers[i + 1]));
  }
  const expression = parts.join(' ');
  const correct = formatNumber(total);

  // Typowy błąd: źle wyrównany przecinek, zgubione przeniesienie/pożyczenie.
  const wrong = [
    formatNumber(Number((total * 10).toFixed(3))),
    formatNumber(Number((total + 0.1).toFixed(3))),
    formatNumber(Number((total - 1).toFixed(3))),
  ].filter((w) => !w.startsWith('-'));

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'ulamki_dziesietne_dodawanie',
    type: 'zamkniete',
    tresc: `Oblicz: ${expression}`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Wyrównujemy liczby według przecinka i wykonujemy działania kolejno, od lewej do prawej.\n` +
      `${expression} = ${correct}.`,
  };
}

function mnozenie(difficulty, rng) {
  const { placesChoices, max } = RANGES[difficulty];
  const a = decimalValue(rng, placesChoices[0], max);
  const b = rng.int(2, 12);
  const product = Number((a * b).toFixed(placesChoices[0]));

  return {
    id: 'ulamki_dziesietne_mnozenie',
    type: 'otwarte',
    tresc: `Oblicz: ${formatNumber(a)} · ${b}`,
    odpowiedz: formatNumber(product),
    rozwiazanie:
      `Mnożymy tak jak liczby naturalne, a następnie oddzielamy ${placesChoices[0]} ` +
      `miejsc po przecinku.\n` +
      `${formatNumber(a)} · ${b} = ${formatNumber(product)}.`,
  };
}

function dzielenie(difficulty, rng) {
  const { quotientPlaces, divisorMax, decimalDivisor } = RANGES[difficulty];
  const quotient = decimalValue(rng, quotientPlaces, 20);
  // A forced nonzero tenths digit keeps the trudny divisor a genuine decimal
  // (never one that happens to round to a whole number).
  const divisor = decimalDivisor
    ? rng.int(1, divisorMax) + rng.int(1, 9) / 10
    : rng.int(2, divisorMax);

  const qScale = 10 ** quotientPlaces;
  const dScale = decimalDivisor ? 10 : 1;
  const dividend = (Math.round(quotient * qScale) * Math.round(divisor * dScale)) / (qScale * dScale);
  const correct = formatNumber(quotient);

  return {
    id: 'ulamki_dziesietne_dzielenie',
    type: 'otwarte',
    tresc: `Oblicz: ${formatNumber(dividend)} : ${formatNumber(divisor)}`,
    odpowiedz: correct,
    rozwiazanie: decimalDivisor
      ? `Aby podzielić przez ułamek dziesiętny, mnożymy dzielną i dzielnik przez 10, ` +
        `aby dzielnik stał się liczbą całkowitą.\n` +
        `${formatNumber(dividend)} : ${formatNumber(divisor)} = ` +
        `${formatNumber(Number((dividend * 10).toFixed(3)))} : ` +
        `${formatNumber(Number((divisor * 10).toFixed(3)))} = ${correct}.`
      : `Dzielimy: ${formatNumber(dividend)} : ${formatNumber(divisor)} = ${correct}.`,
  };
}

export const templates = [
  { id: 'ulamki_dziesietne_dodawanie', generate: dodawanie },
  { id: 'ulamki_dziesietne_mnozenie', generate: mnozenie },
  { id: 'ulamki_dziesietne_dzielenie', generate: dzielenie },
];
