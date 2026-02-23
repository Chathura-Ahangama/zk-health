"use client";

import { motion } from "framer-motion";
import {
  Lock,
  Droplets,
  Heart,
  Activity,
  TestTube,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { GlassCard } from "./glass-card";
import { cn } from "@/lib/utils";
import type { MedicalData } from "@/hooks/use-zkp";
import { THRESHOLDS } from "@/hooks/use-zkp";

interface DataExtractionProps {
  data: MedicalData;
  onGenerateProof: () => void;
}

interface FieldConfig {
  key: string;
  label: string;
  getValue: (d: MedicalData) => string;
  unit: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

const fields: FieldConfig[] = [
  {
    key: "sugar",
    label: "Blood Sugar",
    getValue: (d) => String(d.sugar ?? "—"),
    unit: "mg/dL",
    icon: Droplets,
    color: "text-rose-500",
    bgColor: "bg-rose-50",
  },
  {
    key: "cholesterol",
    label: "Cholesterol",
    getValue: (d) => String(d.cholesterol ?? "—"),
    unit: "mg/dL",
    icon: Activity,
    color: "text-amber-500",
    bgColor: "bg-amber-50",
  },
  {
    key: "bloodPressure",
    label: "Blood Pressure",
    getValue: (d) =>
      d.bloodPressure
        ? `${d.bloodPressure.systolic}/${d.bloodPressure.diastolic}`
        : "—",
    unit: "mmHg",
    icon: Heart,
    color: "text-red-500",
    bgColor: "bg-red-50",
  },
  {
    key: "hemoglobin",
    label: "Hemoglobin",
    getValue: (d) => String(d.hemoglobin ?? "—"),
    unit: "g/dL",
    icon: TestTube,
    color: "text-violet-500",
    bgColor: "bg-violet-50",
  },
];

export function DataExtraction({ data, onGenerateProof }: DataExtractionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-3xl mx-auto space-y-4 sm:space-y-6"
    >
      {/* Header */}
      <div className="text-center px-2">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/50 text-[10px] sm:text-xs font-semibold text-indigo-600 mb-3"
        >
          <ShieldAlert className="w-3 h-3" />
          <span className="hidden sm:inline">
            Values remain private — only the proof leaves your device
          </span>
          <span className="sm:hidden">Values stay private</span>
        </motion.div>
        {data.labName && (
          <p className="text-[10px] sm:text-xs text-slate-400 mt-1">
            Source: {data.labName}
          </p>
        )}
      </div>

      {/* Data Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {fields.map((field, idx) => {
          const Icon = field.icon;
          const value = field.getValue(data);

          return (
            <motion.div
              key={field.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.1 + idx * 0.1,
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <GlassCard
                padding="sm"
                className="group hover:shadow-lg hover:shadow-indigo-100/50 transition-shadow duration-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl",
                        field.bgColor,
                      )}
                    >
                      <Icon
                        className={cn("w-4 h-4 sm:w-5 sm:h-5", field.color)}
                      />
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                        {field.label}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
                        <span
                          className="text-lg sm:text-xl font-bold text-slate-800 select-none"
                          style={{ filter: "blur(8px)" }}
                        >
                          {value}
                        </span>
                        <span className="text-[10px] sm:text-xs text-slate-400 font-medium">
                          {field.unit}
                        </span>
                      </div>
                    </div>
                  </div>

                  <motion.div
                    className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors"
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.4 }}
                  >
                    <Lock className="w-3.5 h-3.5" />
                  </motion.div>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      {/* Circuit criteria */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <GlassCard padding="sm" className="bg-indigo-50/30">
          <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 sm:mb-3">
            Circuit Constraints (Public)
          </p>
          <div className="space-y-1.5 sm:space-y-2">
            {Object.entries(THRESHOLDS).map(([key, threshold]) => (
              <div
                key={key}
                className="flex items-center gap-2 text-xs sm:text-sm text-slate-600"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                <span className="font-mono text-[11px] sm:text-xs">
                  {threshold.label}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      </motion.div>

      {/* Generate Proof button */}
      <motion.div
        className="flex justify-center pt-1 sm:pt-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <motion.button
          onClick={onGenerateProof}
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "relative flex items-center gap-2 sm:gap-2.5 px-5 sm:px-8 py-3 sm:py-3.5 rounded-xl",
            "bg-gradient-to-r from-indigo-600 to-violet-600",
            "text-white text-xs sm:text-sm font-semibold tracking-wide",
            "shadow-lg shadow-indigo-400/25",
            "hover:shadow-xl hover:shadow-indigo-400/35 transition-shadow",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
          )}
        >
          Generate Zero-Knowledge Proof
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
