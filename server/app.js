import express from 'express';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_NAMN = 50;
const MAX_VAD = 100;

class Ogiltig extends Error {
  constructor(meddelande) {
    super(meddelande);
    this.status = 400;
  }
}

function klientId(req, { kravs }) {
  const varde = req.get('X-Klient-Id');
  if (varde === undefined || varde === '') {
    if (kravs) throw new Ogiltig('Headern X-Klient-Id saknas.');
    return null;
  }
  if (!UUID.test(varde)) {
    if (kravs) throw new Ogiltig('X-Klient-Id måste vara ett giltigt UUID.');
    return null;
  }
  return varde.toLowerCase();
}

function textfalt(body, falt, etikett, max) {
  const varde = body?.[falt];
  if (typeof varde !== 'string') throw new Ogiltig(`${etikett} måste vara text.`);
  const trimmat = varde.trim();
  if (trimmat.length === 0) throw new Ogiltig(`${etikett} får inte vara tomt.`);
  if (trimmat.length > max) {
    throw new Ogiltig(`${etikett} får vara högst ${max} tecken.`);
  }
  return trimmat;
}

function publik(post, klient) {
  return {
    id: post.id,
    namn: post.namn,
    vad: post.vad,
    skapad: post.skapad,
    egen: klient !== null && post.klient_id === klient,
  };
}

// Bygger Express-appen. Importerar ingen databas, så den är lätt att testa.
export function createApp({ repo } = {}) {
  const app = express();
  app.locals.repo = repo;

  app.use(express.json());

  const api = express.Router();
  const hantera = (fn) => (req, res, next) => fn(req, res).catch(next);

  api.get('/halsa', (req, res) => {
    res.status(200).json({ ok: true });
  });

  api.get(
    '/fika',
    hantera(async (req, res) => {
      const klient = klientId(req, { kravs: false });
      const poster = await repo.list();
      res.status(200).json(poster.map((p) => publik(p, klient)));
    })
  );

  api.post(
    '/fika',
    hantera(async (req, res) => {
      const klient = klientId(req, { kravs: true });
      const namn = textfalt(req.body, 'namn', 'Namn', MAX_NAMN);
      const vad = textfalt(req.body, 'vad', 'Fikat', MAX_VAD);
      const ny = await repo.create({ namn, vad, klient_id: klient });
      res.status(201).json(publik(ny, klient));
    })
  );

  api.delete(
    '/fika/:id',
    hantera(async (req, res) => {
      const klient = klientId(req, { kravs: true });
      if (!UUID.test(req.params.id)) throw new Ogiltig('Ogiltigt id i adressen.');
      const post = await repo.get(req.params.id);
      if (!post) return res.status(404).json({ fel: 'Posten finns inte.' });
      if (post.klient_id !== klient) {
        return res.status(403).json({ fel: 'Du kan bara ta bort dina egna poster.' });
      }
      await repo.remove(post.id);
      res.status(204).end();
    })
  );

  api.use((req, res) => {
    res.status(404).json({ fel: 'Adressen finns inte.' });
  });

  app.use('/api', api);

  // Felhanterare: 400 för ogiltig indata och JSON, annars 500.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ fel: 'Ogiltig JSON i anropet.' });
    }
    if (err.status === 400) {
      return res.status(400).json({ fel: err.message });
    }
    console.error(err);
    res.status(500).json({ fel: 'Något gick fel på servern.' });
  });

  return app;
}
