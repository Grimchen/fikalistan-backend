import { createMemoryRepo } from '../server/repo.memory.js';

// Låtsasdatabas för testerna. Med { fel: true } kastar alla anrop (för 500-tester).
export function createFakeRepo({ fel = false } = {}) {
  const repo = createMemoryRepo();
  if (!fel) return repo;
  const kasta = async () => {
    throw new Error('Databasen är nere (test)');
  };
  return { list: kasta, get: kasta, create: kasta, remove: kasta };
}
