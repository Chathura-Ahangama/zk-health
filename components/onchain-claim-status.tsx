"use client";

import { useEffect, useState } from "react";
import {
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock3,
} from "lucide-react";
import { GlassCard } from "@/components/glass-card";
import type { ClaimBundle } from "@/lib/claim-engine";
import { getClaimStatus, getTxUrl, type OnChainStatus } from "@/lib/chain";

export function OnChainClaimStatus({ bundle }: { bundle: ClaimBundle }) {
  const [status, setStatus] = useState<OnChainStatus>("Unknown");
  const [loading, setLoading] = useState(false);

  const claimId = bundle.onChain?.claimId;

  const refresh = async () => {
    if (!claimId) return;
    setLoading(true);
    try {
      const s = await getClaimStatus(claimId);
      setStatus(s);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (claimId) {
      refresh();
    }
  }, [claimId]);

  if (!bundle.onChain) return null;

  const icon =
    status === "Approved" ? (
      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
    ) : status === "Rejected" ? (
      <XCircle className="w-4 h-4 text-red-600" />
    ) : (
      <Clock3 className="w-4 h-4 text-amber-600" />
    );

  return (
    <GlassCard padding="sm" className="bg-indigo-50/20">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-sm font-semibold text-slate-700">
              On-chain Claim Status
            </span>
          </div>

          <button
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-600 hover:border-indigo-300"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <div className="text-xs text-slate-500">
          Claim ID
          <div className="font-mono text-slate-700 break-all mt-1">
            {bundle.onChain.claimId}
          </div>
        </div>

        <div className="text-xs text-slate-500">
          Status
          <div className="mt-1 font-semibold text-slate-700">{status}</div>
        </div>

        <a
          href={getTxUrl(bundle.onChain.txHash)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:underline"
        >
          View submit transaction
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </GlassCard>
  );
}
