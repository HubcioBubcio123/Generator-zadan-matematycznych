# Generator zadań z matematyki

Statyczna strona generująca zadania z matematyki dla uczniów szkoły
podstawowej (klasy 4–8) oraz liceum i technikum (klasy 1–4). Zadania są
tworzone losowo na podstawie szablonów wzorowanych na formacie arkuszy CKE.

## Uruchomienie

Strona korzysta z modułów ES, więc wymaga serwera HTTP (otwarcie pliku
`index.html` bezpośrednio z dysku nie zadziała):

```
python -m http.server 8000
```

Następnie otwórz `http://localhost:8000`.

## Testy

```
node --test
```

## Tryby

- **Ćwiczenia** — wybierasz etap, klasę i dział, a następnie poziom trudności
  i liczbę zadań (1–12).
- **Egzamin** — generuje arkusz w stylu egzaminu ósmoklasisty lub matury na
  poziomie podstawowym, z mieszanką zadań zamkniętych i otwartych.

Przycisk **Pokaż odpowiedzi** wyświetla odpowiedź wraz z krótkim rozwiązaniem
bezpośrednio pod każdym zadaniem. Przycisk **Drukuj** przygotowuje arkusz do
wydruku.

## Struktura projektu

- `index.html` — szkielet strony
- `css/styles.css` — style, w tym arkusz wydruku
- `js/app.js` — obsługa menu i renderowanie arkusza
- `js/sheetGenerator.js` — losowanie zadań do arkusza
- `js/topicRegistry.js` — przypisanie działów do klas
- `js/examModes.js` — pule zadań egzaminacyjnych
- `js/topics/` — szablony zadań, jeden plik na dział
- `test/` — testy jednostkowe

## Dodawanie nowego działu

1. Utwórz `js/topics/<nazwa>.js` eksportujący tablicę `templates`, gdzie każdy
   element to `{ id, generate(difficulty, rng) }`.
2. Dodaj wpis do `TOPICS` w `js/topicRegistry.js` i wymień jego klucz w
   `topicKeys` odpowiednich klas.
3. Napisz test w `test/topics/<nazwa>.test.js`, który niezależnie przelicza
   poprawność każdej odpowiedzi.
