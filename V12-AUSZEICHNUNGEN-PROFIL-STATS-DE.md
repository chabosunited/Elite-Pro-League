# EPL v12 – Full-Admin Auszeichnungen & kompakte Mobile-Profilstats

## Neu

### Full-Admin Auszeichnungscenter
Unter **Admin → Auszeichnungen** können ausschließlich `SUPER_ADMIN` und `FULL_ADMIN`:

- vorhandene EPL Trophäen vergeben
- vorhandene EPL Badges vergeben
- eine Auszeichnung mehrfach vergeben (Profil zeigt automatisch `×2`, `×5`, ...)
- Achievements manuell freischalten
- freie/custom Auszeichnungen mit Titel, Untertitel und Asset-Key/https-Bild vergeben
- Trophäen/Badges wieder einzeln oder komplett entziehen
- manuell vergebene Achievements/custom Awards entfernen
- die letzten Vergaben im Audit-Verlauf sehen

TOTW bleibt weiterhin im eigenen **Team of the Week** Bereich und wird dort ausschließlich manuell vergeben.

### Gestapelte Profil-Auszeichnungen
Unter **TROPHÄEN & BADGES** werden Mehrfachauszeichnungen zusammengefasst:

- 2× EPL Meister → ein Meister-Asset mit `×2`
- 5× TOTW → ein TOTW-Asset mit `×5`
- 3× EPL Supercup → ein Supercup-Asset mit `×3`

Die TOTW-Anzahl stammt direkt aus den manuellen TOTW-Auswahlen.

### Mobile Profilstatistiken
Der große zweizeilige Statistikblock auf Mobile wurde wieder durch einen kompakten horizontalen Social-Stats-Streifen ersetzt. Follower, Folge ich, Likes, Matches, Tore/Assists bzw. Torwartwerte und Rating lassen sich seitlich wischen.

## Installation
Nur die neue Migration ausführen:

```bat
npx wrangler d1 execute epl-db --remote --file=./migrations/0014_admin_awards_profile_counts.sql
```

Migrationen `0001` bis `0013` nicht erneut ausführen.

Danach den Quellcode auf GitHub hochladen und Cloudflare Pages neu deployen lassen.

Keine neuen Cloudflare-Variablen oder Bindings nötig.
