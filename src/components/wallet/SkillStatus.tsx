"use client";

import { useEffect, useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { useSkillAuth, getAuthToken } from "@/hooks/useSkillAuth";
import { useI18n } from "@/i18n";

const SKILL_VERIFIER_ADDRESS = process.env.NEXT_PUBLIC_SKILL_VERIFIER_ADDRESS as `0x${string}` | undefined;

const ABI = [{
  inputs: [{ internalType: "address", name: "", type: "address" }],
  name: "verified",
  outputs: [{ internalType: "bool", name: "", type: "bool" }],
  stateMutability: "view",
  type: "function",
}] as const;

export function SkillStatus() {
  const { address, isConnected } = useAccount();
  const { t } = useI18n();
  const { login } = useSkillAuth();
  const [meLoading, setMeLoading] = useState(false);
  const [signedIn, setSignedIn] = useState<boolean>(false);

  const shouldReadOnChain = isConnected && !!address && !!SKILL_VERIFIER_ADDRESS;

  const { data: onchainVerified } = useReadContract({
    address: SKILL_VERIFIER_ADDRESS,
    abi: ABI,
    functionName: "verified",
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(shouldReadOnChain),
    },
  });

  // Check backend token validity
  useEffect(() => {
    let cancelled = false;
    async function checkMe() {
      setMeLoading(true);
      try {
        const token = getAuthToken();
        if (!token) {
          if (!cancelled) setSignedIn(false);
          return;
        }
        const res = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          if (!cancelled) setSignedIn(false);
          return;
        }
        const data = await res.json();
        if (!cancelled) setSignedIn(data.address?.toLowerCase() === address?.toLowerCase());
      } catch {
        if (!cancelled) setSignedIn(false);
      } finally {
        if (!cancelled) setMeLoading(false);
      }
    }
    checkMe();
    return () => { cancelled = true; };
  }, [address]);

  if (!isConnected) return null;

  const allowlisted = onchainVerified === true;
  const label = allowlisted
    ? signedIn ? t.skill.allowlistedSignedIn : t.skill.allowlistedSignIn
    : signedIn ? t.skill.notAllowlistedSignedIn : t.skill.notAllowlisted;

  return (
    <div className="flex items-center gap-2">
      <span
        className={`px-2 py-1 text-xs rounded-md border ${
          allowlisted ? "text-neon-green border-neon-green/30 bg-neon-green/10" : "text-amber-400 border-amber-400/30 bg-amber-400/10"
        }`}
        title={allowlisted ? t.skill.tipAllowlisted : t.skill.tipNotAllowlisted}
      >
        {label}
      </span>
      {!signedIn && (
        <button
          className="px-2 py-1 text-xs rounded-md border border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10 transition-colors disabled:opacity-50"
          onClick={async () => { try { await login(); setSignedIn(true); } catch {} }}
          disabled={meLoading}
        >
          {meLoading ? t.common.signing : t.common.signIn}
        </button>
      )}
    </div>
  );
}
