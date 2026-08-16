# EPL v17 – Recht, Datenschutz & Safety

## Neu in v17

- Rechtsseiten: Impressum, Datenschutz, Nutzungsbedingungen, Community-Richtlinien.
- Footer auf jeder Seite mit allen Rechtslinks und „Inhalte melden“.
- Registrierung mit Geburtsdatum.
- Unter 13: keine Kontoerstellung.
- 13–15: Elternzustimmung über zeitlich begrenzten E-Mail-Link.
- Ab 16: normales Profil-Onboarding nach Bestätigung der Rechtsdokumente.
- Account & Datenschutz: Datenauskunft anfordern, JSON-Datenexport, Datenschutzkontakt, Account löschen/anonymisieren.
- Meldefunktion für Posts, Kommentare, Profile, Clubs, News und private Nachrichten.
- Private Nachrichten: Moderatoren erhalten ausschließlich die gemeldete Nachricht und begrenzten unmittelbaren Kontext – kein globaler Chatreader.
- Moderationszentrale mit Melder, Ziel, Zeit, Quelle, Grund, Inhalt, Status, Entscheidungsbegründung und Maßnahme.
- Sperren/Banns mit Regel, Begründung und optionalem Enddatum; Nutzer wird informiert.
- Echtgeld-Shop bleibt unverändert deaktiviert, solange `PAYMENTS_ENABLED=false` gesetzt ist.

## Installation

Nur die neue Migration ausführen:

```bat
npx wrangler d1 execute epl-db --remote --file=./migrations/0018_legal_safety_privacy.sql
```

Die Migration `0001` bis `0017` nicht erneut ausführen.

Danach v17 auf GitHub hochladen und das Cloudflare Pages Production-Deployment abwarten.

## Elternzustimmung 13–15

Die v17 verwendet für den Versand der Zustimmungs-E-Mail die Resend HTTP API. Ohne eingerichteten Versand werden 13–15-Jährige absichtlich noch nicht freigeschaltet; Nutzer ab 16 können sich normal registrieren.

Für den E-Mail-Versand werden in Cloudflare Pages Production benötigt:

- `RESEND_API_KEY` – **Secret**
- `PARENT_CONSENT_FROM_EMAIL` – z. B. `EPL <noreply@eliteproleague.de>`

Der Absender muss zu einer bei Resend verifizierten eigenen Domain gehören. Der Zustimmungslink ist 48 Stunden gültig.

## Hinweise

- Die Original-Rechtstexte liegen zusätzlich im Ordner `legal/` und werden unverändert als Basis für `src/legal.js` mitgeliefert.
- Änderungen an Betreiberangaben, Domain, Zahlungsanbieter oder Tracking müssen später auch in den Rechtstexten nachgezogen werden.
- `dist/`, `.wrangler/`, `node_modules/`, `.env`, ZIP/RAR weiterhin nicht auf GitHub hochladen.
