// Renders task objects to markup. Knows only the task contract, never which
// topic produced a task, so new topics need no change here.

import { chartSvg } from './chart.js';
import { figuraSvg } from './figura.js';

const LITERY = ['A', 'B', 'C', 'D'];

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function optionsHtml(task) {
  if (task.type !== 'zamkniete') return '';
  const items = task.odpowiedzi
    .map((opt, i) => `<li>${LITERY[i]}. ${escapeHtml(opt)}</li>`)
    .join('');
  return `<ul class="opcje">${items}</ul>`;
}

function answerLabel(task) {
  if (task.type === 'zamkniete') {
    return `${LITERY[task.poprawna]}. ${escapeHtml(task.odpowiedz)}`;
  }
  return escapeHtml(task.odpowiedz);
}

function wykresHtml(task) {
  if (!task.wykres) return '';
  const akcje =
    '<div class="wykres-akcje">' +
    '<button type="button" class="wykres-wyczysc">Wyczyść rysunek</button>' +
    '<button type="button" class="wykres-powieksz">Powiększ</button>' +
    '</div>';
  return `<div class="wykres-kontener">${akcje}${chartSvg(task.wykres)}</div>`;
}

function figuraHtml(task) {
  if (!task.figura) return '';
  return `<div class="figura-kontener">${figuraSvg(task.figura)}</div>`;
}

function zadanieNaglowekHtml(index) {
  return (
    '<div class="zadanie-naglowek">' +
    `<p class="zadanie-numer">Zadanie ${index + 1}.</p>` +
    '<div class="zadanie-akcje">' +
    `<button type="button" class="zadanie-losuj-liczby" data-index="${index}">Losuj nowe liczby</button>` +
    `<button type="button" class="zadanie-losuj-typ" data-index="${index}">Losuj inny typ zadania</button>` +
    '</div>' +
    '</div>'
  );
}

// The answer block is nested inside the task's own <li> so revealing it never
// makes the student scroll away from the question.
export function taskToHtml(task, index) {
  return [
    '<li class="zadanie">',
    zadanieNaglowekHtml(index),
    `<p class="zadanie-tresc">${escapeHtml(task.tresc)}</p>`,
    figuraHtml(task),
    wykresHtml(task),
    optionsHtml(task),
    '<div class="odpowiedz-blok" hidden>',
    `<p><strong>Odpowiedź:</strong> ${answerLabel(task)}</p>`,
    `<p class="rozwiazanie">${escapeHtml(task.rozwiazanie)}</p>`,
    '</div>',
    '</li>',
  ].join('');
}

export function sheetToHtml(tasks) {
  return tasks.map((task, i) => taskToHtml(task, i)).join('');
}
