// Pure SVG generator for static reference figures (a labeled triangle,
// quadrilateral, map, or solid) that accompany a word problem. Unlike
// js/chart.js's function graphs, these are never drawn on by the student —
// simple line-art only. No DOM access; takes a shape spec, returns markup.

import { formatNumber } from './format.js';

function trojkatSvg({ bok }) {
  const label = `${formatNumber(bok)} cm`;
  return (
    `<svg class="figura" viewBox="0 0 240 220" xmlns="http://www.w3.org/2000/svg">` +
    `<polygon class="ksztalt" points="120,20 20,200 220,200" />` +
    `<text class="etykieta-figury" x="120" y="216" text-anchor="middle">${label}</text>` +
    `</svg>`
  );
}

function czworokatSvg() {
  return (
    `<svg class="figura" viewBox="0 0 240 220" xmlns="http://www.w3.org/2000/svg">` +
    `<polygon class="ksztalt" points="40,40 200,60 180,200 50,180" />` +
    `<text class="etykieta-figury" x="25" y="35" text-anchor="middle">α</text>` +
    `<text class="etykieta-figury" x="215" y="55" text-anchor="middle">β</text>` +
    `<text class="etykieta-figury" x="195" y="205" text-anchor="middle">γ</text>` +
    `<text class="etykieta-figury" x="30" y="200" text-anchor="middle">δ</text>` +
    `<polyline class="znacznik-katu" points="50,165 65,165 65,180" />` +
    `</svg>`
  );
}

function mapaSvg({ dx, dy }) {
  return (
    `<svg class="figura" viewBox="0 0 240 220" xmlns="http://www.w3.org/2000/svg">` +
    `<line class="ksztalt" x1="190" y1="190" x2="190" y2="60" />` +
    `<line class="ksztalt" x1="190" y1="60" x2="60" y2="60" />` +
    `<line class="ksztalt przerywana" x1="190" y1="190" x2="60" y2="60" />` +
    `<circle class="punkt" cx="190" cy="190" r="3" />` +
    `<circle class="punkt" cx="60" cy="60" r="3" />` +
    `<text class="etykieta-figury" x="200" y="195" text-anchor="start">A</text>` +
    `<text class="etykieta-figury" x="50" y="55" text-anchor="end">B</text>` +
    `<text class="etykieta-figury" x="205" y="125" text-anchor="middle">${formatNumber(dy)} km</text>` +
    `<text class="etykieta-figury" x="125" y="50" text-anchor="middle">${formatNumber(dx)} km</text>` +
    `<line class="strzalka-polnoc" x1="30" y1="55" x2="30" y2="25" />` +
    `<polygon class="strzalka-polnoc" points="30,15 25,27 35,27" />` +
    `<text class="etykieta-figury" x="30" y="12" text-anchor="middle">N</text>` +
    `</svg>`
  );
}

function prostopadloscianSvg({ a, b, c }) {
  return (
    `<svg class="figura" viewBox="0 0 240 200" xmlns="http://www.w3.org/2000/svg">` +
    `<polygon class="ksztalt" points="40,150 180,150 180,60 40,60" />` +
    `<polygon class="ksztalt" points="80,120 220,120 220,30 80,30" />` +
    `<line class="ksztalt" x1="40" y1="150" x2="80" y2="120" />` +
    `<line class="ksztalt" x1="180" y1="150" x2="220" y2="120" />` +
    `<line class="ksztalt" x1="180" y1="60" x2="220" y2="30" />` +
    `<line class="ksztalt" x1="40" y1="60" x2="80" y2="30" />` +
    `<text class="etykieta-figury" x="110" y="168" text-anchor="middle">${formatNumber(a)} cm</text>` +
    `<text class="etykieta-figury" x="20" y="108" text-anchor="middle">${formatNumber(b)} cm</text>` +
    `<text class="etykieta-figury" x="65" y="140" text-anchor="middle">${formatNumber(c)} cm</text>` +
    `</svg>`
  );
}

export function figuraSvg(figura) {
  switch (figura.typ) {
    case 'trojkat':
      return trojkatSvg(figura);
    case 'czworokat':
      return czworokatSvg(figura);
    case 'mapa':
      return mapaSvg(figura);
    case 'prostopadloscian':
      return prostopadloscianSvg(figura);
    default:
      throw new Error(`Nieznany typ figury: ${figura.typ}`);
  }
}
