import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createApp } from './app.js';
import { createMemoryRepo } from './repo.memory.js';

try {
  process.loadEnvFile();
} catch {
  // .env saknas – det är okej i steg 1.
}

const rot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const produktion = process.env.NODE_ENV === 'production';
const port = Number(process.env.PORT) || 3000;

// Tillfälligt repo i minnet. Supabase-kopplingen kommer i steg 4.
const app = createApp({ repo: createMemoryRepo() });

if (produktion) {
  const dist = path.join(rot, 'dist');
  app.use(express.static(dist));
  app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));
} else {
  const { createServer } = await import('vite');
  const vite = await createServer({
    root: rot,
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(port, () => {
  console.log(`Fikalistan körs på http://localhost:${port}`);
});
