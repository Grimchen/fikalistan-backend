# AGENTS.md

Fikalistan: gemensam fikalista (React + Express + Supabase). Se [PLAN.md](PLAN.md) för steg, API och databas.

## Alltid
- Svenska i hela gränssnittet och i alla felmeddelanden från API:et.
- Ett steg i PLAN.md per session, på en egen branch (`steg-N-namn`) från `main`. Jobba aldrig direkt på `main`.
- Kör `npm test` och se till att allt går igenom innan pull requesten öppnas.
- Avsluta steget med en pull request som öppnas med `gh pr create`.
- Bocka av steget (`- [x]`) i PLAN.md i samma pull request.
- En server på http://localhost:3000 för både sidor och `/api`. Frontenden pratar bara med vårt eget API, aldrig direkt med Supabase.
- Backenden validerar all indata och svarar 400 med `{ "fel": "…" }` på svenska.
- Row Level Security på alla tabeller. Tabeller skapas som migrationer i `supabase/migrations/` och skickas med `supabase db push`.
- Tester använder en låtsasdatabas, rör aldrig Supabase och kräver ingen nyckel.

## Hemligheter
- Supabase-adress och hemlig nyckel ligger i `.env`, som aldrig committas. Uppdatera `.env.example` när nya variabler tillkommer.
- Användaren klistrar in nyckeln själv. Be aldrig om den i chatten och skriv aldrig ut den.
