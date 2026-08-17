# EPL v21 – Desktop, Mitgliederzugang, VM Control Center & Statistiken

Basis: vom Nutzer erneut bereitgestellter EPL-v20-Stand.

## Änderungen
- Desktop-UI auf echten Layoutgrößen vergrößert (kein CSS-Transform/Browser-Zoom-Hack).
- Gäste erhalten auf `/teams`, `/spieler`, `/spieler/<name>`, `/transfers` und `/shop` eine Mitglieder-Hinweisseite mit Login/Registrierung.
- Club Control Center: Tabs Übersicht, Kader, Bewerbungen, Saisonziele, Matches & Stats und Clubseite schalten zuverlässig zwischen den Bereichen um; aktiver Tab bleibt nach Reloads im Control Center erhalten.
- Clublogo als dezentes transparentes Wasserzeichen im VM-Hero ergänzt.
- Liga-Seite um drei Ranglisten ergänzt: Top-Torschützen, Top-Assistgeber und Top-Torhüter (Clean Sheets + Saves). Die Ranglisten können nach EPL-Liga gefiltert werden und basieren ausschließlich auf bestätigten Matches der aktuellen Saison.
- Tabelle öffnet ohne URL-Filter standardmäßig die Division/Liga mit Level 1; ein explizit benannter `EPL LIGA 1`-Datensatz wird bevorzugt.

## Deployment
Keine neue D1-Migration und keine neuen Secrets/Bindings nötig.

Geänderte Dateien:
- `src/app.js`
- `src/styles.css`
- `functions/api/[[path]].js`
- `package.json`
