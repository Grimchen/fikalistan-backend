import express from 'express';

// Bygger Express-appen. Importerar ingen databas, så den är lätt att testa.
export function createApp({ repo } = {}) {
  const app = express();
  app.locals.repo = repo;

  app.use(express.json());

  const api = express.Router();

  api.get('/halsa', (req, res) => {
    res.status(200).json({ ok: true });
  });

  api.use((req, res) => {
    res.status(404).json({ fel: 'Adressen finns inte.' });
  });

  app.use('/api', api);

  // Felhanterare (ogiltig JSON ger 400, allt annat 500).
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ fel: 'Ogiltig JSON i anropet.' });
    }
    console.error(err);
    res.status(500).json({ fel: 'Något gick fel på servern.' });
  });

  return app;
}
