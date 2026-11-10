# DevOps Basics — modularna dokumentacja (DDEV + GitHub Pages)

Projekt dokumentacji HTML/CSS/JavaScript/JSON, przygotowany do edycji w **VS Code / Notepad++**, uruchamiania w **WSL2 + Docker + DDEV** i automatycznej publikacji przez **GitHub Actions → GitHub Pages**.

## Zakładki

- **DevOps - lokalnie** — WSL2, Docker, DDEV, Composer, Drush, Drupal 7/11 oraz klonowanie projektów (10 sekcji; zachowano wcześniejsze treści).
- **DevOps - GitHub** — Git, GitHub, gałęzie, CI/CD i GitHub Pages (4 sekcje).
- **DevOps - VS Code** — instalacja, WSL2, edycja, Markdown/JSON, DDEV, Git, rozszerzenia i diagnostyka (5 sekcji).

Górne elementy **topbar i hero są stale widoczne podczas przewijania** (również na telefonach). Wysokość nagłówka jest uwzględniana automatycznie przy nawigacji do sekcji, a wydruk pozostaje bez przyklejonego nagłówka.

Każda komenda ma opis i przycisk kopiowania. Menu boczne, sekcje i podsekcje powstają z danych JSON.

## Struktura katalogów

```text
devops-basics/ (repozytorium)
├── .ddev/config.yaml            # DDEV: docroot public, bez kontenera DB
├── .github/workflows/ci.yml    # testy przy push i PR
├── .github/workflows/pages.yml # build i wdrożenie GitHub Pages z main
├── .vscode/                   # ustawienia edytora i rozszerzenia
├── public/                    # jedyne pliki publikowane jako strona
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   ├── .nojekyll
│   └── content/
│       ├── site.json          # zakładki główne
│       ├── lokalnie/
│       ├── github/
│       └── vscode/
├── scripts/validate.py        # walidacja struktury i składni JSON
├── scripts/build.py           # kopiuje public/ do dist/
├── tests/                     # testy automatyczne
├── .gitignore
├── .editorconfig
└── README.md
```

## Uruchomienie lokalne w DDEV

Rozpakuj projekt np. do `~/projekty/devops-basics/` w Ubuntu WSL2:

```bash
cd ~/projekty/devops-basics
ddev start
ddev launch
```

Strona powinna działać pod adresem **https://devops-basics.ddev.site**. DDEV w tym projekcie nie wymaga Drupala, Drusha, Composera ani bazy danych.

Alternatywa bez DDEV:

```bash
python3 -m http.server 8000 --directory public
```

Otwórz `http://localhost:8000`. Nie otwieraj `public/index.html` jako `file://`, ponieważ aplikacja pobiera JSON przez `fetch()`.

## VS Code + WSL2

Zainstaluj **VS Code na Windows**, dodaj rozszerzenie **WSL** (Microsoft), a następnie w Ubuntu:

```bash
cd ~/projekty/devops-basics
code .
```

Przy pierwszym uruchomieniu może pojawić się `Installing VS Code Server for Linux x64` — to normalne. W VS Code otwórz terminal `Ctrl+\`` i sprawdź `pwd`, `git status`, `ddev list`.

Pliki `.vscode/settings.json` i `.vscode/extensions.json` są częścią repozytorium. Dodatkowe polecenia i skróty znajdziesz w zakładce **DevOps - VS Code**.

## Walidacja i budowanie

```bash
python3 scripts/validate.py
python3 -m unittest discover -s tests -v
python3 scripts/build.py
```

Katalog `dist/` jest generowany automatycznie i ignorowany przez Git.

## Pierwsze umieszczenie na GitHub

1. Utwórz puste publiczne repozytorium o nazwie **devops-basics** na GitHub (bez generowania README).
2. W katalogu projektu uruchom:

```bash
cd ~/projekty/devops-basics
git init -b main
git config --global user.name "Twoje imię i nazwisko"
git config --global user.email "twoj-email@example.com"
git add .
git commit -m "Initial DevOps Basics"
git remote add origin https://github.com/TWOJ_LOGIN/devops-basics.git
git push -u origin main
```

3. Do uwierzytelniania HTTPS użyj np. `gh auth login` lub Git Credential Manager (nie hasła konta GitHub).
4. Otwórz repozytorium na GitHub → **Settings → Pages** → **Build and deployment → Source: GitHub Actions**.
5. Sprawdź **Actions**. Jeśli pierwszy workflow nie wdrożył strony, użyj **Run workflow** w workflow publikacji.
6. Strona będzie pod adresem `https://TWOJ_LOGIN.github.io/devops-basics/`.

## Codzienna aktualizacja i automatyczna publikacja

W edytorze zmodyfikuj odpowiedni JSON pod `public/content/`. Następnie:

```bash
python3 scripts/validate.py
python3 -m unittest discover -s tests -v
git status
git add .
git commit -m "Aktualizacja DevOps Basics"
git pull --ff-only
git push
```

Każdy push na `main` uruchamia sprawdzanie i publikację przez `.github/workflows/pages.yml`. Zmiany w Pull Request sprawdza workflow `.github/workflows/ci.yml`; produkcyjna publikacja nastąpi dopiero po połączeniu do `main`.

## Dodawanie nowych treści

1. Nowa **zakładka**: dodaj pozycję do `public/content/site.json`, plik `content/<id>/page.json` i sekcje.
2. Nowa **sekcja**: utwórz `public/content/<zakladka>/sections/sekcja-XX.json` i dopisz plik do tablicy `sections` w `page.json`.
3. Nowa **podsekcja**: dopisz obiekt do tablicy `subsections` wybranej sekcji.
4. Nowa **komenda**: dopisz `{"command":"...","description":"..."}` do tablicy `commands`.
5. Po zmianach uruchom `python3 scripts/validate.py` i odśwież przeglądarkę.

JSON wymaga podwójnych cudzysłowów i nie dopuszcza komentarzy ani przecinka po ostatnim elemencie. Wyszukiwarka indeksuje nazwy i opisy; przyciski **Kopiuj** działają przy każdej komendzie.

## Klonowanie na drugim komputerze

```bash
cd ~/projekty
git clone https://github.com/TWOJ_LOGIN/devops-basics.git
cd devops-basics
ddev start
ddev launch
```

## Diagnozowanie

- **404 na GitHub Pages:** sprawdź **Settings → Pages**, nazwę repozytorium i status workflow w **Actions**.
- **Błąd JSON:** `python3 scripts/validate.py` wskaże plik lub brakującą strukturę.
- **Błąd `code: command not found`:** sprawdź instalację VS Code na Windows, opcję PATH, rozszerzenie WSL i ponownie uruchom WSL (`wsl --shutdown` z PowerShell).
- **Strona pusta po otwarciu z dysku:** uruchom przez DDEV lub `python3 -m http.server`, nie przez `file://`.

**Bezpieczeństwo:** GitHub Pages służy do publikowania treści publicznych. Nie umieszczaj w `public/`, Git ani historii commitów haseł, tokenów, kluczy i danych poufnych. Workflow publikuje wyłącznie katalog `public/` skopiowany do `dist/`.

Oficjalne dokumentacje: https://code.visualstudio.com/docs/remote/wsl · https://code.visualstudio.com/docs/languages/markdown · https://docs.github.com/en/pages.

## Zachowanie menu bocznego

`topbar` i `hero` są przyklejone u góry strony. Menu boczne również jest przyklejone,
**nawet jeśli ma więcej pozycji, niż mieści się na ekranie**. Widać jego górną
część; podczas przewijania dokumentacji lista menu automatycznie przesuwa się
dopiero wtedy, gdy aktywna pozycja wychodzi poza widoczny obszar.

Nie ma pionowego scrollbara menu. Przyciski **Wcześniejsze / Dalsze** pozwalają
ręcznie odsłaniać odległe pozycje, bez przewijania dokumentu. Na małych
ekranach menu otwiera się w postaci rozwijanej listy.
