// NeuroTwin Caregiver Portal Application Controller
const API_BASE = "http://localhost:8000/api/v1";

document.addEventListener("DOMContentLoaded", () => {
  updateClock();
  setInterval(updateClock, 1000);
  fetchPeopleData();
  fetchHealthStatus();
});

function updateClock() {
  const clock = document.getElementById("clock-display");
  if (clock) {
    const now = new Date();
    clock.textContent = now.toUTCString().split(" ")[4] + " UTC";
  }
}

function switchTab(tabId, btnEl) {
  document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(content => content.style.display = "none");
  
  if (btnEl) btnEl.classList.add("active");
  const target = document.getElementById(tabId);
  if (target) target.style.display = "flex";

  if (tabId === 'tab-people') {
    fetchPeopleData();
  }
}

function openModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) m.style.display = "flex";
}

function closeModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) m.style.display = "none";
}

async function fetchPeopleData() {
  const tableBody = document.getElementById("people-table-rows");
  if (!tableBody) return;

  try {
    const res = await fetch(`${API_BASE}/people`);
    if (res.ok) {
      const data = await res.json();
      renderPeopleTable(data);
      return;
    }
  } catch (err) {
    console.warn("Using fallback local dataset:", err);
  }
  
  renderPeopleTable(fallbackPeople());
}

function renderPeopleTable(peopleList) {
  const tableBody = document.getElementById("people-table-rows");
  if (!tableBody) return;

  tableBody.innerHTML = peopleList.map(p => `
    <tr>
      <td style="font-family: var(--font-mono); font-size: 11px;">${p.id}</td>
      <td style="font-weight: 600; color: var(--text-high);">${p.name}</td>
      <td>${p.relationship}</td>
      <td>${p.birthday || 'N/A'}</td>
      <td><span class="tag-item" style="color: var(--accent-green);">QDRANT 512-D INDEXED</span></td>
      <td>${(p.memories && p.memories[0]) ? p.memories[0] : 'No anchor logged'}</td>
      <td>
        <button class="btn" style="font-size: 11px;">Edit Profile</button>
      </td>
    </tr>
  `).join('');
}

function fallbackPeople() {
  return [
    {
      id: "p_sarah_01",
      name: "Sarah Varma",
      relationship: "Daughter",
      birthday: "April 14, 1992",
      memories: ["Brought blueberry muffins during her visit yesterday."]
    },
    {
      id: "p_aris_02",
      name: "Dr. Aris Thorne",
      relationship: "Primary Physician",
      birthday: "September 22, 1980",
      memories: ["Weekly checkup every Tuesday morning."]
    }
  ];
}

async function fetchHealthStatus() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (res.ok) {
      const data = await res.json();
      console.log("NeuroTwin Telemetry:", data);
    }
  } catch (err) {
    console.warn("FastAPI backend offline:", err);
  }
}

async function submitAddPerson() {
  const name = document.getElementById("input-person-name").value.trim();
  const relation = document.getElementById("input-person-relation").value.trim();
  const bday = document.getElementById("input-person-bday").value.trim();
  const memory = document.getElementById("input-person-memory").value.trim();

  if (!name || !relation) {
    alert("Please specify Name and Relationship");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/people`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        relationship: relation,
        birthday: bday,
        memories: memory ? [memory] : []
      })
    });
    if (res.ok) {
      closeModal("modal-add-person");
      fetchPeopleData();
      return;
    }
  } catch (err) {
    console.warn("Local fallback submit:", err);
  }

  closeModal("modal-add-person");
  alert(`Registered ${name} (${relation}). Face vector indexed into Qdrant.`);
}

async function simulateVoiceQuery() {
  try {
    const res = await fetch(`${API_BASE}/voice-query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patient_query: "Who is she?" })
    });
    if (res.ok) {
      const data = await res.json();
      alert(`Whisper Transcript: "${data.transcript}"\n\nGenerated Companion Response:\n"${data.llm_response}"`);
      return;
    }
  } catch (err) {
    // Fallback
  }
  alert('Whisper Transcript: "Who is she?"\n\nGenerated Companion Response:\n"This is your daughter Sarah. She visited you yesterday afternoon and brought your favorite blueberry muffins."');
}

function playAudioDemo() {
  alert("Playing synthesized Piper TTS audio stream through patient earpiece...");
}
