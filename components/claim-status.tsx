"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileCheck,
  Send,
  Search,
  BadgeCheck,
  XCircle,
  Clock,
  Shield,
  PartyPopper,
  ExternalLink,
  Wifi,
  WifiOff,
  ShieldCheck,
  Hash,
  Download,
} from "lucide-react";
import { GlassCard } from "./glass-card";
import { cn, formatDateTime, formatDate, downloadJSON } from "@/lib/utils";
import { useClaimStatus } from "@/hooks/use-claim-status";
import type { ClaimBundle } from "@/lib/claim-engine";
import type { ClaimStatusType } from "@/lib/claim-sync";

interface ClaimStatusProps {
  bundle: ClaimBundle;
}

const STEP_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  proof_generated: FileCheck,
  claim_submitted: Send,
  under_review: Search,
  verified: ShieldCheck,
  approved: BadgeCheck,
  rejected: XCircle,
};

export function ClaimStatus({ bundle }: ClaimStatusProps) {
  const {
    steps,
    isLive,
    currentStatus,
    isApproved,
    isRejected,
    isDecided,
    latestUpdate,
    initializeClaim,
  } = useClaimStatus(bundle.claimId);

  // Initialize claim history on first render
  useEffect(() => {
    initializeClaim(bundle.claimId, [
      { status: "proof_generated" },
      { status: "claim_submitted" },
      { status: "under_review" },
    ]);
  }, [bundle.claimId, initializeClaim]);

  const downloadApproval = () => {
    if (!latestUpdate?.data) return;
    downloadJSON(
      {
        claimId: bundle.claimId,
        policyNumber: bundle.policy.number,
        decision: currentStatus,
        referenceNumber: latestUpdate.data.referenceNumber,
        reviewerNotes: latestUpdate.data.reviewerNotes,
        decidedAt: latestUpdate.data.decidedAt,
        verificationMethod: "Zero-Knowledge Proof",
      },
      `medzk-decision-${bundle.claimId}.json`,
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-2xl mx-auto space-y-6"
    >
      {/* Live connection indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center"
      >
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold border",
            isLive
              ? "bg-emerald-50 border-emerald-200/50 text-emerald-700"
              : "bg-slate-50 border-slate-200/50 text-slate-500",
          )}
        >
          {isLive ? (
            <>
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Wifi className="w-3 h-3" />
              </motion.div>
              Live — Listening for insurer updates
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3" />
              Connecting...
            </>
          )}
        </div>
      </motion.div>

      {/* Decision banner — appears when insurer decides */}
      <AnimatePresence>
        {isDecided && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, height: 0 }}
            animate={{ opacity: 1, scale: 1, height: "auto" }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 20,
            }}
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
              <div className="flex items-center gap-4">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    delay: 0.3,
                  }}
                  className={cn(
                    "flex items-center justify-center w-16 h-16 rounded-2xl shadow-xl",
                    isApproved
                      ? "bg-gradient-to-br from-emerald-500 to-teal-500 shadow-emerald-300/30"
                      : "bg-gradient-to-br from-red-500 to-rose-500 shadow-red-300/30",
                  )}
                >
                  {isApproved ? (
                    <PartyPopper className="w-8 h-8 text-white" />
                  ) : (
                    <XCircle className="w-8 h-8 text-white" />
                  )}
                </motion.div>

                <div className="flex-1">
                  <motion.h2
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className={cn(
                      "text-xl font-bold",
                      isApproved ? "text-emerald-800" : "text-red-800",
                    )}
                  >
                    {isApproved ? "🎉 Claim Approved!" : "Claim Rejected"}
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className={cn(
                      "text-sm mt-0.5",
                      isApproved ? "text-emerald-600" : "text-red-600",
                    )}
                  >
                    {isApproved
                      ? `${bundle.policy.insurerName} has approved your claim. No private data was revealed.`
                      : `${bundle.policy.insurerName} has rejected your claim.`}
                  </motion.p>
                </div>
              </div>

              {/* Reference number + notes from insurer */}
              {latestUpdate?.data && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className={cn(
                    "mt-4 pt-4 border-t space-y-3",
                    isApproved ? "border-emerald-200/40" : "border-red-200/40",
                  )}
                >
                  {latestUpdate.data.referenceNumber && (
                    <div className="flex items-center gap-2">
                      <Hash
                        className={cn(
                          "w-4 h-4",
                          isApproved ? "text-emerald-500" : "text-red-500",
                        )}
                      />
                      <span className="text-xs text-slate-500">Reference:</span>
                      <span
                        className={cn(
                          "text-sm font-bold font-mono",
                          isApproved ? "text-emerald-700" : "text-red-700",
                        )}
                      >
                        {latestUpdate.data.referenceNumber}
                      </span>
                    </div>
                  )}

                  {latestUpdate.data.reviewerNotes && (
                    <div
                      className={cn(
                        "p-3 rounded-xl text-sm",
                        isApproved
                          ? "bg-emerald-100/50 text-emerald-700"
                          : "bg-red-100/50 text-red-700",
                      )}
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-wider opacity-60 mb-1">
                        Message from Insurer
                      </p>
                      <p>{latestUpdate.data.reviewerNotes}</p>
                    </div>
                  )}

                  {latestUpdate.data.decidedAt && (
                    <div className="flex items-center gap-2">
                      <Clock
                        className={cn(
                          "w-3.5 h-3.5",
                          isApproved ? "text-emerald-400" : "text-red-400",
                        )}
                      />
                      <span className="text-[11px] text-slate-400 font-mono">
                        {formatDateTime(latestUpdate.data.decidedAt)}
                      </span>
                    </div>
                  )}
                </motion.div>
              )}
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top banner (submitted state - only when not decided yet) */}
      {!isDecided && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
        >
          <GlassCard
            glow="emerald"
            padding="lg"
            className="bg-gradient-to-br from-emerald-50/60 to-teal-50/40 border-emerald-200/40"
          >
            <div className="flex items-center gap-4">
              <motion.div
                className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-xl shadow-emerald-300/30"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 180, delay: 0.3 }}
              >
                <Send className="w-6 h-6 text-white" />
              </motion.div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-emerald-800">
                  Claim Submitted
                </h2>
                <p className="text-sm text-emerald-600 mt-0.5">
                  Waiting for{" "}
                  <span className="font-semibold">
                    {bundle.policy.insurerName}
                  </span>{" "}
                  to verify and decide
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Status timeline */}
      <GlassCard glow="indigo" padding="lg">
        <h3 className="text-sm font-semibold text-slate-700 mb-6">
          Claim Progress
        </h3>

        <div className="relative pl-8">
          {/* Vertical line */}
          <div className="absolute left-[15px] top-2 bottom-2 w-[2px] bg-slate-200 rounded-full" />

          {/* Animated progress fill on the vertical line */}
          <motion.div
            className={cn(
              "absolute left-[15px] top-2 w-[2px] rounded-full",
              isRejected ? "bg-red-400" : "bg-indigo-500",
            )}
            initial={{ height: 0 }}
            animate={{
              height: `${
                (steps.filter((s) => s.status === "complete").length /
                  Math.max(steps.length - 1, 1)) *
                100
              }%`,
            }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          />

          <div className="space-y-8">
            {steps.map((step, idx) => {
              const Icon = STEP_ICONS[step.id] ?? FileCheck;
              const isComplete = step.status === "complete";
              const isCurrent = step.status === "current";
              const isPending = step.status === "pending";
              const isRejectedStep = step.id === "rejected";

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + idx * 0.12 }}
                  className="relative flex items-start gap-4"
                >
                  {/* Node */}
                  <motion.div
                    className={cn(
                      "absolute -left-8 flex items-center justify-center w-[30px] h-[30px] rounded-full border-2 z-10",
                      isComplete &&
                        !isRejectedStep &&
                        "bg-indigo-600 border-indigo-600 text-white",
                      isCurrent &&
                        !isRejectedStep &&
                        "bg-white border-indigo-500 text-indigo-600 shadow-md shadow-indigo-200/50",
                      isCurrent &&
                        isRejectedStep &&
                        "bg-red-500 border-red-500 text-white shadow-md shadow-red-200/50",
                      isComplete &&
                        isRejectedStep &&
                        "bg-red-500 border-red-500 text-white",
                      isPending && "bg-white border-slate-200 text-slate-400",
                    )}
                    animate={
                      isCurrent && !isRejectedStep
                        ? { scale: [1, 1.15, 1] }
                        : {}
                    }
                    transition={
                      isCurrent
                        ? {
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }
                        : {}
                    }
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </motion.div>

                  {/* Content */}
                  <div className="flex-1 pt-0.5">
                    <div className="flex items-center gap-2">
                      <p
                        className={cn(
                          "text-sm font-semibold",
                          isComplete && "text-slate-800",
                          isCurrent && !isRejectedStep && "text-indigo-700",
                          isCurrent && isRejectedStep && "text-red-700",
                          isPending && "text-slate-400",
                        )}
                      >
                        {step.label}
                      </p>

                      {isCurrent && !isDecided && (
                        <motion.span
                          className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600 text-[9px] font-bold uppercase tracking-wider"
                          animate={{ opacity: [1, 0.4, 1] }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                          }}
                        >
                          In Progress
                        </motion.span>
                      )}

                      {isCurrent && isRejectedStep && (
                        <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[9px] font-bold uppercase tracking-wider">
                          Final
                        </span>
                      )}

                      {/* New update pulse */}
                      {isCurrent && isDecided && !isRejectedStep && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                          }}
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider",
                            isApproved
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700",
                          )}
                        >
                          {isApproved ? "Approved ✓" : "Rejected"}
                        </motion.span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 mt-0.5">
                      {step.description}
                    </p>

                    {step.timestamp && (
                      <p className="text-[10px] text-slate-400 font-mono mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDateTime(step.timestamp)}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </GlassCard>

      {/* Claim details */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Claim ID", value: bundle.claimId },
          { label: "Policy", value: bundle.policy.number },
          { label: "Type", value: bundle.policy.claimTypeLabel },
          { label: "Expires", value: formatDate(bundle.expiresAt) },
        ].map((item, idx) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 + idx * 0.08 }}
          >
            <GlassCard padding="sm">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                {item.label}
              </p>
              <p className="text-sm font-bold text-slate-700 font-mono mt-0.5 truncate">
                {item.value}
              </p>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Download decision record (only when decided) */}
      <AnimatePresence>
        {isDecided && latestUpdate?.data?.referenceNumber && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center"
          >
            <motion.button
              onClick={downloadApproval}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold shadow-lg shadow-indigo-400/25 hover:shadow-xl transition-shadow"
            >
              <Download className="w-4 h-4" />
              Download Decision Record
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Privacy note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <GlassCard padding="sm" className="bg-indigo-50/20">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-indigo-500 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-slate-700">
                Your medical data never left your device
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Only the cryptographic proof was shared. The insurer verified
                your claim without seeing your actual health values.
              </p>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Verifier portal link */}
      <motion.div
        className="flex justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
      >
        <a
          href="/verify"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs font-medium text-indigo-500 hover:text-indigo-700 transition-colors"
        >
          Open Insurer Portal (to test approval)
          <ExternalLink className="w-3 h-3" />
        </a>
      </motion.div>
    </motion.div>
  );
}
