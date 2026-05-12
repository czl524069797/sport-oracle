from functools import lru_cache
import os
from typing import Callable

from fastapi import Depends, HTTPException, Request
from jwt import decode as jwt_decode, InvalidTokenError
from cachetools import TTLCache


ENABLE = os.getenv("ENABLE_SKILL_VERIFICATION", "false").lower() == "true"
JWT_SECRET = os.getenv("JWT_SECRET", "change_me")
VERIFIER_ADDRESS = os.getenv("SKILL_VERIFIER_ADDRESS", "")
RPC_URL = os.getenv("SKILL_VERIFIER_RPC_URL", os.getenv("NEXT_PUBLIC_POLYGON_RPC_URL", ""))
CACHE_TTL = int(os.getenv("SKILL_VERIFIER_CACHE_TTL", "60"))


@lru_cache(maxsize=1)
def _get_w3():
    # Lazy import to avoid hard dependency when verification is disabled
    from web3 import Web3
    if not RPC_URL:
        raise RuntimeError("SKILL_VERIFIER_RPC_URL not configured")
    return Web3(Web3.HTTPProvider(RPC_URL))


SKILL_VERIFIER_ABI = [
    {
        "inputs": [{"internalType": "address", "name": "", "type": "address"}],
        "name": "verified",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function",
    }
]

# Simple TTL cache for on-chain verified(address)
_verified_cache: TTLCache[str, bool] = TTLCache(maxsize=10000, ttl=CACHE_TTL)


def _read_verified(addr: str) -> bool:
    # Lazy import inside the function
    from web3 import Web3
    w3 = _get_w3()
    try:
        contract = w3.eth.contract(address=Web3.to_checksum_address(VERIFIER_ADDRESS), abi=SKILL_VERIFIER_ABI)
        key = addr.lower()
        if key in _verified_cache:
            return _verified_cache[key]
        value = bool(contract.functions.verified(Web3.to_checksum_address(addr)).call())
        _verified_cache[key] = value
        return value
    except Exception:
        return False


def _get_addr_from_token(token: str) -> str:
    try:
        payload = jwt_decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload.get("address", "")
    except InvalidTokenError:
        return ""


async def requires_skill_verified(request: Request):
    if not ENABLE:
        return True
    if not VERIFIER_ADDRESS:
        raise HTTPException(status_code=500, detail="Skill verifier not configured")

    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="missing token")
    token = auth.split(" ", 1)[1]
    addr = _get_addr_from_token(token)
    if not addr:
        raise HTTPException(status_code=401, detail="invalid token")

    if not _read_verified(addr):
        raise HTTPException(status_code=403, detail="skill not verified")
    return True
