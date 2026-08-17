# EPL v22 – Header/Slider/Footer & Club Control Center

## Änderungen
- v21 Desktop-Zoom entfernt, der den gesamten Shell-Bereich auf ca. 90,9 % Breite verkürzt hatte.
- Header, Startseiten-Slider und Footer laufen auf Desktop wieder über die vollständige Browserbreite.
- Desktop-UI bleibt trotzdem deutlich größer: Header, Navigation, Buttons, Slider-Typografie, Karten und Seitenüberschriften wurden gezielt vergrößert statt die komplette Website per CSS-Zoom zu skalieren.
- Club Control Center optisch überarbeitet.
- Clublogo wird transparent als Wasserzeichen in der oberen Club-Control-Center-Box angezeigt.
- Tabs `ÜBERSICHT`, `KADER`, `BEWERBUNGEN`, `SAISONZIELE`, `MATCHES & STATS`, `CLUBSEITE` funktionieren jetzt als echte Inhaltsnavigation.
- Fehler behoben, durch den `hidden` bei Manager-Sektionen von `display:grid` überschrieben wurde und mehrere Bereiche gleichzeitig sichtbar blieben.
- Beim Klick wird der gewählte Bereich eingeblendet, als aktiv markiert und weich in den sichtbaren Bereich gescrollt.
- Der zuletzt gewählte Manager-Tab bleibt bei internen Aktualisierungen des Control Centers erhalten.

## Datenbank
Keine neue D1-Migration erforderlich.
