import { randomUUID } from 'node:crypto';

// Enkelt repo i minnet. Används tills Supabase kopplas in (steg 4) och i testerna.
export function createMemoryRepo() {
  const poster = [];

  return {
    async list() {
      return [...poster]; // senaste först (create använder unshift)
    },
    async get(id) {
      return poster.find((p) => p.id === id) ?? null;
    },
    async create({ namn, vad, klient_id }) {
      const post = { id: randomUUID(), namn, vad, klient_id, skapad: new Date().toISOString() };
      poster.unshift(post); // senaste först
      return post;
    },
    async remove(id) {
      const i = poster.findIndex((p) => p.id === id);
      if (i !== -1) poster.splice(i, 1);
    },
  };
}
