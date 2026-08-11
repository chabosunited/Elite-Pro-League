# EPL v11 – Mobile Social UX, Home Feed & Messenger Fix

## Änderungen

- Spielerprofile auf Mobile neu ausgerichtet: Social-App-Hierarchie mit Cover, überlappendem quadratischem Profilbild, sauberem Namen/Bio-Bereich, kompakten Aktionen, Statistikraster und eigenständiger Marktwert-Karte.
- EPL-Marktwert wird auf Mobile nicht mehr direkt unter dem Benutzernamen angezeigt.
- Eingeloggt zeigt Home nur noch Header/Slider und den persönlichen EPL Social Feed der gefolgten Spieler/Clubs.
- Mobile Burger-Menü vereinfacht: Achievements und Marktwerte entfernt, da sie über den Daily Hub erreichbar sind.
- Burger-Menü mit modernen SVG-Icons vor News, Tabelle, Transfers, Shop, Regeln, Daily Hub, Profil, Benachrichtigungen, Nachrichten, VM Panel und Admin.
- Drei-Punkte-Menü durch modernes Hamburger-SVG ersetzt und Drawer mit eigenem Header/Schließen-Button modernisiert.
- Messenger-Polling aktualisiert nur noch Nachrichten und Online-Status. Der Texteingabe-Entwurf wird nicht mehr alle 5 Sekunden zerstört.
- Chats können über „Alle Nachrichten“ / Zurück-Pfeil geschlossen werden. `/nachrichten` öffnet nun zunächst die Unterhaltungsliste statt automatisch den ersten Chat.
- Auf Mobile wechselt der Messenger wie eine Chat-App zwischen Unterhaltungsliste und aktivem Chat.

## Installation

Keine neue D1-Migration nötig.

1. Projektdateien mit dieser Version ersetzen.
2. `dist`, `.wrangler`, `node_modules`, `.env`, ZIP/RAR nicht nach GitHub hochladen.
3. Auf GitHub committen/pushen.
4. Cloudflare Pages baut automatisch mit `npm run build`.
5. Nach grünem Deployment im Browser einmal Strg+F5 drücken.

## Empfohlene Tests

1. Mobile `/spieler/<username>` öffnen und Cover/Avatar/Aktionen/Stats prüfen.
2. Mobile Home als eingeloggter Nutzer öffnen: unter Slider darf nur der Social Feed erscheinen.
3. Burger-Menü öffnen: Icons + reduzierte Einträge prüfen.
4. `/nachrichten?c=...` öffnen, mindestens 15 Sekunden tippen ohne zu senden – Text muss erhalten bleiben.
5. Im Chat Zurück-Pfeil / „Alle Nachrichten“ drücken – Unterhaltungsliste muss erscheinen.
6. Desktop Messenger ebenfalls testen; Polling darf den Entwurf nicht mehr löschen.
