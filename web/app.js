// NeuroTwin Caregiver Portal Application Script
const API_BASE = "http://localhost:8000/api/v1";

document.addEventListener("DOMContentLoaded", () => {
  updateClock();
  setInterval(updateClock, 1000);
  fetchHealthStatus();
  fetchRegisteredPeople();
});

function updateClock() {
  const clockEl = document.getElementById("live-clock");
  if (clockEl) {
    const now = new Date();
    clockEl.textContent = now.toUTCString().split(" ")[4] + " UTC";
  }
}

function switchTab(tabName) {
  document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".content-body").forEach(el => el.style.display = "none");
  
  if (tabName === 'overview') {
    document.querySelector(".nav-list li:nth-child(1)").classList.add("active");
    document.getElementById("tab-overview").style.display = "flex";
  } else if (tabName === 'people') {
    document.querySelector(".nav-list li:nth-child(2)").classList.add("active");
    document.getElementById("tab-people").style.display = "flex";
    fetchRegisteredPeople();
  }
}

async function fetchHealthStatus() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (res.ok) {
      const data = await res.json();
      console.log("NeuroTwin Backend Health:", data);
    }
  } catch (err) {
    console.warn("FastAPI backend offline or starting up:", err);
  }
}

async function fetchRegisteredPeople() {
  const container = document.getElementById("people-cards-container");
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/people`);
    if (res.ok) {
      const people = await res.json();
      renderPeopleCards(people);
    }
  } catch (err) {
    console.warn("Using fallback client memory state:", err);
    renderPeopleCards(fallbackPeopleData());
  }
}

function renderPeopleCards(people) {
  const container = document.getElementById("people-cards-container");
  container.innerHTML = people.map(p => `
    <div class="card">
      <div class="card-title">
        <span>${p.name}</span>
        <span class="status-badge" style="font-size: 11px;">Indexed</span>
      </div>
      <div class="meta-list">
        <div class="meta-row">
          <span class="meta-key">RELATIONSHIP</span>
          <span class="meta-val">${p.relationship}</span>
        </div>
        <div class="meta-row">
          <span class="meta-key">BIRTHDAY</span>
          <span class="meta-val">${p.birthday || 'N/A'}</span>
        </div>
      </div>
      <div>
        <div class="meta-key" style="margin-bottom: 4px;">STORIES & MEMORIES</div>
        <ul style="list-style: none; display: flex; flex-direction: column; gap: 4px; font-size: 12px;">
          ${(p.memories || []).map(m => `<li style="padding: 4px 8px; background: var(--bg-panel); border-radius: 4px; border: 1px solid var(--border-quiet);">${m}</li>`).join('')}
        </ul>
      </div>
      <div style="margin-top: auto; display: flex; gap: 8px;">
        <button class="btn" style="flex: 1; font-size: 12px;">Edit Profile</button>
        <button class="btn" style="flex: 1; font-size: 12px;">Add Memory</button>
      </div>
    </div>
  `).join('');
}

function fallbackPeopleData() {
  return [
    {
      id: "p_sarah_01",
      name: "Sarah Varma",
      relationship: "Daughter",
      birthday: "April 14, 1992",
      memories: ["Brought blueberry muffins yesterday.", "Loves Lake Tahoe hikes."]
    },
    {
      id: "p_aris_02",
      name: "Dr. Aris Thorne",
      relationship: "Primary Doctor",
      birthday: "September 22, 1980",
      memories: ["Weekly checkup every Tuesday morning."]
    }
  ];
}

async function triggerTestVoiceQuery() {
  try {
    const res = await fetch(`${API_BASE}/voice-query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patient_query: "Who is she?" })
    });
    if (res.ok) {
      const data = await res.json();
      alert(`Whisper STT: "${data.transcript}"\n\nLLM Companion Response:\n"${data.llm_response}"`);
    }
  } catch (err) {
    alert('Voice Query Demo:\nWhisper Transcript: "Who is she?"\n\nLLM Companion Response:\n"This is your daughter Sarah. She visited you yesterday afternoon and brought your favorite blueberry muffins."');
  }
}
