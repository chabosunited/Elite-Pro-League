# EPL v10 – TOTW, Karriere, Marktwerte, Achievements & Daily Hub

Diese Version baut auf EPL v9 auf. Eine Hall of Fame ist bewusst **noch nicht** enthalten.

## 1. Manuelles EPL Team of the Week

TOTW wird niemals automatisch vergeben. Nur berechtigte EPL-Admins können Spieler auswählen:

`Admin → Team of the Week → + TOTW SPIELER`

Der Admin wählt Saison, Liga und Spieltag. Anschließend werden ausschließlich Spieler angezeigt, für die in bestätigten Matches dieses Spieltags Spielerstatistiken vorliegen. Tore, Assists, Saves, Clean Sheets, MOTM und Rating werden zur manuellen Prüfung angezeigt.

Bei Vergabe erhält der Spieler:

- 250 EPL Coins einmalig
- Zugriff auf den exklusiven TOTW-Profilbildrahmen für exakt 7 Tage
- eine TOTW-Auszeichnung im Profil
- eine Benachrichtigung

Der Spieler entscheidet unter `Profil & Cosmetics` selbst, ob er den TOTW-Rahmen ausrüstet. Nach Ablauf der 7 Tage verschwindet der temporäre Rahmen automatisch aus der Auswahl. Ein zuvor ausgerüsteter normaler Profilrahmen bleibt gespeichert und wird danach wieder angezeigt.

## 2. Karriere-System

Der Profil-Reiter `Karriere` zeigt bestätigte EPL-Leistungsdaten saisonweise und nach Club getrennt:

- Saison
- Club und Liga
- Spiele
- Tore / Assists für Feldspieler
- Saves / Clean Sheets für Torhüter
- Rating
- MOTM
- Transferhistorie
- Clubhistorie
- Auszeichnungen
- Marktwertverlauf

Nur bestätigte Matches fließen in die sportliche Karriere ein.

## 3. EPL Marktwert

Neue Seite: `/marktwerte`

Der Marktwert ist ein rein virtueller EPL-Wert und hat nichts mit echtem Geld zu tun. **Alter wird absichtlich nicht berücksichtigt.**

Einflussfaktoren:

- Basismarktwert
- bestätigte EPL-Spiele / Erfahrung
- Durchschnittsrating
- Form der letzten fünf bestätigten Matches
- Feldspieler: Tore und Assists
- Torhüter: Saves und Clean Sheets
- MOTM-Auszeichnungen
- bisherige TOTW-Auszeichnungen
- freigeschaltete Achievements
- Spielklasse/Liga

Liga-Multiplikatoren:

- Level/Liga 1: 1,25
- Level/Liga 2: 1,12
- Level/Liga 3: 1,00
- niedrigere Level: 0,95
- Free Agent / ohne Liga: 0,92

Der Wert ist auf 250.000 bis 50.000.000 virtuelle EPL-Euro begrenzt und wird auf 10.000 gerundet. Nach bestätigten Matches wird ein neuer Marktwert-Snapshot gespeichert, wenn sich der Wert verändert hat.

## 4. Achievements, Trophäen & Badges

Neue Seite: `/erfolge`

Dort sieht ein Spieler:

- alle verfügbaren Achievement-Ziele
- aktuellen Fortschritt
- gesperrt / freigeschaltet
- Freischaltdatum
- eigene Trophäen und Admin-Auszeichnungen
- kompletten EPL Trophy-/Badge-Katalog

Automatische Achievement-Ziele aus dem hochgeladenen Asset-Pack:

1. First Blood – erstes EPL-Tor
2. Sniper – 10 EPL-Tore
3. Playmaker – 20 Assists
4. The Wall – 10 Clean Sheets
5. One Club Man – 100 Matches für denselben Club
6. Loyalty – in 3 unterschiedlichen Saisons für denselben Club spielen
7. EPL Legend – 250 bestätigte EPL-Matches
8. Unbeaten – 10 bestätigte Einsätze in Folge ungeschlagen
9. Derby King – 5 Tore gegen denselben Gegner
10. Golden Boot – eine beendete Saison als alleiniger oder geteilter Torschützenkönig abschließen (mindestens 1 Tor)

Freigeschaltete Achievements erscheinen ebenfalls im Spielerprofil unter `TROPHÄEN & BADGES`.

## 5. Persönlicher Daily Hub

Neue Seite: `/hub`

Der persönliche Hub zeigt unter anderem:

- aktuellen EPL-Marktwert
- neue Benachrichtigungen
- ungelesene Nachrichten
- EPL-Coin-Balance
- nächstes Match
- aktuellen Club-Tabellenplatz inklusive Punkte, Spiele, Siege und Tore
- Fortschritt ausgewählter Saisonziele
- zuletzt freigeschaltete Achievements
- aktiven TOTW-Status und Ablaufzeit des Rahmens

## 6. Neue Assets

Die hochgeladenen Assets liegen optimiert unter:

- `/public/assets/achievements/`
- `/public/assets/trophies/`
- `/public/assets/totw/SpielerDerWocheRahmen.png`

Der TOTW-Rahmen wurde auf exakt 512 × 512 px optimiert, damit er auf das quadratische EPL-Profilbild passt.

## Installation

Nur diese neue Migration ausführen:

```bat
npx wrangler d1 execute epl-db --remote --file=./migrations/0013_totw_career_market_achievements_hub.sql
```

Die Migrationen 0001 bis 0012 nicht erneut ausführen.

Danach die neuen Quelldateien auf GitHub hochladen. `dist/`, `.wrangler/`, `node_modules/`, `.env`, ZIP- und RAR-Dateien nicht ins Repository laden. Cloudflare baut `dist` weiterhin selbst mit `npm run build`.

Für v10 sind keine neuen Cloudflare-Variablen, Secrets oder Bindings nötig.
