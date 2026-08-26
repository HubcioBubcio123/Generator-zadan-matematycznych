// Geometria płaska: pola i obwody figur (klasy 4-6).
//
// Poziomy trudności:
//   łatwy   - wymiary całkowite do 12
//   średni  - wymiary całkowite do 40
//   trudny  - wymiary z jednym miejscem po przecinku, do 40; figura złożona
//             wymaga odjęcia pola wyciętego prostokąta od pola dużego

import { formatNumber } from '../format.js';
import { buildOptions } from '../distractors.js';

const RANGES = {
  latwy: { max: 12, decimal: false },
  sredni: { max: 40, decimal: false },
  trudny: { max: 40, decimal: true },
};

const COMPOSITE_MAX = { latwy: 10, sredni: 20, trudny: 30 };

function dimension(rng, difficulty) {
  const { max, decimal } = RANGES[difficulty];
  return decimal ? rng.int(20, max * 10) / 10 : rng.int(2, max);
}

function poleProstokata(difficulty, rng) {
  const a = dimension(rng, difficulty);
  const b = dimension(rng, difficulty);
  const area = Number((a * b).toFixed(4));
  const correct = `${formatNumber(area)} cm²`;

  // Typowy błąd: policzony obwód zamiast pola.
  const wrong = [
    `${formatNumber(Number((2 * (a + b)).toFixed(4)))} cm²`,
    `${formatNumber(Number((a + b).toFixed(4)))} cm²`,
    `${formatNumber(Number((area / 2).toFixed(4)))} cm²`,
  ];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'geometria_pole_prostokata',
    type: 'zamkniete',
    tresc:
      `Prostokąt ma boki długości ${formatNumber(a)} cm i ${formatNumber(b)} cm. ` +
      `Oblicz jego pole.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Pole prostokąta to iloczyn długości jego boków: P = a · b.\n` +
      `P = ${formatNumber(a)} · ${formatNumber(b)} = ${formatNumber(area)} cm².`,
  };
}

function obwodProstokata(difficulty, rng) {
  const a = dimension(rng, difficulty);
  const b = dimension(rng, difficulty);
  const perimeter = Number((2 * (a + b)).toFixed(4));

  return {
    id: 'geometria_obwod_prostokata',
    type: 'otwarte',
    tresc:
      `Prostokąt ma boki długości ${formatNumber(a)} cm i ${formatNumber(b)} cm. ` +
      `Oblicz jego obwód.`,
    odpowiedz: `${formatNumber(perimeter)} cm`,
    rozwiazanie:
      `Obwód prostokąta to Ob = 2 · (a + b).\n` +
      `Ob = 2 · (${formatNumber(a)} + ${formatNumber(b)}) = ` +
      `${formatNumber(perimeter)} cm.`,
  };
}

function poleTrojkata(difficulty, rng) {
  const base = dimension(rng, difficulty);
  const height = dimension(rng, difficulty);
  const area = Number(((base * height) / 2).toFixed(4));

  return {
    id: 'geometria_pole_trojkata',
    type: 'otwarte',
    tresc:
      `Trójkąt ma podstawę długości ${formatNumber(base)} cm ` +
      `i wysokość ${formatNumber(height)} cm. Oblicz jego pole.`,
    odpowiedz: `${formatNumber(area)} cm²`,
    rozwiazanie:
      `Pole trójkąta to P = (a · h) : 2.\n` +
      `P = (${formatNumber(base)} · ${formatNumber(height)}) : 2 = ` +
      `${formatNumber(area)} cm².`,
  };
}

function poleTrapezu(difficulty, rng) {
  let a = dimension(rng, difficulty);
  let b = dimension(rng, difficulty);
  if (b > a) [a, b] = [b, a];
  const h = dimension(rng, difficulty);
  const area = Number((((a + b) / 2) * h).toFixed(4));
  const correct = `${formatNumber(area)} cm²`;

  // Typowe błędy: zapomniane dzielenie przez 2, pomnożenie wszystkich wymiarów.
  const wrong = [
    `${formatNumber(Number(((a + b) * h).toFixed(4)))} cm²`,
    `${formatNumber(Number((a * b * h).toFixed(4)))} cm²`,
    `${formatNumber(Number((area * 2).toFixed(4)))} cm²`,
  ];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'geometria_pole_trapezu',
    type: 'zamkniete',
    tresc:
      `Trapez ma podstawy długości ${formatNumber(a)} cm i ${formatNumber(b)} cm ` +
      `oraz wysokość ${formatNumber(h)} cm. Oblicz jego pole.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Pole trapezu to P = ((a + b) : 2) · h.\n` +
      `P = ((${formatNumber(a)} + ${formatNumber(b)}) : 2) · ${formatNumber(h)} = ${correct}.`,
  };
}

function figuraZlozona(difficulty, rng) {
  const max = COMPOSITE_MAX[difficulty];
  const W = rng.int(6, max);
  const H = rng.int(6, max);
  const w = rng.int(1, Math.max(1, Math.floor(W / 2)));
  const h = rng.int(1, Math.max(1, Math.floor(H / 2)));
  const bigArea = W * H;
  const cutArea = w * h;
  const area = bigArea - cutArea;
  const correct = `${formatNumber(area)} cm²`;

  // Typowe błędy: pominięcie odjęcia wyciętego fragmentu, dodanie zamiast odjęcia.
  const wrong = [
    `${formatNumber(bigArea)} cm²`,
    `${formatNumber(bigArea + cutArea)} cm²`,
    `${formatNumber(area + w + h)} cm²`,
  ];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'geometria_figura_zlozona',
    type: 'zamkniete',
    tresc:
      `Z prostokąta o wymiarach ${W} cm na ${H} cm wycięto w rogu mniejszy ` +
      `prostokąt o wymiarach ${w} cm na ${h} cm. Oblicz pole pozostałej figury.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Pole dużego prostokąta: ${W} · ${H} = ${bigArea} cm².\n` +
      `Pole wyciętego prostokąta: ${w} · ${h} = ${cutArea} cm².\n` +
      `Pole figury złożonej: ${bigArea} - ${cutArea} = ${area} cm².`,
  };
}

const TROJKAT_RB_RANGES = {
  latwy: { kMax: 5 },
  sredni: { kMax: 8 },
  trudny: { kMax: 12 },
};

function trojkatRownobocznyPrawdaFalsz(difficulty, rng) {
  const { kMax } = TROJKAT_RB_RANGES[difficulty];
  const k = rng.int(1, kMax);
  const s = 2 * k;

  const trueHeightText = k === 1 ? '√3 cm' : `${k}√3 cm`;
  const trueAreaText = `${k * k}√3 cm²`;
  const wrongHeightText = `${s}√3 cm`; // pominięte dzielenie przez 2
  const wrongAreaText = `${2 * k * k}√3 cm²`; // pominięte dzielenie przez 2

  const claim1True = rng.bool();
  const claim2True = rng.bool();
  const claimHeightText = claim1True ? trueHeightText : wrongHeightText;
  const claimAreaText = claim2True ? trueAreaText : wrongAreaText;

  return {
    id: 'geometria_trojkat_rownoboczny_prawda_falsz',
    type: 'otwarte',
    figura: { typ: 'trojkat', bok: s },
    tresc:
      `Dany jest trójkąt równoboczny o boku długości ${s} cm.\n` +
      `1. Wysokość tego trójkąta jest równa ${claimHeightText}.\n` +
      `2. Pole tego trójkąta jest równe ${claimAreaText}.\n` +
      `Oceń prawdziwość obu zdań.`,
    odpowiedz: `1. ${claim1True ? 'Prawda' : 'Fałsz'}, 2. ${claim2True ? 'Prawda' : 'Fałsz'}`,
    rozwiazanie:
      `Wysokość trójkąta równobocznego dzieli go na dwa trójkąty prostokątne ` +
      `o przeciwprostokątnej ${s} cm i jednej przyprostokątnej ${k} cm.\n` +
      `Z twierdzenia Pitagorasa: h² = ${s}² - ${k}² = ${s * s} - ${k * k} = ${s * s - k * k}, ` +
      `więc h = ${trueHeightText}.\n` +
      `Pole: P = (${s} · ${trueHeightText}) : 2 = ${trueAreaText}.\n` +
      `Zdanie 1 jest ${claim1True ? 'prawdziwe' : 'fałszywe'}, ` +
      `zdanie 2 jest ${claim2True ? 'prawdziwe' : 'fałszywe'}.`,
  };
}

const CZWOROKAT_RANGES = {
  latwy: { betaMax: 40, k: 2 },
  sredni: { betaMax: 50, k: 2 },
  trudny: { betaMax: 50, k: 3 },
};

function czworokatKaty(difficulty, rng) {
  const { betaMax, k } = CZWOROKAT_RANGES[difficulty];
  // beta*(2+k) must stay at or below 269 so diff = alpha - beta comes out
  // strictly positive ("alpha bigger than beta" has to actually be true).
  const betaLimit = Math.min(betaMax, Math.floor(269 / (2 + k)));
  const beta = rng.int(10, betaLimit);
  const gamma = k * beta;
  const delta = 90;
  const alpha = 360 - beta - gamma - delta;
  const diff = alpha - beta;
  const mnoznik = k === 2 ? 'dwukrotnie' : 'trzykrotnie';

  const correct = `${alpha}°`;
  // Typowe błędy: podanie beta lub gamma zamiast alfa, zapomnienie o kącie prostym.
  const wrong = [`${beta}°`, `${gamma}°`, `${360 - beta - gamma}°`];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'geometria_czworokat_katy',
    type: 'zamkniete',
    figura: { typ: 'czworokat' },
    tresc:
      `Kąty wewnętrzne czworokąta ABCD oznaczono odpowiednio α, β, γ, δ. ` +
      `Miara kąta α jest o ${diff}° większa od miary kąta β, a miara kąta γ jest ` +
      `${mnoznik} większa od miary kąta β. Kąt δ jest kątem prostym. ` +
      `Oblicz miarę kąta α.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Suma kątów wewnętrznych czworokąta wynosi 360°.\n` +
      `β + γ + δ + α = 360°, gdzie γ = ${k} · β, δ = 90°, α = β + ${diff}°.\n` +
      `β + ${k}β + 90 + β + ${diff} = 360°, więc ${2 + k}β = ${270 - diff}, β = ${beta}°.\n` +
      `α = β + ${diff}° = ${beta}° + ${diff}° = ${correct}.`,
  };
}

export const templates = [
  { id: 'geometria_pole_prostokata', generate: poleProstokata },
  { id: 'geometria_obwod_prostokata', generate: obwodProstokata },
  { id: 'geometria_pole_trojkata', generate: poleTrojkata },
  { id: 'geometria_pole_trapezu', generate: poleTrapezu },
  { id: 'geometria_figura_zlozona', generate: figuraZlozona },
  { id: 'geometria_trojkat_rownoboczny_prawda_falsz', generate: trojkatRownobocznyPrawdaFalsz },
  { id: 'geometria_czworokat_katy', generate: czworokatKaty },
];
