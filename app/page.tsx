"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useZKP } from "@/hooks/use-zkp";
import { DashboardHeader } from "@/components/dashboard-header";
import { StatusTimeline } from "@/components/status-timeline";
import { UploadZone } from "@/components/upload-zone";
import { DataExtraction } from "@/components/data-extraction";
import { CircuitVisualizer } from "@/components/circuit-visualizer";
import { ProofDisplay } from "@/components/proof-display";
import { GlassCard } from "@/components/glass-card";
import { ScanLine } from "lucide-react";

export default function Dashboard() {
  const zkp = useZKP();

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Header */}
      <DashboardHeader state={zkp.state} onReset={zkp.reset} />

      {/* Timeline */}
      <StatusTimeline state={zkp.state} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center px-4 sm:px-6 py-8 lg:py-12">
        <AnimatePresence mode="wait">
          {/* ── IDLE: Upload ──────────────────────────────── */}
          {zkp.state === "IDLE" && (
            <UploadZone
              key="upload"
              onUpload={zkp.uploadAndScan}
              error={zkp.error}
            />
          )}

          {/* ── GENERATING_WITNESS: Scanning ──────────────── */}
          {zkp.state === "GENERATING_WITNESS" && (
            <ScanningView key="scanning" progress={zkp.progress} />
          )}

          {/* ── WITNESS_READY: Data Extraction ────────────── */}
          {zkp.state === "WITNESS_READY" && zkp.medicalData && (
            <DataExtraction
              key="extraction"
              data={zkp.medicalData}
              onGenerateProof={zkp.generateProof}
            />
          )}

          {/* ── PROVING: Circuit Visualizer ───────────────── */}
          {zkp.state === "PROVING" && (
            <CircuitVisualizer key="circuit" progress={zkp.progress} />
          )}

          {/* ── PROOF_GENERATED / VERIFIED: Results ──────── */}
          {(zkp.state === "PROOF_GENERATED" || zkp.state === "VERIFIED") &&
            zkp.proof && (
              <ProofDisplay
                key="proof"
                proof={zkp.proof}
                isVerified={zkp.isVerified}
                onVerify={zkp.verifyProof}
                progress={zkp.progress}
              />
            )}
        </AnimatePresence>

        {/* Error toast (floating) */}
        <AnimatePresence>
          {zkp.error && zkp.state !== "IDLE" && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl bg-red-600 text-white text-sm font-medium shadow-2xl"
            >
              {zkp.error}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 text-center">
        <p className="text-[10px] text-slate-400 tracking-wide">
          Proofs are generated locally in your browser. No medical data leaves
          your device.
        </p>
      </footer>
    </div>
  );
}

/* ── Scanning View ────────────────────────────────────────── */

function ScanningView({ progress }: { progress: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.97 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-lg mx-auto"
    >
      <GlassCard glow="indigo" padding="lg">
        <div className="flex flex-col items-center gap-6">
          {/* Scanning icon animation */}
          <div className="relative">
            <motion.div
              className="w-20 h-20 rounded-2xl bg-indigo-50 border border-indigo-200/40 flex items-center justify-center overflow-hidden"
              animate={{
                borderColor: [
                  "rgba(199,210,254,0.4)",
                  "rgba(99,102,241,0.4)",
                  "rgba(199,210,254,0.4)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <ScanLine className="w-8 h-8 text-indigo-500" />

              {/* Scanning line */}
              <motion.div
                className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
                animate={{
                  top: ["-2%", "102%"],
                }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            </motion.div>

            {/* Pulse rings */}
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-2xl border border-indigo-300/30"
                animate={{
                  scale: [1, 1.5],
                  opacity: [0.6, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.6,
                  ease: "easeOut",
                }}
              />
            ))}
          </div>

          {/* Progress */}
          <div className="w-full space-y-3 text-center">
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-700">
                Scanning Medical Data
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Extracting fields and generating witness...{" "}
                <span className="font-mono text-indigo-600">
                  {Math.round(progress)}%
                </span>
              </p>
            </div>
          </div>

          {/* Extraction preview */}
          <div className="w-full space-y-1.5">
            {["Patient ID", "Blood Sugar", "Cholesterol", "Blood Pressure"].map(
              (field, i) => (
                <motion.div
                  key={field}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50/80"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.3 }}
                >
                  <span className="text-xs font-medium text-slate-500">
                    {field}
                  </span>
                  <motion.div
                    className="w-16 h-3 rounded bg-indigo-100"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                </motion.div>
              ),
            )}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
