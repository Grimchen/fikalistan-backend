# ☕ Fikalistan

Gemensam fikalista för jobbet. Skriv upp vad du tar med, se vad andra tar med och ta bort dina egna poster. Ingen inloggning: webbläsaren får ett slumpat id som avgör vilka poster som är dina.

Fullstack i ett projekt: React (Vite) + Express (REST under `/api`) + Postgres hos Supabase. En server på http://localhost:3000 skickar både sidorna och API:et.

## Det här behöver du

- [Node.js](https://nodejs.org/) 20.12 eller nyare (LTS)
- Ett [Supabase](https://supabase.com/)-projekt
- [Supabase CLI](https://supabase.com/docs/guides/cli) (bara för att skapa databastabellen)

## Installation

1. Hämta koden och installera beroenden:

   ```bash
   git clone https://github.com/Grimchen/fikalistan-backend.git
   cd fikalistan-backend
   npm ci
   ```

2. Skapa `.env` från mallen:

   ```bash
   cp .env.example .env
   ```

   Fyll i värdena i `.env`:

   | Variabel | Betydelse |
   |---|---|
   | `SUPABASE_URL` | Projektets adress, t.ex. `https://abcd1234.supabase.co` (Project Settings → API) |
   | `SUPABASE_SECRET_KEY` | Projektets hemliga nyckel (Project Settings → API Keys). Ger full åtkomst, så dela den aldrig och committa aldrig `.env`. |
   | `PORT` | Port för servern. Standard `3000`. |

3. Skapa tabellen i databasen:

   ```bash
   npx supabase login
   npx supabase link --project-ref <ditt-projekt-ref>
   npx supabase db push
   ```

   Projektets ref är den första delen av `SUPABASE_URL` (`abcd1234` i exemplet ovan).

## Kommandon

| Kommando | Gör |
|---|---|
| `npm run dev` | Startar utvecklingsservern på http://localhost:3000 (Vite i middleware-läge) |
| `npm run build` | Bygger frontenden till `dist/` |
| `npm start` | Kör produktionsläge: serverar `dist/` och API:et (kör `npm run build` först) |
| `npm test` | Kör testerna. Använder en låtsasdatabas och kräver ingen `.env` eller nyckel. |

## API

Alla fel svarar `{ "fel": "svensk text" }`. Headern `X-Klient-Id` (UUID) krävs på POST och DELETE.

| Metod | Adress | Gör |
|---|---|---|
| GET | `/api/halsa` | Hälsokoll |
| GET | `/api/fika` | Lista, senaste först |
| POST | `/api/fika` | Skapar post från `{ "namn": "…", "vad": "…" }` (max 50/100 tecken) |
| DELETE | `/api/fika/:id` | Tar bort din egen post |

## Felsökning

- **Listan visar ett fel eller servern kraschar vid start:** kontrollera `SUPABASE_URL` och `SUPABASE_SECRET_KEY` i `.env` och att `npx supabase db push` har körts.
- **Porten är upptagen:** ändra `PORT` i `.env`.
- **Posterna är inte "mina" längre:** ägarskapet ligger i webbläsarens localStorage. Rensas den eller byter du webbläsare får du ett nytt id.

Klient-id skyddar mot misstag, inte mot någon som vill ställa till det.
