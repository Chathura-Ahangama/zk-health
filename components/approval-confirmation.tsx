"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  XCircle,
  Download,
  RotateCcw,
  FileText,
  Clock,
  Hash,
  Shield,
  Sparkles,
  Building2,
  Wifi,
} from "lucide-react";
import { GlassCard } from "./glass-card";
import { cn, formatDateTime, downloadJSON } from "@/lib/utils";
import { publishStatusUpdate } from "@/lib/claim-sync";
import type { ClaimBundle } from "@/lib/claim-engine";
import type { ApprovalRecord } from "@/hooks/use-verifier";

interface ApprovalConfirmationProps {
  bundle: ClaimBundle;
  approval: ApprovalRecord;
  onReset: () => void;
}

export function ApprovalConfirmation({
  bundle,
  approval,
  onReset,
}: ApprovalConfirmationProps) {
  const isApproved = approval.decision === "approved";

  // Broadcast the decision to the patient's tab
  useEffect(() => {
    // First publish "verified" status
    publishStatusUpdate({
      claimId: bundle.claimId,
      status: "verified",
      timestamp: Date.now() - 1000, // slightly before decision
      data: {
        verifiedAt: Date.now() - 1000,
      },
    });

    // Then publish the actual decision
    setTimeout(() => {
      publishStatusUpdate({
        claimId: bundle.claimId,
        status: isApproved ? "approved" : "rejected",
        timestamp: Date.now(),
        data: {
          referenceNumber: approval.referenceNumber,
          reviewerNotes: approval.reviewerNotes,
          decidedAt: approval.decidedAt,
        },
      });
    }, 500);
  }, [bundle.claimId, isApproved, approval]);

  const downloadRecord = () => {
    const record = {
      ...approval,
      claimDetails: {
        claimId: bundle.claimId,
        policyNumber: bundle.policy.number,
        claimType: bundle.policy.claimTypeLabel,
        insurerName: bundle.policy.insurerName,
        labSource: bundle.publicParams.labIdentifier,
        proofHash: bundle.proof.hash,
        verificationKey: bundle.proof.verificationKey,
        publicThresholds: bundle.publicParams.thresholds,
      },
      verificationMethod: "Zero-Knowledge Proof (Groth16)",
      privacyStatement:
        "No private medical data was accessed during verification.",
    };
    downloadJSON(
      record,
      `medzk-${approval.decision}-${approval.referenceNumber}.json`,
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-2xl mx-auto space-y-5"
    >
      {/* Sync indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex items-center justify-center"
      >
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/50 text-[11px] font-semibold text-emerald-700">
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Wifi className="w-3 h-3" />
          </motion.div>
          Decision synced to patient portal
        </div>
      </motion.div>

      {/* Main banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 180 }}
      >
        <GlassCard
          glow={isApproved ? "emerald" : "none"}
          padding="lg"
          className={cn(
            isApproved
              ? "bg-gradient-to-br from-emerald-50/80 to-teal-50/60 border-emerald-200/50"
              : "bg-gradient-to-br from-red-50/80 to-rose-50/60 border-red-200/50",
          )}
        >
          <div className="flex flex-col items-center text-center gap-4">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 12,
                delay: 0.3,
              }}
              className={cn(
                "flex items-center justify-center w-20 h-20 rounded-3xl shadow-xl",
                isApproved
                  ? "bg-gradient-to-br from-emerald-500 to-teal-500 shadow-emerald-300/40"
                  : "bg-gradient-to-br from-red-500 to-rose-500 shadow-red-300/40",
              )}
            >
              {isApproved ? (
                <BadgeCheck className="w-10 h-10 text-white" />
              ) : (
                <XCircle className="w-10 h-10 text-white" />
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center justify-center gap-2">
                <h2
                  className={cn(
                    "text-2xl font-bold",
                    isApproved ? "text-emerald-800" : "text-red-800",
                  )}
                >
                  {isApproved ? "Claim Approved" : "Claim Rejected"}
                </h2>
                {isApproved && (
                  <motion.div
                    animate={{ rotate: [0, 15, -15, 0] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 3,
                    }}
                  >
                    <Sparkles className="w-6 h-6 text-emerald-500" />
                  </motion.div>
                )}
              </div>
              <p
                className={cn(
                  "text-sm mt-1",
                  isApproved ? "text-emerald-600" : "text-red-600",
                )}
              >
                {isApproved
                  ? "The patient will see this approval in their portal instantly."
                  : "The patient has been notified of the rejection."}
              </p>
            </motion.div>

            {/* Reference number */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7, type: "spring" }}
              className={cn(
                "px-4 py-2 rounded-xl border",
                isApproved
                  ? "bg-emerald-100/80 border-emerald-200 text-emerald-800"
                  : "bg-red-100/80 border-red-200 text-red-800",
              )}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">
                Reference Number
              </p>
              <p className="text-lg font-bold font-mono tracking-wide">
                {approval.referenceNumber}
              </p>
            </motion.div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Decision details */}
      <GlassCard padding="md">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">
          Decision Summary
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            {
              icon: FileText,
              label: "Claim ID",
              value: approval.claimId,
              bg: "bg-blue-50",
              color: "text-blue-600",
            },
            {
              icon: Hash,
              label: "Reference",
              value: approval.referenceNumber,
              bg: "bg-violet-50",
              color: "text-violet-600",
            },
            {
              icon: Clock,
              label: "Decided At",
              value: formatDateTime(approval.decidedAt),
              bg: "bg-amber-50",
              color: "text-amber-600",
            },
            {
              icon: Building2,
              label: "Policy",
              value: bundle.policy.number,
              bg: "bg-indigo-50",
              color: "text-indigo-600",
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + idx * 0.08 }}
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

        {approval.reviewerNotes && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-4 pt-3 border-t border-slate-200/40"
          >
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Your Notes
            </p>
            <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
              {approval.reviewerNotes}
            </p>
          </motion.div>
        )}
      </GlassCard>

      {/* Privacy note */}
      <GlassCard padding="sm" className="bg-indigo-50/20 border-indigo-200/30">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-indigo-500 flex-shrink-0" />
          <p className="text-xs text-slate-600">
            This decision was made using{" "}
            <span className="font-semibold">
              zero-knowledge proof verification
            </span>
            . No private medical data was accessed or stored.
          </p>
        </div>
      </GlassCard>

      {/* Actions */}
      <motion.div
        className="flex items-center justify-center gap-3 pt-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <motion.button
          onClick={onReset}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          Verify Another Claim
        </motion.button>

        <motion.button
          onClick={downloadRecord}
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold shadow-lg shadow-indigo-400/25 hover:shadow-xl transition-shadow"
        >
          <Download className="w-4 h-4" />
          Download Record
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
