import { test } from 'node:test';
import assert from 'node:assert/strict';
import { taskToHtml, sheetToHtml } from '../js/render.js';

const openTask = {
  id: 'test_open',
  type: 'otwarte',
  tresc: 'Oblicz 2 + 2.',
  odpowiedz: '4',
  rozwiazanie: 'Dodajemy: 2 + 2 = 4.',
};

const closedTask = {
  id: 'test_closed',
  type: 'zamkniete',
  tresc: 'Oblicz 2 + 2.',
  odpowiedzi: ['3', '4', '5', '6'],
  poprawna: 1,
  odpowiedz: '4',
  rozwiazanie: 'Dodajemy: 2 + 2 = 4.',
};

test('renders the task number in Polish', () => {
  assert.match(taskToHtml(openTask, 0), /Zadanie 1\./);
  assert.match(taskToHtml(openTask, 5), /Zadanie 6\./);
});

test('renders the question text', () => {
  assert.match(taskToHtml(openTask, 0), /Oblicz 2 \+ 2\./);
});

test('renders lettered options for closed tasks only', () => {
  const closed = taskToHtml(closedTask, 0);
  assert.match(closed, /A\./);
  assert.match(closed, /B\./);
  assert.match(closed, /C\./);
  assert.match(closed, /D\./);
  assert.ok(!taskToHtml(openTask, 0).includes('A.'));
});

test('the answer block is emitted inside the same task element, hidden', () => {
  const html = taskToHtml(openTask, 0);
  const blockIndex = html.indexOf('odpowiedz-blok');
  const closeIndex = html.lastIndexOf('</li>');
  assert.ok(blockIndex > -1, 'no answer block emitted');
  assert.ok(blockIndex < closeIndex, 'answer block escaped its task element');
  assert.match(html, /hidden/);
});

test('the answer block carries both the answer and the solution', () => {
  const html = taskToHtml(openTask, 0);
  assert.match(html, /Odpowiedź/);
  assert.match(html, /Dodajemy: 2 \+ 2 = 4\./);
});

test('closed tasks show the answer with its option letter', () => {
  assert.match(taskToHtml(closedTask, 0), /B\. 4/);
});

test('escapes HTML so task text cannot inject markup', () => {
  const nasty = { ...openTask, tresc: 'Oblicz <b>2</b> & 3.' };
  const html = taskToHtml(nasty, 0);
  assert.ok(!html.includes('<b>'), 'raw tag survived');
  assert.match(html, /&lt;b&gt;/);
  assert.match(html, /&amp;/);
});

test('sheetToHtml renders every task once, in order', () => {
  const html = sheetToHtml([openTask, closedTask, openTask]);
  assert.equal((html.match(/class="zadanie"/g) ?? []).length, 3);
  assert.ok(html.indexOf('Zadanie 1.') < html.indexOf('Zadanie 2.'));
  assert.ok(html.indexOf('Zadanie 2.') < html.indexOf('Zadanie 3.'));
});

test('every task element contains exactly one answer block', () => {
  const html = sheetToHtml([openTask, closedTask]);
  assert.equal((html.match(/odpowiedz-blok/g) ?? []).length, 2);
});

const taskWithChart = {
  id: 'test_chart',
  type: 'otwarte',
  tresc: 'Odczytaj z wykresu.',
  wykres: { rownanie: 'liniowa', a: 1, b: -2, xMin: -5, xMax: 5 },
  odpowiedz: 'x = 2',
  rozwiazanie: 'Wykres przecina os OX w punkcie x = 2.',
};

test('embeds the chart svg, unescaped, when a task has a wykres field', () => {
  const html = taskToHtml(taskWithChart, 0);
  assert.match(html, /<div class="wykres-kontener">/);
  assert.match(html, /<svg class="wykres"/);
  assert.ok(!html.includes('&lt;svg'), 'svg markup was escaped');
});

test('omits the chart container when a task has no wykres field', () => {
  const html = taskToHtml(openTask, 0);
  assert.ok(!html.includes('wykres-kontener'));
});

test('emits a clear-drawing button and an enlarge-toggle button alongside the chart', () => {
  const html = taskToHtml(taskWithChart, 0);
  assert.match(html, /<div class="wykres-akcje">/);
  assert.match(html, /<button type="button" class="wykres-wyczysc">Wyczyść rysunek<\/button>/);
  assert.match(html, /<button type="button" class="wykres-powieksz">Powiększ<\/button>/);
});
