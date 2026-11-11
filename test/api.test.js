import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createApp } from '../server/app.js';
import { createFakeRepo } from './fake-repo.js';

function starta(repo) {
  return new Promise((resolve) => {
    const server = createApp({ repo }).listen(0, () => {
      resolve({ server, url: `http://localhost:${server.address().port}/api` });
    });
  });
}

const stoppa = (server) => new Promise((resolve) => server.close(resolve));

let s;
before(async () => {
  s = await starta(createFakeRepo());
});
after(() => stoppa(s.server));

function anrop(metod, vag, { klient, body, rå } = {}) {
  const headers = {};
  if (klient) headers['X-Klient-Id'] = klient;
  if (body !== undefined || rå !== undefined) headers['Content-Type'] = 'application/json';
  return fetch(s.url + vag, {
    method: metod,
    headers,
    body: rå ?? (body === undefined ? undefined : JSON.stringify(body)),
  });
}

const skapa = (klient, body = { namn: 'Anna', vad: 'Kanelbullar' }) =>
  anrop('POST', '/fika', { klient, body });

test('GET /halsa ger 200', async () => {
  const r = await anrop('GET', '/halsa');
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { ok: true });
});

test('okänd /api-adress ger 404 med svenskt fel', async () => {
  const r = await anrop('GET', '/finns-inte');
  assert.equal(r.status, 404);
  assert.equal(typeof (await r.json()).fel, 'string');
});

test('POST /fika ger 201, trimmar och döljer klient_id', async () => {
  const klient = randomUUID();
  const r = await skapa(klient, { namn: '  Anna  ', vad: ' Bullar ' });
  assert.equal(r.status, 201);
  const post = await r.json();
  assert.equal(post.namn, 'Anna');
  assert.equal(post.vad, 'Bullar');
  assert.equal(post.egen, true);
  assert.ok(post.id && post.skapad);
  assert.equal('klient_id' in post, false);
});

test('GET /fika listar senaste först och markerar egna', async () => {
  const jag = randomUUID();
  const annan = randomUUID();
  await skapa(annan, { namn: 'Bo', vad: 'Först' });
  await skapa(jag, { namn: 'Cia', vad: 'Sist' });
  const r = await anrop('GET', '/fika', { klient: jag });
  assert.equal(r.status, 200);
  const lista = await r.json();
  const sist = lista.findIndex((p) => p.vad === 'Sist');
  const forst = lista.findIndex((p) => p.vad === 'Först');
  assert.ok(sist < forst, 'senaste ska komma först');
  assert.equal(lista[sist].egen, true);
  assert.equal(lista[forst].egen, false);
  assert.equal('klient_id' in lista[0], false);
});

test('GET /fika utan klient-id ger 200 med egen=false', async () => {
  const r = await anrop('GET', '/fika');
  assert.equal(r.status, 200);
  for (const p of await r.json()) assert.equal(p.egen, false);
});

test('POST /fika ger 400 vid ogiltig indata', async () => {
  const klient = randomUUID();
  const fall = [
    { namn: '', vad: 'x' },
    { namn: '   ', vad: 'x' },
    { namn: 'x', vad: '' },
    { namn: 5, vad: 'x' },
    { namn: 'x', vad: ['a'] },
    { vad: 'x' },
    { namn: 'a'.repeat(51), vad: 'x' },
    { namn: 'x', vad: 'a'.repeat(101) },
  ];
  for (const body of fall) {
    const r = await skapa(klient, body);
    assert.equal(r.status, 400, JSON.stringify(body));
    assert.equal(typeof (await r.json()).fel, 'string');
  }
});

test('POST /fika tillåter exakt maxlängd', async () => {
  const r = await skapa(randomUUID(), { namn: 'a'.repeat(50), vad: 'b'.repeat(100) });
  assert.equal(r.status, 201);
});

test('POST /fika ger 400 vid ogiltig JSON', async () => {
  const r = await anrop('POST', '/fika', { klient: randomUUID(), rå: '{trasig' });
  assert.equal(r.status, 400);
  assert.equal((await r.json()).fel, 'Ogiltig JSON i anropet.');
});

test('POST och DELETE ger 400 utan eller med ogiltigt X-Klient-Id', async () => {
  for (const klient of [undefined, 'inte-ett-uuid']) {
    const p = await skapa(klient);
    assert.equal(p.status, 400);
    const d = await anrop('DELETE', `/fika/${randomUUID()}`, { klient });
    assert.equal(d.status, 400);
  }
});

test('DELETE med ogiltigt id i adressen ger 400', async () => {
  const r = await anrop('DELETE', '/fika/abc', { klient: randomUUID() });
  assert.equal(r.status, 400);
});

test('DELETE av egen post ger 204 och posten försvinner', async () => {
  const klient = randomUUID();
  const { id } = await (await skapa(klient)).json();
  const r = await anrop('DELETE', `/fika/${id}`, { klient });
  assert.equal(r.status, 204);
  const lista = await (await anrop('GET', '/fika', { klient })).json();
  assert.equal(lista.some((p) => p.id === id), false);
});

test('DELETE av annans post ger 403 och posten finns kvar', async () => {
  const ägare = randomUUID();
  const { id } = await (await skapa(ägare)).json();
  const r = await anrop('DELETE', `/fika/${id}`, { klient: randomUUID() });
  assert.equal(r.status, 403);
  const lista = await (await anrop('GET', '/fika', { klient: ägare })).json();
  assert.equal(lista.some((p) => p.id === id), true);
});

test('DELETE av okänd post ger 404', async () => {
  const r = await anrop('DELETE', `/fika/${randomUUID()}`, { klient: randomUUID() });
  assert.equal(r.status, 404);
});

test('databasfel ger 500 med svenskt fel på GET, POST och DELETE', async () => {
  const trasig = await starta(createFakeRepo({ fel: true }));
  const klient = randomUUID();
  const h = { 'X-Klient-Id': klient, 'Content-Type': 'application/json' };
  const body = JSON.stringify({ namn: 'A', vad: 'B' });
  const original = console.error;
  console.error = () => {}; // tysta förväntade fel i testutskriften
  try {
    const svar = [
      await fetch(`${trasig.url}/fika`, { headers: h }),
      await fetch(`${trasig.url}/fika`, { method: 'POST', headers: h, body }),
      await fetch(`${trasig.url}/fika/${randomUUID()}`, { method: 'DELETE', headers: h }),
    ];
    for (const r of svar) {
      assert.equal(r.status, 500);
      assert.equal(typeof (await r.json()).fel, 'string');
    }
  } finally {
    console.error = original;
    await stoppa(trasig.server);
  }
});
