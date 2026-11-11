# Fikalistan – plan

Gemensam fikalista för jobbet. En fullstack-app i ett projekt: React (JavaScript) + Express (REST under `/api`) + Postgres hos Supabase. En enda server på http://localhost:3000 skickar både sidorna och API:et.

**Beslut:** ingen inloggning. Ägarskap via ett slumpat webbläsar-id (UUID i localStorage, skickas som header `X-Klient-Id`). En enda lista. Poster har `namn` + `vad`. Namnet kommer ihåg i localStorage.

## Arkitektur

- `server/app.js` – `createApp({ repo })`: Express, JSON, `/api`-routes, 404 för okänd `/api/*`, felhanterare. Importerar ingen databas, så den är lätt att testa.
- `server/repo.supabase.js` – `@supabase/supabase-js` med `SUPABASE_URL` + `SUPABASE_SECRET_KEY` från `.env`.
- `server/index.js` – läser `.env` och bygger appen. Utveckling: Vite i middleware-läge. Produktion: `express.static('dist')` + SPA-fallback. Port 3000.
- `src/` – React, mobilanpassad, varma färger, svenska.
- `test/api.test.js` – `node --test` med ett in-memory-repo (`test/fake-repo.js`). Appen startas på port 0 och anropas med `fetch`. Rör aldrig Supabase och kräver ingen nyckel.
- Skript: `dev`, `build` (vite build), `start` (NODE_ENV=production), `test`.
- `.env.example`: `SUPABASE_URL=`, `SUPABASE_SECRET_KEY=`, `PORT=3000`.

## Databas

Tabell `public.fikaposter` (migration i `supabase/migrations/`, skickas med `supabase db push`):

| Kolumn | Typ | Regler |
|---|---|---|
| id | uuid | PK, default `gen_random_uuid()` |
| namn | text | not null, check 1–50 tecken efter trim |
| vad | text | not null, check 1–100 tecken efter trim |
| klient_id | uuid | not null (ägare, returneras aldrig i API:et) |
| skapad | timestamptz | not null, default `now()` |

Index på `skapad desc`. Row Level Security slås på utan policies: backenden använder den hemliga nyckeln (kringgår RLS), medan anon/authenticated inte når något.

## API (`/api`)

Fel svarar `{ "fel": "svensk text" }`. Headern `X-Klient-Id` (UUID) krävs på POST och DELETE; GET använder den för fältet `egen`.

| Metod | Adress | Gör | Statuskoder |
|---|---|---|---|
| GET | `/api/halsa` | Hälsokoll | 200 |
| GET | `/api/fika` | Lista, senaste först. Varje post: `id, namn, vad, skapad, egen` | 200, 500 |
| POST | `/api/fika` | Skapar post från `{ namn, vad }` | 201, 400, 500 |
| DELETE | `/api/fika/:id` | Tar bort egen post | 204, 400, 403 (annans post), 404, 500 |
| * | `/api/*` övrigt | Okänd adress | 404 |

Validering (400, svenska felmeddelanden): ogiltig JSON, `namn`/`vad` måste vara text, trimmas, får inte vara tomma, max 50/100 tecken, ogiltigt `X-Klient-Id`, ogiltigt id i adressen.

## Steg

Varje steg görs i en egen session, på en egen branch, och blir en egen pull request.

- [x] **Steg 0 – Repo och dokument.** PLAN.md, AGENTS.md, .gitignore, publikt repo `fikalistan-backend` pushat. *Klart när:* repot syns på GitHub med dessa filer.
- [ ] **Steg 1 – Projektgrund.** package.json (ESM), Express + Vite middleware, React-skal, `.env.example`, build/start. *Klart när:* `npm run dev` visar en sida på http://localhost:3000 och `/api/halsa` svarar 200; `npm run build && npm start` gör detsamma.
- [ ] **Steg 2 – API, validering och tester.** `createApp`, routes, validering, fake-repo, `node --test`. *Klart när:* `npm test` går grönt utan `.env` och täcker alla statuskoder i API-tabellen.
- [ ] **Steg 3 – GitHub Actions.** `.github/workflows/test.yml` på `pull_request` (Node LTS, `npm ci`, `npm test`). *Klart när:* workflowet är grönt på sin egen pull request.
- [ ] **Steg 4 – Databas och Supabase-koppling.** `supabase init`/`link`, migration med RLS, `supabase db push`, `repo.supabase.js`. Användaren klistrar in nyckeln i `.env` själv. *Klart när:* `curl` mot `npm run dev` skapar, listar och tar bort en post, posten finns kvar efter omstart av servern och tabellen har RLS på.
- [ ] **Steg 5 – Gränssnitt.** Formulär (namn ihågkommet), lista med senaste först, Ta bort-knapp bara på egna poster, lägen för tomt/laddar/fel, glad design med varma färger, mobilanpassat. *Klart när:* hela flödet fungerar i webbläsaren på mobilbredd och två webbläsare ser samma lista.
- [ ] **Steg 6 – Putsning.** README (installation, `.env`, kommandon), genomgång av felmeddelanden och tillgänglighet. *Klart när:* en ny person kan köra appen enbart med README.

## Att tänka på

- `supabase link` behöver projektets ref (frågas i steg 4). `supabase login` är redan gjort.
- Klient-id skyddar mot misstag, inte mot någon som vill ställa till det. Det är accepterat.
