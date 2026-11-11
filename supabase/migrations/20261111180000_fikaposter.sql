create table public.fikaposter (
  id uuid primary key default gen_random_uuid(),
  namn text not null check (char_length(btrim(namn)) between 1 and 50),
  vad text not null check (char_length(btrim(vad)) between 1 and 100),
  klient_id uuid not null,
  skapad timestamptz not null default now()
);

create index fikaposter_skapad_idx on public.fikaposter (skapad desc);

-- RLS på utan policies: bara backendens hemliga nyckel (som kringgår RLS) når tabellen.
alter table public.fikaposter enable row level security;
