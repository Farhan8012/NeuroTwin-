// NeuroTwin — Accessible Senior Companion Application Controller
const API_BASE = "http://localhost:8000/api/v1";
let isCaregiverMode = false;

document.addEventListener("DOMContentLoaded", () => {
  loadPeople();
  loadHealth();
  initTabs();
});

// ===================== TAB SWITCHING =====================
function initTabs() {
  const tabBar = document.getElementById("caregiver-tabs");
  if (!tabBar) return;
  tabBar.addEventListener("click", (e) => {
    const btn = e.target.closest(".tab-btn");
    if (!btn) return;
    // Deactivate all
    tabBar.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach((p) => {
      p.style.display = "none";
      p.classList.remove("active");
    });
    // Activate selected
    btn.classList.add("active");
    const panel = document.getElementById(btn.dataset.tab);
    if (panel) {
      panel.style.display = "";
      panel.classList.add("active");
    }
    // Lazy-load data for the tab
    const tabId = btn.dataset.tab;
    if (tabId === "tab-people") loadPeople();
    else if (tabId === "tab-memories") loadMemories();
    else if (tabId === "tab-medicines") loadMedicines();
    else if (tabId === "tab-emergency") loadEmergency();
    else if (tabId === "tab-telemetry") loadHealth();
  });
}

// ===================== MODE TOGGLE =====================
function toggleCaregiverMode() {
  isCaregiverMode = !isCaregiverMode;
  const patientView = document.getElementById("patient-view");
  const caregiverView = document.getElementById("caregiver-view");
  const toggleBtn = document.getElementById("toggle-mode-btn");

  if (isCaregiverMode) {
    patientView.style.display = "none";
    caregiverView.style.display = "flex";
    toggleBtn.innerHTML = "<span>👤 Switch to Patient Mode</span>";
    loadPeople();
    loadHealth();
  } else {
    patientView.style.display = "flex";
    caregiverView.style.display = "none";
    toggleBtn.innerHTML = "<span>⚙️ Caregiver Mode</span>";
  }
}

// ===================== MODAL HELPERS =====================
function openModal(id) {
  document.getElementById(id).style.display = "flex";
}
function closeModal(id) {
  document.getElementById(id).style.display = "none";
}

// ===================== PATIENT VOICE LOOP =====================
async function askQuestion(btn) {
  const button = btn || event.currentTarget;
  const original = button.innerHTML;
  button.innerHTML = "<span>🎙️ Listening…</span>";
  button.disabled = true;
  try {
    const res = await fetch(`${API_BASE}/voice-query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patient_query: "Who is she?" }),
    });
    if (res.ok) {
      const data = await res.json();
      showVoiceResponse(data);
      appendVoiceLog(data);
      button.innerHTML = original;
      button.disabled = false;
      return;
    }
  } catch (err) {
    console.warn("Backend offline:", err);
  }
  alert('Voice Companion Answer:\n\n"This is your daughter Sarah. She visited you yesterday afternoon and brought your favorite blueberry muffins."');
  button.innerHTML = original;
  button.disabled = false;
}

function showVoiceResponse(data) {
  const existing = document.getElementById("voice-answer");
  if (existing) existing.remove();
  const hero = document.querySelector(".hero-card");
  const box = document.createElement("div");
  box.id = "voice-answer";
  box.style.cssText = "border:2px solid var(--accent-gold); border-radius:16px; padding:20px 24px; background:var(--surface-card);";
  box.innerHTML = `
    <div style="font-size:14px; text-transform:uppercase; letter-spacing:.05em; color:var(--accent-gold); font-weight:700;">Voice Companion Answer</div>
    <p style="font-size:20px; color:var(--text-primary); margin:10px 0 14px;">${data.llm_response}</p>
    ${data.tts_audio_url ? `<button class="btn-senior" style="height:56px; font-size:16px; width:100%;" onclick="playAudio('${data.tts_audio_url}')"><span class="btn-icon">🔊</span><span>Play Audio Answer</span></button>` : ""}
  `;
  hero.after(box);
}

function playAudio(url) {
  const full = url.startsWith("http") ? url : `http://localhost:8000${url}`;
  const audio = new Audio(full);
  audio.play().catch(() => alert("Could not play audio stream."));
}

function appendVoiceLog(data) {
  const log = document.getElementById("voice-log");
  if (!log) return;
  const t = new Date().toLocaleTimeString();
  log.innerHTML = `<div style="border-bottom:1px solid var(--border); padding:10px 0;">
    <span style="font-family:monospace; color:var(--text-muted); font-size:13px;">${t}</span>
    <div style="color:var(--text-primary); margin:4px 0;"><strong>Query:</strong> "${data.transcript}"</div>
    <div style="color:var(--text-secondary);">${data.llm_response}</div>
    ${data.tts_audio_url ? `<button class="mode-toggle-btn" style="margin-top:8px; font-size:13px;" onclick="playAudio('${data.tts_audio_url}')">🔊 Play Audio</button>` : ""}
  </div>` + log.innerHTML;
}

// ===================== PEOPLE CRUD =====================
async function loadPeople() {
  const tbody = document.getElementById("caregiver-table-body");
  if (!tbody) return;
  try {
    const res = await fetch(`${API_BASE}/people`);
    if (!res.ok) throw new Error(res.status);
    const people = await res.json();
    if (!people.length) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted);">No registered people yet.</td></tr>`;
      return;
    }
    tbody.innerHTML = people.map((p) => {
      const statusClass = p.vector_status === "indexed" ? "tag-ok" : (p.vector_status === "no_face_detected" ? "tag-none" : "tag-pending");
      const statusLabel = p.vector_status === "indexed" ? "QDRANT INDEXED" : p.vector_status.toUpperCase();
      return `<tr>
        <td style="font-family:monospace; font-size:13px; color:var(--text-muted);">${p.id}</td>
        <td style="font-weight:700; color:var(--text-primary);">${p.name}</td>
        <td>${p.relationship}</td>
        <td>${p.birthday || "—"}</td>
        <td><span class="${statusClass}">${statusLabel}</span></td>
        <td>${(p.memories && p.memories[0]) || "—"}</td>
        <td><button class="mode-toggle-btn" style="font-size:13px;" onclick="deletePerson('${p.id}', '${p.name}')">Delete</button></td>
      </tr>`;
    }).join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted);">Backend offline — start FastAPI on the M4 (port 8000).</td></tr>`;
  }
}

function openAddPerson() { openModal("add-person-modal"); }

async function submitAddPerson() {
  const name = document.getElementById("person-name").value.trim();
  const relation = document.getElementById("person-relation").value.trim();
  const bday = document.getElementById("person-bday").value.trim();
  const memory = document.getElementById("person-memory").value.trim();
  const photoInput = document.getElementById("person-photo");
  const statusEl = document.getElementById("add-person-status");

  if (!name || !relation) {
    statusEl.textContent = "⚠️ Name and Relationship are required.";
    return;
  }

  statusEl.textContent = "Registering + indexing face vector…";
  const formData = new FormData();
  formData.append("name", name);
  formData.append("relationship", relation);
  if (bday) formData.append("birthday", bday);
  if (memory) formData.append("memory", memory);
  if (photoInput.files.length) formData.append("photos", photoInput.files[0]);

  try {
    const res = await fetch(`${API_BASE}/people/with-photo`, { method: "POST", body: formData });
    if (!res.ok) throw new Error(res.status);
    const p = await res.json();
    statusEl.textContent = `✔ Registered ${p.name} — ${p.vector_status.toUpperCase()}.`;
    closeModal("add-person-modal");
    loadPeople();
    // Clear form
    ["person-name", "person-relation", "person-bday", "person-memory"].forEach((id) => (document.getElementById(id).value = ""));
    document.getElementById("person-photo").value = "";
    alert(`Registered ${p.name} (${p.relationship}).\nFace vector status: ${p.vector_status.toUpperCase()}.`);
  } catch (err) {
    statusEl.textContent = "✖ Failed to reach backend. Is FastAPI running on port 8000?";
    console.warn(err);
  }
}

async function deletePerson(id, name) {
  if (!confirm(`Delete ${name} (${id})? This removes their profile AND face vectors from Qdrant.`)) return;
  try {
    const res = await fetch(`${API_BASE}/people/${id}`, { method: "DELETE" });
    if (res.ok) {
      alert(`Deleted ${name}. Face vectors purged.`);
      loadPeople();
    } else {
      alert("Delete failed.");
    }
  } catch (err) {
    alert("Backend offline.");
  }
}

// ===================== MEMORIES CRUD =====================
async function loadMemories() {
  const tbody = document.getElementById("memories-table-body");
  if (!tbody) return;
  try {
    const res = await fetch(`${API_BASE}/memories`);
    if (!res.ok) throw new Error(res.status);
    const memories = await res.json();
    if (!memories.length) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">No memories yet.</td></tr>`;
      return;
    }
    tbody.innerHTML = memories.map((m) => `<tr>
      <td style="font-weight:700; color:var(--text-primary);">${m.title}</td>
      <td>${m.description}</td>
      <td><span class="tag-pending">${(m.category || "story").toUpperCase()}</span></td>
      <td>${m.person_binding || "—"}</td>
      <td><button class="mode-toggle-btn" style="font-size:13px;" onclick="deleteMemory('${m.id}', '${m.title.replace(/'/g, "\\'")}')">Delete</button></td>
    </tr>`).join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">Backend offline.</td></tr>`;
  }
}

function openAddMemory() { openModal("add-memory-modal"); }

async function submitAddMemory() {
  const title = document.getElementById("memory-title").value.trim();
  const desc = document.getElementById("memory-desc").value.trim();
  const category = document.getElementById("memory-category").value;
  const person = document.getElementById("memory-person").value.trim();

  if (!title || !desc) { alert("Title and Description are required."); return; }

  try {
    const res = await fetch(`${API_BASE}/memories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description: desc, category, person_id: person || null }),
    });
    if (!res.ok) throw new Error(res.status);
    closeModal("add-memory-modal");
    loadMemories();
    ["memory-title", "memory-desc", "memory-person"].forEach((id) => (document.getElementById(id).value = ""));
  } catch (err) {
    alert("Failed to save memory. Backend offline?");
  }
}

async function deleteMemory(id, title) {
  if (!confirm(`Delete memory "${title}"?`)) return;
  try {
    const res = await fetch(`${API_BASE}/memories/${id}`, { method: "DELETE" });
    if (res.ok) loadMemories();
    else alert("Delete failed.");
  } catch (err) { alert("Backend offline."); }
}

// ===================== MEDICINES CRUD =====================
async function loadMedicines() {
  const tbody = document.getElementById("medicines-table-body");
  if (!tbody) return;
  try {
    const res = await fetch(`${API_BASE}/medicines`);
    if (!res.ok) throw new Error(res.status);
    const meds = await res.json();
    if (!meds.length) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">No medicines yet.</td></tr>`;
      return;
    }
    tbody.innerHTML = meds.map((m) => `<tr>
      <td style="font-weight:700; color:var(--text-primary);">${m.name}</td>
      <td>${m.dosage}</td>
      <td>${m.schedule_time}</td>
      <td>${m.instructions}</td>
      <td><button class="mode-toggle-btn" style="font-size:13px;" onclick="deleteMedicine('${m.id}', '${m.name.replace(/'/g, "\\'")}')">Delete</button></td>
    </tr>`).join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">Backend offline.</td></tr>`;
  }
}

function openAddMedicine() { openModal("add-medicine-modal"); }

async function submitAddMedicine() {
  const name = document.getElementById("med-name").value.trim();
  const dosage = document.getElementById("med-dosage").value.trim();
  const schedule = document.getElementById("med-schedule").value.trim();
  const instructions = document.getElementById("med-instructions").value.trim();

  if (!name || !dosage) { alert("Name and Dosage are required."); return; }

  try {
    const res = await fetch(`${API_BASE}/medicines`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "", name, dosage, schedule_time: schedule, instructions }),
    });
    if (!res.ok) throw new Error(res.status);
    closeModal("add-medicine-modal");
    loadMedicines();
    ["med-name", "med-dosage", "med-schedule", "med-instructions"].forEach((id) => (document.getElementById(id).value = ""));
  } catch (err) {
    alert("Failed to save medicine. Backend offline?");
  }
}

async function deleteMedicine(id, name) {
  if (!confirm(`Delete medicine "${name}"?`)) return;
  try {
    const res = await fetch(`${API_BASE}/medicines/${id}`, { method: "DELETE" });
    if (res.ok) loadMedicines();
    else alert("Delete failed.");
  } catch (err) { alert("Backend offline."); }
}

// ===================== EMERGENCY CONTACTS CRUD =====================
async function loadEmergency() {
  const tbody = document.getElementById("emergency-table-body");
  if (!tbody) return;
  try {
    const res = await fetch(`${API_BASE}/emergency-contacts`);
    if (!res.ok) throw new Error(res.status);
    const contacts = await res.json();
    if (!contacts.length) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">No contacts yet.</td></tr>`;
      return;
    }
    tbody.innerHTML = contacts.map((c) => `<tr>
      <td style="font-weight:700; color:var(--text-primary);">${c.name}</td>
      <td>${c.relationship}</td>
      <td style="font-family:monospace;">${c.phone}</td>
      <td>${c.is_primary ? '<span class="tag-ok">PRIMARY</span>' : '<span class="tag-none">—</span>'}</td>
      <td><button class="mode-toggle-btn" style="font-size:13px;" onclick="deleteEmergency('${c.id}', '${c.name.replace(/'/g, "\\'")}')">Delete</button></td>
    </tr>`).join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">Backend offline.</td></tr>`;
  }
}

function openAddEmergency() { openModal("add-emergency-modal"); }

async function submitAddEmergency() {
  const name = document.getElementById("em-name").value.trim();
  const relation = document.getElementById("em-relation").value.trim();
  const phone = document.getElementById("em-phone").value.trim();
  const isPrimary = document.getElementById("em-primary").value === "true";

  if (!name || !phone) { alert("Name and Phone are required."); return; }

  try {
    const res = await fetch(`${API_BASE}/emergency-contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "", name, relationship: relation, phone, is_primary: isPrimary }),
    });
    if (!res.ok) throw new Error(res.status);
    closeModal("add-emergency-modal");
    loadEmergency();
    ["em-name", "em-relation", "em-phone"].forEach((id) => (document.getElementById(id).value = ""));
  } catch (err) {
    alert("Failed to save contact. Backend offline?");
  }
}

async function deleteEmergency(id, name) {
  if (!confirm(`Delete contact "${name}"?`)) return;
  try {
    const res = await fetch(`${API_BASE}/emergency-contacts/${id}`, { method: "DELETE" });
    if (res.ok) loadEmergency();
    else alert("Delete failed.");
  } catch (err) { alert("Backend offline."); }
}

// ===================== SYSTEM TELEMETRY =====================
async function loadHealth() {
  const grid = document.getElementById("telemetry-grid");
  if (!grid) return;
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error(res.status);
    const d = await res.json();
    const c = d.components;
    const m = d.system_metrics;
    const q = d.system_metrics.qdrant_vectors || {};
    grid.innerHTML = `
      ${tile("FastAPI", "healthy", "tag-ok")}
      ${tile("Qdrant Vector DB", c.qdrant_vector_db, c.qdrant_vector_db === "connected" ? "tag-ok" : "tag-none")}
      ${tile("Ollama LLM", c.ollama_llm, c.ollama_llm === "active" ? "tag-ok" : "tag-pending")}
      ${tile("Whisper STT", c.whisper_stt, "tag-ok")}
      ${tile("Piper TTS", c.tts_piper, "tag-ok")}
      ${tile("Face Recognition", c.face_recognition, "tag-ok")}
      ${tile("CPU", m.cpu_percent + "%", "tag-pending")}
      ${tile("Memory", m.memory_used_gb + " / " + m.memory_total_gb + " GB", "tag-pending")}
      ${tile("Indexed People", q.people ?? 0, "tag-ok")}
      ${tile("Indexed Objects", q.objects ?? 0, "tag-ok")}`;
  } catch (err) {
    grid.innerHTML = `<div style="grid-column: span 2; color: var(--text-muted);">Backend offline — start FastAPI on the M4 (port 8000).</div>`;
  }
}

function tile(label, value, cls) {
  return `<div style="background:var(--surface-card); border:1px solid var(--border); border-radius:12px; padding:16px;">
    <div style="font-size:13px; text-transform:uppercase; letter-spacing:.05em; color:var(--text-muted);">${label}</div>
    <div class="${cls}" style="font-size:20px; margin-top:6px;">${value}</div>
  </div>`;
}

// ===================== PATIENT ACTIONS =====================
function playMusic() {
  alert('🎵 Playing Sarah\'s favorite song: "You Are My Sunshine" through earpiece...');
}

function callSarah() {
  alert('📞 Initiating phone call to Daughter Sarah Varma...');
}
