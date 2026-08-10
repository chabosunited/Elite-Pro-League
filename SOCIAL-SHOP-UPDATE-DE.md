# EPL Social + Shop Cosmetics Update

Diese Version baut auf den bereits ausgeführten Migrationen `0001` bis `0004` auf.

## 1. D1 aktualisieren

Im Projektordner ausführen:

```bat
npx wrangler d1 execute epl-db --remote --file=./migrations/0005_social_inventory_presence.sql
```

`0005` nur einmal ausführen. Die alten Migrationen `0001` bis `0004` nicht erneut ausführen.

## 2. Danach Projekt auf GitHub aktualisieren

Den Inhalt dieser Version in das bestehende Repository `chabosunited/Elite-Pro-League` hochladen und die alten Dateien ersetzen. Cloudflare Pages startet danach automatisch ein neues Deployment.

Es werden keine neuen Cloudflare Bindings oder Secrets benötigt. Bestehende Konfiguration bleibt:

- D1 Binding: `DB` → `epl-db`
- R2 Binding: `MEDIA` → `epl-media`
- `PUBLIC_SITE_URL=https://eliteproleague.pages.dev`
- Discord/Google OAuth Variablen bleiben unverändert.

## 3. Neue Funktionen testen

Nach grünem Deployment mit `Strg + F5` neu laden.

### Online-Status
- Eingeloggt = grüner Punkt.
- Wenn kein Heartbeat mehr kommt, wechselt ein Spieler nach ca. 2 Minuten auf offline/grau.
- Abmelden setzt den Status direkt auf offline.

### Spielerprofil
- Profilbild ist quadratisch.
- Tabs: Beiträge, Highlights, Statistiken, Karriere, Clubs und beim eigenen Profil Shop-Inhalte.
- Eigene Beiträge können mit optionalem Bild erstellt werden.
- Beiträge unterstützen ❤️, 🔥, 👏 und ⚽ Reaktionen.
- Kommentare können geliked und beantwortet werden.

### Shop Cosmetics
1. Cosmetic im Shop mit EPL Coins kaufen.
2. Eigenes Spielerprofil öffnen.
3. `Profil & Cosmetics` anklicken.
4. Gekauften Profilbildrahmen, Titelbildrahmen oder Namenseffekt auswählen.
5. Speichern.

### Clubseite
- Manager/VM/Admin kann im Club-Feed als Club posten.
- Club-Tabs sind anklickbar: Feed, Kader, Statistiken, Spiele, Transfers, Galerie.

### Home Social Feed
- Erscheint nur bei eingeloggten Benutzern.
- Zeigt die neuesten Beiträge von Spielern und Clubs, denen der Benutzer folgt.

## Hinweis zu Migration 0005

Die Migration erweitert bestehende Tabellen mit `ALTER TABLE`. Deshalb nicht mehrfach ausführen. Falls Cloudflare meldet, dass eine der Spalten bereits existiert, wurde die Migration bereits angewendet und muss nicht erneut gestartet werden.

### Als Club interagieren
Wenn du Manager/VM eines Clubs bist, erscheint bei Beiträgen die Auswahl **Interagieren als**. Dort kannst du zwischen deinem Spieleraccount und deinem Club wählen. So kann ein Club auf Beiträge reagieren und Kommentare/Antworten als Club veröffentlichen.
