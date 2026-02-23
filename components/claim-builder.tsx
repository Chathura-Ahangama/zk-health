"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Building2,
  Tag,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  Lock,
  Info,
} from "lucide-react";
import { GlassCard } from "./glass-card";
import { cn } from "@/lib/utils";
import {
  CLAIM_TYPES,
  type ClaimType,
  type ClaimDetails,
} from "@/lib/claim-engine";
import type { ZKProof } from "@/hooks/use-zkp";

interface ClaimBuilderProps {
  proof: ZKProof;
  onSubmit: (details: ClaimDetails) => void;
}

export function ClaimBuilder({ proof, onSubmit }: ClaimBuilderProps) {
  const [policyNumber, setPolicyNumber] = useState("");
  const [claimType, setClaimType] = useState<ClaimType>("diabetes_diagnosis");
  const [insurerName, setInsurerName] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!policyNumber.trim())
      newErrors.policyNumber = "Policy number is required";
    if (!insurerName.trim())
      newErrors.insurerName = "Insurance company name is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({
      policyNumber: policyNumber.trim(),
      claimType,
      insurerName: insurerName.trim(),
      notes: notes.trim(),
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-2xl mx-auto space-y-5"
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-300/30 mx-auto"
        >
          <FileText className="w-6 h-6 text-white" />
        </motion.div>
        <h2 className="text-xl font-bold text-slate-800">
          Prepare Insurance Claim
        </h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Attach your zero-knowledge proof to a claim. Only the proof and policy
          details are shared — your medical values stay private.
        </p>
      </div>

      {/* Privacy reminder */}
      <GlassCard padding="sm" className="bg-indigo-50/30 border-indigo-200/30">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 flex-shrink-0 mt-0.5">
            <Lock className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-indigo-800">
              What the insurer will see:
            </p>
            <ul className="mt-1 text-[11px] text-indigo-600 space-y-0.5">
              <li>✓ Cryptographic proof (opaque — reveals nothing)</li>
              <li>✓ Public thresholds (e.g., &quot;Sugar &gt; 126&quot;)</li>
              <li>✓ Policy number and claim type</li>
              <li>✗ Actual blood sugar, cholesterol, or any medical values</li>
            </ul>
          </div>
        </div>
      </GlassCard>

      {/* Form */}
      <GlassCard glow="indigo" padding="lg">
        <div className="space-y-5">
          {/* Policy Number */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <Tag className="w-3.5 h-3.5" />
              Policy Number
            </label>
            <input
              type="text"
              value={policyNumber}
              onChange={(e) => setPolicyNumber(e.target.value)}
              placeholder="e.g., POL-2024-001234"
              className={cn(
                "w-full px-4 py-3 rounded-xl text-sm font-mono",
                "bg-white/80 border transition-colors",
                "placeholder:text-slate-300",
                "focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-300",
                errors.policyNumber
                  ? "border-red-300 bg-red-50/50"
                  : "border-slate-200/80",
              )}
            />
            {errors.policyNumber && (
              <p className="text-xs text-red-500">{errors.policyNumber}</p>
            )}
          </div>

          {/* Insurance Company */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5" />
              Insurance Company
            </label>
            <input
              type="text"
              value={insurerName}
              onChange={(e) => setInsurerName(e.target.value)}
              placeholder="e.g., Blue Cross Health Insurance"
              className={cn(
                "w-full px-4 py-3 rounded-xl text-sm",
                "bg-white/80 border transition-colors",
                "placeholder:text-slate-300",
                "focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-300",
                errors.insurerName
                  ? "border-red-300 bg-red-50/50"
                  : "border-slate-200/80",
              )}
            />
            {errors.insurerName && (
              <p className="text-xs text-red-500">{errors.insurerName}</p>
            )}
          </div>

          {/* Claim Type */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              Claim Type
            </label>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(CLAIM_TYPES).map(([key, config]) => (
                <motion.button
                  key={key}
                  onClick={() => setClaimType(key as ClaimType)}
                  whileTap={{ scale: 0.99 }}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 rounded-xl text-left transition-all border",
                    claimType === key
                      ? "bg-indigo-50 border-indigo-300 ring-1 ring-indigo-200"
                      : "bg-white/60 border-slate-200/60 hover:border-slate-300",
                  )}
                >
                  <div
                    className={cn(
                      "w-4 h-4 mt-0.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                      claimType === key
                        ? "border-indigo-600 bg-indigo-600"
                        : "border-slate-300",
                    )}
                  >
                    {claimType === key && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <div>
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        claimType === key
                          ? "text-indigo-800"
                          : "text-slate-700",
                      )}
                    >
                      {config.label}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {config.description}
                    </p>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <MessageSquare className="w-3.5 h-3.5" />
              Additional Notes
              <span className="text-slate-400 font-normal normal-case">
                (optional)
              </span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional information for the insurer..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl text-sm bg-white/80 border border-slate-200/80 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-300 resize-none"
            />
          </div>
        </div>
      </GlassCard>

      {/* Proof attached indicator */}
      <GlassCard padding="sm" className="bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50">
            <Info className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium text-slate-500">
              Attached Proof
            </p>
            <p className="text-xs font-mono text-slate-600 truncate">
              {proof.proofHash.slice(0, 30)}...
            </p>
          </div>
          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700 uppercase">
            Attached
          </span>
        </div>
      </GlassCard>

      {/* Submit */}
      <motion.div className="flex justify-center pt-2">
        <motion.button
          onClick={handleSubmit}
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold tracking-wide shadow-lg shadow-indigo-400/25 hover:shadow-xl hover:shadow-indigo-400/35 transition-shadow"
        >
          Build Claim Bundle
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
