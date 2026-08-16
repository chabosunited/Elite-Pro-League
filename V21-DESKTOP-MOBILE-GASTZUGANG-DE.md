# EPL v21 – Desktop-Skalierung, Mobile-Abstände & Gastzugang

## Desktop
- Die komplette Desktop-Oberfläche wird bei Browser-Zoom 100 % zusätzlich skaliert, damit sie deutlich näher an der bisherigen 125-%-Ansicht wirkt.
- Header, Navigation, Seitenüberschriften, Panels, Tabellen, Liga-Zeilen, Team-/Spielerkarten, Shop, Formulare und Regeltexte wurden zusätzlich vergrößert.
- Mobile Breakpoints werden von dieser Skalierung nicht beeinflusst.

## Mobile
- Globale mobile Seitenbreite auf einen zentrierten Inhaltsbereich mit ca. 15 px Außenabstand je Seite umgestellt.
- Liga, Tabelle, Teams, Spieler, News, Shop und weitere normale Container-Seiten liegen dadurch nicht mehr direkt am Displayrand.
- Header bleibt separat sauber ausgerichtet.
- Karten und Panels erhalten konsistentere Abstände.

## Besucher / Gäste
In der Hauptnavigation sind ohne Anmeldung nur sichtbar:
- Home
- News
- Liga
- Tabelle
- Regeln

Direkt aufrufbare Mitgliederbereiche wie Teams, Spielerprofile, Clubprofile, Transfers, Shop, Marktwerte, Erfolge, Messenger usw. zeigen Gästen eine Mitgliederbereich-Meldung mit Anmelden-/Registrieren-Buttons.

Login/Registrierung sowie rechtlich notwendige Seiten bleiben weiterhin direkt erreichbar.

## Datenbank
Für EPL v21 ist **keine neue D1-Migration** erforderlich. Die letzte benötigte Migration bleibt `0021_default_profile_gender_and_club_logo.sql` aus v20.
