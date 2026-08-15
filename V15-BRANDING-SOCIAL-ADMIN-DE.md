# EPL v15 – Branding, Social Profiles & Admin Control Center

## Neu in v15

- Team-Mentions aus v14 bleiben vollständig erhalten (`@chabos-united`, Autocomplete für Spieler + Teams).
- Neues EPL-Logo aus `epllogofont(1).png` oben links und im Footer-Slogan.
- Spieler können eigene Posts und Kommentare löschen.
- VMs/Co-Manager können Posts und Kommentare löschen, die im Namen ihres Clubs erstellt wurden.
- Full-/berechtigte Admins können den EPL-Marktwert eines Spielers manuell überschreiben. Leeres Feld = automatische EPL-Berechnung.
- Discord, TikTok und Twitch können auf Spieler- und Clubprofilen hinterlegt/verlinkt werden.
- Coin-Geschenke zwischen Spielern/Teams sind deaktiviert und aus der Oberfläche entfernt.
- Spielerprofil-Likes wurden entfernt. Club-Likes bleiben aktiv.
- Der defekte Kontakt-Button auf Clubprofilen wurde entfernt; Kontaktaufnahme erfolgt über Bewerben.
- Auf Desktop zeigt der EPL Social Feed unter der EPL-Social-Box die zuletzt neu registrierten Spieler.
- Admin Panel visuell und strukturell überarbeitet: Control-Center-Header, Icon-Navigation, KPI-Karten, Quick Actions, Statusanzeige und modernere Listen/Karten.
- Home-Nächste-Spiele-Abfrage liefert Clublogos für beide Teams korrekt mit aus.

## Migration

Nur die neue Migration ausführen:

```bat
npx wrangler d1 execute epl-db --remote --file=./migrations/0016_social_profiles_market_admin.sql
```

Die Migration ergänzt:

- `profiles.tiktok`
- `profiles.twitch`
- `profiles.market_value_override`
- `club_details.tiktok`
- `club_details.twitch`

Die bereits vorhandenen Discord-Felder werden weiterverwendet.

**0001 bis 0015 nicht erneut ausführen.**

## Admin – Marktwert manuell setzen

`Admin → Benutzer & Rollen → Profil bearbeiten`

Im Feld **Manueller EPL-Marktwert (€)** einen Wert zwischen 250.000 und 50.000.000 eintragen. Wird das Feld geleert, verwendet EPL wieder die automatische Marktwertberechnung.

## Social Links

Spieler:

`Eigenes Profil → Profil & Cosmetics`

Club:

`VM Panel → Clubseite → Bearbeiten`

Unterstützt werden Discord, TikTok und Twitch. HTTPS-Links werden direkt verwendet; für TikTok/Twitch kann auch ein Handle eingetragen werden.

## Eigene Posts/Kommentare löschen

- Spieler: eigener Beitrag/eigener Kommentar → **Löschen**
- VM/Co-Manager: im Namen des verwalteten Clubs geposteter Beitrag/Kommentar → **Löschen**
- Admin-Moderation bleibt zusätzlich bestehen.

## Deployment

Nicht auf GitHub hochladen:

- `dist/`
- `.wrangler/`
- `node_modules/`
- `.env*`
- ZIP/RAR-Dateien

Cloudflare baut `dist` selbst über `npm run build`.

Für v15 sind keine neuen Cloudflare-Secrets oder Bindings erforderlich.
