import { GRADES, getTopicsForGrade } from './topicRegistry.js';
import { EXAM_MODES } from './examModes.js';
import {
  generateSheet,
  clampCount,
  rerollTaskNumbers,
  rerollTaskType,
} from './sheetGenerator.js';
import { sheetToHtml, taskToHtml } from './render.js';
import { loadPreferences, savePreferences } from './storage.js';
import { initCharts } from './chartInteraction.js';

const el = (id) => document.getElementById(id);

const ekranMenu = el('ekran-menu');
const ekranArkusz = el('ekran-arkusz');
const formularz = el('formularz');
const wyborEtapu = el('wybor-etapu');
const wyborKlasy = el('wybor-klasy');
const wyborDzialu = el('wybor-dzialu');
const wyborEgzaminu = el('wybor-egzaminu');
const grupaCwiczenia = el('grupa-cwiczenia');
const grupaEgzamin = el('grupa-egzamin');
const liczbaZadan = el('liczba-zadan');
const komunikat = el('komunikat-bledu');
const listaZadan = el('lista-zadan');
const naglowekArkusza = el('naglowek-arkusza');
const przyciskOdpowiedzi = el('pokaz-odpowiedzi');

const ETYKIETY_TRUDNOSCI = {
  latwy: 'poziom łatwy',
  sredni: 'poziom średni',
  trudny: 'poziom trudny',
};

let ostatnieUstawienia = null;
let odpowiedziWidoczne = false;
let aktualneZadania = [];

function selectedRadio(name) {
  return formularz.querySelector(`input[name="${name}"]:checked`)?.value;
}

function fillSelect(select, items) {
  select.innerHTML = items
    .map((i) => `<option value="${i.value}">${i.label}</option>`)
    .join('');
}

function refreshKlasy() {
  const etap = wyborEtapu.value;
  const grades = GRADES.filter((g) => g.etap === etap);
  fillSelect(
    wyborKlasy,
    grades.map((g) => ({ value: g.key, label: g.label }))
  );
  refreshDzialy();
}

function refreshDzialy() {
  const topics = getTopicsForGrade(wyborKlasy.value);
  fillSelect(wyborDzialu, [
    { value: '', label: 'Wszystkie działy' },
    ...topics.map((t) => ({ value: t.key, label: t.label })),
  ]);
}

function refreshTryb() {
  const egzamin = selectedRadio('tryb') === 'egzamin';
  grupaCwiczenia.hidden = egzamin;
  grupaEgzamin.hidden = !egzamin;
}

function showError(message) {
  komunikat.textContent = message;
  komunikat.hidden = false;
}

function clearError() {
  komunikat.hidden = true;
  komunikat.textContent = '';
}

function sheetHeading(options) {
  const zakres =
    options.mode === 'egzamin'
      ? EXAM_MODES.find((m) => m.key === options.examKey)?.label
      : GRADES.find((g) => g.key === options.gradeKey)?.label;
  const liczba = options.count === 1 ? '1 zadanie' : `${options.count} zadań`;
  return `Arkusz: ${zakres} · ${ETYKIETY_TRUDNOSCI[options.difficulty]} · ${liczba}`;
}

// Shared by the whole-sheet toggle and a single rerolled task, so a
// freshly-swapped-in task always matches whatever the rest of the sheet is
// currently showing.
function applyAnswerVisibility(scope, visible) {
  for (const block of scope.querySelectorAll('.odpowiedz-blok')) {
    block.hidden = !visible;
  }
  for (const curve of scope.querySelectorAll('.wykres .krzywa')) {
    if (visible) curve.removeAttribute('hidden');
    else curve.setAttribute('hidden', '');
  }
}

function setAnswersVisible(visible) {
  odpowiedziWidoczne = visible;
  applyAnswerVisibility(listaZadan, visible);
  przyciskOdpowiedzi.textContent = visible
    ? 'Ukryj odpowiedzi'
    : 'Pokaż odpowiedzi';
}

function readOptions() {
  const mode = selectedRadio('tryb');
  return {
    mode,
    gradeKey: wyborKlasy.value,
    topicKey: wyborDzialu.value || null,
    examKey: wyborEgzaminu.value,
    difficulty: selectedRadio('trudnosc'),
    count: clampCount(liczbaZadan.value),
  };
}

function renderSheet(options) {
  let tasks;
  try {
    tasks = generateSheet(options);
  } catch (error) {
    showError(error.message);
    return;
  }
  if (tasks.length === 0) {
    showError('Brak zadan dla wybranej kombinacji.');
    return;
  }

  clearError();
  ostatnieUstawienia = options;
  aktualneZadania = tasks;
  listaZadan.innerHTML = sheetToHtml(tasks);
  initCharts(listaZadan);
  naglowekArkusza.textContent = sheetHeading({ ...options, count: tasks.length });
  setAnswersVisible(false);
  ekranMenu.hidden = true;
  ekranArkusz.hidden = false;
  ekranArkusz.scrollIntoView({ block: 'start' });
}

function rerollTaskAt(index, kind) {
  if (!ostatnieUstawienia || !aktualneZadania[index]) return;
  const rerollFn = kind === 'typ' ? rerollTaskType : rerollTaskNumbers;
  const nowyZadanie = rerollFn(ostatnieUstawienia, aktualneZadania, index);
  aktualneZadania[index] = nowyZadanie;
  listaZadan.children[index].outerHTML = taskToHtml(nowyZadanie, index);
  const nowyLi = listaZadan.children[index];
  applyAnswerVisibility(nowyLi, odpowiedziWidoczne);
  initCharts(nowyLi);
}

function restorePreferences() {
  const prefs = loadPreferences();
  if (!prefs) return;
  const trybInput = formularz.querySelector(
    `input[name="tryb"][value="${prefs.tryb}"]`
  );
  if (trybInput) trybInput.checked = true;
  if (prefs.etap) wyborEtapu.value = prefs.etap;
  refreshKlasy();
  if (prefs.klasa) {
    wyborKlasy.value = prefs.klasa;
    refreshDzialy();
  }
  if (prefs.dzial !== undefined) wyborDzialu.value = prefs.dzial;
  if (prefs.egzamin) wyborEgzaminu.value = prefs.egzamin;
  const trudnoscInput = formularz.querySelector(
    `input[name="trudnosc"][value="${prefs.trudnosc}"]`
  );
  if (trudnoscInput) trudnoscInput.checked = true;
  if (prefs.liczba) liczbaZadan.value = clampCount(prefs.liczba);
  refreshTryb();
}

function persist() {
  savePreferences({
    tryb: selectedRadio('tryb'),
    etap: wyborEtapu.value,
    klasa: wyborKlasy.value,
    dzial: wyborDzialu.value,
    egzamin: wyborEgzaminu.value,
    trudnosc: selectedRadio('trudnosc'),
    liczba: clampCount(liczbaZadan.value),
  });
}

function init() {
  fillSelect(
    wyborEgzaminu,
    EXAM_MODES.map((m) => ({ value: m.key, label: m.label }))
  );
  refreshKlasy();
  refreshTryb();
  restorePreferences();

  wyborEtapu.addEventListener('change', refreshKlasy);
  wyborKlasy.addEventListener('change', refreshDzialy);
  for (const input of formularz.querySelectorAll('input[name="tryb"]')) {
    input.addEventListener('change', refreshTryb);
  }

  formularz.addEventListener('submit', (event) => {
    event.preventDefault();
    liczbaZadan.value = clampCount(liczbaZadan.value);
    persist();
    renderSheet(readOptions());
  });

  przyciskOdpowiedzi.addEventListener('click', () =>
    setAnswersVisible(!odpowiedziWidoczne)
  );

  listaZadan.addEventListener('click', (event) => {
    const button = event.target.closest(
      '.zadanie-losuj-liczby, .zadanie-losuj-typ'
    );
    if (!button) return;
    const kind = button.classList.contains('zadanie-losuj-typ')
      ? 'typ'
      : 'liczby';
    rerollTaskAt(Number(button.dataset.index), kind);
  });

  el('nowy-arkusz').addEventListener('click', () => {
    if (ostatnieUstawienia) renderSheet(ostatnieUstawienia);
  });

  el('drukuj').addEventListener('click', () => window.print());

  el('powrot').addEventListener('click', () => {
    ekranArkusz.hidden = true;
    ekranMenu.hidden = false;
    ekranMenu.scrollIntoView({ block: 'start' });
  });
}

init();
