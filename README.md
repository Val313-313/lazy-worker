# 🦥 Lazy Worker - RAV Bewerbungen Helper

Eine Chrome-Erweiterung für Schweizer Arbeitssuchende, die Bewerbungen automatisch erfasst und das RAV-Formular "Nachweis der persönlichen Arbeitsbemühungen" mit einem Klick ausfüllt.

---

## Installation (Schritt-für-Schritt)

> Du brauchst keine Programmierkenntnisse! Folge einfach diesen Schritten:

### Schritt 1: Herunterladen

Klicke auf den grossen Button unten — die Datei wird automatisch heruntergeladen:

### **[>>> Lazy Worker herunterladen <<<](https://github.com/Val313-313/lazy-worker/releases/latest/download/Lazy-Worker-v1.0.0.zip)**

Es wird eine Datei namens `Lazy-Worker-v1.0.0.zip` in deinen Downloads-Ordner gespeichert.

### Schritt 2: ZIP-Datei entpacken

- **Mac:** Doppelklicke auf die `.zip`-Datei im Finder — es entsteht ein Ordner `Lazy-Worker-v1.0.0`
- **Windows:** Rechtsklick auf die `.zip`-Datei → **"Alle extrahieren..."** klicken → **"Extrahieren"** bestätigen

### Schritt 3: Chrome-Erweiterungen öffnen

1. Öffne **Google Chrome**
2. Tippe in die Adressleiste oben ein: `chrome://extensions/`
3. Drücke **Enter**

### Schritt 4: Entwicklermodus aktivieren

Auf der Erweiterungen-Seite findest du **oben rechts** einen Schalter namens **"Developer mode"** (oder **"Entwicklermodus"**). Klicke darauf, sodass er **eingeschaltet** ist (blau).

### Schritt 5: Erweiterung laden

1. Klicke oben links auf den Button **"Load unpacked"** (oder **"Entpackte Erweiterung laden"**)
2. Es öffnet sich ein Datei-Auswahl-Fenster
3. Navigiere zu deinem **Downloads-Ordner**
4. Wähle den **ganzen Ordner** `Lazy-Worker-v1.0.0` aus (nicht eine einzelne Datei darin!)
5. Klicke **"Auswählen"** / **"Select"**

### Fertig!

Du siehst jetzt das 🦥 Lazy Worker Icon oben rechts in Chrome. Die Erweiterung ist installiert und einsatzbereit!

> **Tipp:** Wenn das Icon nicht sichtbar ist, klicke auf das Puzzle-Symbol (🧩) oben rechts in Chrome und pinne "Lazy Worker" an.

---

## Features

- **Automatische Erfassung**: Bewerbungen auf jobs.ch, LinkedIn und Indeed werden automatisch erkannt
- **Ein-Klick-Ausfüllung**: Das RAV-Formular auf arbeit.swiss wird automatisch ausgefüllt
- **Lokale Speicherung**: Alle Daten bleiben auf deinem Computer - keine Cloud, keine Server
- **CSV-Export**: Exportiere alle Bewerbungen für deine Unterlagen
- **Mehrsprachig**: Deutsch und Englisch

## Verwendung

### Bewerbungen erfassen

1. Gehe auf jobs.ch, LinkedIn oder Indeed
2. Suche einen Job und klicke auf "Bewerben"
3. Die Bewerbung wird automatisch erfasst (Notification erscheint)

### RAV-Formular ausfüllen

1. Logge dich bei arbeit.swiss ein
2. Gehe zum Formular "Nachweis der persönlichen Arbeitsbemühungen"
3. Klicke auf den "🦥 Lazy Worker" Button (unten rechts)
4. Wähle eine Bewerbung und klicke "Ausfüllen"
5. Überprüfe die Daten und sende das Formular ab

### Bewerbungen verwalten

- Klicke auf das Extension-Icon in der Chrome-Toolbar
- Hier kannst du:
  - Alle Bewerbungen ansehen
  - Neue Bewerbungen manuell hinzufügen
  - Bestehende bearbeiten oder löschen
  - Als CSV exportieren

## Projektstruktur

```
Lazy Worker/
├── manifest.json           # Chrome Extension Manifest V3
├── src/
│   ├── background/
│   │   └── service-worker.js   # Background Service Worker
│   ├── content/
│   │   ├── arbeit-swiss.js     # Form Filler für RAV
│   │   ├── arbeit-swiss.css    # Styles für Floating UI
│   │   ├── jobs-ch.js          # Scraper für jobs.ch/jobup.ch
│   │   ├── linkedin.js         # Scraper für LinkedIn
│   │   ├── indeed.js           # Scraper für Indeed
│   │   └── common.js           # Gemeinsame Scraping-Utilities
│   ├── popup/
│   │   ├── popup.html          # Popup UI
│   │   ├── popup.css           # Popup Styles
│   │   └── popup.js            # Popup Logic
│   ├── lib/
│   │   ├── storage.js          # Chrome Storage Wrapper
│   │   ├── types.js            # TypeScript-ähnliche Type Definitions
│   │   └── utils.js            # Hilfsfunktionen
│   └── assets/
│       └── icon-*.png          # Extension Icons
└── public/
    └── _locales/
        ├── de/messages.json    # Deutsche Übersetzungen
        └── en/messages.json    # Englische Übersetzungen
```

## Unterstützte Job-Portale

| Portal | Auto-Capture | Status |
|--------|--------------|--------|
| jobs.ch | ✅ | Vollständig |
| jobup.ch | ✅ | Vollständig |
| LinkedIn | ✅ | Vollständig |
| Indeed.ch | ✅ | Vollständig |

## Datenschutz

- **Keine Datenübertragung**: Alle Daten bleiben lokal auf deinem Computer
- **Kein Tracking**: Keine Analytics oder Telemetrie
- **Minimale Berechtigungen**: Nur Zugriff auf die notwendigen Websites
- **Open Source**: Der Code kann jederzeit überprüft werden

## Technologie

- Chrome Extension Manifest V3
- Vanilla JavaScript (ES Modules)
- Chrome Storage API
- Content Scripts für Job-Board-Scraping

## Bekannte Einschränkungen

- Das arbeit.swiss Formular muss manuell aufgerufen werden
- Bei Änderungen an den Job-Portalen können Scraper angepasst werden müssen
- LinkedIn Easy Apply erfasst nicht immer alle Details

## Weiterentwicklung

Mögliche zukünftige Features:
- [ ] Firefox-Unterstützung
- [ ] Weitere Job-Portale (xing, jobscout24)
- [ ] Automatische Adress-Suche
- [ ] Dark Mode
- [ ] Statistiken und Grafiken

## Lizenz

MIT License - Frei verwendbar und anpassbar.

---

Entwickelt mit 🦥 für alle, die ihre Arbeitsbemühungen effizient dokumentieren möchten.
