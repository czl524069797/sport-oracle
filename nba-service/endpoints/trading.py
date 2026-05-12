import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from py_clob_client.client import ClobClient
from py_clob_client.clob_types import OrderArgs, OrderType
from py_clob_client.order_builder.constants import BUY, SELL
from py_clob_client.clob_types import BalanceAllowanceParams

router = APIRouter()

CLOB_HOST = os.getenv("POLYMARKET_API_URL", "https://clob.polymarket.com")
PRIVATE_KEY = os.getenv("POLYMARKET_PRIVATE_KEY", "")
CHAIN_ID = 137  # Polygon
SERVER_TRADING_ENABLED = os.getenv("ENABLE_SERVER_TRADING", "false").lower() == "true"


def _get_clob_client() -> ClobClient:
    if not PRIVATE_KEY:
        raise HTTPException(status_code=500, detail="POLYMARKET_PRIVATE_KEY not configured")

    client = ClobClient(CLOB_HOST, key=PRIVATE_KEY, chain_id=CHAIN_ID)

    # Derive or create API credentials
    try:
        creds = client.derive_api_key()
    except Exception:
        creds = client.create_api_key()

    client.set_api_creds(creds)
    return client


class PlaceOrderRequest(BaseModel):
    token_id: str
    price: float
    size: float
    side: str  # "BUY" or "SELL"


class CancelOrderRequest(BaseModel):
    order_id: str


@router.post("/place")
async def place_order(req: PlaceOrderRequest):
    """Place an order on Polymarket CLOB."""
    if not SERVER_TRADING_ENABLED:
        raise HTTPException(status_code=403, detail="server-side trading disabled (non-custodial mode)")
    try:
        client = _get_clob_client()

        side = BUY if req.side.upper() == "BUY" else SELL

        order_args = OrderArgs(
            price=req.price,
            size=req.size,
            side=side,
            token_id=req.token_id,
        )

        signed_order = client.create_order(order_args)
        result = client.post_order(signed_order, OrderType.GTC)

        return {
            "success": True,
            "order_id": result.get("orderID", result.get("id", "")),
            "status": result.get("status", "placed"),
            "raw": result,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cancel")
async def cancel_order(req: CancelOrderRequest):
    """Cancel an existing order."""
    if not SERVER_TRADING_ENABLED:
        raise HTTPException(status_code=403, detail="server-side trading disabled (non-custodial mode)")
    try:
        client = _get_clob_client()
        result = client.cancel(req.order_id)
        return {"success": True, "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/balance")
async def get_balance():
    """Get account balance and allowances."""
    try:
        client = _get_clob_client()
        # Prefer unified balance+allowance endpoint
        allowances = None
        try:
            if hasattr(client, "get_balance_allowance"):
                allowances = client.get_balance_allowance(BalanceAllowanceParams())
        except Exception:
            allowances = None
        return {
            "success": True,
            "allowances": allowances,
            "ready": True,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class AllowanceRequest(BaseModel):
    asset_type: str = "COLLATERAL"  # COLLATERAL or CONDITIONAL
    token_id: str | None = None


@router.post("/allowance/update")
async def update_allowance(req: AllowanceRequest):
    """Update allowance for collateral or conditional tokens."""
    if not SERVER_TRADING_ENABLED:
        raise HTTPException(status_code=403, detail="server-side trading disabled (non-custodial mode)")
    try:
        client = _get_clob_client()
        # Map string to enum across versions
        from py_clob_client.clob_types import AssetType
        asset_type = getattr(AssetType, req.asset_type)
        params = BalanceAllowanceParams(asset_type=asset_type, token_id=req.token_id)
        res = client.update_balance_allowance(params)
        return {"success": True, "result": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/orders")
async def get_open_orders():
    """Get all open orders."""
    try:
        client = _get_clob_client()
        orders = client.get_orders()
        return {"success": True, "orders": orders}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
