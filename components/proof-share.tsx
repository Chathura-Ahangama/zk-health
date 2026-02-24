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
  Link as LinkIcon,
  Link,
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

interface ProofShareProps {
  bundle: ClaimBundle;
  onShared: () => void;
}

/**
 * Encode bundle into a URL-safe string.
 * Uses base64 encoding of minified JSON.
 */
function encodeBundleForURL(bundle: ClaimBundle): string {
  const minified = JSON.stringify(bundle);
  // btoa works with ASCII — we need to handle unicode safely
  const encoded = btoa(
    encodeURIComponent(minified).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16)),
    ),
  );
  return encoded;
}

export function ProofShare({ bundle, onShared }: ProofShareProps) {
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showBundle, setShowBundle] = useState(false);
  const [shared, setShared] = useState(false);
  const [verifyUrl, setVerifyUrl] = useState("");

  const serialized = serializeBundle(bundle);
  const expiryDays = getExpiryDays(bundle);

  useEffect(() => {
    // Store in localStorage (for same-browser tab sync)
    storeClaimBundle(bundle.claimId, bundle);

    // Build the cross-device URL with encoded bundle data
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const encoded = encodeBundleForURL(bundle);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVerifyUrl(
      `${origin}/verify?claimId=${encodeURIComponent(bundle.claimId)}&data=${encodeURIComponent(encoded)}`,
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
      `Dear ${bundle.policy.insurerName},\n\nPlease find my zero-knowledge proof claim.\n\nClaim ID: ${bundle.claimId}\nPolicy: ${bundle.policy.number}\nType: ${bundle.policy.claimTypeLabel}\n\nVerify instantly by opening this link:\n${verifyUrl}\n\nOr upload the JSON bundle below at ${typeof window !== "undefined" ? window.location.origin : ""}/verify\n\n${serialized}`,
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const copyVerifyLink = async () => {
    await navigator.clipboard.writeText(verifyUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2500);
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
            label: copied ? "Copied!" : "Copy JSON",
            sub: "Bundle to clipboard",
            icon: copied ? Check : Copy,
            color: copied ? "text-emerald-600" : "text-violet-600",
            bg: copied ? "bg-emerald-50" : "bg-violet-50",
            onClick: copyBundle,
          },
          {
            label: "QR Code",
            sub: "Works cross-device",
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

      {/* QR Code expanded */}
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
              {/* QR encodes the full verify URL with bundle data */}
              <QRProof data={verifyUrl} size={220} />

              <div className="text-center space-y-2 w-full">
                <p className="text-xs font-semibold text-slate-700">
                  Scan from any device — works cross-device ✓
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  {bundle.claimId}
                </p>

                {/* Copyable link */}
                <button
                  onClick={copyVerifyLink}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] sm:text-[11px] font-medium transition-colors",
                    linkCopied
                      ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                      : "bg-indigo-50 border-indigo-200/50 text-indigo-600 hover:bg-indigo-100",
                  )}
                >
                  {linkCopied ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <LinkIcon className="w-3 h-3" />
                  )}
                  {linkCopied ? "Link copied!" : "Copy verify link"}
                </button>
              </div>

              {/* How it works */}
              <div className="w-full pt-3 border-t border-slate-200/40 space-y-1.5">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  How it works
                </p>
                <div className="space-y-1">
                  {[
                    "QR contains the full claim data (no server needed)",
                    "Insurer scans → claim auto-loads on their device",
                    "Works on phone, tablet, or any browser",
                  ].map((text, i) => (
                    <p
                      key={i}
                      className="text-[10px] sm:text-[11px] text-slate-400 flex items-start gap-1.5"
                    >
                      <span className="text-indigo-400 mt-0.5">✓</span>
                      {text}
                    </p>
                  ))}
                </div>
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
