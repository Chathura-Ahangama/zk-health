"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Send,
  CheckCircle2,
  ExternalLink,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { GlassCard } from "@/components/glass-card";
import { cn } from "@/lib/utils";
import type { ClaimBundle } from "@/lib/claim-engine";
import { submitBundleOnChain, getTxUrl, getAddressUrl } from "@/lib/chain";

export function OnChainPublish({
  bundle,
  onUpdate,
}: {
  bundle: ClaimBundle;
  onUpdate: (bundle: ClaimBundle) => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signed = !!bundle.issuer;
  const submitted = !!bundle.onChain;

  const handleSubmit = async () => {
    try {
      setError(null);
      setSubmitting(true);
      const onChain = await submitBundleOnChain(bundle);
      onUpdate({ ...bundle, onChain });
    } catch (e) {
      setError(e instanceof Error ? e.message : "On-chain submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <GlassCard padding="md" className="bg-indigo-50/20 border-indigo-200/30">
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-700">
            Sepolia + Chainlink Automation
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            This bundle is already lab-signed. Submit it on-chain so Chainlink
            Automation can process it automatically.
          </p>
        </div>

        {error && (
          <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            {error}
          </div>
        )}

        {bundle.issuer && (
          <div className="p-3 rounded-xl bg-white/70 border border-slate-200/60">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-semibold text-slate-600">
                Signed by Lab
              </span>
            </div>
            <a
              href={getAddressUrl(bundle.issuer.labAddress)}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-mono text-indigo-600 break-all inline-flex items-center gap-1 hover:underline"
            >
              {bundle.issuer.labAddress}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        <motion.button
          onClick={handleSubmit}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          disabled={!signed || submitting || submitted}
          className={cn(
            "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all",
            submitted
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-300/25",
            (!signed || submitting || submitted) &&
              "opacity-60 cursor-not-allowed",
          )}
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting...
            </>
          ) : submitted ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Submitted On-Chain
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit On-Chain
            </>
          )}
        </motion.button>

        {bundle.onChain && (
          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/60 space-y-2">
            <div className="text-xs font-semibold text-emerald-700">
              Claim submitted on Sepolia
            </div>
            <div className="text-[11px] text-slate-600">
              Claim ID:
              <div className="font-mono break-all mt-1 text-emerald-700">
                {bundle.onChain.claimId}
              </div>
            </div>
            <a
              href={getTxUrl(bundle.onChain.txHash)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline"
            >
              View transaction
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
