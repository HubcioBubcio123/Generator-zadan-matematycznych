// Contract enforcement for task objects. Every topic test runs its output
// through assertValidTask so a malformed task fails loudly in tests, not in
// the browser.

const BAD_TOKENS = ['NaN', 'undefined', 'Infinity', 'null'];

// A period between two digits is a decimal point; a period ending a sentence
// is fine.
const DECIMAL_PERIOD = /\d\.\d/;

function checkText(value, field) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Pole ${field} musi byc niepustym tekstem.`);
  }
  for (const token of BAD_TOKENS) {
    if (value.includes(token)) {
      throw new Error(`Pole ${field} zawiera ${token}: "${value}"`);
    }
  }
  if (DECIMAL_PERIOD.test(value)) {
    throw new Error(`Pole ${field} zawiera kropke dziesietna zamiast przecinka: "${value}"`);
  }
}

export function assertValidTask(task) {
  if (!task || typeof task !== 'object') {
    throw new Error('Zadanie musi byc obiektem.');
  }
  if (typeof task.id !== 'string' || task.id.length === 0) {
    throw new Error('Zadanie musi miec niepuste pole id.');
  }
  if (task.type !== 'zamkniete' && task.type !== 'otwarte') {
    throw new Error(`Nieznany type: ${task.type}`);
  }

  checkText(task.tresc, 'tresc');
  checkText(task.odpowiedz, 'odpowiedz');
  checkText(task.rozwiazanie, 'rozwiazanie');

  if (task.type === 'otwarte') {
    if ('odpowiedzi' in task || 'poprawna' in task) {
      throw new Error('Zadanie otwarte nie moze miec pol odpowiedzi ani poprawna.');
    }
    return;
  }

  if (!Array.isArray(task.odpowiedzi) || task.odpowiedzi.length !== 4) {
    throw new Error('Zadanie zamkniete musi miec cztery odpowiedzi.');
  }
  task.odpowiedzi.forEach((opt, i) => checkText(opt, `odpowiedzi[${i}]`));

  if (new Set(task.odpowiedzi).size !== 4) {
    throw new Error(`Odpowiedzi nie moga sie powtarzaj: ${task.odpowiedzi.join(', ')}`);
  }
  if (!Number.isInteger(task.poprawna) || task.poprawna < 0 || task.poprawna > 3) {
    throw new Error(`Pole poprawna musi byc indeksem 0-3, otrzymano ${task.poprawna}`);
  }
  if (task.odpowiedzi[task.poprawna] !== task.odpowiedz) {
    throw new Error(
      `odpowiedzi[poprawna] = "${task.odpowiedzi[task.poprawna]}" != odpowiedz "${task.odpowiedz}"`
    );
  }
}
