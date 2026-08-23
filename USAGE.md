# NeuroTwin — Comprehensive Operations & Usage Manual

Everything you need to configure, run, test, and use the complete NeuroTwin system across Backend, Web Dashboard, and Android Mobile Client.

---

## 📋 System Overview & Components

| Component | Technology | Default URL / Port | Role |
| :--- | :--- | :--- | :--- |
| **Backend Orchestrator** | FastAPI (Python 3.12) | `http://localhost:8000` | REST API, AI pipelines, Qdrant & Supabase sync |
| **Interactive API Docs** | Swagger / OpenAPI | `http://localhost:8000/docs` | Live API testing & schema reference |
| **Senior Web App** | HTML5 / Vanilla JS | `http://localhost:8000/app/` | Lightweight Senior & Caregiver browser UI |
| **Modern Web Dashboard** | React 18 + Vite | `http://localhost:5173/` | Full desktop Caregiver & Patient management portal |
| **Android Client** | Kotlin / Jetpack Compose | Physical Device (Wi-Fi) | Live CameraX Viewfinder, Voice Companion, SOS |
| **Vector Database** | Qdrant Cloud | `https://*.qdrant.io` | 512-d ArcFace & 128-d object vector embeddings |
| **Cloud Database** | Supabase Postgres | `https://*.supabase.co` | Structured records write-through mirror & storage |
| **Reasoning LLM** | Groq Cloud API | `openai/gpt-oss-120b` | Empathetic reasoning & contextual conversation |
| **Speech-to-Text** | Groq Whisper Cloud | `whisper-large-v3` | Fast, accurate voice query transcription |
| **Text-to-Speech** | Piper Neural TTS | `en_US-lessac-medium` | Local real-time natural speech synthesis |

---

## 1. 🚀 First-Time Backend Setup

### Prerequisites
- macOS (Apple Silicon or Intel) or Linux
- Python 3.12+ (managed via `uv` or system Python)

### Step 1: Environment & Dependencies
```bash
cd backend

# Create virtual environment
uv venv --python 3.12 .venv
source .venv/bin/activate

# Install all dependencies
pip install -r requirements.txt
```

### Step 2: Environment Configuration (`backend/.env`)
Create or edit `backend/.env` with your API credentials:

```ini
# Primary LLM & STT Provider (Groq Cloud)
LLM_PROVIDER=groq
GROQ_API_KEY=gsk_your_groq_api_key_here
STT_PROVIDER=groq

# Qdrant Vector Database
QDRANT_URL=https://your-cluster-id.qdrant.io
QDRANT_API_KEY=your_qdrant_api_key_here
QDRANT_COLLECTION_PEOPLE=people
QDRANT_COLLECTION_OBJECTS=objects
FACE_MATCH_THRESHOLD=0.50

# Supabase Cloud Database (Write-Through Sync)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_secret_key_here

# Network & App Config
DEVICE_LAN_IP=192.168.0.198
API_V1_STR=/api/v1
```

### Step 3: Launching the Backend Server
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 2. 🌐 Launching the Web Dashboard

### Caregiver & Patient React Portal (Vite)
```bash
cd dashboard
npm install
npm run dev
```
Open **[http://localhost:5173/](http://localhost:5173/)** in your browser.

- **Desktop Sidebar**: Switch between Caregiver Dashboard, Memories Library, Registered Family & Contacts, Timeline, and Patient Companion.
- **Real-Time Recall Index**: Displays live vector indexing status from Qdrant Cloud.
- **Medication & Memory Manager**: Add or edit prescriptions and cherished life events with automated Supabase sync.

---

## 3. 📱 Android Mobile Client Setup & Usage

### Step 1: Building the APK
```bash
cd mobile
./gradlew assembleDebug
```
The compiled APK is placed at `mobile/app/build/outputs/apk/debug/app-debug.apk` and copied to `backend/static/app-debug.apk`.

### Step 2: Wireless ADB Deployment (No Cables Needed)
1. On your phone, connect to the same Wi-Fi network as your computer.
2. Go to **Settings → Developer Options → Wireless Debugging** and turn it **ON**.
3. Pair or connect using the port shown on your device:
```bash
adb connect 192.168.0.178:XXXXX
adb install -r mobile/app/build/outputs/apk/debug/app-debug.apk
adb shell pm grant com.neurotwin.app android.permission.CAMERA
adb shell pm grant com.neurotwin.app android.permission.RECORD_AUDIO
adb shell monkey -p com.neurotwin.app -c android.intent.category.LAUNCHER 1
```

### Step 3: Using the Mobile App
- **Live AI Camera Viewfinder**: Tap the expand arrow on the **AI Camera Vision** card to view the live preview. The app streams frames to `POST /api/v1/frame` and shows real-time face and object recognition badges.
- **Hold to Talk**: Press and hold the blue microphone button at the bottom, speak naturally (e.g. *"Who is standing in front of me?"* or *"Remember that my keys are on the kitchen table"*), then release to receive an immediate spoken voice response.
- **Quick Question Chips**: Tap *"Who is here?"*, *"Where are my glasses?"*, or *"What medicines today?"* for 1-tap instant answers.
- **Emergency SOS**: Tap the red **CALL SOS** button to dial the primary emergency contact directly.

---

## 4. 🧠 Conversational Memory Saving & Recall

NeuroTwin features automatic memory ingestion directly backed by **Supabase Cloud Postgres**:

### Storing a New Memory / Location
Speak or type queries containing remember intent:
- *"Remember that my blue glasses are on the bedside nightstand"*
- *"Please remember that my grandson Leo loves strawberry gelato"*
- *"Don't forget that Dr. Patel's checkup is on Thursday at 2 PM"*

**What happens:**
1. The AI extracts structured fields (`title`, `description`, `category`, `person_binding`).
2. Persists the record into local storage and synchronizes immediately to the Supabase `memories` table.
3. Speaks a warm confirmation: *"I've safely remembered that for you! Your blue glasses are on the bedside nightstand."*

### Recalling Information
Ask naturally at any later time:
- *"Where are my blue glasses?"* → *"Your blue glasses are right on the bedside nightstand."*
- *"What treat does Leo like?"* → *"Your grandson Leo loves strawberry gelato."*

---

## 5. 🔌 Supabase MCP Server Integration

To manage and inspect your Supabase database directly within Antigravity or AI agents, the Supabase MCP Server is configured in `~/.gemini/antigravity/mcp_config.json`:

```json
{
  "mcpServers": {
    "supabase": {
      "serverUrl": "https://mcp.supabase.com/mcp?project_ref=jhsgxhotzowzjjoridzy&features=docs%2Caccount%2Cdatabase%2Cdebugging%2Cdevelopment%2Cfunctions%2Cbranching"
    }
  }
}
```

### Installed Agent Skills (`.agents/skills/`)
- `supabase`: Full Supabase product suite commands and schema management.
- `supabase-postgres-best-practices`: Performance, RLS security, and index optimization guides.

---

## 6. 🧪 REST API Reference & Testing

### Test Voice Query
```bash
curl -X POST http://127.0.0.1:8000/api/v1/voice-query \
  -H "Content-Type: application/json" \
  -d '{"patient_query": "What medicines do I take today?"}'
```

### Test Camera Frame Stream
```bash
curl -X POST http://127.0.0.1:8000/api/v1/frame \
  -F "file=@backend/static/photos/d29b2602_rob1.jpg"
```

### Test System Health & Telemetry
```bash
curl http://127.0.0.1:8000/api/v1/health
```

---

## 7. 🛠️ Troubleshooting & FAQs

### Q: Why is the app showing "Can't reach backend"?
1. Verify both the Mac/PC and phone are on the same Wi-Fi network.
2. Confirm the Mac's LAN IP in `RetrofitClient.kt` matches your current IP (e.g. `http://192.168.0.198:8000/`).
3. Ensure FastAPI is running on host `0.0.0.0` (not just `127.0.0.1`).

### Q: How do I reset all test/filler data?
Run the reset script in `backend/`:
```bash
cd backend
.venv/bin/python -c "
from app.services import supabase_sync, json_store, people_store
import httpx
headers = supabase_sync._headers()
base = supabase_sync._base()
with httpx.Client(timeout=10.0) as client:
    for tbl in ['memories', 'medicines', 'emergency_contacts', 'people', 'ble_beacons', 'ble_rssi_log']:
        client.delete(f'{base}/{tbl}', params={'id': 'neq.dummy_nonexistent_id'}, headers=headers)
json_store.JSONStore('memories.json').write_all([])
json_store.JSONStore('medicines.json').write_all([])
json_store.JSONStore('emergency_contacts.json').write_all([])
people_store.write_all([])
print('All databases reset to 0 rows!')
"
```
