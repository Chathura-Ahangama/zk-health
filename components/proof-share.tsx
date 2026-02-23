"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  Copy,
  Check,
  QrCode,
  Mail,
  Send,
  ExternalLink,
  Shield,
  Clock,
  FileJson,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { GlassCard } from "./glass-card";
import { QRProof } from "./qr-proof";
import { cn, downloadJSON, formatDate, truncateHash } from "@/lib/utils";
import {
  serializeBundle,
  getExpiryDays,
  type ClaimBundle,
} from "@/lib/claim-engine";

interface ProofShareProps {
  bundle: ClaimBundle;
  onShared: () => void;
}

export function ProofShare({ bundle, onShared }: ProofShareProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showBundle, setShowBundle] = useState(false);
  const [shared, setShared] = useState(false);

  const serialized = serializeBundle(bundle);
  const expiryDays = getExpiryDays(bundle);

  const copyBundle = async () => {
    await navigator.clipboard.writeText(serialized);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const downloadBundle = () => {
    downloadJSON(bundle, `medzk-claim-${bundle.claimId}.json`);
  };

  const emailBundle = () => {
    const subject = encodeURIComponent(
      `MedZK Insurance Claim — ${bundle.claimId}`,
    );
    const body = encodeURIComponent(
      `Dear ${bundle.policy.insurerName},\n\nPlease find attached my zero-knowledge proof claim bundle.\n\nClaim ID: ${bundle.claimId}\nPolicy: ${bundle.policy.number}\nType: ${bundle.policy.claimTypeLabel}\n\nThe proof can be verified at: ${typeof window !== "undefined" ? window.location.origin : ""}/verify\n\n---\n\n${serialized}`,
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const markAsShared = () => {
    setShared(true);
    setTimeout(() => onShared(), 1200);
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
          className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg shadow-emerald-300/30 mx-auto"
        >
          <Send className="w-6 h-6 text-white" />
        </motion.div>
        <h2 className="text-xl font-bold text-slate-800">Share Your Claim</h2>
        <p className="text-sm text-slate-500">
          Send this bundle to{" "}
          <span className="font-semibold text-slate-700">
            {bundle.policy.insurerName}
          </span>{" "}
          for verification
        </p>
      </div>

      {/* Claim summary */}
      <GlassCard padding="md" className="bg-indigo-50/20">
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Claim ID", value: bundle.claimId, mono: true },
            { label: "Policy", value: bundle.policy.number, mono: true },
            { label: "Type", value: bundle.policy.claimTypeLabel, mono: false },
            {
              label: "Lab",
              value: bundle.publicParams.labIdentifier,
              mono: false,
            },
          ].map((item, idx) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + idx * 0.08 }}
            >
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                {item.label}
              </p>
              <p
                className={cn(
                  "text-sm mt-0.5 text-slate-700",
                  item.mono ? "font-mono font-bold" : "font-medium",
                )}
              >
                {item.value}
              </p>
            </motion.div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-200/40">
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-xs text-slate-500">
            Expires in{" "}
            <span className="font-bold text-amber-600">{expiryDays} days</span>{" "}
            ({formatDate(bundle.expiresAt)})
          </span>
        </div>
      </GlassCard>

      {/* Share Methods */}
      <div className="grid grid-cols-2 gap-3">
        {/* Download JSON */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <button onClick={downloadBundle} className="w-full group">
            <GlassCard
              padding="md"
              className="hover:shadow-lg hover:shadow-indigo-100/50 transition-all duration-300 hover:border-indigo-200/60 cursor-pointer h-full"
            >
              <div className="flex flex-col items-center gap-3 py-2">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
                  <Download className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-700">
                    Download JSON
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Save claim bundle file
                  </p>
                </div>
              </div>
            </GlassCard>
          </button>
        </motion.div>

        {/* Copy to Clipboard */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <button onClick={copyBundle} className="w-full group">
            <GlassCard
              padding="md"
              className="hover:shadow-lg hover:shadow-indigo-100/50 transition-all duration-300 hover:border-indigo-200/60 cursor-pointer h-full"
            >
              <div className="flex flex-col items-center gap-3 py-2">
                <div
                  className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-xl transition-colors",
                    copied
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-violet-50 text-violet-600 group-hover:bg-violet-100",
                  )}
                >
                  {copied ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-700">
                    {copied ? "Copied!" : "Copy Bundle"}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Copy to clipboard
                  </p>
                </div>
              </div>
            </GlassCard>
          </button>
        </motion.div>

        {/* QR Code */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <button onClick={() => setShowQR(!showQR)} className="w-full group">
            <GlassCard
              padding="md"
              className={cn(
                "hover:shadow-lg hover:shadow-indigo-100/50 transition-all duration-300 cursor-pointer h-full",
                showQR
                  ? "border-indigo-300 bg-indigo-50/30"
                  : "hover:border-indigo-200/60",
              )}
            >
              <div className="flex flex-col items-center gap-3 py-2">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                  <QrCode className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-700">
                    QR Code
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Scan to verify
                  </p>
                </div>
              </div>
            </GlassCard>
          </button>
        </motion.div>

        {/* Email */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <button onClick={emailBundle} className="w-full group">
            <GlassCard
              padding="md"
              className="hover:shadow-lg hover:shadow-indigo-100/50 transition-all duration-300 hover:border-indigo-200/60 cursor-pointer h-full"
            >
              <div className="flex flex-col items-center gap-3 py-2">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-100 transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-700">Email</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Send via email client
                  </p>
                </div>
              </div>
            </GlassCard>
          </button>
        </motion.div>
      </div>

      {/* QR Code expanded view */}
      <AnimatePresence>
        {showQR && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <GlassCard
              padding="lg"
              className="flex flex-col items-center gap-4"
            >
              <QRProof
                data={JSON.stringify({
                  claimId: bundle.claimId,
                  proofHash: bundle.proof.hash,
                  verifyAt:
                    typeof window !== "undefined"
                      ? `${window.location.origin}/verify`
                      : "/verify",
                })}
                size={200}
              />
              <div className="text-center">
                <p className="text-xs font-medium text-slate-600">
                  Scan with your insurer&apos;s app
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                  {bundle.claimId}
                </p>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Bundle (collapsible) */}
      <div>
        <button
          onClick={() => setShowBundle(!showBundle)}
          className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors mx-auto"
        >
          <FileJson className="w-3.5 h-3.5" />
          {showBundle ? "Hide" : "Preview"} claim bundle
          {showBundle ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </button>

        <AnimatePresence>
          {showBundle && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 overflow-hidden"
            >
              <pre className="p-4 rounded-xl bg-slate-900 text-indigo-300 text-[11px] font-mono leading-relaxed overflow-x-auto max-h-64 overflow-y-auto border border-slate-700/50">
                {serialized}
              </pre>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Verification link info */}
      <GlassCard
        padding="sm"
        className="bg-emerald-50/30 border-emerald-200/30"
      >
        <div className="flex items-center gap-3">
          <Shield className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-emerald-700 font-medium">
              Your insurer can verify this claim at:
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <code className="text-[11px] font-mono text-emerald-600 bg-emerald-100/60 px-2 py-0.5 rounded">
                {typeof window !== "undefined"
                  ? `${window.location.origin}/verify`
                  : "/verify"}
              </code>
              <ExternalLink className="w-3 h-3 text-emerald-500" />
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Mark as shared */}
      <motion.div className="flex justify-center pt-2">
        <motion.button
          onClick={markAsShared}
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          disabled={shared}
          className={cn(
            "flex items-center gap-2.5 px-8 py-3.5 rounded-xl text-sm font-semibold tracking-wide shadow-lg transition-all",
            shared
              ? "bg-emerald-500 text-white shadow-emerald-300/25"
              : "bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-emerald-400/25 hover:shadow-xl hover:shadow-emerald-400/35",
          )}
        >
          {shared ? (
            <>
              <Check className="w-4 h-4" />
              Claim Shared!
            </>
          ) : (
            <>
              I&apos;ve Shared the Claim
              <Send className="w-4 h-4" />
            </>
          )}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
