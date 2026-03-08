"use client";

import { Wallet, ExternalLink, ShieldAlert } from "lucide-react";
import { GlassCard } from "@/components/glass-card";
import { getMetaMaskInstallUrl, hasMetaMask } from "@/lib/chain";

export function WalletRequiredNotice({
  title = "MetaMask required",
  description = "To sign as a lab or submit claims on-chain, open this app in a browser with MetaMask installed.",
}: {
  title?: string;
  description?: string;
}) {
  if (hasMetaMask()) return null;

  return (
    <GlassCard
      padding="sm"
      className="bg-amber-50/70 border-amber-200/60 shadow-[0_8px_24px_rgba(251,191,36,0.08)]"
    >
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex-shrink-0">
          <Wallet className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-amber-900">{title}</p>
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
          </div>

          <p className="text-xs text-amber-800 mt-1 leading-relaxed">
            {description}
          </p>

          <a
            href={getMetaMaskInstallUrl()}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-lg bg-white border border-amber-200 text-xs font-semibold text-amber-700 hover:bg-amber-100/40 transition-colors"
          >
            Install MetaMask
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </GlassCard>
  );
}
