const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

async function postJson(path, payload) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}.`);
  }

  return data;
}

export const createCircuit = (formula) =>
  postJson('/api/create-circuit', { formula });

export const computeTruthTable = (circuit) =>
  postJson('/api/compute-truth-table', circuit);

export const computePropositionalReduction = (circuit) =>
  postJson('/api/compute-propositional-formula', circuit);
