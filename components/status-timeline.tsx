"use client";

import { motion } from "framer-motion";
import { Upload, ScanLine, Database, Cpu, FileCheck, Send } from "lucide-react";
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
  { id: ["PROOF_GENERATED"], label: "Claim", icon: FileCheck },
  { id: ["CLAIM_READY", "SHARED"], label: "Share", icon: Send },
];

function getStepIndex(state: ZKPState): number {
  return steps.findIndex((s) => s.id.includes(state));
}

export function StatusTimeline({ state }: { state: ZKPState }) {
  const activeIdx = getStepIndex(state);

  return (
    <motion.div
      className="flex items-center justify-center gap-0 px-3 sm:px-6 py-2 sm:py-3 overflow-x-auto scrollbar-none"
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
          <div key={step.label} className="flex items-center flex-shrink-0">
            <div className="flex flex-col items-center gap-1 sm:gap-1.5">
              <motion.div
                className={cn(
                  "relative flex items-center justify-center w-7 h-7 sm:w-9 sm:h-9 rounded-full transition-colors duration-500",
                  isComplete &&
                    "bg-indigo-600 text-white shadow-md shadow-indigo-300/30",
                  isActive &&
                    "bg-indigo-100 text-indigo-700 ring-2 ring-indigo-400/40 ring-offset-1 sm:ring-offset-2 ring-offset-transparent",
                  isFuture && "bg-slate-100 text-slate-400",
                )}
                animate={isActive ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                transition={
                  isActive
                    ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
                    : {}
                }
              >
                <Icon className="w-3 h-3 sm:w-4 sm:h-4 relative z-10" />
              </motion.div>
              <span
                className={cn(
                  "text-[8px] sm:text-[10px] font-semibold tracking-wider uppercase",
                  isComplete && "text-indigo-600",
                  isActive && "text-indigo-700",
                  isFuture && "text-slate-400",
                )}
              >
                {step.label}
              </span>
            </div>

            {idx < steps.length - 1 && (
              <div className="relative w-6 sm:w-10 h-[2px] mx-0.5 sm:mx-1 -mt-4 sm:-mt-5 overflow-hidden rounded-full bg-slate-200">
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
