// Arytmetyka — bank egzaminu ósmoklasisty. Exam-exclusive: this topic is
// registered in js/topicRegistry.js's TOPICS but deliberately listed under
// no grade's topicKeys, so it never appears in Ćwiczenia mode.
//
// Covers two things currently uncovered anywhere in the app:
//   - "Proporcjonalność prosta" (podstawa programowa, klasa 7): recognizing
//     and using directly-proportional quantities, including "podział
//     proporcjonalny" (splitting a total in a given ratio).
//   - Order-of-operations with signed integers combined with powers,
//     mirroring the real exam's own style of comparing/evaluating short
//     numeric expressions (e.g. its Zadanie 3/4).
//
// Poziomy trudności:
//   łatwy   - mniejsze wartości
//   średni  - większe wartości
//   trudny  - jeszcze większe wartości / szerszy zakres współczynników

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

function nwdNwwEgz(difficulty, rng) {
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
    id: 'liczby_naturalne_nwd_nww_egz',
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

function sumaKolejnychEgz(difficulty, rng) {
  const { nMax } = SUMA_KOLEJNYCH_RANGES[difficulty];
  const n = rng.int(5, nMax);
  const suma = (n * (n + 1)) / 2;

  return {
    id: 'liczby_naturalne_suma_kolejnych_egz',
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

const POROWNANIE_RANGES = {
  latwy: { max: 30 },
  sredni: { max: 60 },
  trudny: { max: 100 },
};

function porownanieWyrazen(difficulty, rng) {
  const { max } = POROWNANIE_RANGES[difficulty];
  const a = rng.int(10, max);
  const b = rng.int(1, Math.floor(max / 2));
  const c = rng.int(1, Math.floor(max / 2));
  const p = a - b - c;

  // A second, freshly sampled a-b-c triple that lands on the same value p —
  // this is the correct candidate, matching the real exam's "which of these
  // is equal to p" framing.
  const b2 = rng.int(1, Math.floor(max / 2));
  const c2 = rng.int(1, Math.floor(max / 2));
  const a2 = p + b2 + c2;
  const correct = `${a2} - ${b2} - ${c2}`;

  function freshWrong() {
    let x, y, z, val;
    do {
      x = rng.int(10, max);
      y = rng.int(1, Math.floor(max / 2));
      z = rng.int(1, Math.floor(max / 2));
      val = x - y - z;
    } while (val === p);
    return `${x} - ${y} - ${z}`;
  }

  // Typowe błędy: liczby dobrane tak, by wyrażenie dawało inną wartość niż p.
  const wrong = [freshWrong(), freshWrong(), freshWrong()];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'arytmetyka_porownanie_wyrazen_egz',
    type: 'zamkniete',
    tresc: `Liczba p jest równa ${a} - ${b} - ${c}. Która z podanych liczb jest równa p?`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `p = ${a} - ${b} - ${c} = ${p}.\n` +
      `Sprawdzamy: ${correct} = ${p}, więc ta liczba jest równa p.`,
  };
}

const POTEGA_ILOCZYN_RANGES = {
  latwy: { aMax: 4, expMax: 3 },
  sredni: { aMax: 6, expMax: 4 },
  trudny: { aMax: 8, expMax: 4 },
};

function potegaIloczyn(difficulty, rng) {
  const { aMax, expMax } = POTEGA_ILOCZYN_RANGES[difficulty];
  const a = rng.int(2, aMax);
  const m = rng.int(2, expMax);
  const n = rng.int(2, expMax);
  const correct = formatNumber(a ** (m + n));

  // Typowe błędy: pomnożenie wykładników zamiast dodania, dodanie samych
  // potęg zamiast zastosowania wzoru, podwojenie podstawy.
  const wrong = [
    formatNumber(a ** (m * n)),
    formatNumber(a ** m + a ** n),
    formatNumber((2 * a) ** (m + n)),
  ];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'arytmetyka_potega_iloczyn_egz',
    type: 'zamkniete',
    tresc: `Oblicz wartość wyrażenia: ${a}^${m} · ${a}^${n}.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Przy mnożeniu potęg o tej samej podstawie dodajemy wykładniki: ${a}^${m} · ${a}^${n} = ${a}^${m + n}.\n` +
      `${a}^${m + n} = ${correct}.`,
  };
}

const ZAOKRAGLANIE_RANGES = {
  latwy: { max: 999 },
  sredni: { max: 9999 },
  trudny: { max: 99999 },
};

function zaokraglanie(difficulty, rng) {
  const { max } = ZAOKRAGLANIE_RANGES[difficulty];
  const thousandths = rng.int(1, max);
  const value = (thousandths + 0.5) / 1000;
  const correct = formatNumber(Math.round(value * 100) / 100);

  // Typowe błędy: obcięcie zamiast zaokrąglenia, zaokrąglenie do dziesiątych
  // zamiast setnych, błąd o jeden na ostatniej cyfrze.
  const wrong = [
    formatNumber(Math.floor(value * 100) / 100),
    formatNumber(Math.round(value * 10) / 10),
    formatNumber(Math.round(value * 100) / 100 + 0.01),
  ];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'arytmetyka_zaokraglanie_egz',
    type: 'zamkniete',
    tresc: `Zaokrąglij liczbę ${formatNumber(value)} do części setnych (do dwóch miejsc po przecinku).`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Trzecia cyfra po przecinku decyduje o zaokrągleniu drugiej.\n` +
      `${formatNumber(value)} zaokrąglone do setnych daje ${correct}.`,
  };
}

const KOLEJNOSC_RANGES = {
  latwy: { max: 10 },
  sredni: { max: 15 },
  trudny: { max: 20 },
};

function kolejnoscDzialan(difficulty, rng) {
  const { max } = KOLEJNOSC_RANGES[difficulty];
  const a = rng.int(1, max);
  const b = rng.int(1, max);
  const c = rng.int(1, max);
  const d = rng.int(1, max);
  const correct = formatNumber(a + b * c - d);

  // Typowe błędy: wykonanie działań od lewej do prawej z pominięciem
  // kolejności działań, błędne pogrupowanie mnożenia, zły znak przy d.
  const wrong = [
    formatNumber((a + b) * c - d),
    formatNumber(a + b * (c - d)),
    formatNumber(a + b * c + d),
  ];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'arytmetyka_kolejnosc_dzialan_egz',
    type: 'zamkniete',
    tresc: `Oblicz wartość wyrażenia: ${a} + ${b} · ${c} - ${d}.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Najpierw mnożenie: ${b} · ${c} = ${b * c}.\n` +
      `Następnie dodawanie i odejmowanie od lewej: ${a} + ${b * c} - ${d} = ${correct}.`,
  };
}

// Every denominator below divides some power of 10, so m/n always
// terminates within formatNumber's 4 decimal places.
const ZAMIANA_DENOMINATORY = [2, 4, 5, 8, 10, 20, 25, 50];

function ulamekDziesietnyZamiana(difficulty, rng) {
  const n = rng.pick(ZAMIANA_DENOMINATORY);
  const m = rng.int(1, 2 * n);
  const value = m / n;
  const correct = formatNumber(value);

  // Typowe błędy: odwrócenie ułamka, przesunięcie przecinka o jedno miejsce
  // w złą stronę.
  const wrong = [formatNumber(n / m), formatNumber(value * 10), formatNumber(value / 10)];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'arytmetyka_ulamek_dziesietny_zamiana_egz',
    type: 'zamkniete',
    tresc: `Zamień ułamek ${m}/${n} na liczbę dziesiętną.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie: `Dzielimy licznik przez mianownik: ${m} : ${n} = ${correct}.`,
  };
}

const NAJWIEKSZA_RANGES = {
  latwy: { max: 20, decimals: false },
  sredni: { max: 50, decimals: true },
  trudny: { max: 100, decimals: true },
};

function najwiekszaNajmniejsza(difficulty, rng) {
  const { max, decimals } = NAJWIEKSZA_RANGES[difficulty];
  const values = new Set();
  while (values.size < 4) {
    const whole = rng.int(-max, max);
    const value = decimals ? whole + rng.pick([0, 0.5]) : whole;
    values.add(value);
  }
  const numbers = [...values];
  const correct = formatNumber(Math.max(...numbers));
  const wrong = numbers.filter((v) => v !== Math.max(...numbers)).map((v) => formatNumber(v));

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'arytmetyka_najwieksza_najmniejsza_egz',
    type: 'zamkniete',
    tresc: `Dane są liczby: ${numbers.map((v) => formatNumber(v)).join('; ')}. Wybierz największą z podanych liczb.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie: `Porównując podane liczby na osi liczbowej, największa z nich to ${correct}.`,
  };
}

const DZIELNIK_RANGES = {
  latwy: { primes: [2, 3, 5, 7] },
  sredni: { primes: [2, 3, 5, 7, 11, 13] },
  trudny: { primes: [2, 3, 5, 7, 11, 13, 17, 19] },
};

function dzielnikPierwszy(difficulty, rng) {
  const { primes } = DZIELNIK_RANGES[difficulty];
  let p, q, r;
  do {
    p = rng.pick(primes);
    q = rng.pick(primes);
  } while (p === q);
  do {
    r = rng.pick(primes);
  } while (r === p || r === q);
  const N = p * q;
  const correct = String(p);

  // Typowe błędy: podanie liczby N (złożonej), podanie jedynki (nie jest
  // liczbą pierwszą), podanie liczby pierwszej niebędącej dzielnikiem N.
  const wrong = [String(N), '1', String(r)];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'arytmetyka_dzielnik_pierwszy_egz',
    type: 'zamkniete',
    tresc: `Liczba N jest iloczynem dwóch liczb pierwszych: N = ${p} · ${q} = ${N}. Który z podanych dzielników liczby N jest liczbą pierwszą?`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Dzielnikami liczby N są: 1, ${p}, ${q}, ${N}.\n` +
      `Spośród podanych opcji liczbą pierwszą i jednocześnie dzielnikiem N jest ${correct}.`,
  };
}

const PROCENT_PROSTY_RANGES = {
  latwy: { yMax: 200, pSet: [10, 20, 50] },
  sredni: { yMax: 500, pSet: [10, 20, 25, 40, 50] },
  trudny: { yMax: 1000, pSet: [5, 10, 15, 20, 25, 40, 50, 75] },
};

function procentProsty(difficulty, rng) {
  const { yMax, pSet } = PROCENT_PROSTY_RANGES[difficulty];
  const p = rng.pick(pSet);
  const y = rng.int(2, Math.floor(yMax / 20)) * 20;
  const correct = formatNumber((p * y) / 100);

  // Typowe błędy: pomnożenie zamiast podzielenia przez 100, podzielenie
  // zamiast pomnożenia, przesunięcie przecinka o jedno miejsce.
  const wrong = [formatNumber(p * y), formatNumber(y / p), formatNumber((p * y) / 1000)];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'arytmetyka_procent_prosty_egz',
    type: 'zamkniete',
    tresc: `Oblicz ${p}% liczby ${y}.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie: `${p}% liczby ${y} to ${p}/100 · ${y} = ${correct}.`,
  };
}

const RESZTA_RANGES = {
  latwy: { dMax: 8, nMax: 60 },
  sredni: { dMax: 12, nMax: 150 },
  trudny: { dMax: 15, nMax: 300 },
};

function resztaZDzielenia(difficulty, rng) {
  const { dMax, nMax } = RESZTA_RANGES[difficulty];
  const d = rng.int(2, dMax);
  const n = rng.int(d + 1, nMax);
  const reszta = n % d;
  const iloraz = Math.floor(n / d);
  const correct = formatNumber(reszta);

  // Typowe błędy: podanie ilorazu zamiast reszty, odjęcie reszty od
  // dzielnika, użycie złego dzielnika.
  const wrong = [
    formatNumber(iloraz),
    formatNumber(d - reszta === d ? 0 : d - reszta),
    formatNumber(n % (d + 1)),
  ];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'arytmetyka_reszta_z_dzielenia_egz',
    type: 'zamkniete',
    tresc: `Oblicz resztę z dzielenia liczby ${n} przez ${d}.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `${n} : ${d} = ${iloraz} reszty ${reszta} (bo ${iloraz} · ${d} = ${iloraz * d}, a ${n} - ${iloraz * d} = ${reszta}).`,
  };
}

const PARZYSTOSC_RANGES = {
  latwy: { maxHalf: 5 },
  sredni: { maxHalf: 7 },
  trudny: { maxHalf: 10 },
};

function parzystoscKul(difficulty, rng) {
  const { maxHalf } = PARZYSTOSC_RANGES[difficulty];
  // N is always odd, so the odd-count and even-count of 1..N differ (by
  // exactly 1) and never collide — the "kept" count below always resolves
  // to a unique parity, avoiding the ambiguous case where both parities
  // would leave the same number of balls behind.
  const N = 2 * rng.int(3, maxHalf) + 1;
  const oddCount = (N + 1) / 2;
  const evenCount = (N - 1) / 2;
  const keepOdd = rng.bool();
  const kept = keepOdd ? oddCount : evenCount;
  const r = N - kept;
  let sum = 0;
  for (let k = 1; k <= N; k++) {
    if (k % 2 === 1 === keepOdd) sum += k;
  }
  const parityLabel = keepOdd ? 'nieparzystymi' : 'parzystymi';

  return {
    id: 'arytmetyka_parzystosc_kul_egz',
    type: 'otwarte',
    tresc:
      `W pudełku było ${N} kul ponumerowanych kolejnymi liczbami naturalnymi od 1 do ${N}. ` +
      `Z tego pudełka wylosowano ${r} kul. Suma liczb na dowolnych dwóch kulach, które ` +
      `pozostały w pudełku, jest parzysta. Podaj, jakimi liczbami (parzystymi czy ` +
      `nieparzystymi) są ponumerowane kule, które zostały w pudełku, oraz oblicz sumę ` +
      `liczb na tych kulach.`,
    odpowiedz: `Liczby ${parityLabel}, suma = ${formatNumber(sum)}`,
    rozwiazanie:
      `Suma dwóch liczb jest parzysta tylko wtedy, gdy obie są parzyste albo obie ` +
      `nieparzyste — gdyby wśród pozostałych kul była mieszanka obu parzystości, dałoby ` +
      `się znaleźć dwie kule o sumie nieparzystej. Zatem wszystkie pozostałe kule mają tę ` +
      `samą parzystość: ${parityLabel}.\n` +
      `Suma liczb ${parityLabel} od 1 do ${N}: ${formatNumber(sum)}.`,
  };
}

const PROPORCJA_RANGES = {
  latwy: { aMax: 6, xMax: 12 },
  sredni: { aMax: 10, xMax: 20 },
  trudny: { aMax: 15, xMax: 30 },
};

function proporcjaWartosc(difficulty, rng) {
  const { aMax, xMax } = PROPORCJA_RANGES[difficulty];
  const a = rng.int(2, aMax);
  const x1 = rng.int(2, xMax);
  let x2 = rng.int(2, xMax);
  while (x2 === x1) x2 = rng.int(2, xMax);
  const y1 = a * x1;
  const y2 = a * x2;

  return {
    id: 'arytmetyka_proporcja_wartosc_egz',
    type: 'otwarte',
    tresc:
      `Wielkości x i y są wprost proporcjonalne. Gdy x = ${x1}, to y = ${y1}. ` +
      `Oblicz wartość y, gdy x = ${x2}.`,
    odpowiedz: formatNumber(y2),
    rozwiazanie:
      `Współczynnik proporcjonalności: a = y : x = ${y1} : ${x1} = ${a}.\n` +
      `Dla x = ${x2}: y = a · x = ${a} · ${x2} = ${formatNumber(y2)}.`,
  };
}

const PROPORCJA_ZADANIE_RANGES = {
  latwy: { jednostkowaMax: 8, nMax: 10 },
  sredni: { jednostkowaMax: 15, nMax: 15 },
  trudny: { jednostkowaMax: 25, nMax: 20 },
};

// Polish noun/adjective/verb agreement for "zeszyt" (same pattern as
// osobaForma in statystykaEgzamin.js): 1 -> singular; 2-4 except teens ->
// nominative plural + plural verb; 5+ or teens -> genitive plural + verb
// treated as singular. n1/n2 here are always >= 2, but the n===1 branch is
// kept so the helper stays correct if the range ever changes.
function zeszytForma(n) {
  if (n === 1) {
    return { przymiotnik: 'identyczny', rzeczownik: 'zeszyt', takich: 'taki', czasownik: 'kosztuje' };
  }
  const lastDigit = n % 10;
  const lastTwo = n % 100;
  if (lastDigit >= 2 && lastDigit <= 4 && !(lastTwo >= 12 && lastTwo <= 14)) {
    return { przymiotnik: 'identyczne', rzeczownik: 'zeszyty', takich: 'takie', czasownik: 'kosztują' };
  }
  return { przymiotnik: 'identycznych', rzeczownik: 'zeszytów', takich: 'takich', czasownik: 'kosztuje' };
}

function proporcjaZadanie(difficulty, rng) {
  const { jednostkowaMax, nMax } = PROPORCJA_ZADANIE_RANGES[difficulty];
  const jednostkowa = rng.int(2, jednostkowaMax);
  const n1 = rng.int(2, nMax);
  let n2 = rng.int(2, nMax);
  while (n2 === n1) n2 = rng.int(2, nMax);
  const w1 = jednostkowa * n1;
  const w2 = jednostkowa * n2;
  const correct = `${formatNumber(w2)} zł`;
  const forma1 = zeszytForma(n1);
  const forma2 = zeszytForma(n2);

  // Typowe błędy: podanie ceny za n1 zamiast n2, dodanie zamiast pomnożenia,
  // dodanie ceny jednostkowej zamiast przeskalowania.
  const wrong = [
    `${formatNumber(w1)} zł`,
    `${formatNumber(jednostkowa * (n1 + n2))} zł`,
    `${formatNumber(w2 + jednostkowa)} zł`,
  ];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'arytmetyka_proporcja_zadanie_egz',
    type: 'zamkniete',
    tresc:
      `${n1} ${forma1.przymiotnik} ${forma1.rzeczownik} ${forma1.czasownik} łącznie ${formatNumber(w1)} zł. ` +
      `Ile ${forma2.czasownik} ${n2} ${forma2.takich} ${forma2.rzeczownik}?`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Cena jednego zeszytu: ${formatNumber(w1)} : ${n1} = ${formatNumber(jednostkowa)} zł.\n` +
      `Cena ${n2} zeszytów: ${formatNumber(jednostkowa)} · ${n2} = ${correct}.`,
  };
}

const PODZIAL_RANGES = {
  latwy: { jednostkaMax: 10, stosunekMax: 5 },
  sredni: { jednostkaMax: 20, stosunekMax: 8 },
  trudny: { jednostkaMax: 30, stosunekMax: 10 },
};

function podzialProporcjonalny(difficulty, rng) {
  const { jednostkaMax, stosunekMax } = PODZIAL_RANGES[difficulty];
  const a = rng.int(1, stosunekMax);
  let b = rng.int(1, stosunekMax);
  while (b === a) b = rng.int(1, stosunekMax);
  const jednostka = rng.int(2, jednostkaMax);
  const total = (a + b) * jednostka;
  const wieksza = Math.max(a, b) * jednostka;
  const mniejsza = Math.min(a, b) * jednostka;
  const correct = formatNumber(wieksza);

  // Typowe błędy: podanie mniejszej części, podanie całości, błędny
  // podział na pół zamiast w podanym stosunku.
  const wrong = [formatNumber(mniejsza), formatNumber(total), formatNumber(Math.round(total / 2))];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'arytmetyka_podzial_proporcjonalny_egz',
    type: 'zamkniete',
    tresc: `Podziel liczbę ${formatNumber(total)} na dwie części w stosunku ${a}:${b}. Oblicz większą z tych części.`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `Liczbę dzielimy na ${a + b} równych jednostek: ${formatNumber(total)} : ${a + b} = ${formatNumber(jednostka)}.\n` +
      `Większa część odpowiada ${Math.max(a, b)} jednostkom: ${Math.max(a, b)} · ${formatNumber(jednostka)} = ${correct}.`,
  };
}

const DZIALANIA_RANGES = {
  latwy: { max: 6 },
  sredni: { max: 9 },
  trudny: { max: 12 },
};

function dzialaniaCalkowite(difficulty, rng) {
  const { max } = DZIALANIA_RANGES[difficulty];
  const a = rng.int(2, Math.min(max, 10));
  const b = rng.int(2, max);
  const c = rng.int(2, max);
  const d = rng.int(2, max * 2);
  const wartosc = a * a + b * c - d;
  const correct = formatNumber(wartosc);

  // Typowe błędy: błędny znak przy kwadracie liczby ujemnej, błędny znak
  // przy mnożeniu dwóch liczb ujemnych, błędny znak przy dodaniu ujemnej.
  const wrong = [formatNumber(-(a * a) + b * c - d), formatNumber(a * a - b * c - d), formatNumber(a * a + b * c + d)];

  const { odpowiedzi, poprawna } = buildOptions(correct, wrong, rng);

  return {
    id: 'arytmetyka_dzialania_calkowite_egz',
    type: 'zamkniete',
    tresc: `Oblicz wartość wyrażenia: (-${a})² - ${b} · (-${c}) + (-${d}).`,
    odpowiedzi,
    poprawna,
    odpowiedz: correct,
    rozwiazanie:
      `(-${a})² = ${a * a} (kwadrat liczby ujemnej jest dodatni).\n` +
      `${b} · (-${c}) = ${-b * c}, więc odejmujemy ten wynik: -(${-b * c}) = ${b * c}.\n` +
      `Razem: ${a * a} + ${b * c} + (-${d}) = ${a * a} + ${b * c} - ${d} = ${correct}.`,
  };
}

export const templates = [
  { id: 'arytmetyka_proporcja_wartosc_egz', generate: proporcjaWartosc },
  { id: 'arytmetyka_proporcja_zadanie_egz', generate: proporcjaZadanie },
  { id: 'arytmetyka_podzial_proporcjonalny_egz', generate: podzialProporcjonalny },
  { id: 'arytmetyka_dzialania_calkowite_egz', generate: dzialaniaCalkowite },
  { id: 'liczby_naturalne_nwd_nww_egz', generate: nwdNwwEgz },
  { id: 'liczby_naturalne_suma_kolejnych_egz', generate: sumaKolejnychEgz },
  { id: 'arytmetyka_porownanie_wyrazen_egz', generate: porownanieWyrazen },
  { id: 'arytmetyka_potega_iloczyn_egz', generate: potegaIloczyn },
  { id: 'arytmetyka_zaokraglanie_egz', generate: zaokraglanie },
  { id: 'arytmetyka_kolejnosc_dzialan_egz', generate: kolejnoscDzialan },
  { id: 'arytmetyka_ulamek_dziesietny_zamiana_egz', generate: ulamekDziesietnyZamiana },
  { id: 'arytmetyka_najwieksza_najmniejsza_egz', generate: najwiekszaNajmniejsza },
  { id: 'arytmetyka_dzielnik_pierwszy_egz', generate: dzielnikPierwszy },
  { id: 'arytmetyka_procent_prosty_egz', generate: procentProsty },
  { id: 'arytmetyka_reszta_z_dzielenia_egz', generate: resztaZDzielenia },
  { id: 'arytmetyka_parzystosc_kul_egz', generate: parzystoscKul },
];
