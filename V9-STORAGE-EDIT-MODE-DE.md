# EPL v9 – Storage Saver, Home Feed & Full-Admin Edit Mode

## 1. Datenbankmigration

Nur die neue Migration ausführen:

```bat
npx wrangler d1 execute epl-db --remote --file=./migrations/0012_storage_editmode.sql
```

Die Migration protokolliert kostenpflichtige Änderungen von Profil- und Titelbildern. Frühere Migrationen 0001–0011 nicht erneut ausführen.

## 2. GitHub / Cloudflare

Den Quellcode hochladen, aber **nicht** `dist/`, `.wrangler/`, `node_modules/`, `.env`, ZIP oder RAR. Cloudflare baut `dist` mit `npm run build` selbst.

Keine neuen Cloudflare Bindings oder Secrets nötig. `DB -> epl-db`, `MEDIA -> epl-media`, Discord/Google OAuth bleiben unverändert.

## 3. Was v9 ändert

- Keine EPL-Coins mehr durch Online-Zeit. Presence wird nur noch alle fünf Minuten aktualisiert.
- Neue OAuth-Nutzer starten mit 60 EPL Coins.
- Profilbild- oder Titelbildänderung kostet jeweils 10 EPL Coins.
- Uploads werden clientseitig heruntergerechnet und mit WebP-Qualität um ca. 50–60 % komprimiert.
- Posts, Profil-/Titelbilder sowie CMS-/Shop-Bilder unterstützen `https://`-Bild-URLs. URLs belegen keinen R2-Speicher.
- Eingeloggte Nutzer sehen auf Home unter dem Slider nur News, nächste Spiele und Top-Scorer; darunter folgt direkt der Social Feed.
- Nächste Spiele zeigen Heimlogo links und Auswärtslogo rechts.
- Desktop-Header: Benachrichtigungen, Nachrichten und Profil sind kompakte Icons; der Benutzername steht unter dem Profil-Icon.
- Seiteneditor, Shop & Bundles und Moderations-Detailansicht besitzen robustes Event-Handling.
- SUPER_ADMIN und FULL_ADMIN haben einen Edit-Mode-Schalter im Header. In Edit Mode können sichtbare CMS-Slides, CMS-Blöcke und markierte Texte direkt geöffnet und bearbeitet werden.
- Mobile Shop-Breite wurde zusätzlich gegen horizontales Seiten-Scrolling abgesichert.

## 4. Testen

Nach dem grünen Deployment `Strg + F5` drücken und testen:

1. Neues Testkonto anlegen -> 60 Coins.
2. Profilbild hochladen -> 10 Coins Abzug.
3. Titelbild per `https://` URL setzen -> 10 Coins Abzug, kein R2-Upload.
4. Post mit Upload und mit URL testen.
5. Als SUPER_ADMIN Edit Mode einschalten und einen Home-Slide direkt anklicken.
6. Admin -> Seiteneditor: Bearbeiten, + Slide, + Inhaltsblock.
7. Admin -> Shop & Bundles: Shop-Item bearbeiten und neu anlegen.
8. Admin -> Moderation & Meldungen: Ansehen öffnet Meldung plus Zielinhalt.
9. Mobile Shop bei ca. 360–430 px Breite prüfen; die Gesamtseite darf nicht horizontal scrollen.
