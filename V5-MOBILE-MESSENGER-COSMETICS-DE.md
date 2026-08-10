# EPL v5 – Mobile App, Messenger, Likes, Cosmetics & News Social

## Installation

1. Diese Version über die bisherige EPL-Projektversion kopieren.
2. Nur die neue Migration ausführen:

```bat
npx wrangler d1 execute epl-db --remote --file=./migrations/0008_social_messaging_likes.sql
```

3. Danach die Projektdateien nach GitHub pushen/hochladen.
4. Cloudflare Pages baut weiterhin mit `npm run build` und Output `dist`.
5. Nach dem grünen Deployment Browser mit `Strg + F5` neu laden.

Die vorhandenen Bindings bleiben unverändert:
- `DB` → `epl-db`
- `MEDIA` → `epl-media`

Es sind keine neuen Cloudflare-Secrets erforderlich.

## Neu in v5

- Profilrahmen werden exakt als 1:1-Overlay auf das quadratische Spielerbild gelegt.
- Titelbildrahmen können wieder ausgerüstet werden.
- Der Fehler `Ungültiger Cosmetic-Slot.` ist behoben; Frontend und API verstehen die Slots robust.
- Neues visuelles Profil-&-Cosmetics-Fenster mit Live-Vorschau.
- Gekaufte Inhalte können aus dem Inventar entfernt werden. Vor dem Entfernen erscheinen zwei Warnabfragen; danach muss der Inhalt erneut gekauft werden.
- Shop-Vorschauen wurden verkleinert.
- Spieler- und Clubprofile haben echte Likes.
- Integrierter EPL Messenger für Direktnachrichten; Club-Kontakt schreibt an den Vereinsmanager.
- News unterstützen Reaktionen, Kommentare, Kommentar-Likes und Antworten.
- Footer verwendet lokale Social-Network-Symbole.
- Desktop-Inhalte sind bei 100 % Zoom deutlich größer und besser lesbar.
- Mobile Ansicht wurde wie eine Liga-/Social-Network-App umgebaut: App-Header, Bottom-Navigation, Touch-optimierte Profile, Feed, Shop und Messenger.
- `manifest.webmanifest` ist vorhanden, damit EPL auf unterstützten Smartphones im Standalone-Look zum Homescreen hinzugefügt werden kann.

## Tests nach dem Deployment

1. Eigenes Profil öffnen → `Profil & Cosmetics`.
2. Gekauften Profilrahmen auswählen → Live-Vorschau prüfen → speichern.
3. Gekauften Titelbildrahmen auswählen → speichern.
4. Unter `Shop-Inhalte` testweise einen nicht benötigten Inhalt entfernen und beide Warnungen prüfen.
5. Anderes Spielerprofil öffnen → `LIKE` testen → `Nachricht` testen.
6. Teamprofil öffnen → `LIKE` und `Kontakt` testen.
7. `/nachrichten` öffnen und Nachrichten senden.
8. Newsartikel öffnen → Reaktion, Kommentar, Antwort und Kommentar-Like testen.
9. Website auf Smartphone oder DevTools Mobile View öffnen und Bottom-Navigation prüfen.
