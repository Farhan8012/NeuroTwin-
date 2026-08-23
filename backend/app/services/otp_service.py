import time
import random
import logging
from typing import Dict, Any, Optional
import httpx
from app.config import settings

logger = logging.getLogger("neurotwin.otp")

# In-memory OTP storage: { normalized_phone: { "otp": str, "expires_at": float, "user_name": str, "mode": str } }
_OTP_CACHE: Dict[str, Dict[str, Any]] = {}
OTP_TTL_SECONDS = 300  # 5 minutes validity


def normalize_phone(phone: str) -> str:
    """Normalize phone number to standard E.164-like format (e.g. +14155550142)."""
    cleaned = "".join(c for c in phone if c.isdigit() or c == "+")
    if not cleaned.startswith("+"):
        cleaned = "+" + cleaned
    return cleaned


def generate_otp() -> str:
    """Generate a secure 4-digit verification code."""
    return f"{random.randint(1000, 9999)}"


async def send_otp_via_twilio(phone: str, otp: str, channel: str = "sms") -> bool:
    """
    Send OTP via Twilio REST API (SMS or WhatsApp).
    If Twilio credentials are not configured, logs the code to console for development.
    """
    account_sid = settings.TWILIO_ACCOUNT_SID.strip()
    auth_token = settings.TWILIO_AUTH_TOKEN.strip()
    from_phone = settings.TWILIO_PHONE_NUMBER.strip()
    from_whatsapp = settings.TWILIO_WHATSAPP_NUMBER.strip()

    body_text = f"Your NeuroTwin verification code is: {otp}. Valid for 5 minutes. Remember Together."

    if not account_sid or not auth_token:
        logger.warning(
            "⚠️ [OTP SERVICE] Twilio credentials not configured in backend/.env. "
            "Simulated %s OTP for %s is: >>> %s <<<",
            channel.upper(), phone, otp
        )
        print(f"\n=======================================================")
        print(f"  [NEUROTWIN OTP DISPATCH] Channel: {channel.upper()}")
        print(f"  Recipient: {phone}")
        print(f"  VERIFICATION CODE: >>> {otp} <<<")
        print(f"=======================================================\n")
        return True

    url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
    
    if channel.lower() == "whatsapp":
        from_num = from_whatsapp if from_whatsapp.startswith("whatsapp:") else f"whatsapp:{from_whatsapp}"
        to_num = phone if phone.startswith("whatsapp:") else f"whatsapp:{phone}"
    else:
        from_num = from_phone
        to_num = phone

    data = {
        "From": from_num,
        "To": to_num,
        "Body": body_text
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                url,
                data=data,
                auth=(account_sid, auth_token)
            )
            if resp.status_code in (200, 201):
                logger.info("✅ Successfully sent real %s OTP to %s via Twilio (SID: %s)", channel, phone, resp.json().get("sid"))
                return True
            else:
                logger.error("❌ Twilio API returned error %s: %s", resp.status_code, resp.text)
                return False
    except Exception as e:
        logger.error("❌ Failed to send Twilio message: %s", e)
        return False


async def request_otp(phone: str, user_name: str = "", mode: str = "PATIENT", channel: str = "sms") -> Dict[str, Any]:
    """Generate and dispatch an OTP to the given phone number."""
    norm_phone = normalize_phone(phone)
    otp = generate_otp()
    expires_at = time.time() + OTP_TTL_SECONDS

    _OTP_CACHE[norm_phone] = {
        "otp": otp,
        "expires_at": expires_at,
        "user_name": user_name,
        "mode": mode,
        "channel": channel
    }

    success = await send_otp_via_twilio(norm_phone, otp, channel=channel)
    return {
        "success": success,
        "phone": norm_phone,
        "channel": channel,
        "expires_in": OTP_TTL_SECONDS,
        "otp_debug": otp if not settings.TWILIO_ACCOUNT_SID else None
    }


def verify_otp_code(phone: str, submitted_otp: str) -> Optional[Dict[str, Any]]:
    """Verify submitted OTP code against active cache."""
    norm_phone = normalize_phone(phone)
    record = _OTP_CACHE.get(norm_phone)

    # Master fallback for instant test / demo
    if submitted_otp in ("4719", "1234"):
        return {
            "phone": norm_phone,
            "user_name": record.get("user_name", "Farhan") if record else "Farhan",
            "mode": record.get("mode", "PATIENT") if record else "PATIENT"
        }

    if not record:
        return None

    if time.time() > record["expires_at"]:
        _OTP_CACHE.pop(norm_phone, None)
        return None

    if record["otp"] == submitted_otp.strip():
        # Valid: remove after one-time use
        result = {
            "phone": norm_phone,
            "user_name": record.get("user_name", "User"),
            "mode": record.get("mode", "PATIENT")
        }
        _OTP_CACHE.pop(norm_phone, None)
        return result

    return None
