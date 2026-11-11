import { useEffect, useState } from 'react';

function hamtaKlientId() {
  try {
    let id = localStorage.getItem('klientId');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('klientId', id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

const klientId = hamtaKlientId();

async function anropa(url, options = {}) {
  const svar = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Klient-Id': klientId,
      ...options.headers,
    },
  });
  if (svar.status === 204) return null;
  let data = null;
  try {
    data = await svar.json();
  } catch {
    // inget JSON i svaret
  }
  if (!svar.ok) throw new Error(data?.fel || 'Något gick fel. Försök igen.');
  return data;
}

function sparatNamn() {
  try {
    return localStorage.getItem('namn') || '';
  } catch {
    return '';
  }
}

export default function App() {
  const [poster, setPoster] = useState([]);
  const [laddar, setLaddar] = useState(true);
  const [listfel, setListfel] = useState('');
  const [namn, setNamn] = useState(sparatNamn);
  const [vad, setVad] = useState('');
  const [skickar, setSkickar] = useState(false);
  const [formfel, setFormfel] = useState('');

  async function ladda() {
    try {
      setPoster(await anropa('/api/fika'));
      setListfel('');
    } catch (e) {
      setListfel(e.message);
    } finally {
      setLaddar(false);
    }
  }

  useEffect(() => {
    ladda();
  }, []);

  async function laggTill(e) {
    e.preventDefault();
    setSkickar(true);
    setFormfel('');
    try {
      await anropa('/api/fika', {
        method: 'POST',
        body: JSON.stringify({ namn, vad }),
      });
      try {
        localStorage.setItem('namn', namn.trim());
      } catch {
        // localStorage ej tillgängligt
      }
      setVad('');
      await ladda();
    } catch (e) {
      setFormfel(e.message);
    } finally {
      setSkickar(false);
    }
  }

  async function taBort(id) {
    try {
      await anropa(`/api/fika/${id}`, { method: 'DELETE' });
      setPoster((p) => p.filter((x) => x.id !== id));
    } catch (e) {
      setListfel(e.message);
    }
  }

  return (
    <main className="sida">
      <header className="topp">
        <h1>☕ Fikalistan</h1>
        <p>Vem tar med vad till fikat? Skriv upp dig!</p>
      </header>

      <form className="kort" onSubmit={laggTill}>
        <label>
          Ditt namn
          <input
            value={namn}
            onChange={(e) => setNamn(e.target.value)}
            maxLength={50}
            required
            autoComplete="given-name"
          />
        </label>
        <label>
          Vad tar du med?
          <input
            value={vad}
            onChange={(e) => setVad(e.target.value)}
            maxLength={100}
            required
            placeholder="t.ex. kanelbullar"
          />
        </label>
        {formfel && (
          <p className="fel" role="alert">
            {formfel}
          </p>
        )}
        <button type="submit" disabled={skickar}>
          {skickar ? 'Sparar…' : 'Lägg till 🍪'}
        </button>
      </form>

      <section aria-live="polite">
        <h2>På listan</h2>
        {laddar && <p className="info">Laddar fikalistan…</p>}
        {listfel && (
          <p className="fel" role="alert">
            {listfel}{' '}
            <button type="button" className="liten" onClick={ladda}>
              Försök igen
            </button>
          </p>
        )}
        {!laddar && !listfel && poster.length === 0 && (
          <p className="info">Ingen har skrivit upp sig än. Bli först! 🥐</p>
        )}
        <ul className="lista">
          {poster.map((p) => (
            <li key={p.id} className="kort post">
              <div>
                <strong>{p.namn}</strong> tar med <span>{p.vad}</span>
              </div>
              {p.egen && (
                <button
                  type="button"
                  className="liten fara"
                  onClick={() => taBort(p.id)}
                  aria-label={`Ta bort ${p.vad}`}
                >
                  Ta bort
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
