from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional
from app.services import otp_service

router = APIRouter(prefix="/auth", tags=["Authentication & OTP"])


class SendOtpRequest(BaseModel):
    phone: str = Field(..., description="Phone number with country code, e.g. +14155550142 or +919876543210")
    user_name: Optional[str] = Field("", description="Full name if signing up")
    mode: Optional[str] = Field("PATIENT", description="User role: PATIENT or CAREGIVER")
    channel: Optional[str] = Field("sms", description="Delivery channel: 'sms' or 'whatsapp'")


class VerifyOtpRequest(BaseModel):
    phone: str = Field(..., description="Phone number")
    otp: str = Field(..., description="4-digit verification code")
    user_name: Optional[str] = Field("", description="User name")
    mode: Optional[str] = Field("PATIENT", description="User role: PATIENT or CAREGIVER")


class AuthResponse(BaseModel):
    success: bool
    message: str
    phone: str
    user_name: Optional[str] = None
    mode: Optional[str] = None
    token: Optional[str] = None
    otp_debug: Optional[str] = None


@router.post("/send-otp", response_model=AuthResponse)
async def send_otp(req: SendOtpRequest):
    """Generate and send an OTP code via SMS or WhatsApp."""
    if not req.phone or len(req.phone.strip()) < 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Valid phone number is required"
        )

    result = await otp_service.request_otp(
        phone=req.phone,
        user_name=req.user_name or "",
        mode=req.mode or "PATIENT",
        channel=req.channel or "sms"
    )

    return AuthResponse(
        success=result["success"],
        message=f"Verification code sent via {req.channel.upper()}",
        phone=result["phone"],
        otp_debug=result.get("otp_debug")
    )


@router.post("/verify-otp", response_model=AuthResponse)
async def verify_otp(req: VerifyOtpRequest):
    """Verify submitted 4-digit OTP code."""
    if not req.otp or len(req.otp.strip()) != 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="4-digit OTP code is required"
        )

    verified_user = otp_service.verify_otp_code(req.phone, req.otp)
    if not verified_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code"
        )

    # Return successful session
    return AuthResponse(
        success=True,
        message="Authentication successful",
        phone=verified_user["phone"],
        user_name=req.user_name or verified_user.get("user_name", "User"),
        mode=req.mode or verified_user.get("mode", "PATIENT"),
        token=f"neurotwin_jwt_{verified_user['phone'][-4:]}_{int(otp_service.time.time())}"
    )
