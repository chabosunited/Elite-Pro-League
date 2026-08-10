# EPL – Elite Pro League

Komplette Starter-Plattform für eine Pro-Clubs-Online-Liga im Look der gelieferten Referenzen.

## Enthalten

### Frontend
- EPL Homepage im dunklen Blau/Schwarz-Esports-Look
- Social-Media-Spielerprofile mit Titelbild, Profilbild, Follow-Button, Feed, Highlights, Trophäen und Attributen
- Clubprofile mit Cover, Logo, Follow/Bewerben/Kontakt, Feed, Kader, Spiele, Transfers und Reputation
- Teams, Spielerübersicht, Liga/Spielplan, Tabelle, Transfers, News, Regelwerk
- Shop mit EPL Coins, Cosmetics, Coin-Paketen und Wallet-Verlauf
- Registrierung/Login
- Manager Panel
- League Admin Panel
- Responsive Layout

### Cloudflare Backend
- **Pages Functions** API (`functions/api/[[path]].js`)
- **D1** Schema für Accounts, Profile, Clubs, Verträge, Bewerbungen, Seasons, Matches, Statistiken, Transfers, Social Posts, Shop, Coins, Inventar, Orders, Moderation usw.
- **R2** Upload/Serving für Profilbilder und Titelbilder
- **Turnstile** serverseitige Prüfung für Registrierung/Login
- Session-Cookies (`HttpOnly`, `Secure`, `SameSite=Lax`)
- Passwort-Hashing mit PBKDF2-SHA256 im Workers WebCrypto Runtime
- Optionaler **Stripe Checkout** Adapter für Echtgeld-Käufe von EPL Coins inklusive signiertem Webhook
- Frontend fällt ohne Backend automatisch auf Demo-Daten zurück, damit das Design sofort sichtbar ist

## Projekt starten

```bash
npm install
npm run dev
```

Vite läuft danach lokal und zeigt die Website. Ohne D1/R2 bleibt das Frontend im Demo-Modus.

## Build

```bash
npm run build
```

Cloudflare Pages Output Directory:

```text
dist
```

Build Command:

```text
npm run build
```

## Cloudflare D1 einrichten

```bash
npx wrangler d1 create epl-db
```

Danach in Cloudflare Pages unter **Settings → Bindings** eine D1-Bindung anlegen:

```text
Variable name: DB
Database: epl-db
```

Schema anwenden:

```bash
npx wrangler d1 execute epl-db --remote --file=./migrations/0001_schema.sql
npx wrangler d1 execute epl-db --remote --file=./migrations/0002_seed.sql
```

## Cloudflare R2 einrichten

```bash
npx wrangler r2 bucket create epl-media
```

In Cloudflare Pages → **Settings → Bindings**:

```text
Variable name: MEDIA
R2 bucket: epl-media
```

Die API legt Uploads z. B. so ab:

```text
profiles/19382/avatar-<uuid>.webp
profiles/19382/cover-<uuid>.webp
clubs/54/logo-<uuid>.webp
matches/2026/382/screenshot-<uuid>.webp
```

## Turnstile

In Cloudflare Turnstile eine Site anlegen und anschließend setzen:

Public variable:

```text
TURNSTILE_SITE_KEY=<dein site key>
```

Secret:

```bash
npx wrangler pages secret put TURNSTILE_SECRET --project-name epl-elite-pro-league
```

Ohne `TURNSTILE_SECRET` wird die Prüfung im lokalen Entwicklungsmodus übersprungen. Für Produktion unbedingt setzen.

## Echtgeld-Käufe / Stripe optional aktivieren

Standardmäßig ist das Payment-Feature deaktiviert:

```text
PAYMENTS_ENABLED=false
```

Für Stripe:

```text
PAYMENTS_ENABLED=true
PUBLIC_SITE_URL=https://deine-domain.de
```

Secrets:

```text
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
```

Webhook Route:

```text
https://deine-domain.de/api/payments/stripe/webhook
```

Der Server definiert die Coin-Pakete selbst. Der Browser kann den Preis oder die Coin-Menge dadurch nicht frei manipulieren. Coins werden erst nach einem erfolgreich signierten `checkout.session.completed` Webhook gutgeschrieben.

## Deployment über GitHub + Cloudflare Pages

1. Diesen gesamten Projektordner in dein GitHub Repository pushen.
2. Cloudflare → Workers & Pages → Create → Pages → Git verbinden.
3. Repository auswählen.
4. Build command: `npm run build`
5. Build output directory: `dist`
6. D1 Binding `DB` hinzufügen.
7. R2 Binding `MEDIA` hinzufügen.
8. Variablen/Secrets setzen.
9. Erneut deployen.

Wichtig: Bei Pages Functions empfiehlt sich Git-Deployment oder Wrangler. Die reine Dashboard-Direct-Upload-Variante ist für Pages-Projekte mit Functions nicht der normale Weg.

## Lokaler Pages-Functions-Test

Nach `npm install`:

```bash
npm run build
npx wrangler pages dev dist --d1 DB --r2 MEDIA
```

Für eine lokale D1-Datenbank kannst du zusätzlich das Schema mit Wrangler lokal einspielen.

## API-Auswahl

```text
GET  /api/config
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
POST /api/social/follow
POST /api/clubs
POST /api/applications
POST /api/contracts
GET  /api/profile/:username
GET  /api/club/:slug
GET  /api/standings
GET  /api/fixtures
POST /api/upload
GET  /api/media/:key
GET  /api/wallet
GET  /api/ea/club-info?clubId=...&platform=common-gen5
POST /api/shop/purchase
POST /api/payments/checkout
POST /api/payments/stripe/webhook
```

## Nächste sinnvolle Produktionsschritte

- E-Mail-Verifizierung / Passwort-Reset ergänzen
- Rate Limits für Login, Uploads und Social Actions aktivieren
- R2 Uploads serverseitig zusätzlich normalisieren (z. B. WebP, Crop, Größenlimits)
- Admin-Seiten vollständig mit D1-Live-Daten verbinden
- Match-Result-Workflow (Submit → Gegner bestätigt → Admin-Dispute) ausbauen
- Zusätzliche Saisonziele/Bonusse für das bereits serverseitig vorbereitete Match-Rewards-System konfigurieren
- Rechtstexte/Datenschutz/AGB/Impressum und Zahlungsbedingungen für dein tatsächliches Angebot ergänzen
- Den enthaltenen EA-Club-Info-Proxy bei Bedarf um Match-History/Members erweitern; EA weiterhin als externen, austauschbaren Provider behandeln

---

## Production deployment – genaue Einstellungen

Für diese Version **nicht nur `dist` als ZIP per Dashboard Drag & Drop hochladen**, wenn die API/Registrierung funktionieren soll. Das Projekt nutzt den Ordner `/functions` für Pages Functions. Am einfachsten ist GitHub/GitLab-Integration oder ein Wrangler-Deployment aus dem Projekt-Root.

### Empfohlen: GitHub → Cloudflare Pages

Im GitHub-Repository muss der **Inhalt dieses Projektordners im Repository-Root** liegen, also unter anderem:

```text
/functions
/migrations
/public
/src
index.html
package.json
build.mjs
wrangler.toml
```

Cloudflare Pages Build Settings:

```text
Framework preset: None
Root directory: /
Build command: npm run build
Build output directory: dist
```

### D1

Datenbank anlegen:

```bash
npx wrangler d1 create epl-db
```

Cloudflare Pages → dein Projekt → **Settings → Bindings → Add → D1 database**:

```text
Variable name: DB
D1 database: epl-db
```

Danach Datenbanktabellen auf die Remote-Datenbank anwenden:

```bash
npx wrangler d1 execute epl-db --remote --file=./migrations/0001_schema.sql
npx wrangler d1 execute epl-db --remote --file=./migrations/0002_seed.sql
```

`0002_seed.sql` enthält keine Fake-Spieler oder Fake-Clubs; es initialisiert nur die Grundsaison/Division und Shop-Cosmetics.

### R2

Bucket anlegen:

```bash
npx wrangler r2 bucket create epl-media
```

Cloudflare Pages → dein Projekt → **Settings → Bindings → Add → R2 bucket**:

```text
Variable name: MEDIA
R2 bucket: epl-media
```

Ein öffentlicher R2-Bucket ist nicht erforderlich. Profilbilder, Clublogos und Titelbilder werden über `/api/media/...` aus der Pages Function ausgeliefert.

### Environment Variables

Unter **Settings → Environment variables** für Production setzen:

```text
APP_NAME=EPL - Elite Pro League
PUBLIC_SITE_URL=https://DEINE-DOMAIN.de
TURNSTILE_SITE_KEY=DEIN_TURNSTILE_SITE_KEY
PAYMENTS_ENABLED=false
```

Nach dem ersten Pages-Deployment kannst du für `PUBLIC_SITE_URL` zunächst auch deine `https://<projekt>.pages.dev` URL verwenden.

### Secrets

Turnstile Secret als Secret setzen:

```bash
npx wrangler pages secret put TURNSTILE_SECRET --project-name epl-elite-pro-league
```

Optional für Echtgeld-Coins mit Stripe:

```text
PAYMENTS_ENABLED=true
```

und die Secrets:

```bash
npx wrangler pages secret put STRIPE_SECRET_KEY --project-name epl-elite-pro-league
npx wrangler pages secret put STRIPE_WEBHOOK_SECRET --project-name epl-elite-pro-league
```

Stripe Webhook:

```text
https://DEINE-DOMAIN.de/api/payments/stripe/webhook
```

### Benötigte Bindings zusammengefasst

```text
D1:
DB     → epl-db

R2:
MEDIA  → epl-media
```

**KV wird für diese Version nicht benötigt.**

Nach dem Hinzufügen oder Ändern eines Bindings das Pages-Projekt erneut deployen, damit die Bindings in `context.env` verfügbar sind.

## Bild-Uploads: Zuschneiden + automatische Optimierung

Profilbilder, Clublogos und Titelbilder werden im Browser vor dem Upload bearbeitet und verkleinert:

- Profilbild: 512 × 512 px, WebP, maximal ca. 600 KB
- Clublogo: 512 × 512 px, WebP, maximal ca. 600 KB
- Spieler-Titelbild: 1600 × 500 px, WebP, maximal ca. 1.2 MB
- Club-Titelbild: 1600 × 500 px, WebP, maximal ca. 1.2 MB
- Original-Upload: maximal 10 MB, JPG/PNG/WebP

Der Nutzer erhält einen Editor zum Verschieben und Zoomen. Erst das zugeschnittene WebP wird an `/api/upload` gesendet. Die API akzeptiert für diese Uploads nur optimierte WebP-Dateien innerhalb der Limits und löscht beim Ersetzen eines Profil-/Clubbildes nach Möglichkeit die alte R2-Datei, damit der Speicher nicht unnötig wächst.

Für produktive Uploads muss im Cloudflare-Pages-Projekt ein R2-Binding gesetzt sein:

- Variable: `MEDIA`
- Bucket: `epl-media`
