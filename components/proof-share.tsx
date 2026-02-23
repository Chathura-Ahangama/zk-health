"use client";

import { useState, useEffect } from "react";
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
import { cn, downloadJSON, formatDate } from "@/lib/utils";
import {
  serializeBundle,
  getExpiryDays,
  type ClaimBundle,
} from "@/lib/claim-engine";
import { storeClaimBundle } from "@/lib/claim-sync";
import Link from "next/link";

interface ProofShareProps {
  bundle: ClaimBundle;
  onShared: () => void;
}

export function ProofShare({ bundle, onShared }: ProofShareProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showBundle, setShowBundle] = useState(false);
  const [shared, setShared] = useState(false);
  const [verifyUrl, setVerifyUrl] = useState("");

  const serialized = serializeBundle(bundle);
  const expiryDays = getExpiryDays(bundle);

  // Store bundle in localStorage and generate the verify URL
  useEffect(() => {
    storeClaimBundle(bundle.claimId, bundle);
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVerifyUrl(
      `${origin}/verify?claimId=${encodeURIComponent(bundle.claimId)}`,
    );
  }, [bundle]);

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
      `Dear ${bundle.policy.insurerName},\n\nPlease find my zero-knowledge proof claim.\n\nClaim ID: ${bundle.claimId}\nPolicy: ${bundle.policy.number}\nType: ${bundle.policy.claimTypeLabel}\n\nScan the QR code or open this link to verify:\n${verifyUrl}\n\nOr use the JSON bundle below:\n\n${serialized}`,
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const copyVerifyLink = async () => {
    await navigator.clipboard.writeText(verifyUrl);
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
      className="w-full max-w-2xl mx-auto space-y-4 sm:space-y-5"
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg shadow-emerald-300/30 mx-auto"
        >
          <Send className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </motion.div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-800">
          Share Your Claim
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 px-4">
          Send to{" "}
          <span className="font-semibold text-slate-700">
            {bundle.policy.insurerName}
          </span>
        </p>
      </div>

      {/* Claim summary */}
      <GlassCard padding="sm" className="sm:p-6 bg-indigo-50/20">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {[
            { label: "Claim ID", value: bundle.claimId, mono: true },
            { label: "Policy", value: bundle.policy.number, mono: true },
            {
              label: "Type",
              value: bundle.policy.claimTypeLabel,
              mono: false,
            },
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
            </motion.div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3 sm:mt-4 pt-3 border-t border-slate-200/40">
          <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
          <span className="text-[10px] sm:text-xs text-slate-500">
            Expires in{" "}
            <span className="font-bold text-amber-600">{expiryDays} days</span>
          </span>
        </div>
      </GlassCard>

      {/* Share Methods */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {[
          {
            label: "Download",
            sub: "Save JSON file",
            icon: Download,
            color: "text-blue-600",
            bg: "bg-blue-50",
            onClick: downloadBundle,
          },
          {
            label: copied ? "Copied!" : "Copy",
            sub: "To clipboard",
            icon: copied ? Check : Copy,
            color: copied ? "text-emerald-600" : "text-violet-600",
            bg: copied ? "bg-emerald-50" : "bg-violet-50",
            onClick: copyBundle,
          },
          {
            label: "QR Code",
            sub: "Insurer scans this",
            icon: QrCode,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
            onClick: () => setShowQR(!showQR),
            active: showQR,
          },
          {
            label: "Email",
            sub: "Send via email",
            icon: Mail,
            color: "text-amber-600",
            bg: "bg-amber-50",
            onClick: emailBundle,
          },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + idx * 0.05 }}
            >
              <button onClick={item.onClick} className="w-full group">
                <GlassCard
                  padding="sm"
                  className={cn(
                    "hover:shadow-lg hover:shadow-indigo-100/50 transition-all duration-300 cursor-pointer h-full",
                    "active" in item && item.active
                      ? "border-indigo-300 bg-indigo-50/30"
                      : "hover:border-indigo-200/60",
                  )}
                >
                  <div className="flex flex-col items-center gap-2 py-1 sm:py-2">
                    <div
                      className={cn(
                        "flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl transition-colors",
                        item.bg,
                        item.color,
                      )}
                    >
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs sm:text-sm font-semibold text-slate-700">
                        {item.label}
                      </p>
                      <p className="text-[9px] sm:text-[11px] text-slate-400 mt-0.5">
                        {item.sub}
                      </p>
                    </div>
                  </div>
                </GlassCard>
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* QR Code expanded — now contains a real verify URL */}
      <AnimatePresence>
        {showQR && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <GlassCard
              padding="md"
              className="sm:p-8 flex flex-col items-center gap-4"
            >
              {/* The QR now encodes the actual verify URL */}
              <QRProof data={verifyUrl} size={200} />

              <div className="text-center space-y-2">
                <p className="text-xs font-semibold text-slate-700">
                  Insurer scans this → claim auto-loads
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  {bundle.claimId}
                </p>

                {/* Copyable link */}
                <button
                  onClick={copyVerifyLink}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200/50 text-[10px] sm:text-[11px] font-mono text-indigo-600 hover:bg-indigo-100 transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  <span className="truncate max-w-[200px] sm:max-w-[300px]">
                    {verifyUrl}
                  </span>
                </button>
              </div>

              <div className="w-full pt-2 border-t border-slate-200/40">
                <p className="text-[10px] text-slate-400 text-center">
                  💡 For demo: open{" "}
                  <a
                    href={verifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-500 underline"
                  >
                    this link
                  </a>{" "}
                  in a new tab — the claim loads automatically
                </p>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Bundle */}
      <div>
        <button
          onClick={() => setShowBundle(!showBundle)}
          className="flex items-center gap-2 text-[10px] sm:text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors mx-auto"
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
              <pre className="p-3 sm:p-4 rounded-xl bg-slate-900 text-indigo-300 text-[9px] sm:text-[11px] font-mono leading-relaxed overflow-x-auto max-h-48 sm:max-h-64 overflow-y-auto border border-slate-700/50">
                {serialized}
              </pre>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Verification info */}
      <GlassCard
        padding="sm"
        className="bg-emerald-50/30 border-emerald-200/30"
      >
        <div className="flex items-center gap-2.5 sm:gap-3">
          <Shield className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] sm:text-xs text-emerald-700 font-medium">
              Insurer can verify by scanning QR, opening the link, or uploading
              the JSON at:
            </p>
            <Link href="/verify" target="_blank">
              <code className="text-[10px] sm:text-[11px] font-mono text-emerald-600 bg-emerald-100/60 px-1.5 py-0.5 rounded inline-flex items-center gap-1 mt-0.5">
                {typeof window !== "undefined"
                  ? `${window.location.origin}/verify`
                  : "/verify"}
                <ExternalLink className="w-2.5 h-2.5" />
              </code>
            </Link>
          </div>
        </div>
      </GlassCard>

      {/* Mark as shared */}
      <motion.div className="flex justify-center pt-1 sm:pt-2">
        <motion.button
          onClick={markAsShared}
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          disabled={shared}
          className={cn(
            "w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm font-semibold tracking-wide shadow-lg transition-all",
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
