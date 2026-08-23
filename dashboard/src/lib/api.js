const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const V1 = `${BASE}/api/v1`
const API_KEY = import.meta.env.VITE_NEUROTWIN_API_KEY || ''

function headers(extra = {}) {
  const h = { ...extra }
  if (API_KEY) h['X-API-Key'] = API_KEY
  return h
}

async function request(url, options = {}) {
  const res = await fetch(url, { ...options, headers: headers(options.headers) })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`${res.status} ${res.statusText}: ${detail.slice(0, 200)}`)
  }
  return res.status === 204 ? null : res.json()
}

export const api = {
  baseUrl: BASE,

  // ── Health / telemetry ──────────────────────────────
  getHealth: () => request(`${V1}/health`),

  // ── People (registered faces) ───────────────────────
  listPeople: () => request(`${V1}/people`),
  createPersonWithPhoto: (formData) =>
    request(`${V1}/people/with-photo`, { method: 'POST', body: formData }),
  updatePerson: (id, data) =>
    request(`${V1}/people/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  deletePerson: (id) => request(`${V1}/people/${id}`, { method: 'DELETE' }),

  // ── Memories ────────────────────────────────────────
  listMemories: () => request(`${V1}/memories`),
  createMemory: (data) =>
    request(`${V1}/memories`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  deleteMemory: (id) => request(`${V1}/memories/${id}`, { method: 'DELETE' }),

  // ── Medications ─────────────────────────────────────
  listMedicines: () => request(`${V1}/medicines`),
  createMedicine: (data) =>
    request(`${V1}/medicines`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  deleteMedicine: (id) => request(`${V1}/medicines/${id}`, { method: 'DELETE' }),

  // ── Emergency contacts ──────────────────────────────
  listEmergencyContacts: () => request(`${V1}/emergency-contacts`),
  createEmergencyContact: (data) =>
    request(`${V1}/emergency-contacts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  updateEmergencyContact: (id, data) =>
    request(`${V1}/emergency-contacts/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  deleteEmergencyContact: (id) => request(`${V1}/emergency-contacts/${id}`, { method: 'DELETE' }),

  // ── Objects / locations ─────────────────────────────
  listObjects: () => request(`${V1}/objects`),
  getObjectLocation: (objectClass) => request(`${V1}/objects/${encodeURIComponent(objectClass)}/location`),

  // ── Voice companion pipeline ────────────────────────
  voiceQuery: (patientQuery, visualContext) =>
    request(`${V1}/voice-query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patient_query: patientQuery, visual_context: visualContext ?? null }),
    }),

  audioUrl: (staticPath) => (staticPath ? `${BASE}${staticPath}` : null),
}
