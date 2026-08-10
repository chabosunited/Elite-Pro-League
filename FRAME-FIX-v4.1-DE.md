# EPL v4.1 – Profilbildrahmen-Fix

Die Profilbildrahmen werden jetzt pixelgenau als 1:1-Overlay auf das quadratische Profilbild gelegt.

## Wichtig für bestehende Cloudflare-D1-Datenbank

Nur diese neue Migration einmal ausführen:

```bat
npx wrangler d1 execute epl-db --remote --file=./migrations/0007_avatar_frame_alignment.sql
```

Die Migration korrigiert das alte Shop-Item 1, das noch auf ein nicht-quadratisches 1536×1024 Asset zeigte, auf den 512×512 Shop-Rahmen.

Danach neue Dateien auf GitHub hochladen, Deployment abwarten und Strg+F5.
