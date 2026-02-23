"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileJson, AlertCircle, ClipboardPaste } from "lucide-react";
import { GlassCard } from "./glass-card";
import { cn } from "@/lib/utils";

interface VerifierUploadProps {
  onLoad: (input: string | File) => void;
  error?: string | null;
}

export function VerifierUpload({ onLoad, error }: VerifierUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteValue, setPasteValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (file.type === "application/json" || file.name.endsWith(".json")) {
        onLoad(file);
      }
    },
    [onLoad],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handlePaste = () => {
    if (pasteValue.trim()) {
      onLoad(pasteValue.trim());
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-2xl mx-auto space-y-4"
    >
      {/* Mode tabs */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => setPasteMode(false)}
          className={cn(
            "px-4 py-2 rounded-lg text-xs font-semibold transition-all",
            !pasteMode
              ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
              : "bg-white/60 text-slate-500 border border-slate-200/60 hover:bg-slate-50",
          )}
        >
          <Upload className="w-3.5 h-3.5 inline mr-1.5" />
          Upload File
        </button>
        <button
          onClick={() => setPasteMode(true)}
          className={cn(
            "px-4 py-2 rounded-lg text-xs font-semibold transition-all",
            pasteMode
              ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
              : "bg-white/60 text-slate-500 border border-slate-200/60 hover:bg-slate-50",
          )}
        >
          <ClipboardPaste className="w-3.5 h-3.5 inline mr-1.5" />
          Paste JSON
        </button>
      </div>

      <AnimatePresence mode="wait">
        {!pasteMode ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <GlassCard glow="indigo" padding="lg">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={cn(
                  "relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-300",
                  "flex flex-col items-center justify-center gap-4 py-14 px-8",
                  isDragOver
                    ? "border-indigo-400 bg-indigo-50/60"
                    : "border-slate-200/80 hover:border-indigo-300",
                )}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".json"
                  onChange={handleChange}
                  className="hidden"
                />

                <div
                  className={cn(
                    "flex items-center justify-center w-14 h-14 rounded-2xl transition-colors",
                    isDragOver
                      ? "bg-indigo-100 text-indigo-600"
                      : "bg-slate-100 text-slate-400",
                  )}
                >
                  <FileJson className="w-6 h-6" />
                </div>

                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-700">
                    Drop MedZK claim bundle
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    JSON file received from the patient
                  </p>
                </div>

                <span className="px-4 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-lg border border-indigo-200/60">
                  Browse Files
                </span>
              </div>
            </GlassCard>
          </motion.div>
        ) : (
          <motion.div
            key="paste"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <GlassCard glow="indigo" padding="lg">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2 block">
                Paste Claim Bundle JSON
              </label>
              <textarea
                value={pasteValue}
                onChange={(e) => setPasteValue(e.target.value)}
                placeholder='{"version":"1.0.0","claimId":"CLM-...","proof":{...}}'
                rows={8}
                className="w-full px-4 py-3 rounded-xl text-xs font-mono bg-slate-900 text-indigo-300 border border-slate-700/50 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 resize-none"
              />
              <motion.button
                onClick={handlePaste}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={!pasteValue.trim()}
                className="mt-3 w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
              >
                Parse Bundle
              </motion.button>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200/60 text-red-700 text-sm"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
