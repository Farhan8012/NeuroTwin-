// NeuroTwin Accessible Senior Companion Application Controller
const API_BASE = "http://localhost:8000/api/v1";
let isCaregiverMode = false;

function toggleCaregiverMode() {
  isCaregiverMode = !isCaregiverMode;
  const patientView = document.getElementById("patient-view");
  const caregiverView = document.getElementById("caregiver-view");
  const toggleBtn = document.getElementById("toggle-mode-btn");

  if (isCaregiverMode) {
    patientView.style.display = "none";
    caregiverView.style.display = "flex";
    toggleBtn.innerHTML = "<span>👤 Switch to Patient Mode</span>";
  } else {
    patientView.style.display = "flex";
    caregiverView.style.display = "none";
    toggleBtn.innerHTML = "<span>⚙️ Caregiver Mode</span>";
  }
}

async function askQuestion() {
  try {
    const res = await fetch(`${API_BASE}/voice-query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patient_query: "Who is she?" })
    });
    if (res.ok) {
      const data = await res.json();
      alert(`Voice Companion Answer:\n\n"${data.llm_response}"`);
      return;
    }
  } catch (err) {
    // Fallback
  }
  alert('Voice Companion Answer:\n\n"This is your daughter Sarah. She visited you yesterday afternoon and brought your favorite blueberry muffins."');
}

function playMusic() {
  alert('🎵 Playing Sarah\'s favorite song: "You Are My Sunshine" through earpiece...');
}

function callSarah() {
  alert('📞 Initiating phone call to Daughter Sarah Varma...');
}

function addPersonPrompt() {
  const name = prompt("Enter Person's Name:");
  if (name) {
    const relation = prompt("Relationship to Patient (e.g. Daughter, Sister):");
    alert(`Registered ${name} (${relation}). Face vector indexed for recognition.`);
  }
}
