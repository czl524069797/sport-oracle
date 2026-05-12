"use client";

import { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import { getAuthToken, useSkillAuth } from "@/hooks/useSkillAuth";
import type { BetRequest, ApiResponse } from "@/types";

export function useBetting() {
  const { address } = useAccount();
  const { login } = useSkillAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ orderId: string; status: string } | null>(null);

  const placeBet = useCallback(async (request: BetRequest) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      // Ensure we have an auth token for backend gate
      let token = getAuthToken();
      if (!token && address) {
        try { token = await login(); } catch {}
      }
      const res = await fetch("/api/betting", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
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
  }, [address, login]);

  return { loading, error, result, placeBet };
}
