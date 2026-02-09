"use client";

import { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import type { BetRequest, ApiResponse } from "@/types";

export function useBetting() {
  const { address } = useAccount();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ orderId: string; status: string } | null>(null);

  const placeBet = useCallback(async (request: BetRequest) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/betting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...request,
          // Send walletAddress if available; backend handles pk-user fallback
          ...(address ? { walletAddress: address } : {}),
        }),
      });
      const data: ApiResponse<{ orderId: string; status: string }> = await res.json();
      if (data.success && data.data) {
        setResult(data.data);
      } else {
        setError(data.error ?? "Bet placement failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [address]);

  return { loading, error, result, placeBet };
}
