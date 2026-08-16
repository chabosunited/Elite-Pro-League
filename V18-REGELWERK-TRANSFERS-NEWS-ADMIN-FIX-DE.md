# EPL v18 – Regelwerk, Transferperioden, News-Editor & Admin-Fixes

## Installation

Diese Version baut auf EPL v17 auf.

1. Projektdateien aus der v18-ZIP über den aktuellen Projektordner kopieren.
2. Nur die neue Migration `0019_rules_transfer_windows_admin.sql` remote ausführen:

```bat
cd C:\Users\Matscho\Desktop\Ordner\MEINEWEBSITE\EPL-CLEAN+MOBILE
npx wrangler d1 execute epl-db --remote --file=./migrations/0019_rules_transfer_windows_admin.sql
```

3. **Migrationen 0001 bis 0018 nicht erneut ausführen.**
4. Quellcode auf GitHub hochladen. `dist/`, `.wrangler/`, `node_modules/`, `.env*`, ZIP/RAR nicht hochladen.
5. Cloudflare Pages baut wie bisher mit `npm run build` in `dist`.
6. Nach grünem Deployment einmal `Strg + F5`.

Es sind **keine neuen Cloudflare-Secrets oder Bindings** erforderlich. `DB → epl-db` und `MEDIA → epl-media` bleiben unverändert.

---

## 1. EPL-Regelwerk

Die öffentliche Seite **Regeln** ist jetzt ein kategorisiertes, aus D1 geladenes Liga-Regelwerk. Ein berechtigter Admin kann die einzelnen Regeln im Admin Panel unter **Regelwerk** bearbeiten.

Enthalten sind unter anderem:

- Mindestaufstellung: **5 Feldspieler + 1 menschlicher Torwart**.
- Nur registrierte, aktive EPL-Kaderspieler sind spielberechtigt.
- Einsatz eines nicht spielberechtigten Spielers: grundsätzlich **0:3 Defwin** gegen den betreffenden Club.
- 15-Minuten-Regel bei Nichtantritt/fehlender verwertbarer VM-Rückmeldung.
- Ein VM meldet das Ergebnis, der gegnerische VM bestätigt es.
- Jeder VM trägt ausschließlich die Spielerstatistiken seines eigenen Clubs ein.
- Match-, Ergebnis- und Statistiknachweise sind **7 Tage** aufzubewahren.
- Maximale aktive Kadergröße: **25 Spieler**.
- Vor Saisonbeginn: beliebig viele Verpflichtungen bis zum Kadermaximum.
- Aktive Saison: normale Verpflichtungen nur bei geöffnetem Transferfenster.
- Während eines geöffneten Transferfensters: **5 Basis-Transfers** pro Club; danach zusätzliche +5 Pakete aus dem Club-Shop.
- Clubwechsel außerhalb der Transferperiode: Zustimmung/Freigabe des bisherigen Clubs erforderlich.
- **5 Basis-Spielerentlassungen je Saison**, danach zusätzliche +5 Pakete aus dem Club-Shop.
- Proteste, Korrekturen, Aussteiger/Disqualifikationen und mögliche Sanktionen/Defwins.

---

## 2. Transferperioden

Im Admin Panel unter **Transfers** gibt es jetzt zusätzlich **+ TRANSFERFENSTER**.

Der Admin kann pro Saison Transferfenster mit folgenden Daten verwalten:

- Name
- Öffnungszeitpunkt
- Schließzeitpunkt
- Status: `DRAFT`, `OPEN`, `CLOSED`

Bei einer aktiven Saison gilt:

- ohne `OPEN`-Fenster keine normalen Free-Agent-Verpflichtungen;
- bei `OPEN`-Fenster werden zunächst die 5 Basis-Transfers verwendet;
- danach werden gekaufte `+5 Transfers` aus der Clubkasse verwendet;
- außerhalb eines Fensters kann ein Club-zu-Club-Wechsel nur nach Freigabe des bisherigen Clubs abgeschlossen werden.

Vor Saisonbeginn (`REGISTRATION`/`DRAFT`) werden die 5 Transferplätze nicht verbraucht; es gilt nur das Kadermaximum.

---

## 3. VM Club Control Center

Das VM Panel zeigt jetzt deutlich:

- aktuelle Kadergröße / 25
- noch verfügbare Basis-Entlassungen
- zusätzliche gekaufte Entlassungs-Credits
- noch verfügbare Basis-Transfers
- zusätzliche gekaufte Transfer-Credits
- aktuelles Transferfenster / Preseason / geschlossen

Beim Entlassen eines Spielers meldet EPL anschließend, wie viele Entlassungen noch vorhanden sind.

### Freigabe außerhalb der Transferperiode

Ein Spieler eines anderen EPL-Clubs kann ein Vertrags-/Transferangebot erhalten. Akzeptiert er dieses außerhalb eines offenen Transferfensters, erscheint beim bisherigen Club eine **Freigabe-Anfrage**. Erst nach Zustimmung des alten Clubs wird der Wechsel vollzogen.

---

## 4. Ergebnis & Statistiken

### VM-Ablauf

1. VMs vereinbaren den Termin und tragen ihn ein.
2. Jeder VM trägt die Spielerstatistiken **seines eigenen Clubs** ein.
3. Ein VM meldet das Endergebnis.
4. Danach kann die andere Seite das Ergebnis nur noch **bestätigen**; sie bekommt nicht parallel erneut einen normalen Ergebnis-Melden-Button.
5. Erst nach Bestätigung ist das Match endgültig bestätigt.

Die Mindestaufstellung von 5 Feldspielern + 1 menschlichem Torwart wird bei eingereichten Teamstatistiken geprüft.

### Admin-Schnellentscheidung

Unter **Admin → Spielplan & Ergebnisse → Ergebnis & Stats** gibt es zusätzlich:

- `DEF-WIN Heim 3:0`
- `DEF-WIN Auswärts 0:3`
- `ERGEBNIS ZURÜCKSETZEN`

Beim Defwin muss ein Grund eingegeben werden. Das ist für Nichtantritt, nicht spielberechtigte Spieler und andere eindeutige Regelverstöße gedacht.

---

## 5. News-Redaktion

Der einfache News-Dialog wurde zu einem Rich-Text-Editor erweitert.

Der Editor unterstützt unter anderem:

- Schriftart
- Schriftgröße
- normaler Absatz
- H2 / H3
- Zitat
- Fett / Kursiv / Unterstrichen / Durchgestrichen
- Textausrichtung
- Listen
- Links
- Bilder per URL
- Headerbild per URL oder Upload
- Undo / Redo
- Formatierung entfernen

Bestehende News können jetzt **bearbeitet und gelöscht** werden.

---

## 6. Admin Panel repariert

Die zuvor nicht funktionierenden Aktionen wurden angeschlossen bzw. vervollständigt.

### Clubs & VM
- Club anlegen
- Club bearbeiten
- VM zuweisen
- Club-Coins buchen

### Ligen & Saisons
- Saison anlegen/bearbeiten
- Liga anlegen/bearbeiten
- Liga löschen
- Saisonziele abrechnen

### Spielplan & Ergebnisse
- Match anlegen/bearbeiten
- automatischen Spielplan generieren
- Spielplan zurücksetzen
- Ergebnis + Spielerstatistiken eintragen
- Ergebnis zurücksetzen
- Defwin-Schnellaktionen

### Transfers
- Transfer manuell als Admin eintragen
- Transferfenster anlegen/bearbeiten/öffnen/schließen

### News
- News anlegen
- Rich-Text bearbeiten
- News löschen

### Regelwerk
- Regel anlegen
- Regeltext, Bereich, Priorität, Reihenfolge und Aktivstatus bearbeiten

Die Funktionen wurden für Desktop und die mobile Admin-Ansicht gebunden.

---

## 7. Datenbankänderungen in 0019

Neu sind insbesondere:

- `league_rule_sections`
- `league_rules`
- `transfer_windows`
- `club_season_limits`
- 7-Tage-Nachweisfrist bei Match-Abgaben
- Transfer-/Freigabefelder bei Verträgen
- Rich-HTML-Feld bei News

Die Migration löscht keine vorhandenen Nutzer, Clubs, Matches oder bisherigen Statistiken.
