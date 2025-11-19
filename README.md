# Wohnheim-Einsatzplaner

Eine kleine, komplett lokale Web-App, mit der du im Wohnheim protokollieren
kannst, wer bei spontanen Aufgaben geholfen hat. So behältst du im Blick, wer
wie oft unterstützt hat und kannst zukünftige Einsätze fair verteilen.

## Funktionen

- Mitgliederliste mit automatischer Zählung der bisherigen Einsätze
- Formular zum Erfassen neuer Aufgaben inkl. Datum, Notiz und smarter Teilnehmer:innenwahl (Suchfeld & Schnellaktionen)
- Schnelles Nachtragen oder Anpassen von Helferlisten
- Speicherung im Browser (LocalStorage) – keine Anmeldung, keine Cloud

## Nutzung

1. Öffne `index.html` in deinem Browser (oder starte z. B. `python -m http.server`
   im Projektordner und rufe `http://localhost:8000` auf).
2. Lege alle Bewohner:innen im Abschnitt "Mitglieder verwalten" an.
3. Erfasse nach jeder erledigten Aufgabe einen neuen Einsatz und hake alle
   Helfenden ab.
4. In der Übersicht kannst du später jederzeit nachvollziehen, wer zuletzt aktiv
   war und Aufgaben gerecht verteilen.

Die Daten bleiben im jeweiligen Browser gespeichert. Wenn du das Gerät oder den
Browser wechselst, exportiere/importiere die Daten über die DevTools oder übertrage
sie manuell.
