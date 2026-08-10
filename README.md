# EPL – Elite Pro League

Cloudflare-Pages-Projekt für eine EA FC Pro Clubs Online Liga mit D1, R2, Google/Discord OAuth, Spielerprofilen, Clubs, Verträgen, Tabellen, Spielplan, News, Shop und Admin-/Manager-Bereichen.

## Authentifizierung

Diese Version verwendet **Google + Discord OAuth 2.0** statt eigener EPL-Passwörter.

Ablauf:

```text
Google / Discord Login
        ↓
Cloudflare Pages Function OAuth Callback
        ↓
EPL Benutzer in D1 anlegen / finden
        ↓
HttpOnly Session Cookie
        ↓
Einmalig Spielerprofil vervollständigen
(EA ID, Plattform, Position, Trikotnummer …)
```

Turnstile ist für Login/Registrierung nicht mehr nötig. Bestehende Turnstile-Einstellungen können für spätere öffentliche Formulare behalten werden.

## Projektstruktur

```text
functions/api/[[path]].js   Cloudflare Pages Functions API
migrations/0001_schema.sql Grundschema
migrations/0002_seed.sql   Saison/Shop-Grunddaten
migrations/0003_oauth.sql  Google/Discord OAuth Tabellen
public/                     Assets, Headers, Redirects
src/app.js                  Frontend / SPA
src/data.js                 statische Inhalte / Assets
src/styles.css              Design
build.mjs                   Build nach dist/
```

## Cloudflare Bindings

```text
DB    -> epl-db
MEDIA -> epl-media
```

## Benötigte Variablen

Normale Variablen:

```text
APP_NAME=EPL - Elite Pro League
PUBLIC_SITE_URL=https://eliteproleague.pages.dev
GOOGLE_CLIENT_ID=...
DISCORD_CLIENT_ID=...
PAYMENTS_ENABLED=false
```

Secrets:

```text
GOOGLE_CLIENT_SECRET=...
DISCORD_CLIENT_SECRET=...
```

## D1 Migration

Wenn `0001_schema.sql` und `0002_seed.sql` bereits ausgeführt wurden, nur noch:

```bash
npx wrangler d1 execute epl-db --remote --file=./migrations/0003_oauth.sql
```

## Build

```bash
npm install
npm run build
```

Cloudflare Pages:

```text
Build command: npm run build
Output directory: dist
Production branch: main
```

## OAuth Redirects

Google:

```text
https://eliteproleague.pages.dev/api/auth/oauth/google/callback
```

Discord:

```text
https://eliteproleague.pages.dev/api/auth/oauth/discord/callback
```

## API Auth Routen

```text
GET  /api/config
GET  /api/auth/oauth/google/start
GET  /api/auth/oauth/google/callback
GET  /api/auth/oauth/discord/start
GET  /api/auth/oauth/discord/callback
POST /api/auth/logout
GET  /api/auth/me
POST /api/profile/setup
```

Die alten Passwort-Endpunkte geben absichtlich HTTP 410 zurück.

## Wichtiger Hinweis zu wrangler.toml

Die Produktionskonfiguration dieses Projekts soll aktuell aus dem **Cloudflare Dashboard** kommen. Liegt im Repository noch eine `wrangler.toml` mit `pages_build_output_dir`, lösche sie vor dem Deployment, sofern du nicht bewusst alle D1/R2/Variablen vollständig in Wrangler verwalten willst.

Eine Schritt-für-Schritt-Anleitung liegt in [`OAUTH-SETUP-DE.md`](./OAUTH-SETUP-DE.md).
