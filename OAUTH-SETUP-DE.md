# EPL – Google + Discord Login einrichten

Diese Version verwendet **keine EPL-Passwörter mehr**. Neue und bestehende Nutzer melden sich über Google oder Discord an. Beim ersten Login werden danach nur die Pro-Clubs-Daten ergänzt.

## 0. Wichtig: wrangler.toml entfernen

Dieses Projekt ist für **Cloudflare-Dashboard-Konfiguration** vorbereitet. Wenn in deinem GitHub-Repository noch eine `wrangler.toml` mit `pages_build_output_dir` liegt, lösche sie vor dem nächsten Deployment. Sonst kann die Wrangler-Datei zur Source of Truth werden und deine Dashboard-Variablen/Bindings überschreiben.

## 1. Neue D1-Migration ausführen

Im Projektordner:

```bash
npx wrangler d1 execute epl-db --remote --file=./migrations/0003_oauth.sql
```

Die Migration erstellt:

- `oauth_accounts` – Zuordnung Google/Discord → EPL-Benutzer
- `profile_onboarding` – Profilstatus + Trikotnummer

Die Migration ist so geschrieben, dass vorhandene Spielerprofile erhalten bleiben.

## 2. Google OAuth einrichten

### Google Cloud / Google Auth Platform

1. Öffne die Google Cloud Console und erstelle/verwende ein Projekt, z. B. `EPL Elite Pro League`.
2. Öffne **Google Auth Platform → Branding**.
3. Falls noch nicht eingerichtet: **Get started**.
4. App name: `EPL - Elite Pro League`.
5. User support email: deine Support-E-Mail.
6. Audience: **External**.
7. Solange du testest: unter **Audience → Test users** deine eigene Google-E-Mail hinzufügen.
8. Unter **Data Access** nur die Basis-Scopes für Login verwenden: `openid`, `email`, `profile`.
9. Öffne **Google Auth Platform → Clients → Create client**.
10. Application type: **Web application**.
11. Name: `EPL Website`.
12. Authorized JavaScript origin (optional für diesen serverseitigen Flow, aber okay):

```text
https://eliteproleague.pages.dev
```

13. **Authorized redirect URI** exakt:

```text
https://eliteproleague.pages.dev/api/auth/oauth/google/callback
```

14. Client ID und Client Secret kopieren. Das Secret niemals in GitHub hochladen.

## 3. Discord OAuth einrichten

1. Öffne das Discord Developer Portal.
2. **Applications → New Application**.
3. Name: `EPL - Elite Pro League`.
4. Öffne **OAuth2**.
5. Unter **Redirects** exakt hinzufügen:

```text
https://eliteproleague.pages.dev/api/auth/oauth/discord/callback
```

6. Client ID/Application ID kopieren.
7. Client Secret kopieren bzw. neu erzeugen.
8. Kein Bot ist für den Login nötig.
9. Der Code fordert nur die Scopes `identify` und `email` an.

## 4. Cloudflare Pages Variablen/Secrets

Cloudflare Dashboard → **Workers & Pages → eliteproleague → Settings → Variables and Secrets**.

Als normale Textvariablen:

```text
PUBLIC_SITE_URL=https://eliteproleague.pages.dev
GOOGLE_CLIENT_ID=<deine Google Client ID>
DISCORD_CLIENT_ID=<deine Discord Client ID>
PAYMENTS_ENABLED=false
APP_NAME=EPL - Elite Pro League
```

Als **Secret**:

```text
GOOGLE_CLIENT_SECRET=<dein Google Client Secret>
DISCORD_CLIENT_SECRET=<dein Discord Client Secret>
```

Die vorhandenen D1/R2 Bindings bleiben:

```text
DB    -> epl-db
MEDIA -> epl-media
```

Die alten Turnstile-Variablen dürfen vorerst bestehen bleiben. Login/Registrierung verwendet sie in dieser Version nicht mehr.

## 5. Deployment

GitHub `main` aktualisieren. Cloudflare Pages sollte automatisch neu deployen.

Build command:

```text
npm run build
```

Build output directory:

```text
dist
```

Danach öffnen:

```text
https://eliteproleague.pages.dev/registrieren
```

Es sollten zwei Login-Optionen erscheinen:

- Weiter mit Discord
- Weiter mit Google

Nach dem ersten erfolgreichen OAuth-Login geht es automatisch zu:

```text
/profil-einrichten
```

Dort werden EPL Benutzername, EA ID, Plattform, Land, Haupt-/Nebenposition und Trikotnummer gespeichert.

## 6. Redirect-URI Regel

Die Redirect-URI muss beim Anbieter **exakt** zu der URI passen, die EPL verwendet. Schon ein anderer Hostname, http statt https oder ein zusätzlicher Slash kann OAuth fehlschlagen lassen.

Wenn später eine eigene Domain verwendet wird, z. B. `https://eliteproleague.de`, dann:

1. `PUBLIC_SITE_URL` auf die neue Domain ändern.
2. Bei Google zusätzlich `https://eliteproleague.de/api/auth/oauth/google/callback` eintragen.
3. Bei Discord zusätzlich `https://eliteproleague.de/api/auth/oauth/discord/callback` eintragen.

## 7. Sicherheit

- Google/Discord Client Secrets niemals in GitHub oder Screenshots veröffentlichen.
- EPL speichert kein Google-/Discord-Passwort.
- OAuth verwendet einen zufälligen `state`-Wert gegen Login-CSRF.
- Sessions bleiben in D1 und werden als `HttpOnly`, `Secure`, `SameSite=Lax` Cookie gesetzt.
- OAuth-Zugriffstokens werden nicht dauerhaft in D1 gespeichert.
