# ⚽ Bundesliga-Analyst

Eine React-Anwendung, die aktuelle Daten der **1. Fußball-Bundesliga** übersichtlich aufbereitet
und mit einer **KI** einordnet: Tabelle, Spieltage und Teamstatistiken kommen live aus der
OpenLigaDB, eine LLM-API schreibt daraus Formanalysen und Duell-Vorschauen – ausschließlich auf
Basis dieser echten Daten.

Einsendeaufgabe 2 · Front-End Development (SED502) · Ferdinand Porsche FernFH

## Wofür und für wen?

Für Fußballinteressierte, die sich vor einem Spieltag schnell ein Bild machen wollen: Wie steht
mein Verein da, wie ist die Form, wie gingen die letzten Duelle gegen den nächsten Gegner aus?
Statt Zahlen selbst zu vergleichen, fasst die KI die Statistik in wenigen Absätzen verständlich
zusammen.

## Funktionen

| Seite | Route | Inhalt |
|---|---|---|
| **Tabelle** | `/` | Aktuelle Tabelle mit Wappen, Bilanz, Tordifferenz und markierten Tabellenzonen |
| **Spieltag** | `/spieltag` → `/spieltag/:nr` | Alle Spiele eines Spieltags mit End- und Halbzeitergebnis, Blättern zwischen Spieltagen; `/spieltag` leitet automatisch zum aktuellen Spieltag weiter |
| **Team** | `/team/:id` | Tabellenplatz, Gesamt-/Heim-/Auswärtsbilanz, Formkurve, letzte Spiele, Torschützen, nächstes Spiel und **KI-Formanalyse** |
| **Duell-Vorschau** | `/duell` | Formular mit Validierung (Heim- und Gastteam, Schwerpunkt), Vergleich beider Teams und der direkten Duelle sowie **KI-Duellvorschau** |
| 404 | `*` | Hinweis bei unbekannten Adressen |

## Technologien und APIs

- **React 19** mit **TypeScript**, Build-Tool **Vite**
- **React Router** für die Navigation zwischen den Seiten
- **OpenLigaDB** (<https://www.openligadb.de>) – freie REST-API für Fußballdaten, ohne API-Key;
  Daten unter der Open Database License (ODbL)
- **Google Gemini API** (`streamGenerateContent`) mit **Streaming** für die KI-Texte
- Eigenes CSS (Mobile First, CSS-Variablen, Grid und Flexbox), keine UI-Bibliothek

## Installation und Start

Voraussetzung: Node.js (LTS) und ein kostenloser Gemini-API-Key aus
[Google AI Studio](https://aistudio.google.com/apikey).

```bash
npm install
```

Danach die Datei `.env.example` kopieren, die Kopie `.env` nennen und den eigenen Key eintragen:

```
VITE_GEMINI_API_KEY=...
VITE_GEMINI_MODEL=gemini-flash-latest
```

```bash
npm run dev      # Entwicklungsserver unter http://localhost:5173
npm run build    # Typprüfung (tsc) und Produktions-Build
npm run lint     # Statische Code-Analyse (oxlint)
```

Ohne Key funktionieren Tabelle, Spieltage und Statistiken trotzdem; die KI-Bereiche zeigen dann
einen verständlichen Hinweis.

## Projektstruktur

```
src/
├── komponenten/   Wiederverwendbare UI-Bausteine (Layout, Tabelle, Spielkarte, KI-Bereich, Formular …)
├── seiten/        Eine Komponente pro Route (Tabelle, Spieltag, TeamDetail, Duell …)
├── hooks/         Custom Hooks: useFetch, useAIStream, useSeitentitel
├── typen/         TypeScript-Interfaces für API-Daten, App-Daten und KI-Nachrichten
├── utils/         API-Zugriff, Streaming, Statistik-Berechnung, Prompts, Formatierung
├── App.tsx        Routen
└── main.tsx       Einstiegspunkt mit BrowserRouter
```

## Technische Entscheidungen

**Datenquelle OpenLigaDB.** Sie liefert alle Bundesliga-Daten kostenlos, ohne Registrierung und
erlaubt Aufrufe direkt aus dem Browser. Weil das Projekt ehrenamtlich betrieben wird, speichert
`fetchJSON` Antworten zwei Minuten zwischen; „Erneut versuchen“ holt bewusst frische Daten.

**Drei Zustände über einen Custom Hook.** `useFetch<T>(url)` liefert `daten`, `isLaden`,
`fehler` und `neuLaden`. Mit `url = null` wird bewusst noch nichts geladen (z. B. bevor das
Duell-Formular abgeschickt ist). Laufende Anfragen werden beim Seitenwechsel per
`AbortController` abgebrochen (Cleanup im `useEffect`). Die Antwort wird zusammen mit ihrer URL
gespeichert – so kann nie eine veraltete Antwort zur falschen Seite angezeigt werden.

**Statistik selbst berechnet.** Bilanz, Heim/Auswärts, Formkurve, Torschützen und direkte Duelle
werden in `utils/statistik.ts` mit `filter`, `map` und `reduce` aus den Spieldaten berechnet.
Duplikate, die in der OpenLigaDB vorkommen können, werden beim Direktvergleich entfernt.

**KI mit echtem Mehrwert statt Chatbox.** Die KI bekommt nicht nur eine Frage, sondern alle
berechneten Kennzahlen als strukturierten Datenblock. Der System-Prompt (Persona, Aufgabe,
Format, Einschränkungen) verbietet, Fakten zu erfinden, und schließt Wett-Tipps aus. Dadurch sind
die Texte überprüfbar: Jede Aussage muss sich auf die angezeigten Zahlen stützen.

**Streaming robust umgesetzt.** `utils/aiStream.ts` liest die Server-Sent Events mit einem
Zeilenpuffer, weil ein Datenpaket mitten in einer Zeile enden kann (sonst gehen Wörter verloren).
`useAIStream` kapselt Zustand, Abbruch und Fehler; die Tokens werden mit der funktionalen
Update-Form `setText(alt => alt + token)` angehängt. Fehler der API (ungültiger Key, Guthaben
aufgebraucht, Modell nicht verfügbar, Rate Limit) werden in verständliche deutsche Meldungen
übersetzt.

**KI-Anbieter austauschbar.** Die App arbeitet intern mit einem anbieterneutralen
Nachrichtenformat (`system`/`user`/`assistant`). Nur `utils/aiStream.ts` kennt die Gemini-API und
wandelt das Format um (System-Nachricht → `systemInstruction`, `assistant` → `model`). Ursprünglich
war OpenAI geplant; der Wechsel zu Gemini betraf nur diese eine Datei und die `.env`. Als Modell ist
der Google-Alias `gemini-flash-latest` voreingestellt, damit die App nicht ausfällt, wenn Google
ältere Modellversionen abschaltet. Interne „Denk“-Teile des Modells werden nicht angezeigt.

**Antwortzeit und Ausfallsicherheit der KI.** Beim Testen traten zwei Probleme auf: Das Modell
„dachte“ standardmäßig so gründlich nach, dass selbst eine Ein-Wort-Antwort über 20 Sekunden
brauchte, und zeitweise meldete Google für `gemini-flash-latest` „high demand“ (HTTP 503) – in der
App hüpften die Ladepunkte dann scheinbar endlos. Gelöst wurde das in `utils/aiStream.ts`:
Die Anfrage setzt eine niedrige Denkstufe (`thinkingConfig.thinkingLevel: 'low'`), weil für das
Zusammenfassen vorgegebener Zahlen kein tiefes Nachdenken nötig ist. Ist ein Modell überlastet,
das Kontingent erschöpft oder das Modell nicht verfügbar (503, 429, 500, 404), probiert die App
automatisch die Ausweichmodelle `gemini-flash-lite-latest` und `gemini-2.5-flash`. Kennt ein
Modell die Denkstufe nicht, wird die Anfrage ohne sie wiederholt. Ergebnis im Test: Der erste
Text der Formanalyse erscheint nach rund sechs Sekunden.

**Barrierefreiheit von Beginn an.** Semantisches HTML, Skip-Link, `aria-label` an der
Navigation, Tabellen mit `caption` und `scope`, Formular mit `label`, `aria-invalid` und
`aria-describedby` für Fehlermeldungen, `role="status"`/`role="alert"` für Lade- und
Fehlerzustände, `aria-live` für die KI-Antwort, sichtbarer Fokus und Rücksicht auf
`prefers-reduced-motion`. Informationen werden nie nur über Farbe vermittelt (z. B. Formkurve mit
Buchstaben, Tabellenzonen mit Screenreader-Text).

**Sicherheit des API-Keys.** Der Key liegt nur lokal in `.env`, die über `.gitignore`
ausgeschlossen ist; im Repository liegt nur `.env.example`. Da Vite-Variablen im Browser-Bundle
landen, ist diese Lösung nur für die lokale Entwicklung gedacht. Für das öffentliche Deployment
(ESA 3) wird der KI-Aufruf hinter eine serverlose Funktion verlegt – dafür muss nur
`utils/aiStream.ts` angepasst werden.

## Aufgabenverteilung

Einzelarbeit von Thomas Kluczny . Alle Teile –
Konzept, Umsetzung, Test und Dokumentation – liegen in einer Hand.

## Dokumentation des KI-Einsatzes

### KI in der Anwendung

- **Modell:** Google Gemini laut `VITE_GEMINI_MODEL` (Standard: Alias `gemini-flash-latest`;
  bei Überlastung automatisch `gemini-flash-lite-latest` bzw. `gemini-2.5-flash`), Endpunkt
  `streamGenerateContent` mit Server-Sent Events, niedrige Denkstufe für kurze Antwortzeiten
- **Zweck:** Formanalyse eines Teams und neutrale Duell-Vorschau
- **Gesendete Daten:** ausschließlich öffentliche Fußballstatistiken aus der OpenLigaDB und der
  feste System-Prompt – keine personenbezogenen Daten der Nutzerinnen und Nutzer. (Im Gratis-Tarif
  darf Google Eingaben zur Verbesserung seiner Dienste nutzen; deshalb werden keine persönlichen
  Daten übertragen.)
- **Kennzeichnung:** Alle KI-Texte sind sichtbar als „KI-generiert“ markiert und mit dem Hinweis
  versehen, dass KI Fehler machen kann
- **Kostenkontrolle:** kostenloses Kontingent der Gemini-API, Antwortlänge über `maxOutputTokens`
  begrenzt; die KI wird nur auf
  Knopfdruck aufgerufen, nicht automatisch beim Laden

### KI bei der Entwicklung

| Werkzeug | Wofür | Umgang mit dem Ergebnis |
|---|---|---|
| **Claude (Anthropic)** | Themenfindung und Konzept, Projektstruktur, Erstellung des Großteils des Quellcodes (Komponenten, Hooks, Streaming, Statistik, CSS), Prüfung der API-Struktur, Entwurf dieser README | Code Schritt für Schritt übernommen, lokal getestet und nachvollzogen; Konzeptentscheidungen (Thema, Liga, Funktionsumfang, KI-Anbieter) selbst getroffen |

Konkrete Fälle, in denen Vorlagen nicht unverändert übernommen, sondern angepasst wurden:

- Der `useAI`-Hook aus Modul 05 hängt die Benutzernachricht mehrfach an den Verlauf an. Der
  eigene Hook `useAIStream` sendet stattdessen die vollständig aufgebauten Nachrichten genau
  einmal.
- Die Streaming-Funktion aus Modul 05 verarbeitet jedes Datenpaket isoliert. Ergänzt wurde ein
  Zeilenpuffer, damit an Paketgrenzen zerschnittene Zeilen nicht verloren gehen, sowie ein
  Abbruch per `AbortController`.
- Die Beispiele in Modul 05 nutzen das OpenAI-Format. Für Gemini wurde der Aufruf auf
  `streamGenerateContent?alt=sse` umgestellt, der Key wird im Header `x-goog-api-key` statt in der
  URL übergeben, und leere oder blockierte Antworten erzeugen eine verständliche Fehlermeldung.

### Eigene Tests und Erfahrungen

- **Getestet** wurden alle Seiten lokal mit echten Daten der Saison 2026/27: Tabelle, Blättern
  zwischen Spieltagen, Teamseiten (z. B. FC Bayern München, Hamburger SV), die Duell-Vorschau
  (z. B. 1. FC Köln gegen Bayer 04 Leverkusen) sowie das Formular mit ungültigen Eingaben
  (kein Team gewählt, zweimal dasselbe Team).
- **KI-Texte nachgeprüft:** Die Aussagen der KI wurden stichprobenartig mit den angezeigten Zahlen
  verglichen – etwa Punkte aus Siegen und Remis, die Reihenfolge der Formkurve oder die Summe der
  direkten Duelle. Erfundene Fakten sind dabei nicht aufgefallen; die Vorgabe „nur gelieferte
  Daten verwenden“ im System-Prompt hat sich bewährt.
- **Problem beim Testen:** Die KI-Analyse schien zunächst endlos zu laden. Die Ursache lag nicht
  im eigenen Code, sondern bei der API (lange Denkzeit des Modells, zeitweise Überlastung). Die
  Lösung – niedrige Denkstufe und Ausweichmodelle – ist oben unter „Antwortzeit und
  Ausfallsicherheit der KI“ beschrieben.
- **Erkenntnis:** KI-generierter Code spart viel Zeit, muss aber verstanden und mit echten Daten
  getestet werden. Fehler zeigen sich oft erst im Zusammenspiel mit externen Diensten.
- **Sicherheit:** Beim Erstellen von Screenshots wurde der API-Key einmal versehentlich sichtbar.
  Der Key wurde daraufhin in Google AI Studio gelöscht und durch einen neuen ersetzt.

## Bekannte Grenzen

- Die OpenLigaDB wird von Freiwilligen gepflegt; Ergebnisse können mit Verzögerung erscheinen.
- Die direkten Duelle umfassen nur Bundesliga-Spiele, die in der OpenLigaDB erfasst sind.
- KI-Texte können trotz Daten-Vorgabe ungenau sein und ersetzen keine eigene Recherche.

## Datenquelle und Lizenz

Fußballdaten: [OpenLigaDB](https://www.openligadb.de), lizenziert unter der
[Open Database License (ODbL)](https://opendatacommons.org/licenses/odbl/).
Vereinswappen werden über die von der OpenLigaDB gelieferten Links (Wikimedia) eingebunden.
