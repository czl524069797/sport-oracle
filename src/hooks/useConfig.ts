"use client";

import { useState, useEffect } from "react";
import type { ApiResponse } from "@/types";
import { readApiResponse } from "@/lib/api-response";

interface ConfigData {
  hasPrivateKey: boolean;
}

export function useConfig() {
  const [hasPrivateKey, setHasPrivateKey] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const serverTradingEnabled = (process.env.NEXT_PUBLIC_ENABLE_SERVER_TRADING ?? "false").toLowerCase() === "true";

  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await fetch("/api/config");
        const data: ApiResponse<ConfigData> = await readApiResponse(res);
        if (data.success && data.data) {
          setHasPrivateKey(data.data.hasPrivateKey);
        }
      } catch {
        // Silently fail — default to no private key
      } finally {
        setLoaded(true);
      }
    }
    fetchConfig();
  }, []);

  return { hasPrivateKey, loaded, serverTradingEnabled };
}
