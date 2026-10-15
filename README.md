# Danmarksnyheder

Obligatorisk opgave 1 – Map/Markers. En Expo / React Native-app, som viser DR Indlands nyheder på et Danmarkskort.

## Funktioner

- Viser et kort med blå nyhedsmarkører.
- Henter DR Indlands RSS-feed og finder stednavne i overskrifter og beskrivelser.
- Logger automatisk ind som anonym Supabase-bruger og husker sessionen.
- Gemmer markørerne i Supabase uden dubletter og henter brugerens gemte markører til kortet.
- Viser overskrift og sted, når man trykker på en markør.

Løsningen dækker opgavens punkt 1, 3 og 4. Supabase bruges i stedet for Firebase.

## Start projektet

Du skal bruge Node.js, npm og Expo Go på en telefon med en version, som understøtter Expo SDK 57.

```bash
npm ci
cp .env.example .env.local
```

Opsæt derefter Supabase:

1. Opret et Supabase-projekt med Data API aktiveret.
2. Kør `supabase/schema.sql` én gang i projektets SQL Editor. Det opretter tabellen og adgangsreglerne.
3. Aktivér **Allow anonymous sign-ins** under Authentication → Sign In / Providers, og gem.
4. Indsæt projektets URL og publishable key i `.env.local`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://DIT-PROJEKT.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=sb_publishable_DIN-NOEGLE
```

Brug en publishable key, aldrig en secret- eller service-role-nøgle. `.env.local` er udeladt fra Git.

```bash
npx expo start --clear
```

Åbn appen i Expo Go via QR-koden. Ved problemer med det lokale netværk kan Expo tunnel være nødvendigt. Appen er beregnet til iOS/Android, ikke web.

## Afprøvning

- Kontrollér at kortet og nyhedsmarkørerne vises. Antallet afhænger af feedets indhold.
- Tryk på en blå markør for at se overskriften.
- Kontrollér loggen `Markører hentet fra Supabase` og rækkerne under Table Editor → nyhedsmarkorer.
- Genindlæs med samme session og feed: der skal ikke oprettes dubletter.

Lagring og hentning af to markører blev manuelt bekræftet på iOS og i Supabase under udviklingen. Projektet har ikke en opsat lint- eller TypeScript-kontrol.

## Begrænsninger

Appen genkender Bornholm, Gribskov, København, Aarhus, Odense, Aalborg, Esbjerg og Randers. Et match betyder, at stedet omtales; det er ikke nødvendigvis hændelsens præcise sted. Koordinaterne er omtrentlige. Nyheder uden match får ingen markør, og flere markører samme sted kan overlappe.

Nyheder hentes ved skærmens opstart; der er ingen løbende opdatering eller pushnotifikationer. Tidligere gemte nyheder slettes ikke automatisk. Hentning fra databasen sker efter RSS-hentningen, så fejl ved DR kan forhindre indlæsning. Markører tilhører den anonyme bruger; mistes sessionen, kan brugeren ikke genskabe adgangen til sine tidligere rækker. Manuelle markører er fjernet.
