// Pure SVG generator for linear/quadratic function graphs. No DOM access;
// takes numbers, returns a markup string. The interactivity layer
// (js/chartInteraction.js) reads the data-* attributes this module embeds
// on the root <svg> instead of re-deriving any of this geometry.

import { formatNumber } from './format.js';

export const CHART_SIZE = 300;
export const CHART_PADDING = 20;
const PLOT = CHART_SIZE - CHART_PADDING * 2;
const SAMPLE_COUNT = 100;
const TARGET_GRID_LINES = 8;

function evaluate(wykres, x) {
  const { rownanie, a, b, c } = wykres;
  return rownanie === 'kwadratowa' ? a * x * x + b * x + (c ?? 0) : a * x + b;
}

function samplePoints(wykres) {
  const { xMin, xMax } = wykres;
  const points = [];
  for (let i = 0; i <= SAMPLE_COUNT; i++) {
    const x = xMin + ((xMax - xMin) * i) / SAMPLE_COUNT;
    points.push({ x, y: evaluate(wykres, x) });
  }
  return points;
}

function computeYRange(points) {
  let yMin = Math.min(...points.map((p) => p.y));
  let yMax = Math.max(...points.map((p) => p.y));
  if (yMin === yMax) {
    yMin -= 1;
    yMax += 1;
  }
  const padding = (yMax - yMin) * 0.1;
  yMin -= padding;
  yMax += padding;
  if (yMin > 0) yMin = 0;
  if (yMax < 0) yMax = 0;
  return { yMin, yMax };
}

// Picks a "nice" step (1, 2, or 5 times a power of ten) so a grid stays
// legible no matter how wide or narrow the computed range turns out to be.
function niceStep(span, targetCount) {
  const rough = span / targetCount;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const normalized = rough / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

function gridLines(min, max, step) {
  const lines = [];
  const start = Math.ceil(min / step) * step;
  for (let v = start; v <= max + 1e-9; v += step) {
    lines.push(Number(v.toFixed(6)));
  }
  return lines;
}

export function chartSvg(wykres) {
  const { rownanie, a, b, c, xMin, xMax } = wykres;
  if (!(xMin < xMax)) {
    throw new Error('wykres.xMin musi byc mniejsze od wykres.xMax.');
  }

  const points = samplePoints(wykres);
  const { yMin, yMax } = computeYRange(points);
  const xStep = niceStep(xMax - xMin, TARGET_GRID_LINES);
  const yStep = niceStep(yMax - yMin, TARGET_GRID_LINES);

  const px = (x) => CHART_PADDING + ((x - xMin) / (xMax - xMin)) * PLOT;
  const py = (y) => CHART_PADDING + (1 - (y - yMin) / (yMax - yMin)) * PLOT;

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${px(p.x).toFixed(2)} ${py(p.y).toFixed(2)}`)
    .join(' ');

  const xGridLines = gridLines(xMin, xMax, xStep)
    .map(
      (x) =>
        `<line class="siatka" x1="${px(x).toFixed(2)}" y1="${CHART_PADDING}" x2="${px(x).toFixed(2)}" y2="${CHART_SIZE - CHART_PADDING}" />`
    )
    .join('');
  const yGridLines = gridLines(yMin, yMax, yStep)
    .map(
      (y) =>
        `<line class="siatka" x1="${CHART_PADDING}" y1="${py(y).toFixed(2)}" x2="${CHART_SIZE - CHART_PADDING}" y2="${py(y).toFixed(2)}" />`
    )
    .join('');

  const xAxisY = py(0);
  const yAxisX = px(0);

  const xTicks = gridLines(xMin, xMax, xStep)
    .filter((x) => x !== 0)
    .map(
      (x) =>
        `<text class="etykieta" x="${px(x).toFixed(2)}" y="${(xAxisY + 14).toFixed(2)}" text-anchor="middle">${formatNumber(x)}</text>`
    )
    .join('');
  const yTicks = gridLines(yMin, yMax, yStep)
    .filter((y) => y !== 0)
    .map(
      (y) =>
        `<text class="etykieta" x="${(yAxisX - 6).toFixed(2)}" y="${(py(y) + 4).toFixed(2)}" text-anchor="end">${formatNumber(y)}</text>`
    )
    .join('');

  return (
    `<svg class="wykres" viewBox="0 0 ${CHART_SIZE} ${CHART_SIZE}" xmlns="http://www.w3.org/2000/svg" ` +
    `data-rownanie="${rownanie}" data-a="${a}" data-b="${b}" data-c="${c ?? 0}" ` +
    `data-x-min="${xMin}" data-x-max="${xMax}" data-y-min="${yMin}" data-y-max="${yMax}" ` +
    `data-x-step="${xStep}" data-y-step="${yStep}">` +
    `<g class="siatka-warstwa">${xGridLines}${yGridLines}</g>` +
    `<line class="os" x1="${CHART_PADDING}" y1="${xAxisY.toFixed(2)}" x2="${CHART_SIZE - CHART_PADDING}" y2="${xAxisY.toFixed(2)}" />` +
    `<line class="os" x1="${yAxisX.toFixed(2)}" y1="${CHART_PADDING}" x2="${yAxisX.toFixed(2)}" y2="${CHART_SIZE - CHART_PADDING}" />` +
    `<g class="etykiety-warstwa">${xTicks}${yTicks}</g>` +
    `<path class="krzywa" d="${pathD}" fill="none" />` +
    `<rect class="nakladka" x="${CHART_PADDING}" y="${CHART_PADDING}" width="${PLOT}" height="${PLOT}" fill="transparent" />` +
    `<circle class="znacznik" r="4" cx="0" cy="0" hidden></circle>` +
    `<text class="etykieta-znacznika" x="0" y="0" hidden></text>` +
    `</svg>`
  );
}
