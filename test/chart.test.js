import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chartSvg, CHART_SIZE, CHART_PADDING } from '../js/chart.js';

const LINIOWA = { rownanie: 'liniowa', a: 2, b: -4, xMin: -5, xMax: 5 };
const KWADRATOWA = { rownanie: 'kwadratowa', a: 1, b: 0, c: -4, xMin: -6, xMax: 6 };

function parseDataAttrs(svg) {
  const attrs = {};
  for (const m of svg.matchAll(/data-([a-z-]+)="(-?[\d.]+|liniowa|kwadratowa)"/g)) {
    attrs[m[1]] = m[2];
  }
  return attrs;
}

function pathPoints(svg) {
  const d = svg.match(/<path[^>]*class="krzywa"[^>]*d="([^"]+)"/)[1];
  return [...d.matchAll(/(-?[\d.]+) (-?[\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
}

// Converts an SVG pixel point back to function-space, independently of
// chart.js's own internal math, using only the geometry constants and the
// data attributes chart.js publishes.
function toFunctionSpace(attrs, px, py) {
  const xMin = Number(attrs['x-min']);
  const xMax = Number(attrs['x-max']);
  const yMin = Number(attrs['y-min']);
  const yMax = Number(attrs['y-max']);
  const plot = CHART_SIZE - CHART_PADDING * 2;
  const x = xMin + ((px - CHART_PADDING) / plot) * (xMax - xMin);
  const y = yMin + (1 - (py - CHART_PADDING) / plot) * (yMax - yMin);
  return { x, y };
}

test('chartSvg returns an svg with a curve path and matching data attributes', () => {
  const svg = chartSvg(LINIOWA);
  assert.match(svg, /<svg[^>]*class="wykres"/);
  assert.match(svg, /<path[^>]*class="krzywa"/);
  const attrs = parseDataAttrs(svg);
  assert.equal(attrs['rownanie'], 'liniowa');
  assert.equal(Number(attrs['a']), 2);
  assert.equal(Number(attrs['b']), -4);
  assert.equal(Number(attrs['x-min']), -5);
  assert.equal(Number(attrs['x-max']), 5);
});

test('sampled path points independently satisfy y = a*x + b for a linear function', () => {
  const svg = chartSvg(LINIOWA);
  const coords = pathPoints(svg);
  assert.ok(coords.length > 50, 'too few sampled points');
  const attrs = parseDataAttrs(svg);

  for (const [px, py] of [coords[0], coords[coords.length - 1]]) {
    const { x, y } = toFunctionSpace(attrs, px, py);
    assert.ok(
      Math.abs(y - (2 * x - 4)) < 0.05,
      `point (${x}, ${y}) does not satisfy y = 2x - 4`
    );
  }
});

test('sampled path points independently satisfy y = a*x^2 + b*x + c for a quadratic', () => {
  const svg = chartSvg(KWADRATOWA);
  const coords = pathPoints(svg);
  const attrs = parseDataAttrs(svg);

  let closest = coords[0];
  let closestDist = Infinity;
  for (const point of coords) {
    const { x } = toFunctionSpace(attrs, point[0], point[1]);
    if (Math.abs(x) < closestDist) {
      closestDist = Math.abs(x);
      closest = point;
    }
  }
  const { x, y } = toFunctionSpace(attrs, closest[0], closest[1]);
  assert.ok(Math.abs(y - (x * x - 4)) < 0.05, `near x=0 point does not satisfy y = x^2 - 4`);
});

test('the y-range always includes zero so the x-axis is visible', () => {
  const svg = chartSvg(KWADRATOWA);
  const attrs = parseDataAttrs(svg);
  assert.ok(Number(attrs['y-min']) <= 0 && Number(attrs['y-max']) >= 0);
});

test('grid steps are always 1, 2, or 5 times a power of ten', () => {
  const cases = [
    LINIOWA,
    KWADRATOWA,
    { rownanie: 'kwadratowa', a: 3, b: 12, c: 40, xMin: -10, xMax: 2 },
  ];
  for (const wykres of cases) {
    const svg = chartSvg(wykres);
    const attrs = parseDataAttrs(svg);
    for (const key of ['x-step', 'y-step']) {
      const step = Number(attrs[key]);
      const magnitude = 10 ** Math.floor(Math.log10(step));
      const normalized = Number((step / magnitude).toFixed(6));
      assert.ok([1, 2, 5].includes(normalized), `${key}=${step} is not a nice number`);
    }
  }
});

test('rejects a degenerate domain the same way callers should never produce', () => {
  assert.throws(() => chartSvg({ rownanie: 'liniowa', a: 1, b: 0, xMin: 5, xMax: 5 }));
});
