import { createClient } from '@supabase/supabase-js';

const TABELL = 'fikaposter';
const FALT = 'id, namn, vad, klient_id, skapad';

function kolla({ error }) {
  if (error) throw new Error(error.message);
}

// Repo mot Supabase. Använder den hemliga nyckeln, så det körs bara på servern.
export function createSupabaseRepo({ url, secretKey }) {
  if (!url || !secretKey) {
    throw new Error('SUPABASE_URL och SUPABASE_SECRET_KEY måste finnas i .env.');
  }
  const db = createClient(url, secretKey, { auth: { persistSession: false } });

  return {
    async list() {
      const res = await db.from(TABELL).select(FALT).order('skapad', { ascending: false });
      kolla(res);
      return res.data;
    },
    async get(id) {
      const res = await db.from(TABELL).select(FALT).eq('id', id).maybeSingle();
      kolla(res);
      return res.data;
    },
    async create({ namn, vad, klient_id }) {
      const res = await db.from(TABELL).insert({ namn, vad, klient_id }).select(FALT).single();
      kolla(res);
      return res.data;
    },
    async remove(id) {
      kolla(await db.from(TABELL).delete().eq('id', id));
    },
  };
}
