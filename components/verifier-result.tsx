"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BadgeCheck,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Clock,
  Fingerprint,
  Building2,
  FileText,
  RotateCcw,
  MessageSquare,
  ArrowRight,
  X,
} from "lucide-react";
import { GlassCard } from "./glass-card";
import { cn, formatDateTime, truncateHash } from "@/lib/utils";
import type { ClaimBundle } from "@/lib/claim-engine";
import type { VerificationResult } from "@/hooks/use-verifier";

interface VerifierResultProps {
  bundle: ClaimBundle;
  result: VerificationResult;
  onApprove: (notes: string) => void;
  onReject: (notes: string) => void;
  onReset: () => void;
}

export function VerifierResult({
  bundle,
  result,
  onApprove,
  onReject,
  onReset,
}: VerifierResultProps) {
  const [showDecisionModal, setShowDecisionModal] = useState<
    "approve" | "reject" | null
  >(null);
  const [reviewerNotes, setReviewerNotes] = useState("");

  const handleConfirm = () => {
    if (showDecisionModal === "approve") {
      onApprove(reviewerNotes.trim());
    } else if (showDecisionModal === "reject") {
      onReject(reviewerNotes.trim());
    }
    setShowDecisionModal(null);
    setReviewerNotes("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-2xl mx-auto space-y-5"
    >
      {/* Result banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, type: "spring" }}
      >
        <GlassCard
          glow={result.isValid ? "emerald" : "none"}
          padding="lg"
          className={cn(
            result.isValid
              ? "bg-gradient-to-br from-emerald-50/60 to-teal-50/40 border-emerald-200/40"
              : "bg-gradient-to-br from-red-50/60 to-rose-50/40 border-red-200/40",
          )}
        >
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className={cn(
                "flex items-center justify-center w-16 h-16 rounded-2xl shadow-xl",
                result.isValid
                  ? "bg-gradient-to-br from-emerald-500 to-teal-500 shadow-emerald-300/30"
                  : "bg-gradient-to-br from-red-500 to-rose-500 shadow-red-300/30",
              )}
            >
              {result.isValid ? (
                <BadgeCheck className="w-8 h-8 text-white" />
              ) : (
                <XCircle className="w-8 h-8 text-white" />
              )}
            </motion.div>
            <div className="flex-1">
              <h2
                className={cn(
                  "text-xl font-bold",
                  result.isValid ? "text-emerald-800" : "text-red-800",
                )}
              >
                {result.isValid ? "Claim Verified ✓" : "Verification Failed"}
              </h2>
              <p
                className={cn(
                  "text-sm mt-0.5",
                  result.isValid ? "text-emerald-600" : "text-red-600",
                )}
              >
                {result.isValid
                  ? "The zero-knowledge proof is mathematically valid. No private medical data was revealed."
                  : "The proof could not be verified. The claim may be invalid or tampered with."}
              </p>
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider",
                result.isValid
                  ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                  : "bg-red-100 text-red-700 border border-red-200",
              )}
            >
              {result.isValid ? "Valid" : "Invalid"}
            </motion.div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Verification checks */}
      <GlassCard padding="lg">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">
          Verification Checks
        </h3>
        <div className="space-y-3">
          {result.checks.map((check, idx) => (
            <motion.div
              key={check.label}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + idx * 0.1 }}
              className={cn(
                "flex items-start gap-3 p-3 rounded-xl border",
                check.passed
                  ? "bg-emerald-50/50 border-emerald-200/40"
                  : "bg-red-50/50 border-red-200/40",
              )}
            >
              {check.passed ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p
                  className={cn(
                    "text-sm font-semibold",
                    check.passed ? "text-emerald-800" : "text-red-800",
                  )}
                >
                  {check.label}
                </p>
                <p
                  className={cn(
                    "text-xs mt-0.5",
                    check.passed ? "text-emerald-600" : "text-red-600",
                  )}
                >
                  {check.detail}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>

      {/* Claim details */}
      <GlassCard padding="md">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">
          Claim Details (Public)
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            {
              icon: FileText,
              label: "Claim ID",
              value: bundle.claimId,
              bg: "bg-blue-50",
              color: "text-blue-600",
            },
            {
              icon: Building2,
              label: "Policy",
              value: bundle.policy.number,
              bg: "bg-violet-50",
              color: "text-violet-600",
            },
            {
              icon: Shield,
              label: "Claim Type",
              value: bundle.policy.claimTypeLabel,
              bg: "bg-indigo-50",
              color: "text-indigo-600",
            },
            {
              icon: Clock,
              label: "Submitted",
              value: formatDateTime(bundle.createdAt),
              bg: "bg-amber-50",
              color: "text-amber-600",
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + idx * 0.08 }}
                className="flex items-start gap-3"
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0",
                    item.bg,
                  )}
                >
                  <Icon className={cn("w-4 h-4", item.color)} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    {item.label}
                  </p>
                  <p className="text-xs font-medium text-slate-700 mt-0.5 truncate">
                    {item.value}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Proof hash */}
        <div className="mt-4 pt-3 border-t border-slate-200/40">
          <div className="flex items-center gap-2 mb-1.5">
            <Fingerprint className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Proof Hash
            </span>
          </div>
          <code className="text-[11px] font-mono text-slate-600 break-all">
            {truncateHash(bundle.proof.hash, 20)}
          </code>
        </div>

        {/* Thresholds */}
        <div className="mt-4 pt-3 border-t border-slate-200/40">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Public Thresholds Proven
          </p>
          <div className="space-y-1.5">
            {Object.entries(bundle.publicParams.thresholds).map(
              ([key, val]) => (
                <div
                  key={key}
                  className="flex items-center gap-2 text-xs text-slate-600"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  <span className="capitalize">{key}</span>
                  <span className="font-mono text-indigo-600">
                    threshold = {val}
                  </span>
                </div>
              ),
            )}
          </div>
        </div>
      </GlassCard>

      {/* Privacy assurance */}
      <GlassCard padding="sm" className="bg-indigo-50/20 border-indigo-200/30">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-indigo-500 flex-shrink-0" />
          <p className="text-xs text-slate-600">
            <span className="font-semibold">Zero-Knowledge Verification:</span>{" "}
            This claim was verified without accessing any private medical data.
            The cryptographic proof mathematically guarantees the patient meets
            the claimed health criteria.
          </p>
        </div>
      </GlassCard>

      {/* Action buttons */}
      <motion.div
        className="flex items-center justify-center gap-3 pt-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <motion.button
          onClick={onReset}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          Verify Another
        </motion.button>

        {result.isValid && (
          <>
            <motion.button
              onClick={() => setShowDecisionModal("reject")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white border border-red-200 text-sm font-semibold text-red-600 hover:bg-red-50 transition-all"
            >
              <XCircle className="w-4 h-4" />
              Reject
            </motion.button>

            <motion.button
              onClick={() => setShowDecisionModal("approve")}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-semibold shadow-lg shadow-emerald-400/25 hover:shadow-xl transition-shadow"
            >
              <BadgeCheck className="w-4 h-4" />
              Approve Claim
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </>
        )}
      </motion.div>

      {/* ── Decision Modal ─────────────────────────────── */}
      <AnimatePresence>
        {showDecisionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              onClick={() => setShowDecisionModal(null)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative w-full max-w-md"
            >
              <GlassCard padding="lg" className="bg-white/95 shadow-2xl">
                {/* Close button */}
                <button
                  onClick={() => setShowDecisionModal(null)}
                  className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className={cn(
                      "flex items-center justify-center w-12 h-12 rounded-xl shadow-md",
                      showDecisionModal === "approve"
                        ? "bg-gradient-to-br from-emerald-500 to-teal-500 shadow-emerald-300/30"
                        : "bg-gradient-to-br from-red-500 to-rose-500 shadow-red-300/30",
                    )}
                  >
                    {showDecisionModal === "approve" ? (
                      <BadgeCheck className="w-6 h-6 text-white" />
                    ) : (
                      <XCircle className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">
                      {showDecisionModal === "approve"
                        ? "Approve Claim"
                        : "Reject Claim"}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Claim {bundle.claimId} • Policy {bundle.policy.number}
                    </p>
                  </div>
                </div>

                {/* Confirmation text */}
                <div
                  className={cn(
                    "p-3 rounded-xl border text-sm mb-5",
                    showDecisionModal === "approve"
                      ? "bg-emerald-50/50 border-emerald-200/40 text-emerald-700"
                      : "bg-red-50/50 border-red-200/40 text-red-700",
                  )}
                >
                  {showDecisionModal === "approve" ? (
                    <p>
                      You are approving this claim based on a cryptographically
                      verified zero-knowledge proof. The patient&apos;s medical
                      values were{" "}
                      <span className="font-bold">never revealed</span> to you.
                    </p>
                  ) : (
                    <p>
                      You are rejecting this claim. Please provide a reason
                      below so the patient can understand the decision.
                    </p>
                  )}
                </div>

                {/* Reviewer notes */}
                <div className="space-y-1.5 mb-6">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <MessageSquare className="w-3.5 h-3.5" />
                    {showDecisionModal === "approve"
                      ? "Reviewer Notes (optional)"
                      : "Reason for Rejection"}
                  </label>
                  <textarea
                    value={reviewerNotes}
                    onChange={(e) => setReviewerNotes(e.target.value)}
                    placeholder={
                      showDecisionModal === "approve"
                        ? "e.g., Proof verified, claim meets policy criteria."
                        : "e.g., Proof expired, policy mismatch, etc."
                    }
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl text-sm bg-white border border-slate-200 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-300 resize-none"
                  />
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setShowDecisionModal(null);
                      setReviewerNotes("");
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 text-sm font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    onClick={handleConfirm}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={
                      showDecisionModal === "reject" && !reviewerNotes.trim()
                    }
                    className={cn(
                      "flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all",
                      "disabled:opacity-40 disabled:cursor-not-allowed",
                      showDecisionModal === "approve"
                        ? "bg-gradient-to-r from-emerald-600 to-teal-600 shadow-md shadow-emerald-300/25"
                        : "bg-gradient-to-r from-red-600 to-rose-600 shadow-md shadow-red-300/25",
                    )}
                  >
                    {showDecisionModal === "approve"
                      ? "Confirm Approval"
                      : "Confirm Rejection"}
                  </motion.button>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
