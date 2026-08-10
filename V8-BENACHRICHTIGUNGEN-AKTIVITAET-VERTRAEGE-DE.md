# EPL v8 – Update

## Neue Funktionen

- Benachrichtigungscenter unter `/benachrichtigungen`
  - @Erwähnungen in Posts, Post-Kommentaren und News-Kommentaren
  - Direktnachrichten
  - neue Follower und Profil-/Club-Likes
  - Vertragsangebote und Vertragsantworten
  - Aktivitätsbelohnungen
- @Username wird im Text anklickbar und führt zum Spielerprofil.
- Admin kann Divisionen/Ligen löschen (doppelte Sicherheitsabfrage).
- Admin kann Match-Ergebnisse inklusive Spielerstatistiken auf `SCHEDULED` zurücksetzen.
- Admin kann den kompletten Spielplan einer Saison/Division zurücksetzen.
- Mobile Shop gegen horizontales Seiten-Scrolling gehärtet.
- Moderne SVG-Icons in der Mobile-App-Navigation.
- Club-Reputation wächst durch Matchaktivität, Shopkäufe, erfolgreiche Saisonziele und aktive Online-Zeit der Clubspieler.
- Aktive Benutzer erhalten 10 EPL Coins je 10 aktive Online-Minuten. Die Belohnung erscheint als Toast und Benachrichtigung.
- Teams sind nach `Alle Teams`, den echten Divisionen sowie deren Liga-Zuordnung filterbar.
- VM/Co-Manager können Free Agents auf dem Spielerprofil ein Vertragsangebot senden.
  - Der Free Agent sieht das Angebot im Benachrichtigungscenter.
  - Annahme fügt ihn automatisch dem Kader hinzu und erzeugt einen Transfer.
  - Ablehnung informiert den anbietenden VM.

## Datenbank-Migration

Nur einmal gegen die Remote-D1-Datenbank ausführen:

```bat
npx wrangler d1 execute epl-db --remote --file=./migrations/0011_notifications_mentions_reputation_contracts.sql
```

Nicht erneut 0001–0010 ausführen.

## Deployment

GitHub enthält den Quellcode. Nicht hochladen:

- `dist/`
- `.wrangler/`
- `node_modules/`
- `.env*`
- ZIP/RAR

Cloudflare Pages baut weiterhin mit `npm run build` und Output `dist`.

## Neue Cloudflare-Einstellungen

Keine. Bestehende Bindings/Secrets bleiben unverändert.
