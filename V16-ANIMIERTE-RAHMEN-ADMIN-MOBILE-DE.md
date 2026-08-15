# EPL v16 – Animierte Rahmen & Mobile Admin Navigation

## Neu
- Mobile Admin-Navigation: SVG-Icons werden wieder sichtbar und sind als große Touch-Buttons nutzbar.
- Shop-Kategorie **Animierte Rahmen**.
- Erstes Item: **EPL STORM FRAME** (2200 EPL Coins / 7,99 € vorbereitet).
- Animierte Rahmen teilen sich den Profilbildrahmen-Slot mit normalen Rahmen: immer nur einer aktiv.
- Shop- und Profil-Vorschau unterstützen animierte GIF/APNG/WebP-Dateien.
- Full Admin kann unter **Shop & Bundles** weitere animierte Rahmen anlegen und GIF/APNG/WebP unverändert nach R2 hochladen.

## Installation
Nur Migration 0017 ausführen:
`npx wrangler d1 execute epl-db --remote --file=./migrations/0017_animated_avatar_frames.sql`

## Hinweis zum gelieferten Asset
Die hochgeladene Datei `ProfilrahmenAnimated1.gif` enthält technisch PNG-Bilddaten mit nur einem Frame. v16 behandelt sie deshalb als EPL Motion Frame und erzeugt den sichtbaren Bewegungseffekt zusätzlich per CSS-Glow/Pulse. Echte mehrframe GIF/APNG/WebP Dateien werden von der neuen Upload-Route unverändert gespeichert und nativ animiert dargestellt.
