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
  Sparkles,
} from "lucide-react";
import { GlassCard } from "./glass-card";
import { cn, formatTimestamp, truncateHash } from "@/lib/utils";
import type { ZKProof } from "@/hooks/use-zkp";

interface ProofDisplayProps {
  proof: ZKProof;
  isVerified: boolean;
  onVerify: () => void;
  progress: number;
}

export function ProofDisplay({
  proof,
  isVerified,
  onVerify,
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
      {/* Verified Banner */}
      <AnimatePresence>
        {isVerified && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <GlassCard
              glow="emerald"
              padding="md"
              className="bg-emerald-50/40 border-emerald-200/40"
            >
              <div className="flex items-center gap-4">
                <motion.div
                  className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-300/30"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                    delay: 0.2,
                  }}
                >
                  <BadgeCheck className="w-7 h-7 text-white" />
                </motion.div>

                <div className="flex-1">
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-emerald-800">
                        Mathematically Verified
                      </h3>
                      <motion.div
                        animate={{ rotate: [0, 15, -15, 0] }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          repeatDelay: 3,
                        }}
                      >
                        <Sparkles className="w-5 h-5 text-emerald-500" />
                      </motion.div>
                    </div>
                    <p className="text-sm text-emerald-600 mt-0.5">
                      The proof has been verified against the verification key.
                      No private data was revealed.
                    </p>
                  </motion.div>
                </div>

                <motion.div
                  className="px-3 py-1.5 rounded-full bg-emerald-100 border border-emerald-200/60"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6, type: "spring" }}
                >
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                    Valid
                  </span>
                </motion.div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Proof Hash */}
      <GlassCard
        glow={isVerified ? "emerald" : "indigo"}
        padding="md"
        className={cn(isVerified && "proof-glow")}
      >
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

        {/* Hash display */}
        <motion.div
          className={cn(
            "relative p-4 rounded-xl font-mono text-xs leading-relaxed break-all",
            "bg-slate-900 text-indigo-300",
            "border border-slate-700/50",
            "overflow-hidden",
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {/* Subtle scan line effect */}
          <motion.div
            className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent"
            animate={{ top: ["0%", "100%"] }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "linear",
            }}
          />

          <span className="text-slate-500">proof: </span>
          <span className="text-indigo-300">{proof.proofHash}</span>
        </motion.div>
      </GlassCard>

      {/* Proof Metadata */}
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
          Public Inputs
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

      {/* Verification Key */}
      <GlassCard padding="sm">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
          <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Verification Key
          </h4>
        </div>
        <code className="text-[11px] font-mono text-slate-500 break-all leading-relaxed">
          {truncateHash(proof.verificationKey, 16)}
        </code>
      </GlassCard>

      {/* Verify Button */}
      {!isVerified && (
        <motion.div
          className="flex justify-center pt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <motion.button
            onClick={onVerify}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            disabled={progress > 0}
            className={cn(
              "relative flex items-center gap-2.5 px-8 py-3.5 rounded-xl",
              "bg-gradient-to-r from-emerald-600 to-teal-600",
              "text-white text-sm font-semibold tracking-wide",
              "shadow-lg shadow-emerald-400/25",
              "hover:shadow-xl hover:shadow-emerald-400/35 transition-shadow",
              "disabled:opacity-60 disabled:cursor-not-allowed",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2",
            )}
          >
            {progress > 0 ? (
              <>
                <motion.div
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
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
                Verify Proof
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
}
