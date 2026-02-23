"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileJson, AlertCircle, Download } from "lucide-react";
import { GlassCard } from "./glass-card";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
  onUpload: (file: File) => void;
  error?: string | null;
}

const sampleData = {
  patientId: "MED-2024-7829",
  sugar: 142,
  cholesterol: 185,
  bloodPressure: { systolic: 128, diastolic: 82 },
  hemoglobin: 14.2,
  creatinine: 0.9,
  timestamp: "2024-01-15T10:30:00Z",
  labName: "Metro Diagnostics Lab",
};

export function UploadZone({ onUpload, error }: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (file.type === "application/json" || file.name.endsWith(".json")) {
        onUpload(file);
      }
    },
    [onUpload],
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

  const downloadSample = () => {
    const blob = new Blob([JSON.stringify(sampleData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample-medical-report.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.97 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-2xl mx-auto"
    >
      <GlassCard glow="indigo" padding="lg">
        {/* Drop zone */}
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
            "flex flex-col items-center justify-center gap-4 py-16 px-8",
            isDragOver
              ? "border-indigo-400 bg-indigo-50/60 scale-[1.01]"
              : "border-slate-200/80 hover:border-indigo-300 hover:bg-indigo-50/30",
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleChange}
            className="hidden"
          />

          {/* Icon */}
          <motion.div
            className={cn(
              "flex items-center justify-center w-16 h-16 rounded-2xl transition-colors duration-300",
              isDragOver
                ? "bg-indigo-100 text-indigo-600"
                : "bg-slate-100 text-slate-400",
            )}
            animate={
              isDragOver
                ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }
                : { scale: 1, rotate: 0 }
            }
            transition={{ duration: 0.6 }}
          >
            {isDragOver ? (
              <FileJson className="w-7 h-7" />
            ) : (
              <Upload className="w-7 h-7" />
            )}
          </motion.div>

          {/* Text */}
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-700">
              {isDragOver ? "Release to upload" : "Drop your medical report"}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              JSON format • Lab results, diagnostics, health records
            </p>
          </div>

          {/* Browse button */}
          <div className="flex items-center gap-2 mt-2">
            <span className="px-4 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-lg border border-indigo-200/60 hover:bg-indigo-100 transition-colors">
              Browse Files
            </span>
          </div>

          {/* Corner decorations */}
          <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-indigo-200/60 rounded-tl-md" />
          <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-indigo-200/60 rounded-tr-md" />
          <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-indigo-200/60 rounded-bl-md" />
          <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-indigo-200/60 rounded-br-md" />
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200/60 text-red-700 text-sm"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sample download */}
        <div className="mt-6 flex items-center justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              downloadSample();
            }}
            className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-indigo-500 transition-colors font-medium"
          >
            <Download className="w-3 h-3" />
            Download sample medical report
          </button>
        </div>
      </GlassCard>
    </motion.div>
  );
}
