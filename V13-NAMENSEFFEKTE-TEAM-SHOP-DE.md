# EPL v13 – Namensstyles, VM-Team-Shop und Anderes

## Neue Shop-Bereiche

### Namenseffekte
Der Namenslook ist jetzt modular und kann aus drei gekauften Komponenten kombiniert werden:

- **Schriftart** – Classic Bold, Rounded Pro, Serif Elite, Script Star, Mono Tech, Impact, Pixel Club, Wide Elite
- **Effekt** – Stabil, Farbverlauf, Neon, Toon, Pop, Glitch, Hologram, Pulse, Ice, Fire
- **Farbe** – EPL Blue, Cyan, Mint, Green, Violet, Pink, Red, Gold, Orange, Platinum

Im Shop wird jede Option live mit dem eigenen EPL-Benutzernamen dargestellt. Gekaufte Komponenten werden unter **Profil → Profil & Cosmetics** unabhängig voneinander ausgerüstet und können kombiniert werden.

### Team / VM
Dieser Bereich wird nur für Vereinsmanager und Co-Manager angezeigt und wird aus der **Clubkasse** bezahlt.

- **5 Spieler-Entlassungen** – 1.200 Club-Coins
- **5 Spieler-Transfers** – 1.500 Club-Coins
- **Rote Karte entfernen** – 750 Club-Coins pro Credit

Transfer-Credits werden bei einem Vertragsangebot reserviert und bei Ablehnung zurückgegeben. Bewerbungen anzunehmen verbraucht ebenfalls einen Transfer-Credit. Eine Entlassung verbraucht einen Entlassungs-Credit. Eine rote Karte kann im VM-Spielereditor mit einem entsprechenden Credit entfernt werden.

### Anderes
- **Verifiziert-Haken** – 2.500 EPL Coins
- **Profile Spotlight** – 1.800 EPL Coins
- **EPL Supporter Badge** – 900 EPL Coins

Die Preise können später weiterhin unter **Admin → Shop & Bundles → Bearbeiten** angepasst werden.

## Installation
Nur die neue Migration ausführen:

```bat
npx wrangler d1 execute epl-db --remote --file=./migrations/0015_name_styles_team_shop_other.sql
```

Migrationen `0001` bis `0014` nicht erneut ausführen.

Danach die neue v13 auf GitHub hochladen. Nicht hochladen: `dist/`, `.wrangler/`, `node_modules/`, `.env`, ZIP/RAR.

Keine neuen Cloudflare-Variablen, Secrets, D1-Datenbanken oder R2-Bindings sind notwendig.
