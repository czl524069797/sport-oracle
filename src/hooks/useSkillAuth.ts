"use client";

import { useCallback } from "react";
import { useAccount, useSignMessage, useChainId } from "wagmi";

const TOKEN_KEY = "skill_jwt";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function useSkillAuth() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const chainId = useChainId();

  const login = useCallback(async () => {
    if (!address) throw new Error("wallet not connected");
    const nonceRes = await fetch("/api/auth/nonce");
    const { nonce } = await nonceRes.json();
    // Build SIWE message (EIP-4361)
    const domain = typeof window !== "undefined" ? window.location.host : "localhost";
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const issuedAt = new Date().toISOString();
    const expirationTime = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const statement = "Sign in to SportOracle (NBA Predict)";
    const message = `${domain} wants you to sign in with your Ethereum account:\n${address}\n\n${statement}\n\nURI: ${origin}\nVersion: 1\nChain ID: ${chainId}\nNonce: ${nonce}\nIssued At: ${issuedAt}\nExpiration Time: ${expirationTime}`;
    const signature = await signMessageAsync({ message });
    const verifyRes = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, signature, address, nonce }),
    });
    if (!verifyRes.ok) throw new Error("verify failed");
    const data = await verifyRes.json();
    setAuthToken(data.token);
    return data.token as string;
  }, [address, signMessageAsync, chainId]);

  const logout = useCallback(() => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(TOKEN_KEY);
  }, []);

  return { login, logout, getToken: getAuthToken };
}
