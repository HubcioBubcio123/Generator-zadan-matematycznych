// DOM-only glue: reads the data-* attributes chart.js embeds on a chart's
// <svg> and drives the hover/drag marker via Pointer Events, so mouse hover
// and touch drag both work through the same code path. Not unit-tested —
// this project has no DOM test environment. Verified manually in the browser.

import { formatNumber } from './format.js';
import { CHART_SIZE, CHART_PADDING, TOOLTIP_LABEL_WIDTH } from './chart.js';

const PLOT = CHART_SIZE - CHART_PADDING * 2;

function evaluate(svg, x) {
  const rownanie = svg.dataset.rownanie;
  const a = Number(svg.dataset.a);
  const b = Number(svg.dataset.b);
  const c = Number(svg.dataset.c);
  return rownanie === 'kwadratowa' ? a * x * x + b * x + c : a * x + b;
}

function clientXToFunctionX(svg, clientX) {
  const rect = svg.getBoundingClientRect();
  const viewBox = svg.viewBox.baseVal;
  const fractionAcross = (clientX - rect.left) / rect.width;
  const svgX = viewBox.x + fractionAcross * viewBox.width;
  const xMin = Number(svg.dataset.xMin);
  const xMax = Number(svg.dataset.xMax);
  const fraction = (svgX - CHART_PADDING) / PLOT;
  return xMin + fraction * (xMax - xMin);
}

function toSvgPoint(svg, x, y) {
  const xMin = Number(svg.dataset.xMin);
  const xMax = Number(svg.dataset.xMax);
  const yMin = Number(svg.dataset.yMin);
  const yMax = Number(svg.dataset.yMax);
  const px = CHART_PADDING + ((x - xMin) / (xMax - xMin)) * PLOT;
  const py = CHART_PADDING + (1 - (y - yMin) / (yMax - yMin)) * PLOT;
  return { px, py };
}

function updateMarker(svg, x) {
  const xMin = Number(svg.dataset.xMin);
  const xMax = Number(svg.dataset.xMax);
  const clampedX = Math.max(xMin, Math.min(xMax, x));
  const y = evaluate(svg, clampedX);
  const { px, py } = toSvgPoint(svg, clampedX, y);

  const marker = svg.querySelector('.znacznik');
  const label = svg.querySelector('.etykieta-znacznika');
  if (!marker || !label) return;
  marker.setAttribute('cx', px.toFixed(2));
  marker.setAttribute('cy', py.toFixed(2));
  marker.removeAttribute('hidden');
  label.setAttribute('x', Math.min(px + 8, CHART_SIZE - TOOLTIP_LABEL_WIDTH).toFixed(2));
  label.setAttribute('y', Math.max(py - 8, 12).toFixed(2));
  label.textContent = `(${formatNumber(Number(clampedX.toFixed(2)))}, ${formatNumber(Number(y.toFixed(2)))})`;
  label.removeAttribute('hidden');
}

function hideMarker(svg) {
  const marker = svg.querySelector('.znacznik');
  const label = svg.querySelector('.etykieta-znacznika');
  if (!marker || !label) return;
  marker.setAttribute('hidden', '');
  label.setAttribute('hidden', '');
}

export function initCharts(container) {
  for (const svg of container.querySelectorAll('svg.wykres')) {
    const overlay = svg.querySelector('.nakladka');
    if (!overlay) continue;
    let dragging = false;

    const handleMove = (event) => {
      updateMarker(svg, clientXToFunctionX(svg, event.clientX));
    };

    overlay.addEventListener('pointerdown', (event) => {
      if (event.pointerType !== 'mouse') {
        dragging = true;
        overlay.setPointerCapture(event.pointerId);
      }
      handleMove(event);
    });

    overlay.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'mouse' || dragging) handleMove(event);
    });

    overlay.addEventListener('pointerup', (event) => {
      if (event.pointerType !== 'mouse') {
        dragging = false;
        hideMarker(svg);
      }
    });

    overlay.addEventListener('pointerleave', () => {
      if (!dragging) hideMarker(svg);
    });

    overlay.addEventListener('pointercancel', () => {
      dragging = false;
      hideMarker(svg);
    });
  }
}
