"use client";

import { useEffect, useState } from "react";
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
  PenSquare,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { GlassCard } from "./glass-card";
import { cn } from "@/lib/utils";
import {
  CLAIM_TYPES,
  buildClaimBundle,
  type ClaimType,
  type ClaimDetails,
  type ClaimBundle,
} from "@/lib/claim-engine";
import type { ZKProof } from "@/hooks/use-zkp";
import { signBundleAsLab } from "@/lib/chain";

interface ClaimBuilderProps {
  proof: ZKProof;
  labName: string;
  onSubmitBundle: (bundle: ClaimBundle) => void;
}

export function ClaimBuilder({
  proof,
  labName,
  onSubmitBundle,
}: ClaimBuilderProps) {
  const [policyNumber, setPolicyNumber] = useState("");
  const [claimType, setClaimType] = useState<ClaimType>("diabetes_diagnosis");
  const [insurerName, setInsurerName] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [preparedBundle, setPreparedBundle] = useState<ClaimBundle | null>(
    null,
  );
  const [signing, setSigning] = useState(false);
  const [signError, setSignError] = useState<string | null>(null);

  useEffect(() => {
    setPreparedBundle(null);
    setSignError(null);
  }, [policyNumber, claimType, insurerName, notes]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!policyNumber.trim()) {
      newErrors.policyNumber = "Policy number is required";
    }
    if (!insurerName.trim()) {
      newErrors.insurerName = "Insurance company name is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildDraft = (): ClaimBundle | null => {
    if (!validate()) return null;

    const details: ClaimDetails = {
      policyNumber: policyNumber.trim(),
      claimType,
      insurerName: insurerName.trim(),
      notes: notes.trim(),
    };

    return buildClaimBundle(proof, details, labName);
  };

  const handleSignAsLab = async () => {
    try {
      setSignError(null);
      const draft = buildDraft();
      if (!draft) return;

      setSigning(true);
      const issuer = await signBundleAsLab(draft);
      setPreparedBundle({
        ...draft,
        issuer,
      });
    } catch (err) {
      setSignError(err instanceof Error ? err.message : "Lab signature failed");
    } finally {
      setSigning(false);
    }
  };

  const handleBuildClaim = () => {
    if (!preparedBundle) return;
    onSubmitBundle(preparedBundle);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-2xl mx-auto space-y-4 sm:space-y-5"
    >
      <div className="text-center space-y-2">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-300/30 mx-auto"
        >
          <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </motion.div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-800">
          Prepare Insurance Claim
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto px-4">
          The lab must sign this claim before it can be built and shared.
        </p>
      </div>

      <GlassCard padding="sm" className="bg-indigo-50/30 border-indigo-200/30">
        <div className="flex items-start gap-2.5 sm:gap-3">
          <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-100 flex-shrink-0 mt-0.5">
            <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-semibold text-indigo-800">
              Trust model
            </p>
            <ul className="mt-1 text-[10px] sm:text-[11px] text-indigo-600 space-y-0.5">
              <li>✓ Lab wallet signs the bundle</li>
              <li>✓ Only registered lab wallets can pass on-chain checks</li>
              <li>✗ Insurer never sees private medical values</li>
            </ul>
          </div>
        </div>
      </GlassCard>

      <GlassCard glow="indigo" padding="md" className="sm:p-8">
        <div className="space-y-4 sm:space-y-5">
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <Tag className="w-3.5 h-3.5" />
              Policy Number
            </label>
            <input
              type="text"
              value={policyNumber}
              onChange={(e) => setPolicyNumber(e.target.value)}
              placeholder="e.g., POL-2024-001234"
              className={cn(
                "w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-sm font-mono",
                "bg-white/80 border transition-colors placeholder:text-slate-300",
                "focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-300",
                errors.policyNumber
                  ? "border-red-300 bg-red-50/50"
                  : "border-slate-200/80",
              )}
            />
            {errors.policyNumber && (
              <p className="text-[10px] sm:text-xs text-red-500">
                {errors.policyNumber}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5" />
              Insurance Company
            </label>
            <input
              type="text"
              value={insurerName}
              onChange={(e) => setInsurerName(e.target.value)}
              placeholder="e.g., Blue Cross Health Insurance"
              className={cn(
                "w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-sm",
                "bg-white/80 border transition-colors placeholder:text-slate-300",
                "focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-300",
                errors.insurerName
                  ? "border-red-300 bg-red-50/50"
                  : "border-slate-200/80",
              )}
            />
            {errors.insurerName && (
              <p className="text-[10px] sm:text-xs text-red-500">
                {errors.insurerName}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-slate-600 uppercase tracking-wider">
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

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <MessageSquare className="w-3.5 h-3.5" />
              Notes
              <span className="text-slate-400 font-normal normal-case">
                (optional)
              </span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional information..."
              rows={3}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-sm bg-white/80 border border-slate-200/80 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-300 resize-none"
            />
          </div>
        </div>
      </GlassCard>

      <GlassCard padding="sm" className="bg-slate-50/50">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 flex-shrink-0">
            <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] sm:text-[11px] font-medium text-slate-500">
              Attached Proof
            </p>
            <p className="text-[10px] sm:text-xs font-mono text-slate-600 truncate">
              {proof.proofHash.slice(0, 24)}...
            </p>
          </div>
          <span className="px-2 py-0.5 rounded text-[8px] sm:text-[9px] font-bold bg-emerald-100 text-emerald-700 uppercase flex-shrink-0">
            Ready
          </span>
        </div>
      </GlassCard>

      {signError && (
        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200/60 text-red-700 text-xs sm:text-sm">
          {signError}
        </div>
      )}

      {preparedBundle?.issuer && (
        <GlassCard
          padding="sm"
          className="bg-emerald-50/40 border-emerald-200/40"
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-emerald-800">
                Signed by lab
              </p>
              <p className="text-[10px] sm:text-[11px] text-emerald-600 font-mono break-all">
                {preparedBundle.issuer.labAddress}
              </p>
            </div>
          </div>
        </GlassCard>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <motion.button
          onClick={handleSignAsLab}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={signing}
          className={cn(
            "flex-1 flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl text-xs sm:text-sm font-semibold",
            preparedBundle?.issuer
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-white border border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50",
            signing && "opacity-60 cursor-not-allowed",
          )}
        >
          {signing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Signing...
            </>
          ) : preparedBundle?.issuer ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Signed as Lab
            </>
          ) : (
            <>
              <PenSquare className="w-4 h-4" />
              Sign as Lab
            </>
          )}
        </motion.button>

        <motion.button
          onClick={handleBuildClaim}
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          disabled={!preparedBundle?.issuer}
          className={cn(
            "flex-1 flex items-center justify-center gap-2.5 px-8 py-3 rounded-xl text-xs sm:text-sm font-semibold tracking-wide shadow-lg transition-all",
            preparedBundle?.issuer
              ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-indigo-400/25 hover:shadow-xl hover:shadow-indigo-400/35"
              : "bg-slate-200 text-slate-400 shadow-none cursor-not-allowed",
          )}
        >
          Build Claim Bundle
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
}
