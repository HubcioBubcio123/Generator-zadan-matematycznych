// DOM-only glue: lets the student draw freehand on a chart's blank grid by
// dragging across its transparent overlay. Not unit-tested — this project
// has no DOM test environment. Verified manually in the browser.

import { CHART_SIZE, CHART_PADDING } from './chart.js';

// Converts a pointer event's client position to a point in the SVG's own
// coordinate space, clamped to the plot area so a drag that leaves the
// chart still draws up to the grid's edge instead of escaping it.
function clientToSvgPoint(svg, clientX, clientY) {
  const rect = svg.getBoundingClientRect();
  const viewBox = svg.viewBox.baseVal;
  const fractionX = (clientX - rect.left) / rect.width;
  const fractionY = (clientY - rect.top) / rect.height;
  const x = viewBox.x + fractionX * viewBox.width;
  const y = viewBox.y + fractionY * viewBox.height;
  return {
    x: Math.min(Math.max(x, CHART_PADDING), CHART_SIZE - CHART_PADDING),
    y: Math.min(Math.max(y, CHART_PADDING), CHART_SIZE - CHART_PADDING),
  };
}

export function initCharts(container) {
  for (const kontener of container.querySelectorAll('.wykres-kontener')) {
    const svg = kontener.querySelector('svg.wykres');
    const overlay = svg?.querySelector('.nakladka');
    const drawing = svg?.querySelector('.rysunek-ucznia');
    if (!svg || !overlay || !drawing) continue;

    let isDrawing = false;
    let pathData = drawing.getAttribute('d') || '';

    function appendPoint(command, clientX, clientY) {
      const { x, y } = clientToSvgPoint(svg, clientX, clientY);
      pathData += `${pathData ? ' ' : ''}${command} ${x.toFixed(2)} ${y.toFixed(2)}`;
      drawing.setAttribute('d', pathData);
    }

    overlay.addEventListener('pointerdown', (event) => {
      isDrawing = true;
      appendPoint('M', event.clientX, event.clientY);
      // Capture is a best-effort convenience (keeps the drag receiving
      // events if the pointer leaves the overlay); if it fails for any
      // reason, the stroke's starting point above is already recorded.
      try {
        overlay.setPointerCapture(event.pointerId);
      } catch {
        // no-op
      }
    });

    overlay.addEventListener('pointermove', (event) => {
      if (isDrawing) appendPoint('L', event.clientX, event.clientY);
    });

    overlay.addEventListener('pointerup', () => {
      isDrawing = false;
    });

    overlay.addEventListener('pointercancel', () => {
      isDrawing = false;
    });

    const wyczyscButton = kontener.querySelector('.wykres-wyczysc');
    wyczyscButton?.addEventListener('click', () => {
      pathData = '';
      drawing.setAttribute('d', '');
    });

    const powiekszButton = kontener.querySelector('.wykres-powieksz');
    powiekszButton?.addEventListener('click', () => {
      const powiekszony = kontener.classList.toggle('wykres-kontener--powiekszony');
      powiekszButton.textContent = powiekszony ? 'Pomniejsz' : 'Powiększ';
    });
  }
}
