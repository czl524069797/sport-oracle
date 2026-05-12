import os
import time
import secrets
from typing import Dict

from fastapi import APIRouter, HTTPException, Request
from eth_account.messages import encode_defunct
from eth_account import Account
import jwt
try:
    from siwe import SiweMessage
except Exception:
    SiweMessage = None  # type: ignore

router = APIRouter()

_NONCES: Dict[str, float] = {}
JWT_SECRET = os.getenv("JWT_SECRET", "change_me")
JWT_TTL = int(os.getenv("JWT_TTL_SECONDS", "86400"))
SIWE_EXPECTED_DOMAIN = os.getenv("SIWE_EXPECTED_DOMAIN", "")
SIWE_EXPECTED_CHAIN_ID = int(os.getenv("SIWE_EXPECTED_CHAIN_ID", "0")) or None


@router.get("/nonce")
async def get_nonce():
    nonce = secrets.token_hex(16)
    _NONCES[nonce] = time.time() + 300  # 5 min
    return {"nonce": nonce}


@router.post("/verify")
async def verify(payload: dict):
    """
    Verify wallet ownership and return a short-lived JWT.
    Accepts either a minimal personal_sign payload or an EIP-4361 SIWE message.

    Personal_sign payload:
      { message, signature, address, nonce }

    SIWE payload:
      { message, signature, address } where message is a full EIP-4361 string containing a nonce.
    """
    signature = payload.get("signature", "")
    address = (payload.get("address", "") or "").strip()
    message = (payload.get("message", "") or "").strip()
    now = int(time.time())

    if not signature or not address or not message:
        raise HTTPException(status_code=400, detail="missing fields")

    is_siwe = "domain:" in message.lower() or "uri:" in message.lower() or message.strip().startswith("\n")

    if is_siwe and SiweMessage is not None:
        # SIWE flow
        try:
            siwe_msg = SiweMessage(message)
            # Basic signature verification
            siwe_msg.verify(signature)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"siwe verify failed: {e}")

        if siwe_msg.address.lower() != address.lower():
            raise HTTPException(status_code=400, detail="address mismatch")

        # Optional domain enforcement
        if SIWE_EXPECTED_DOMAIN and getattr(siwe_msg, "domain", "").lower() != SIWE_EXPECTED_DOMAIN.lower():
            raise HTTPException(status_code=400, detail="invalid domain")

        # Optional chainId enforcement
        if SIWE_EXPECTED_CHAIN_ID and getattr(siwe_msg, "chain_id", None) not in (SIWE_EXPECTED_CHAIN_ID, str(SIWE_EXPECTED_CHAIN_ID)):
            raise HTTPException(status_code=400, detail="invalid chain id")

        # Expiration check if provided
        exp = getattr(siwe_msg, "expiration_time", None)
        if exp:
            try:
                from datetime import datetime, timezone
                # siwe lib returns ISO string
                exp_dt = datetime.fromisoformat(str(exp).replace("Z", "+00:00"))
                if exp_dt.timestamp() <= time.time():
                    raise HTTPException(status_code=400, detail="siwe message expired")
            except HTTPException:
                raise
            except Exception:
                pass

        # Validate nonce against our issued nonces if present
        siwe_nonce = getattr(siwe_msg, "nonce", "") or payload.get("nonce", "")
        if not siwe_nonce or siwe_nonce not in _NONCES or _NONCES[siwe_nonce] < time.time():
            raise HTTPException(status_code=400, detail="invalid nonce")
        del _NONCES[siwe_nonce]

        token = jwt.encode({"address": address, "iat": now, "exp": now + JWT_TTL}, JWT_SECRET, algorithm="HS256")
        return {"ok": True, "token": token}
    else:
        # Minimal personal_sign format fallback
        nonce = payload.get("nonce", "")
        if not nonce or nonce not in _NONCES or _NONCES[nonce] < time.time():
            raise HTTPException(status_code=400, detail="invalid nonce")

        msg = encode_defunct(text=message)
        try:
            recovered = Account.recover_message(msg, signature=signature)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"verify failed: {e}")

        if recovered.lower() != address.lower():
            raise HTTPException(status_code=400, detail="address mismatch")

        token = jwt.encode({"address": address, "iat": now, "exp": now + JWT_TTL}, JWT_SECRET, algorithm="HS256")
        del _NONCES[nonce]
        return {"ok": True, "token": token}


@router.get("/me")
async def me(request: Request):
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="missing token")
    token = auth.split(" ", 1)[1]
    try:
        data = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return {"address": data.get("address")}
    except Exception:
        raise HTTPException(status_code=401, detail="invalid token")
