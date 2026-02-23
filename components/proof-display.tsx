"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  Check,
  ShieldCheck,
  Clock,
  Cpu,
  Hash,
  Fingerprint,
  ArrowRight,
  BadgeCheck,
  FileCheck,
} from "lucide-react";
import { GlassCard } from "./glass-card";
import { cn, formatTimestamp, truncateHash } from "@/lib/utils";
import type { ZKProof } from "@/hooks/use-zkp";

interface ProofDisplayProps {
  proof: ZKProof;
  selfVerified: boolean;
  onSelfVerify: () => void;
  onBuildClaim: () => void;
  progress: number;
}

export function ProofDisplay({
  proof,
  selfVerified,
  onSelfVerify,
  onBuildClaim,
  progress,
}: ProofDisplayProps) {
  const [copied, setCopied] = useState(false);

  const copyHash = async () => {
    await navigator.clipboard.writeText(proof.proofHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-3xl mx-auto space-y-5"
    >
      {/* Self-verified badge */}
      <AnimatePresence>
        {selfVerified && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="overflow-hidden"
          >
            <GlassCard
              glow="emerald"
              padding="sm"
              className="bg-emerald-50/40 border-emerald-200/40"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-md shadow-emerald-300/30"
                >
                  <BadgeCheck className="w-5 h-5 text-white" />
                </motion.div>
                <div>
                  <h3 className="text-sm font-bold text-emerald-800">
                    Self-Verified ✓
                  </h3>
                  <p className="text-xs text-emerald-600">
                    Proof is valid. Ready to attach to an insurance claim.
                  </p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Proof hash */}
      <GlassCard glow="indigo" padding="md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Fingerprint className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-semibold text-slate-700">Proof Hash</h3>
          </div>
          <button
            onClick={copyHash}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            {copied ? (
              <Check className="w-3 h-3 text-emerald-500" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        <motion.div
          className="relative p-4 rounded-xl font-mono text-xs leading-relaxed break-all bg-slate-900 text-indigo-300 border border-slate-700/50 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div
            className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent"
            animate={{ top: ["0%", "100%"] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />
          <span className="text-slate-500">proof: </span>
          <span className="text-indigo-300">{proof.proofHash}</span>
        </motion.div>
      </GlassCard>

      {/* Metadata grid */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            icon: Clock,
            label: "Timestamp",
            value: formatTimestamp(proof.timestamp),
            color: "text-blue-500",
            bg: "bg-blue-50",
          },
          {
            icon: Cpu,
            label: "Constraints",
            value: proof.constraintCount.toLocaleString(),
            color: "text-violet-500",
            bg: "bg-violet-50",
          },
          {
            icon: Hash,
            label: "Proving Time",
            value: `${(proof.provingTimeMs / 1000).toFixed(1)}s`,
            color: "text-amber-500",
            bg: "bg-amber-50",
          },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + idx * 0.1 }}
            >
              <GlassCard padding="sm">
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-lg",
                      item.bg,
                    )}
                  >
                    <Icon className={cn("w-4 h-4", item.color)} />
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                      {item.label}
                    </p>
                    <p className="text-sm font-bold text-slate-700 font-mono">
                      {item.value}
                    </p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      {/* Public Inputs */}
      <GlassCard padding="md">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Public Inputs (visible to insurer)
        </h4>
        <div className="space-y-2">
          {proof.publicInputs.map((input, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + idx * 0.1 }}
              className="flex items-center gap-3 py-1.5"
            >
              <span className="flex items-center justify-center w-5 h-5 rounded text-[9px] font-bold bg-slate-100 text-slate-500">
                {idx}
              </span>
              <code className="text-xs font-mono text-slate-600">{input}</code>
            </motion.div>
          ))}
        </div>
      </GlassCard>

      {/* Action buttons */}
      <motion.div
        className="flex items-center justify-center gap-3 pt-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        {/* Self-verify */}
        {!selfVerified && (
          <motion.button
            onClick={onSelfVerify}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={progress > 0}
            className={cn(
              "flex items-center gap-2 px-5 py-3 rounded-xl",
              "bg-white border border-slate-200 text-sm font-semibold text-slate-700",
              "hover:border-indigo-300 hover:bg-indigo-50/50 transition-all",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          >
            {progress > 0 ? (
              <>
                <motion.div
                  className="w-4 h-4 border-2 border-slate-300 border-t-indigo-500 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
                Verifying...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                Self-Verify
              </>
            )}
          </motion.button>
        )}

        {/* Build claim */}
        <motion.button
          onClick={onBuildClaim}
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "flex items-center gap-2.5 px-7 py-3 rounded-xl",
            "bg-gradient-to-r from-indigo-600 to-violet-600",
            "text-white text-sm font-semibold tracking-wide",
            "shadow-lg shadow-indigo-400/25",
            "hover:shadow-xl hover:shadow-indigo-400/35 transition-shadow",
          )}
        >
          <FileCheck className="w-4 h-4" />
          Prepare Insurance Claim
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
