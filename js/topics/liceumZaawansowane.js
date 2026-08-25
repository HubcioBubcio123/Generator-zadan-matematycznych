// Ciągi, trygonometria, geometria analityczna i prawdopodobieństwo
// (liceum/technikum 2-4).
//
// Poziomy trudności:
//   łatwy   - małe wartości, n do 10, współrzędne do 6
//   średni  - n do 25, współrzędne do 12
//   trudny  - n do 60, współrzędne do 20, większe skalowania trójkątów;
//             trygonometria korzysta z kątów specjalnych (30/45/60 stopni)
//             zamiast trójek pitagorejskich; prawdopodobieństwo dotyczy
//             rzutu dwiema kostkami (36 wyników zamiast 6)

import { formatNumber, formatFraction } from '../format.js';
import { buildOptions } from '../distractors.js';

const TRIPLES = [
  [3, 4, 5],
  [5, 12, 13],
  [8, 15, 17],
  [7, 24, 25],
];

const RANGES = {
  latwy: { nMax: 10, coordMax: 6, scaleMax: 1, diffMax: 6 },
  sredni: { nMax: 25, coordMax: 12, scaleMax: 2, diffMax: 12 },
  trudny: { nMax: 60, coordMax: 20, scaleMax: 4, diffMax: 20 },
};

const SPECIAL_ANGLES = {
  30: { sin: 0.5, cos: Math.sqrt(3) / 2 },
  45: { sin: Math.SQRT1_2, cos: Math.SQRT1_2 },
  60: { sin: Math.sqrt(3) / 2, cos: 0.5 },
};

const TWO_DICE_EVENTS = [
  { opis: 'suma oczek wynosi 7', favourable: 6 },
  { opis: 'suma oczek jest parzysta', favourable: 18 },
  { opis: 'suma oczek jest większa od 9', favourable: 6 },
  { opis: 'na obu kostkach wypadnie ta sama liczba oczek', favourable: 6 },
  { opis: 'suma oczek jest mniejsza od 5', favourable: 6 },
];

function ciagArytmetyczny(difficulty, rng) {
  const { nMax, diffMax } = RANGES[difficulty];
  const a1 = rng.int(-diffMax, diffMax);
  const r = rng.int(1, diffMax) * (rng.bool() ? 1 : -1);
  const n = rng.int(3, nMax);
  const value = a1 + (n - 1) * r;
  const correct = formatNumber(value);

  // Typowy błąd: użycie n zamiast n-1 we wzorze.
  const wrong = [
    formatNumber(a1 + n * r),
    formatNumber(a1 + (n - 2) * r),
    formatNumber(a1 * n),
  ];
  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'ciag_arytmetyczny_wyraz',
    type: 'zamkniete',
    tresc:
      `W ciągu arytmetycznym pierwszy wyraz wynosi ${a1}, ` +
      `a różnica wynosi ${r}. Oblicz wyraz o numerze ${n}.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Korzystamy ze wzoru aₙ = a₁ + (n - 1) · r.\n` +
      `aₙ = ${a1} + (${n} - 1) · ${r} = ${a1} + ${(n - 1) * r} = ${correct}.`,
  };
}

function ciagSuma(difficulty, rng) {
  const { nMax, diffMax } = RANGES[difficulty];
  const a1 = rng.int(-diffMax, diffMax);
  const r = rng.int(1, diffMax) * (rng.bool() ? 1 : -1);
  const n = rng.int(3, nMax);
  const sum = (n / 2) * (2 * a1 + (n - 1) * r);
  const correct = formatNumber(sum);

  return {
    id: 'ciag_arytmetyczny_suma',
    type: 'otwarte',
    tresc:
      `W ciągu arytmetycznym pierwszy wyraz wynosi ${a1}, ` +
      `a różnica wynosi ${r}. Oblicz sumę pierwszych ${n} wyrazów tego ciągu.`,
    odpowiedz: correct,
    rozwiazanie:
      `Korzystamy ze wzoru Sₙ = (n : 2) · (2a₁ + (n - 1) · r).\n` +
      `S${n} = (${n} : 2) · (2 · ${a1} + (${n} - 1) · ${r}) = ` +
      `${formatNumber(n / 2)} · ${2 * a1 + (n - 1) * r} = ${correct}.`,
  };
}

function trygonometriaSpecjalna(rng) {
  const angle = rng.pick([30, 45, 60]);
  const hypotenuse = rng.int(2, 10) * 2;
  const wantOpposite = rng.bool();
  const ratio = wantOpposite ? SPECIAL_ANGLES[angle].sin : SPECIAL_ANGLES[angle].cos;
  const roundedRatio = Number(ratio.toFixed(4));
  const side = Number((hypotenuse * ratio).toFixed(4));
  const label = wantOpposite ? 'leżącej naprzeciw kąta α' : 'przyległej do kąta α';
  const trigName = wantOpposite ? 'sinusa' : 'kosinusa';
  const trigSymbol = wantOpposite ? 'sin' : 'cos';

  return {
    id: 'trygonometria_trojkat_prostokatny',
    type: 'otwarte',
    tresc:
      `W trójkącie prostokątnym kąt ostry α ma miarę ${angle}°, ` +
      `a przeciwprostokątna ma długość ${hypotenuse} cm. ` +
      `Oblicz długość przyprostokątnej ${label}.`,
    odpowiedz: `${formatNumber(side)} cm`,
    rozwiazanie:
      `Korzystamy z wartości ${trigName} kąta ${angle}°: ${trigSymbol} ${angle}° = ${formatNumber(roundedRatio)}.\n` +
      `Szukana przyprostokątna = ${hypotenuse} · ${formatNumber(roundedRatio)} = ${formatNumber(side)} cm.`,
  };
}

function trygonometria(difficulty, rng) {
  if (difficulty === 'trudny') return trygonometriaSpecjalna(rng);

  const { scaleMax } = RANGES[difficulty];
  const [a0, , c0] = rng.pick(TRIPLES);
  const scale = rng.int(1, scaleMax);
  const opposite = a0 * scale;
  const hypotenuse = c0 * scale;
  const sine = opposite / hypotenuse;

  return {
    id: 'trygonometria_trojkat_prostokatny',
    type: 'otwarte',
    tresc:
      `W trójkącie prostokątnym przyprostokątna leżąca naprzeciw kąta ostrego ` +
      `α ma długość ${opposite} cm, a przeciwprostokątna ma długość ` +
      `${hypotenuse} cm. Oblicz sin α.`,
    odpowiedz: formatNumber(Number(sine.toFixed(4))),
    rozwiazanie:
      `Sinus kąta ostrego to stosunek przyprostokątnej leżącej naprzeciw tego ` +
      `kąta do przeciwprostokątnej.\n` +
      `sin α = ${opposite} : ${hypotenuse} = ` +
      `${formatNumber(Number(sine.toFixed(4)))}.`,
  };
}

function odleglosc(difficulty, rng) {
  const { coordMax, scaleMax } = RANGES[difficulty];
  // Offsets come from a Pythagorean triple so the distance is a whole number.
  const [dx0, dy0, d0] = rng.pick(TRIPLES);
  const scale = rng.int(1, scaleMax);
  const x1 = rng.int(-coordMax, coordMax);
  const y1 = rng.int(-coordMax, coordMax);
  const x2 = x1 + dx0 * scale * (rng.bool() ? 1 : -1);
  const y2 = y1 + dy0 * scale * (rng.bool() ? 1 : -1);
  const distance = d0 * scale;

  return {
    id: 'geometria_analityczna_odleglosc',
    type: 'otwarte',
    tresc:
      `Dane są punkty A = (${x1}, ${y1}) oraz B = (${x2}, ${y2}). ` +
      `Oblicz odległość między tymi punktami.`,
    odpowiedz: formatNumber(distance),
    rozwiazanie:
      `Korzystamy ze wzoru |AB| = pierwiastek z ((x₂ - x₁)² + (y₂ - y₁)²).\n` +
      `x₂ - x₁ = ${x2 - x1}, y₂ - y₁ = ${y2 - y1}.\n` +
      `|AB| = pierwiastek z (${(x2 - x1) ** 2} + ${(y2 - y1) ** 2}) = ` +
      `pierwiastek z ${distance * distance} = ${distance}.`,
  };
}

function prawdopodobienstwoJednaKostka(rng) {
  const events = [
    { opis: 'wypadnie liczba parzysta', favourable: 3 },
    { opis: 'wypadnie liczba większa od 4', favourable: 2 },
    { opis: 'wypadnie liczba pierwsza', favourable: 3 },
    { opis: 'wypadnie liczba podzielna przez 3', favourable: 2 },
    { opis: 'wypadnie liczba mniejsza od 6', favourable: 5 },
  ];
  const event = rng.pick(events);
  const correct = formatFraction(event.favourable, 6);

  return {
    id: 'prawdopodobienstwo_kostka',
    type: 'otwarte',
    tresc:
      `Rzucamy jeden raz sześcienną kostką do gry. ` +
      `Oblicz prawdopodobieństwo zdarzenia: ${event.opis}.`,
    odpowiedz: correct,
    rozwiazanie:
      `Wszystkich możliwych wyników jest 6.\n` +
      `Zdarzeniu sprzyja ${event.favourable} wyników.\n` +
      `P = ${event.favourable}/6 = ${correct}.`,
  };
}

function prawdopodobienstwoDwieKostki(rng) {
  const event = rng.pick(TWO_DICE_EVENTS);
  const correct = formatFraction(event.favourable, 36);

  return {
    id: 'prawdopodobienstwo_kostka',
    type: 'otwarte',
    tresc:
      `Rzucamy dwiema sześciennymi kostkami do gry. ` +
      `Oblicz prawdopodobieństwo zdarzenia: ${event.opis}.`,
    odpowiedz: correct,
    rozwiazanie:
      `Wszystkich możliwych wyników jest 6 · 6 = 36.\n` +
      `Zdarzeniu sprzyja ${event.favourable} wyników.\n` +
      `P = ${event.favourable}/36 = ${correct}.`,
  };
}

function prawdopodobienstwo(difficulty, rng) {
  return difficulty === 'trudny'
    ? prawdopodobienstwoDwieKostki(rng)
    : prawdopodobienstwoJednaKostka(rng);
}

export const templates = [
  { id: 'ciag_arytmetyczny_wyraz', generate: ciagArytmetyczny },
  { id: 'ciag_arytmetyczny_suma', generate: ciagSuma },
  { id: 'trygonometria_trojkat_prostokatny', generate: trygonometria },
  { id: 'geometria_analityczna_odleglosc', generate: odleglosc },
  { id: 'prawdopodobienstwo_kostka', generate: prawdopodobienstwo },
];
