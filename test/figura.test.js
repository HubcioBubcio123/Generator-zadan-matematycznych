import { test } from 'node:test';
import assert from 'node:assert/strict';
import { figuraSvg } from '../js/figura.js';

test('trojkat: emits an svg containing the side-length label', () => {
  const svg = figuraSvg({ typ: 'trojkat', bok: 8 });
  assert.match(svg, /<svg class="figura"/);
  assert.match(svg, />8 cm</);
});

test('czworokat: labels all four vertices and marks the right angle', () => {
  const svg = figuraSvg({ typ: 'czworokat' });
  for (const label of ['α', 'β', 'γ', 'δ']) {
    assert.ok(svg.includes(`>${label}<`), `missing label ${label}`);
  }
  assert.match(svg, /znacznik-katu/);
});

test('mapa: labels both leg distances and includes a north marker', () => {
  const svg = figuraSvg({ typ: 'mapa', dx: 6, dy: 8 });
  assert.match(svg, />6 km</);
  assert.match(svg, />8 km</);
  assert.match(svg, /strzalka-polnoc/);
});

test('prostopadloscian: labels all three dimensions', () => {
  const svg = figuraSvg({ typ: 'prostopadloscian', a: 3, b: 4, c: 5 });
  assert.match(svg, />3 cm</);
  assert.match(svg, />4 cm</);
  assert.match(svg, />5 cm</);
});

test('numbers route through formatNumber (Polish decimal comma)', () => {
  const svg = figuraSvg({ typ: 'trojkat', bok: 2.5 });
  assert.match(svg, />2,5 cm</);
  assert.ok(!svg.includes('2.5'), 'raw decimal point leaked into the SVG');
});

test('rejects an unknown typ', () => {
  assert.throws(() => figuraSvg({ typ: 'kolo' }), /Nieznany typ/);
});
