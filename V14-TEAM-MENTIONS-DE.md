# EPL v14 – Team-Mentions

## Neu
- Spieler und Teams können in Posts, Kommentaren, Antworten und News-Kommentaren mit `@` markiert werden.
- Beim Tippen von `@` erscheint eine Autocomplete-Liste mit **SPIELER** und **TEAM**.
- Ein Team wird über seinen Club-Slug eingefügt, z. B. `@chabos-united`, aber auf Klick zur Clubseite aufgelöst.
- Auch kompakte Eingaben wie `@chabosunited` oder ein eindeutiger Präfix wie `@chabos` können serverseitig auf einen Club aufgelöst werden, sofern es nur einen eindeutigen Treffer gibt.
- Team-Mentions benachrichtigen Vereinsmanager/Co-Manager bzw. berechtigte Club-Staff-Nutzer.
- Spieler-Mentions funktionieren weiterhin und werden ebenfalls über die neue gemeinsame Mention-Auflösung verlinkt.

## Installation
Für v14 ist **keine neue D1-Migration nötig**. Dateien auf GitHub ersetzen, Cloudflare deployen lassen und danach Strg+F5.

## Benutzung
In einem Beitrag oder Kommentar `@cha` tippen. Danach erscheint z. B.:
- SPIELER – ChabaChuba
- TEAM – Chabos United

Team auswählen → EPL fügt `@chabos-united` ein.
