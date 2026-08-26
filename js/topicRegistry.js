// Maps grades to the topic pools available to them. Adding a topic means
// adding one entry to TOPICS and listing its key under the relevant grades.

import { templates as liczbyNaturalne } from './topics/liczbyNaturalne.js';
import { templates as liczbyNaturalnePowtorka } from './topics/liczbyNaturalnePowtorka.js';
import { templates as ulamki } from './topics/ulamki.js';
import { templates as ulamkiDziesietne } from './topics/ulamkiDziesietne.js';
import { templates as procenty } from './topics/procenty.js';
import { templates as geometriaPlaska } from './topics/geometriaPlaska.js';
import { templates as rownania } from './topics/rownania.js';
import { templates as potegiPitagoras } from './topics/potegiPitagoras.js';
import { templates as funkcje } from './topics/funkcje.js';
import { templates as liceumZaawansowane } from './topics/liceumZaawansowane.js';
import { templates as bryly } from './topics/bryly.js';
import { templates as statystykaEgzamin } from './topics/statystykaEgzamin.js';
import { templates as procentyEgzamin } from './topics/procentyEgzamin.js';
import { templates as geometriaEgzamin } from './topics/geometriaEgzamin.js';

export const TOPICS = [
  { key: 'liczby_naturalne', label: 'Działania na liczbach naturalnych', templates: liczbyNaturalne },
  { key: 'ulamki', label: 'Ułamki zwykłe', templates: ulamki },
  { key: 'ulamki_dziesietne', label: 'Ułamki dziesiętne', templates: ulamkiDziesietne },
  { key: 'procenty', label: 'Procenty', templates: procenty },
  { key: 'geometria_plaska', label: 'Pola i obwody figur', templates: geometriaPlaska },
  { key: 'rownania', label: 'Równania i wyrażenia algebraiczne', templates: rownania },
  { key: 'potegi_pitagoras', label: 'Potęgi, pierwiastki i twierdzenie Pitagorasa', templates: potegiPitagoras },
  { key: 'funkcje', label: 'Funkcja liniowa i kwadratowa', templates: funkcje },
  { key: 'liceum_zaawansowane', label: 'Ciągi, trygonometria, geometria analityczna, prawdopodobieństwo', templates: liceumZaawansowane },
  { key: 'bryly', label: 'Bryły: pole powierzchni i objętość', templates: bryly },
  { key: 'liczby_naturalne_powtorka', label: 'Liczby naturalne — powtórka (NWD, NWW, wzory)', templates: liczbyNaturalnePowtorka },
  // Exam-exclusive: deliberately not listed under any grade's topicKeys
  // below, so it never appears in Ćwiczenia mode's Dział dropdown.
  { key: 'statystyka_osmoklasisty', label: 'Statystyka (egzamin ósmoklasisty)', templates: statystykaEgzamin },
  // Exam-exclusive: deliberately not listed under any grade's topicKeys.
  { key: 'procenty_osmoklasisty', label: 'Procenty (egzamin ósmoklasisty)', templates: procentyEgzamin },
  // Exam-exclusive: deliberately not listed under any grade's topicKeys.
  { key: 'geometria_osmoklasisty', label: 'Geometria (egzamin ósmoklasisty)', templates: geometriaEgzamin },
];

export const GRADES = [
  { key: 'sp4', label: 'Klasa 4', etap: 'podstawowa', topicKeys: ['liczby_naturalne', 'ulamki', 'geometria_plaska'] },
  { key: 'sp5', label: 'Klasa 5', etap: 'podstawowa', topicKeys: ['ulamki', 'ulamki_dziesietne', 'geometria_plaska', 'liczby_naturalne'] },
  { key: 'sp6', label: 'Klasa 6', etap: 'podstawowa', topicKeys: ['ulamki_dziesietne', 'procenty', 'geometria_plaska', 'ulamki', 'bryly'] },
  { key: 'sp7', label: 'Klasa 7', etap: 'podstawowa', topicKeys: ['procenty', 'potegi_pitagoras', 'rownania', 'ulamki_dziesietne'] },
  { key: 'sp8', label: 'Klasa 8', etap: 'podstawowa', topicKeys: ['potegi_pitagoras', 'rownania', 'procenty', 'geometria_plaska', 'liczby_naturalne_powtorka', 'bryly'] },
  { key: 'lo1', label: 'Klasa 1 (liceum/technikum)', etap: 'ponadpodstawowa', topicKeys: ['rownania', 'funkcje', 'potegi_pitagoras', 'procenty'] },
  { key: 'lo2', label: 'Klasa 2 (liceum/technikum)', etap: 'ponadpodstawowa', topicKeys: ['funkcje', 'liceum_zaawansowane', 'rownania'] },
  { key: 'lo3', label: 'Klasa 3 (liceum/technikum)', etap: 'ponadpodstawowa', topicKeys: ['liceum_zaawansowane', 'funkcje', 'potegi_pitagoras'] },
  { key: 'lo4', label: 'Klasa 4 (liceum/technikum)', etap: 'ponadpodstawowa', topicKeys: ['liceum_zaawansowane', 'funkcje', 'rownania', 'procenty'] },
];

function findGrade(gradeKey) {
  return GRADES.find((g) => g.key === gradeKey) ?? null;
}

export function getTopicsForGrade(gradeKey) {
  const grade = findGrade(gradeKey);
  if (!grade) return [];
  return grade.topicKeys
    .map((key) => TOPICS.find((t) => t.key === key))
    .filter(Boolean);
}

export function getTemplatesForGrade(gradeKey, topicKey) {
  const topics = getTopicsForGrade(gradeKey);
  if (topicKey) {
    const topic = topics.find((t) => t.key === topicKey);
    return topic ? [...topic.templates] : [];
  }
  return topics.flatMap((t) => t.templates);
}
