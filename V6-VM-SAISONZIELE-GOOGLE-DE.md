# EPL v6 – VM, Saisonziele, Moderation & Google Login

## Datenbank-Update
Nur die neue Migration ausführen:

```bash
npx wrangler d1 execute epl-db --remote --file=./migrations/0009_vm_goals_google.sql
```

Die Migration ergänzt:
- bezahlte Spieler- und Club-Saisonziele
- bis zu 5 Ziele pro Saison
- Clubkasse + Club-Coin-Verlauf
- weitere Feldspieler-, Torhüter- und Clubziele
- Kaderstatus (Startelf / Bank / Reserve / Kader)

## VM Panel
VM können jetzt:
- Spielerposition und Nebenposition bearbeiten
- Trikotnummer ändern
- Startelf / Bank / Reserve festlegen
- Kapitän oder Co-Manager ernennen
- Spieler aus dem Kader entfernen
- Bewerbungen annehmen / ablehnen
- Clubseite bearbeiten
- Club-Saisonziele kaufen
- Ergebnisse melden
- Match-Statistiken eintragen

## Saisonziele
Saisonziele kosten EPL Coins. Bei Erfolg wird die doppelte Einsatzsumme ausgezahlt.
Beispiel: `10 Saisonsiege` kostet 225 Club-Coins und zahlt 450 Club-Coins aus.

Spieler wählen ihre Ziele im eigenen Spielerprofil unter `Saisonziele`. Clubziele werden im VM Panel gewählt.

## Admin – Match eintragen
`Admin -> Spielplan & Ergebnisse`
1. `+ MATCH` anklicken.
2. Saison, Liga, Spieltag, Termin, Heim- und Auswärtsteam wählen.
3. Speichern.
4. In der Match-Zeile `Ergebnis` anklicken.
5. Heim-/Auswärtstore eintragen und bestätigen.

## Admin – Moderation
`Admin -> Moderation & Meldungen -> ANSEHEN` öffnet jetzt die Meldung zusammen mit dem gemeldeten Inhalt, bevor entschieden wird.

## Google OAuth
Die Anwendung unterstützt Google bereits serverseitig. In Cloudflare müssen `GOOGLE_CLIENT_ID` und `GOOGLE_CLIENT_SECRET` gesetzt werden. Die Redirect-URI lautet:

`https://eliteproleague.pages.dev/api/auth/oauth/google/callback`

Sie muss in Google exakt so als autorisierte Redirect-URI eingetragen werden.
