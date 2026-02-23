"use client";

import { motion } from "framer-motion";
import { Upload, ScanLine, Database, Cpu, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ZKPState } from "@/hooks/use-zkp";

interface Step {
  id: ZKPState[];
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const steps: Step[] = [
  { id: ["IDLE"], label: "Upload", icon: Upload },
  { id: ["GENERATING_WITNESS"], label: "Scan", icon: ScanLine },
  { id: ["WITNESS_READY"], label: "Extract", icon: Database },
  { id: ["PROVING"], label: "Prove", icon: Cpu },
  { id: ["PROOF_GENERATED", "VERIFIED"], label: "Verify", icon: BadgeCheck },
];

const stateOrder: ZKPState[] = [
  "IDLE",
  "GENERATING_WITNESS",
  "WITNESS_READY",
  "PROVING",
  "PROOF_GENERATED",
  "VERIFIED",
];

function getStepIndex(state: ZKPState): number {
  return steps.findIndex((s) => s.id.includes(state));
}

export function StatusTimeline({ state }: { state: ZKPState }) {
  const activeIdx = getStepIndex(state);

  return (
    <motion.div
      className="flex items-center justify-center gap-0 px-6 py-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      {steps.map((step, idx) => {
        const isActive = idx === activeIdx;
        const isComplete = idx < activeIdx;
        const isFuture = idx > activeIdx;
        const Icon = step.icon;

        return (
          <div key={step.label} className="flex items-center">
            {/* Node */}
            <div className="flex flex-col items-center gap-1.5">
              <motion.div
                className={cn(
                  "relative flex items-center justify-center w-9 h-9 rounded-full transition-colors duration-500",
                  isComplete &&
                    "bg-indigo-600 text-white shadow-md shadow-indigo-300/30",
                  isActive &&
                    "bg-indigo-100 text-indigo-700 ring-2 ring-indigo-400/40 ring-offset-2 ring-offset-transparent",
                  isFuture && "bg-slate-100 text-slate-400",
                )}
                animate={isActive ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                transition={
                  isActive
                    ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
                    : {}
                }
              >
                <Icon className="w-4 h-4" />
                {isComplete && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-indigo-600"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  />
                )}
                {isComplete && (
                  <Icon className="relative z-10 w-4 h-4 text-white" />
                )}
              </motion.div>
              <span
                className={cn(
                  "text-[10px] font-semibold tracking-wider uppercase",
                  isComplete && "text-indigo-600",
                  isActive && "text-indigo-700",
                  isFuture && "text-slate-400",
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connector */}
            {idx < steps.length - 1 && (
              <div className="relative w-12 h-[2px] mx-1 -mt-5 overflow-hidden rounded-full bg-slate-200">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-indigo-500 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{
                    width: isComplete ? "100%" : isActive ? "50%" : "0%",
                  }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            )}
          </div>
        );
      })}
    </motion.div>
  );
}
