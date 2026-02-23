"use client";

import { motion } from "framer-motion";
import { Shield, RotateCcw, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ZKPState } from "@/hooks/use-zkp";

interface DashboardHeaderProps {
  state: ZKPState;
  onReset: () => void;
}

const stateLabels: Record<ZKPState, string> = {
  IDLE: "Awaiting Input",
  GENERATING_WITNESS: "Scanning Data",
  WITNESS_READY: "Witness Generated",
  PROVING: "Generating Proof",
  PROOF_GENERATED: "Proof Ready",
  CLAIM_READY: "Claim Prepared",
  SHARED: "Claim Shared",
};

const stateColors: Record<ZKPState, string> = {
  IDLE: "bg-slate-200 text-slate-600",
  GENERATING_WITNESS: "bg-amber-100 text-amber-700",
  WITNESS_READY: "bg-indigo-100 text-indigo-700",
  PROVING: "bg-violet-100 text-violet-700",
  PROOF_GENERATED: "bg-blue-100 text-blue-700",
  CLAIM_READY: "bg-emerald-100 text-emerald-700",
  SHARED: "bg-teal-100 text-teal-700",
};

export function DashboardHeader({ state, onReset }: DashboardHeaderProps) {
  return (
    <motion.header
      className="relative z-20 flex items-center justify-between px-6 py-4 lg:px-10"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-300/30">
          <Shield className="w-5 h-5 text-white" strokeWidth={2.5} />
          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white" />
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-slate-900 flex items-center gap-1.5">
            MedZK
            <Lock className="w-3.5 h-3.5 text-indigo-400" />
          </h1>
          <p className="text-[11px] text-slate-400 tracking-wide uppercase font-medium">
            Privacy-First Insurance Claims
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <a
          href="/verify"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/60 border border-slate-200/60 transition-colors"
        >
          Insurer Portal →
        </a>

        <motion.div
          key={state}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide",
            stateColors[state],
          )}
        >
          <span className="flex items-center gap-1.5">
            {(state === "GENERATING_WITNESS" || state === "PROVING") && (
              <motion.span
                className="inline-block w-1.5 h-1.5 rounded-full bg-current"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
            )}
            {stateLabels[state]}
          </span>
        </motion.div>

        {state !== "IDLE" && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-white/60 border border-slate-200/60 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </motion.button>
        )}
      </div>
    </motion.header>
  );
}
