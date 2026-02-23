"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Shield,
  Building2,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  FileText,
  Clock,
  Fingerprint,
} from "lucide-react";
import { useVerifier } from "@/hooks/use-verifier";
import { GlassCard } from "@/components/glass-card";
import { VerifierUpload } from "@/components/verifier-upload";
import { VerifierResult } from "@/components/verifier-result";
import { ApprovalConfirmation } from "@/components/approval-confirmation";
import { cn, formatDateTime, truncateHash } from "@/lib/utils";
import { publishStatusUpdate } from "@/lib/claim-sync";
import Link from "next/link";

export default function VerifyPage() {
  const v = useVerifier();

  const handleVerify = () => {
    if (v.bundle) {
      publishStatusUpdate({
        claimId: v.bundle.claimId,
        status: "under_review",
        timestamp: Date.now(),
      });
    }
    v.verify();
  };

  const handleApprove = (notes: string) => {
    v.approveClaim(notes);
  };

  const handleReject = (notes: string) => {
    v.rejectClaim(notes);
  };

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Header */}
      <motion.header
        className="relative z-20 flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 lg:px-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 shadow-lg">
            <Building2
              className="w-4 h-4 sm:w-5 sm:h-5 text-white"
              strokeWidth={2}
            />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-semibold tracking-tight text-slate-900 flex items-center gap-1.5">
              MedZK Verifier
              <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-500" />
            </h1>
            <p className="text-[9px] sm:text-[11px] text-slate-400 tracking-wide uppercase font-medium hidden sm:block">
              Insurance Company Portal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-medium text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/60 border border-slate-200/60 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            <span className="hidden sm:inline">Patient Portal</span>
            <span className="sm:hidden">Patient</span>
          </Link>

          {v.state !== "AWAITING" && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={v.reset}
              className="flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-white/60 border border-slate-200/60 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Reset</span>
            </motion.button>
          )}
        </div>
      </motion.header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center px-3 sm:px-6 py-6 sm:py-8 lg:py-12">
        {/* Intro */}
        <AnimatePresence>
          {v.state === "AWAITING" && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center mb-6 sm:mb-8 max-w-lg px-4"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
                Verify a Patient Claim
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-2">
                Upload or paste a MedZK claim bundle to verify the proof without
                accessing any private health data.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {v.state === "AWAITING" && (
            <VerifierUpload
              key="upload"
              onLoad={v.loadBundle}
              error={v.error}
            />
          )}

          {v.state === "PARSING" && (
            <motion.div
              key="parsing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-md mx-auto"
            >
              <GlassCard glow="indigo" padding="lg">
                <div className="flex flex-col items-center gap-4 py-6">
                  <motion.div
                    className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center"
                    animate={{ rotate: [0, 360] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <FileText className="w-6 h-6 text-indigo-600" />
                  </motion.div>
                  <p className="text-sm font-semibold text-slate-700">
                    Parsing claim bundle...
                  </p>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {v.state === "PARSED" && v.bundle && (
            <ParsedView
              key="parsed"
              bundle={v.bundle}
              onVerify={handleVerify}
              error={v.error}
            />
          )}

          {v.state === "VERIFYING" && (
            <motion.div
              key="verifying"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-lg mx-auto"
            >
              <GlassCard glow="indigo" padding="lg">
                <div className="flex flex-col items-center gap-5 sm:gap-6 py-4 sm:py-6">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24">
                    <motion.div
                      className="absolute inset-0 rounded-full border-4 border-indigo-200"
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                    <motion.div
                      className="absolute inset-2 rounded-full border-4 border-transparent border-t-indigo-600 border-r-indigo-400"
                      animate={{ rotate: -360 }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                    <motion.div
                      className="absolute inset-4 rounded-full border-4 border-transparent border-b-violet-500"
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-700">
                      Verifying Proof
                    </p>
                    <p className="text-[10px] sm:text-xs text-slate-400 mt-1 font-mono">
                      Running pairing check...
                    </p>
                  </div>
                  <div className="w-40 sm:w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: `${v.progress}%` }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    />
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {(v.state === "VALID" || v.state === "INVALID") &&
            v.bundle &&
            v.result && (
              <VerifierResult
                key="result"
                bundle={v.bundle}
                result={v.result}
                onApprove={handleApprove}
                onReject={handleReject}
                onReset={v.reset}
              />
            )}

          {(v.state === "APPROVED" || v.state === "REJECTED") &&
            v.bundle &&
            v.approval && (
              <ApprovalConfirmation
                key="approval"
                bundle={v.bundle}
                approval={v.approval}
                onReset={v.reset}
              />
            )}
        </AnimatePresence>

        <AnimatePresence>
          {v.error && v.state !== "AWAITING" && v.state !== "PARSED" && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-50 px-5 py-3 rounded-xl bg-red-600 text-white text-sm font-medium shadow-2xl text-center"
            >
              {v.error}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="px-4 py-4 text-center">
        <p className="text-[10px] text-slate-400 tracking-wide">
          Zero-knowledge verification — no medical values are revealed.
        </p>
      </footer>
    </div>
  );
}

/* ── Parsed View ──────────────────────────────────────────── */

function ParsedView({
  bundle,
  onVerify,
  error,
}: {
  bundle: NonNullable<ReturnType<typeof useVerifier>["bundle"]>;
  onVerify: () => void;
  error: string | null;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-2xl mx-auto space-y-4 sm:space-y-5"
    >
      <GlassCard glow="indigo" padding="md" className="sm:p-8">
        <h3 className="text-xs sm:text-sm font-semibold text-slate-700 mb-3 sm:mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-500" />
          Claim Bundle Parsed
        </h3>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {[
            { label: "Claim ID", value: bundle.claimId, mono: true },
            { label: "Policy", value: bundle.policy.number, mono: true },
            { label: "Type", value: bundle.policy.claimTypeLabel, mono: false },
            {
              label: "Lab",
              value: bundle.publicParams.labIdentifier,
              mono: false,
            },
            {
              label: "Submitted",
              value: formatDateTime(bundle.createdAt),
              mono: false,
              icon: Clock,
            },
            {
              label: "Proof",
              value: truncateHash(bundle.proof.hash, 8),
              mono: true,
              icon: Fingerprint,
            },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-[9px] sm:text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                {item.label}
              </p>
              <p
                className={cn(
                  "text-xs sm:text-sm mt-0.5 text-slate-700 truncate",
                  item.mono ? "font-mono font-bold" : "font-medium",
                )}
              >
                {item.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-3 sm:mt-4 pt-3 border-t border-slate-200/40">
          <p className="text-[9px] sm:text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            What This Proof Guarantees
          </p>
          <div className="space-y-1.5">
            {Object.entries(bundle.publicParams.thresholds).map(
              ([key, val]) => (
                <div
                  key={key}
                  className="flex items-center gap-2 text-xs sm:text-sm text-slate-600"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                  <span className="capitalize font-medium">{key}</span>
                  <span className="text-[10px] sm:text-xs font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                    threshold = {val}
                  </span>
                </div>
              ),
            )}
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-2 italic">
            Actual values are cryptographically hidden.
          </p>
        </div>
      </GlassCard>

      {bundle.policy.notes && (
        <GlassCard padding="sm">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Patient Notes
          </p>
          <p className="text-xs sm:text-sm text-slate-600">
            {bundle.policy.notes}
          </p>
        </GlassCard>
      )}

      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200/60 text-red-700 text-xs sm:text-sm">
          {error}
        </div>
      )}

      <motion.div className="flex justify-center pt-1 sm:pt-2">
        <motion.button
          onClick={onVerify}
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "w-full sm:w-auto flex items-center justify-center gap-2 sm:gap-2.5 px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl",
            "bg-gradient-to-r from-indigo-600 to-violet-600",
            "text-white text-xs sm:text-sm font-semibold tracking-wide",
            "shadow-lg shadow-indigo-400/25 hover:shadow-xl hover:shadow-indigo-400/35 transition-shadow",
          )}
        >
          <Shield className="w-4 h-4" />
          Verify Proof
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
