#!/bin/bash
# NeuroTwin full-stack smoke test — run from repo root: ./test_stack.sh
# Exit code 0 = all green.

PASS=0; FAIL=0
ok()   { echo "  ✓ $1"; PASS=$((PASS+1)); }
bad()  { echo "  ✗ $1"; FAIL=$((FAIL+1)); }
check(){ if [ "$1" = "0" ]; then ok "$2"; else bad "$2"; fi }

echo "════════ NeuroTwin Stack Check ════════"

# ── 1. Services listening ──────────────────────────────
echo "── Services ──"
for p in "6333:Qdrant" "8000:FastAPI" "11434:Ollama"; do
  port="${p%%:*}"; name="${p##*:}"
  lsof -i ":$port" 2>/dev/null | grep -q LISTEN && ok "$name :$port" || bad "$name :$port not running"
done
lsof -i :5173 2>/dev/null | grep -q LISTEN && ok "Dashboard :5173" || bad "Dashboard :5173 not running (cd dashboard && npm run dev)"

# ── 2. Backend component health ────────────────────────
echo "── Backend components ──"
H=$(curl -s -m 5 localhost:8000/api/v1/health)
[ "$(echo "$H" | python3 -c 'import json,sys; print(json.load(sys.stdin)["status"])')" = "online" ] && ok "health: online" || bad "health endpoint"
for c in qdrant_vector_db ollama_llm whisper_stt tts_piper face_recognition; do
  S=$(echo "$H" | python3 -c "import json,sys; print(json.load(sys.stdin)['components'].get('$c','?'))")
  echo "$S" | grep -qE "connected|active|ready" && ok "$c: $S" || bad "$c: $S"
done

# ── 3. Data layer: local vs Supabase parity ───────────
echo "── Data parity (local JSON ↔ Supabase) ──"
KEY=$(grep '^SUPABASE_SERVICE_KEY=' backend/.env | cut -d= -f2)
URL=$(grep '^SUPABASE_URL=' backend/.env | cut -d= -f2)
if [ -n "$KEY" ] && [ "$KEY" != "PASTE_YOUR_SERVICE_ROLE_KEY_HERE" ]; then
  for pair in "people:people.json" "memories:memories.json" "medicines:medicines.json" "emergency_contacts:emergency_contacts.json"; do
    table="${pair%%:*}"; file="${pair##*:}"
    CLOUD=$(curl -s -m 8 "$URL/rest/v1/$table?select=id" -H "apikey: $KEY" -H "Authorization: Bearer $KEY" | python3 -c 'import json,sys; print(len(json.load(sys.stdin)))' 2>/dev/null || echo ERR)
    LOCAL=$(python3 -c "import json; print(len(json.load(open('backend/data/$file'))))" 2>/dev/null || echo ERR)
    [ "$CLOUD" = "$LOCAL" ] && ok "$table: $LOCAL = $CLOUD rows" || bad "$table mismatch: local=$LOCAL cloud=$CLOUD"
  done
else
  echo "  (Supabase key not set — skipping parity)"
fi

# ── 4. AI pipeline round-trips ─────────────────────────
echo "── AI pipelines ──"
FR=$(curl -s -m 30 -X POST localhost:8000/api/v1/frame -F "file=@/tmp/nt-test/rob1.jpg" 2>/dev/null)
[ -n "$FR" ] && echo "$FR" | python3 -c '
import json,sys
d=json.load(sys.stdin)
print("  ✓ face match:", d.get("matched"), "| confidence:", round(d.get("confidence",0),3), "-", d.get("person",{}).get("name","?"))
sys.exit(0)' 2>/dev/null || { curl -s -o /dev/null localhost:8000/api/v1/frame && true; bad "face pipeline (test photo missing at /tmp/nt-test/rob1.jpg?)"; }

VQ=$(curl -s -m 60 -X POST localhost:8000/api/v1/voice-query -H "Content-Type: application/json" -d '{"patient_query":"Where are my glasses?"}')
RESP=$(echo "$VQ" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("llm_response",""))' 2>/dev/null)
AUDIO=$(echo "$VQ"  | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("tts_audio_url",""))' 2>/dev/null)
[ -n "$RESP" ] && ok "voice LLM: \"${RESP:0:70}...\"" || bad "voice-query LLM"
if [ -n "$AUDIO" ]; then
  CODE=$(curl -s -o /dev/null -w "%{http_code}" "localhost:8000$AUDIO")
  [ "$CODE" = "200" ] && ok "TTS audio plays ($AUDIO)" || bad "TTS audio HTTP $CODE"
fi

# ── Summary ────────────────────────────────────────────
echo "════════ $PASS passed, $FAIL failed ════════"
exit $FAIL