# EPL v7 – Spielplan, Match-Stats, Liga-Filter & Coin-Geschenke

## Einmalige D1-Migration

Nur diese neue Migration ausführen:

```bat
npx wrangler d1 execute epl-db --remote --file=./migrations/0010_schedule_stats_gifts.sql
```

Die Migrationen `0001` bis `0009` nicht erneut ausführen.

## Automatischen Spielplan erzeugen

Admin → **Spielplan & Ergebnisse** → **SPIELPLAN GENERIEREN**.

Modi:

- **Hinrunde**: jeder gegen jeden einmal.
- **Hin- & Rückrunde**: jeder gegen jeden zweimal.
- **Feste Anzahl Spiele pro Team**: z. B. 24 Spiele je Team.

Bei 12 Teams bedeutet eine klassische Hin- & Rückrunde 22 Spiele je Team bzw. 132 Liga-Matches insgesamt. Wenn die EPL stattdessen 24 Spiele je Team vorsieht, wähle den Modus **Feste Anzahl Spiele pro Team** und trage `24` ein; das ergibt 144 Liga-Matches insgesamt.

Automatisch erzeugte Matches besitzen zunächst keinen Termin. Ein VM eines der beiden beteiligten Clubs kann später Datum und Startzeit festlegen.

## Ergebnisse und Spielerstatistiken

Admin → **Spielplan & Ergebnisse** → beim Match **Ergebnis & Stats**.

Der Admin kann für beide Teams erfassen:

- Endstand
- eingesetzte Spieler
- Tore
- Assists
- Torwart-Saves
- Clean Sheet
- Gelbe / Rote Karten
- Rating
- MOTM

VM → **Matches & Stats**:

- **Termin setzen / ändern**: Heim- oder Auswärts-VM darf den Termin setzen.
- **Ergebnis melden**: Match-Ergebnis einreichen.
- **Eigene Team-Stats**: ausschließlich die Spielerstatistiken des eigenen Clubs erfassen.

## Clubs

Normale Benutzer können keine Clubs mehr selbst gründen. Clubs werden ausschließlich im Admin Panel angelegt und dort einem VM zugewiesen.

## Spieler-Verzeichnis

Unter **Spieler** stehen Filter für:

- Alle Spieler
- jede vorhandene Liga / Division
- Free Agents

## Tabellen

Unter **Tabelle** gibt es pro Division einen eigenen Tab. Alle einer Saison/Liga zugeordneten Teams werden bereits vor dem ersten Spiel mit `0` Spielen, `0:0` Toren und `0` Punkten angezeigt.

## EPL Coins schenken

- Spieler → Spieler: auf dem Spielerprofil **Coins schenken**.
- Spieler → Club: auf der Clubseite **Coins schenken**.
- Club → Spieler: VM Panel → Kader → **Lohn/Bonus**.

Geschenke werden sofort gebucht und in einer eigenen Geschenk-Historie protokolliert.

## GitHub / Cloudflare

Nicht hochladen:

- `dist/`
- `.wrangler/`
- `node_modules/`
- `.env*`
- ZIP/RAR-Dateien

Cloudflare bleibt bei:

- Build command: `npm run build`
- Build output: `dist`
- D1 Binding: `DB -> epl-db`
- R2 Binding: `MEDIA -> epl-media`

Für v7 sind keine neuen Cloudflare-Variablen oder Bindings erforderlich.
