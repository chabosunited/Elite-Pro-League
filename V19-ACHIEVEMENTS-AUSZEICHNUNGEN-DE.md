# EPL v19 – Achievements, Auszeichnungen & Progress-Fix

Version: **19.0.0**

Diese Version baut direkt auf EPL v18 / Migration `0019_rules_transfer_windows_admin.sql` auf.

## Installation

Auf einer bestehenden v18-Datenbank ausschließlich die neue Migration ausführen:

```bash
npx wrangler d1 execute epl-db --remote --file=./migrations/0020_achievements_awards_v19.sql
```

**Migrationen 0001 bis 0019 nicht erneut ausführen.**

Danach die v19-Dateien wie gewohnt auf GitHub hochladen und Cloudflare Pages deployen.

Für v19 sind **keine neuen Secrets, Umgebungsvariablen, R2-Buckets oder D1-Bindings** erforderlich.

---

## 1. Neue Achievements

Achievements sind einmalige Fortschrittsziele. Ihr aktueller Stand wird aus bestätigten EPL-Matches berechnet, als Progressbar angezeigt und beim Erreichen automatisch dauerhaft freigeschaltet.

Neu hinzugefügt:

- Goal Machine – 25 Tore
- Elite Finisher – 50 Tore
- Centurion – 100 Tore
- Provider – 10 Assists
- Architect – 50 Assists
- Maestro – 100 Assists
- Shot Stopper – 25 Saves
- Guardian – 100 Saves
- Brick Wall – 250 Saves
- Fortress – 25 Clean Sheets
- Iron Wall – 50 Clean Sheets
- Lockdown – 5 Clean Sheets als Feldspieler
- Safe Hands – erstes Clean Sheet als Torwart
- Home Sweet Home – 25 Spiele für denselben Club
- Hot Streak – in 5 Spielen hintereinander treffen
- Relentless – 15 Einsätze in Folge ungeschlagen
- Invincible – 25 Einsätze in Folge ungeschlagen
- Revenge – Gegner schlagen, gegen den das vorherige direkte EPL-Spiel verloren wurde
- Statement Win – Sieg mit mindestens 5 Toren Unterschied

Zusammen mit den bisherigen 10 Definitionen enthält v19 **29 automatische Achievements**.

### Progressbar-Fix

Die Progressbar verwendet jetzt den tatsächlichen Prozentwert statt einer groben Ganzzahl-Rundung. Bereits kleiner Fortschritt – z. B. `1 / 250` – ist deshalb sichtbar. Bei freigeschalteten Achievements wird die Leiste immer vollständig auf **100 %** gesetzt.

---

## 2. Neue wiederholbare Auszeichnungen / Badges

Die neuen Auszeichnungen werden als Badge auf dem Spielerprofil geführt. Wird eine Bedingung mehrfach erfüllt, steigt der Zähler automatisch, z. B.:

`HAT-TRICK HERO ×4`

Neu hinzugefügt:

- Invincibles
- Masterclass
- Seasoned
- Back to Back
- Unbeatable
- On Fire
- Hat-Trick Hero
- Poker Face
- Old Guard
- Dominant
- Assist Streak
- Fortress Run
- Consistency
- Promoted
- Perfect Start
- Survivor
- Defensive Masterclass
- Ice Cold
- Assist King
- Clean Sheet King
- MVP
- TOTW
- Keeper of the Year

Außerdem werden die bereits vorhandenen sportlichen Trophäen **EPL MOTM** und **EPL Meister** jetzt automatisch aus bestätigten Liga-Daten synchronisiert.

### Keine Doppelzählung bei Tor-Auszeichnungen

Die Tor-Auszeichnungen schließen sich pro Match bewusst gegenseitig aus:

- genau 3 Tore → Hat-Trick Hero
- genau 4 Tore → Poker Face
- ab 5 Toren → Ice Cold

Ein 5-Tore-Spiel erhöht dadurch nicht zusätzlich Hat-Trick Hero und Poker Face.

### Serien-Auszeichnungen

Bei langen Serien wird der Badge-Zähler in abgeschlossenen Stufen erhöht. Beispiel: sechs Spiele in Folge mit Tor ergeben `On Fire ×2` (je drei Spiele eine abgeschlossene Serie). Eine Unterbrechung setzt die laufende Serie zurück.

---

## 3. Automatische Synchronisierung

Achievements und Auszeichnungen werden nun insbesondere synchronisiert, wenn:

- ein eingereichtes Ergebnis durch Gegner/Admin bestätigt wird,
- ein VM Statistiken eines bereits bestätigten Matches korrigiert,
- ein Admin ein Ergebnis direkt setzt,
- ein Admin ein Ergebnis zurücksetzt,
- eine Saison beendet wird,
- ein TOTW-Spieler ausgewählt wird,
- ein Spielerprofil oder die `/erfolge`-Seite geladen wird.

Damit werden auch vorhandene Daten beim ersten Aufruf nach dem Update nachgezogen.

Automatische Auszeichnungen besitzen intern einen getrennten `automatic_quantity`-Anteil. Manuelle Admin-Vergaben bleiben additiv erhalten, während sportlich berechnete Mengen bei Ergebnis-/Statistikkorrekturen wieder korrekt abgeglichen werden können.

Automatisch verdiente Mengen können im Adminpanel nicht versehentlich manuell entfernt werden. Nur zusätzlich manuell vergebene Mengen lassen sich entziehen.

---

## 4. TOTW-Duplikat entfernt

Die alte Darstellung verwendete den temporären TOTW-Profilbildrahmen zusätzlich als historische Auszeichnung. v19 verwendet für die Historie nur noch das neue echte **TOTW-Badge** aus dem Asset-Paket.

- TOTW-Auswahl bleibt weiterhin 7 Tage lang als exklusiver Profilbildrahmen nutzbar.
- Jede TOTW-Auswahl erhöht zusätzlich dauerhaft den Profil-Badge-Zähler `TOTW ×N`.
- Alte generierte `EPL Team of the Week`-Doppelzeilen mit dem Rahmen-Asset werden durch Migration 0020 entfernt.

---

## 5. Badge-Größen auf `/erfolge` korrigiert

Die Achievement-Artworks sind in der Bibliothek jetzt fest in ihren Karten begrenzt und können nicht mehr in die nächste Zeile oder benachbarte Karte ragen.

Zusätzlich wurden die neuen 1024×1536-Assets verlustarm auf **341×512 PNG mit Transparenz** optimiert. Das entspricht dem vorhandenen Seitenformat der EPL-Badges und spart deutlich Speicher/Transfer ohne das Layout unnötig aufzublähen.

Desktop und Mobile besitzen getrennte kompakte Badge-Abmessungen.

---

## 6. Hinweise zu saisonalen Auszeichnungen

- **Assist King:** meiste Assists einer beendeten Saison; Gleichstände zählen für alle Führenden.
- **Clean Sheet King:** meiste Clean Sheets einer beendeten Saison; Gleichstände zählen für alle Führenden.
- **MVP:** meiste MOTM-Auszeichnungen einer beendeten Saison; Gleichstände zählen für alle Führenden.
- **Keeper of the Year:** bester TW einer beendeten Saison anhand Rating, danach Clean Sheets, danach Saves; mindestens 3 bestätigte Einsätze.
- **Back to Back:** zwei aufeinanderfolgende beendete EPL-Saisons als Meister der höchsten Liga.
- **Invincibles:** eine beendete Club-Saison ohne Niederlage.
- **Promoted:** der Club spielt in der folgenden Saison in einer höheren Liga.
- **Survivor:** der Club beendet die Saison im unteren Tabellendrittel und spielt in der folgenden Saison weiterhin auf derselben Liga-Stufe.
- **Perfect Start:** die ersten fünf Club-Spiele einer Saison werden gewonnen und der Spieler war in allen fünf Partien eingesetzt.

---

## Nicht auf GitHub hochladen

Wie bisher nicht hochladen:

```text
dist/
.wrangler/
node_modules/
.env
.env.*
*.zip
*.rar
```
