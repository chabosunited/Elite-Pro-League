# EPL Admin-/VM-Update

## Was dieses Update behebt

- Spieler und Clubs werden wieder unter **Spieler** und **Teams** geladen.
  - Ursache war ein Fehler in `/api/bootstrap`: Die API fragte nicht vorhandene Felder (`news.published`, `transfers.created_at`, `fee_text`) ab. Dadurch brach der komplette öffentliche Bootstrap ab.
- Spielerprofil und Clubprofil wurden wieder als kompakte EPL-Dashboardseiten aufgebaut, näher an den Referenzbildern.
- Neues Rollen-/Rechtesystem für Admins und Vereinsmanager.

## Admin-Rollen

- `SUPER_ADMIN` – Website-Besitzer/Hauptadmin; einzige Rolle, die andere Benutzer zu Admins ernennen darf.
- `FULL_ADMIN` – alle operativen Admin-Funktionen, aber keine Vergabe weiterer Admin-Rollen.
- `USER_ADMIN` – Benutzer und Spielerprofile.
- `LEAGUE_ADMIN` – Clubs, Vereinsmanager, Saisons, Ligen, Spielplan, Transfers.
- `MATCH_ADMIN` – Matches, Ergebnisse und Matchdaten.
- `NEWS_ADMIN` – ausschließlich News.
- `COIN_ADMIN` – ausschließlich EPL Coins.

## Vereinsmanager (VM)

Ein Hauptadmin/Ligaadmin kann einen registrierten Benutzer als VM eines Clubs einsetzen. Der VM erhält Rechte für:

- Clubseite verwalten
- Ergebnisse des eigenen Clubs einreichen
- Spielerstatistiken des eigenen Clubs eintragen
- Club-Medien verwalten

VM Panel: `/manager`
Admin Panel: `/admin`

## Einmalige Datenbank-Migration

Nach dem Upload dieser Version exakt einmal ausführen:

```bat
cd C:\Users\Matscho\Desktop\Ordner\MEINEWEBSITE\EPL-CLEAN
npx wrangler d1 execute epl-db --remote --file=./migrations/0004_admin_rbac.sql
```

Die Migration setzt den vorhandenen Benutzer `KiLLUMiNAT` automatisch auf `SUPER_ADMIN`.

Falls der Benutzername später anders lautet, kann der Hauptadmin alternativ einmalig direkt in D1 gesetzt werden:

```sql
UPDATE users SET role='SUPER_ADMIN' WHERE lower(username)='DEIN_BENUTZERNAME_KLEIN';
```

## Danach

1. Dateien auf GitHub aktualisieren.
2. Cloudflare Pages Deployment abwarten.
3. Website mit `Strg + F5` neu laden.
4. `/spieler` und `/teams` prüfen.
5. `/admin` öffnen.
6. Unter **Clubs & VM** einem Spieler Vereinsmanager-Rechte geben.

Es sind keine neuen Cloudflare Bindings oder Secrets nötig. `DB`, `MEDIA` und Discord OAuth bleiben unverändert.
