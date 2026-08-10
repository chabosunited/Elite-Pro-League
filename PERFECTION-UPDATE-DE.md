# EPL – Elite Pro League: Perfect v4 Update

Dieses Update baut auf dem bereits laufenden Discord-OAuth-, Admin/VM- und Social-System auf.
Bestehende Benutzer, Clubs, D1-Daten und R2-Bilder bleiben erhalten.

## Neu in v4

- Größeres Desktop-Layout bei 100 % Browser-Zoom, auch bei Windows-Display-Skalierung.
- Anklickbare News-Übersicht und vollständige News-Artikel.
- Beitragsbilder behalten ihr ursprüngliches Seitenverhältnis. Sie werden nur auf WebP optimiert/verkleinert.
- Quadratische Spielerbilder mit sauberem Online-/Offline-Status.
- Profilbild- und Titelbildrahmen liegen exakt auf den Ziel-Flächen.
- Shop-Kategorien funktionieren als Filter: Profilbildrahmen, Titelbildrahmen, Namenseffekte, Badges, Bundles.
- Zusätzliche Shop-Assets aus `AssetsShop.zip`: 11 Profilbildrahmen + 9 Titelbildrahmen.
- Vier Bundle-Angebote mit Coin- und optionalem Echtgeldpreis.
- Shop-Inventar/Cosmetics: Profilrahmen, Coverrahmen, Namenseffekt und Haupt-Badge ausrüsten.
- Gekaufte/ausgerüstete Badges werden direkt im Spielerprofil angezeigt.
- Feldspieler- und Torwartdarstellung sind getrennt. TW sehen Saves/Clean Sheets statt Tore/Assists.
- Match-Coin-System für Feldspieler und Torhüter.
- Wählbare Spieler-Saisonziele und Club-Saisonziele mit Fortschritt und Coin-Auszahlung.
- Admin kann Saisonziele am Saisonende abrechnen.
- Community-Meldesystem für Posts, Kommentare, Spieler, Clubs und News.
- Moderationsbereich für Admins; Posts/Kommentare/News können gelöscht und Meldungen bearbeitet werden.
- Bestehende Benutzerverwaltung kann Spieler sperren/bannen.
- Echter Seiteneditor: Seitenüberschriften, feste Textbausteine, Home-Slider und flexible Bild/Text/CTA-Blöcke.
- Home-Slider können hinzugefügt, bearbeitet, sortiert, deaktiviert und gelöscht werden.
- Shop & Bundles können im Admin Panel bearbeitet/angelegt werden.

## 1. Neue Migration EINMAL ausführen

Im Projektordner:

```bat
cd C:\Users\Matscho\Desktop\Ordner\MEINEWEBSITE\EPL-CLEAN
npx wrangler d1 execute epl-db --remote --file=./migrations/0006_platform_perfection.sql
```

Bestätige bei Rückfragen mit `y`.

WICHTIG:
- Nur `0006_platform_perfection.sql` ausführen.
- `0001` bis `0005` NICHT erneut ausführen.
- `0006` ebenfalls nur einmal ausführen, da sie neue Spalten per `ALTER TABLE` anlegt.
- Wenn bei einem späteren erneuten Versuch `duplicate column name` erscheint, wurde 0006 bereits ausgeführt und darf nicht erneut gestartet werden.

## 2. GitHub aktualisieren

Den Inhalt dieses Projektordners in dein bestehendes Repository hochladen und die alten Dateien ersetzen.

Repository:
`chabosunited/Elite-Pro-League`

Cloudflare Pages baut weiterhin automatisch mit:

- Build command: `npm run build`
- Output directory: `dist`
- Production branch: `main`

`dist/` muss nicht manuell in GitHub hochgeladen werden. Cloudflare erzeugt ihn beim Build neu.

## 3. Cloudflare

Es werden keine neuen Bindings benötigt.

Bestehend lassen:

- D1 Binding `DB` → `epl-db`
- R2 Binding `MEDIA` → `epl-media`
- Discord OAuth Variablen/Secrets unverändert

Danach auf das neue grüne Production-Deployment warten und die Website mit `Strg + F5` neu laden.

## 4. Optional: Echtgeld-Zahlungen aktivieren

Coin-Käufe und direkte Echtgeld-Shopkäufe sind im Code vorbereitet. Solange

`PAYMENTS_ENABLED=false`

gesetzt ist, funktionieren Coin-Käufe mit vorhandenen EPL Coins, aber die Echtgeld-Checkout-Funktion bleibt deaktiviert.

Für Stripe erwartet das Projekt später:

- `PAYMENTS_ENABLED=true`
- Secret `STRIPE_SECRET_KEY`
- Secret `STRIPE_WEBHOOK_SECRET`
- Webhook-Endpunkt: `https://eliteproleague.pages.dev/api/payments/stripe/webhook`
- Ereignis mindestens: `checkout.session.completed`

Die Echtgeldpreise können im Admin Panel unter **Shop & Bundles** pro Artikel geändert werden.

## 5. Schnelltest nach Deployment

### News
- `/news` öffnen.
- Einen Artikel anklicken.
- Artikeltext, Bild und Zurück-Link prüfen.

### Spielerprofil
- Eigenes Profil öffnen.
- Quadratisches Profilbild prüfen.
- Online-Punkt sollte während aktiver Sitzung grün sein.
- Unter `Profil & Cosmetics` einen gekauften Rahmen/Badge ausrüsten.
- Rahmen muss exakt über Profil-/Titelbild liegen.
- Badge muss direkt auf der Profil-Startseite sichtbar sein.

### Posts
- Beitrag mit Hochformat-, Querformat- oder quadratischem Bild posten.
- Das Bild darf nicht beschnitten/gestreckt werden.
- Reaktion, Kommentar, Kommentar-Like, Antwort und Melden testen.

### Shop
- Jede Kategorie anklicken.
- Bundle-Filter prüfen.
- Coin-Kauf eines Cosmetics testen.
- Unter `Shop-Inhalte` Inventar prüfen.

### Saisonziele
- Eigenes Profil → `Saisonziele`.
- Bis zu drei passende Ziele auswählen.
- Torhüter bekommen Torwartziele; Feldspieler Feldspielerziele.
- VM Panel → Club-Saisonziele auswählen.
- Admin → `Ligen & Saisons` → am Saisonende `Ziele abrechnen`.

### Admin
- `/admin`
- Moderation & Meldungen prüfen.
- Seiteneditor → Home Slider bearbeiten oder neuen Slide hinzufügen.
- Feste Textbausteine bearbeiten.
- Freien Inhaltsblock auf einer Seite hinzufügen.
- Shop & Bundles bearbeiten.

## Coin-Regeln

Automatische Match-Belohnungen:

- Teilnahme: +20 Coins
- Sieg: +100 Coins
- Tor: +25 Coins je Tor
- Assist: +15 Coins je Assist
- Torwart-Save: +5 Coins je Save, maximal +75 pro Match
- Clean Sheet: +60 Coins
- MOTM: +100 Coins

Zusätzlich gibt es auswählbare Saisonziele für Feldspieler, Torhüter und Clubs. Die konkreten Zielwerte und Belohnungen liegen in D1 und werden bei Saisonabschluss geprüft.
