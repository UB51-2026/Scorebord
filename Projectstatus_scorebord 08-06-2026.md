# Ulftse Boys Live - Projectstatus

## Projectdoel

App voor trainers/leiders om tijdens wedstrijden snel WhatsApp-updates te maken en te versturen.

Publiek volgt wedstrijden via WhatsApp. De app zelf is bedoeld voor trainers, leiders en scorers.

\---

# Huidige versie

Versie: 0.8

Hosting:

* GitHub
* GitHub Pages

Techniek:

* HTML
* CSS
* JavaScript
* JSON bestanden

\---

# Werkende functies

## Wedstrijdbeheer

* Wedstrijd starten
* Rust
* Start 2e helft
* Wedstrijd beëindigen
* Wedstrijd resetten

## Scorebord

* Thuisteam
* Uitteam
* Live score
* Wedstrijdstatus
* Wedstrijdklok

## Datum \& Tijd

* Datum zichtbaar boven scorebord
* Live klok (uur:minuut:seconde)
* Nederlandse notatie
* Eerste letter dag met hoofdletter

## Blessuretijd

Ondersteund:

* 45+1
* 45+2
* 45+3
* 90+1
* 90+2
* 90+3

## Teams

Wedstrijdtype selectie:

* Voorbereiding
* Beker
* Competitie

Teams worden automatisch gefilterd op wedstrijdtype.

## Spelers

* Spelers laden uit players.json
* Speler selecteren bij doelpunt
* Wisselspeler selecteren

## WhatsApp

* Bericht genereren
* Bericht delen
* Foto meesturen indien beschikbaar

\---

# Huidige teams

## Ulftse Boys

* Ulftse Boys

## Voorbereiding

* Rijnland
* Doesburg
* VIOD

\---

# Spelers Ulftse Boys

* Jelle Kniest
* Stijn Tiecken
* Jochem Robben
* Wouter Bluemink
* Pim Slutter
* Noah van Hal
* Twan Kraan
* Joep Nijenhuis
* Max te Lintum
* Joris Beumer
* Cas Heuvels
* Devin Zweekhorst
* Mats Hegman
* Roel Gebbinck
* Dirk Slutter
* Ties Smeitink
* Luuk Aalders
* Jarl Erinkveld
* Kees Weijers
* Sep te Lintum
* Tygo Egberts
* Sevki Nohut
* Dylan Rutjes

\---

# In ontwikkeling

## WhatsApp sjablonen

Nog uitwerken:

* Wedstrijd gestart
* Doelpunt
* Wissel
* Rust
* Start 2e helft
* Wedstrijd afgelopen

\---

# Geplande functies

## Opstellingen

Formatie kiezen:

* 4-3-3
* 4-4-2
* 3-5-2
* 4-2-3-1
* Eigen formatie

Functies:

* Basiselftal kiezen
* Wisselspelers kiezen
* Opstelling opslaan
* Opstelling delen via WhatsApp
* Visuele veldweergave

## Competities

* Meerdere seizoenen
* Competitie
* Beker
* Voorbereiding

## Historie

* Gespeelde wedstrijden
* Uitslagen
* Opstellingen terugkijken

\---

# Toekomstige versie (Supabase)

Doel:

JSON bestanden vervangen door database.

## Database

* Teams
* Spelers
* Wedstrijden
* Opstellingen
* Competities
* Seizoenen

## Rollen

### Beheerder

* Teams beheren
* Spelers beheren
* Competities beheren
* Gebruikers beheren

### Trainer

* Opstellingen maken (visueel maken) en kunnen delen in whatsapp
* Wedstrijden beheren

### Scorer

* Live score invoeren

\---

# Login

Publieke bezoekers zijn niet nodig.

Iedere gebruiker logt in.

Gebruikers:

* Beheerder
* Trainer
* Scorer

\---

# Gewenste eindoplossing

GitHub Repository (private)
↓
GitHub Pages of alternatief
↓
Supabase
↓
Trainer / Leider / Scorer

Publiek ontvangt updates uitsluitend via WhatsApp.

