"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface QRProofProps {
  data: string;
  size?: number;
  className?: string;
}

/**
 * Lightweight QR Code generator using canvas.
 * Uses the `qrcode` npm package under the hood.
 *
 * Install: npm install qrcode @types/qrcode
 */
export function QRProof({ data, size = 200, className }: QRProofProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function generate() {
      try {
        // Dynamic import so it only loads client-side
        const QRCode = (await import("qrcode")).default;
        const url = await QRCode.toDataURL(data, {
          width: size * 2, // 2x for retina
          margin: 2,
          color: {
            dark: "#1e1b4b",
            light: "#ffffff",
          },
          errorCorrectionLevel: "M",
        });
        if (!cancelled) setDataUrl(url);
      } catch {
        // Fallback: if qrcode package isn't installed, show placeholder
        if (!cancelled) setError(true);
      }
    }

    generate();
    return () => {
      cancelled = true;
    };
  }, [data, size]);

  if (error) {
    return <QRFallback data={data} size={size} className={className} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "relative inline-flex items-center justify-center rounded-2xl bg-white p-4 shadow-sm border border-slate-100",
        className,
      )}
    >
      {dataUrl ? (
        <img
          src={dataUrl}
          alt="Claim QR Code"
          width={size}
          height={size}
          className="rounded-lg"
        />
      ) : (
        <div
          style={{ width: size, height: size }}
          className="flex items-center justify-center"
        >
          <motion.div
            className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      )}

      {/* Center branding */}
      {dataUrl && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center border border-slate-100">
            <span className="text-[10px] font-black text-indigo-600 tracking-tight">
              ZK
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

/**
 * Fallback if `qrcode` package is not installed.
 * Shows a stylized hash display instead.
 */
function QRFallback({
  data,
  size,
  className,
}: {
  data: string;
  size: number;
  className?: string;
}) {
  // Generate a deterministic grid pattern from the data hash
  const grid: boolean[][] = [];
  const gridSize = 11;

  for (let row = 0; row < gridSize; row++) {
    grid[row] = [];
    for (let col = 0; col < gridSize; col++) {
      const charCode = data.charCodeAt((row * gridSize + col) % data.length);
      grid[row][col] = charCode % 3 !== 0;
    }
  }

  const cellSize = Math.floor(size / gridSize);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "relative inline-flex flex-col items-center justify-center rounded-2xl bg-white p-4 shadow-sm border border-slate-100",
        className,
      )}
    >
      <svg
        width={cellSize * gridSize}
        height={cellSize * gridSize}
        viewBox={`0 0 ${cellSize * gridSize} ${cellSize * gridSize}`}
      >
        {grid.map((row, rowIdx) =>
          row.map((filled, colIdx) =>
            filled ? (
              <rect
                key={`${rowIdx}-${colIdx}`}
                x={colIdx * cellSize}
                y={rowIdx * cellSize}
                width={cellSize - 1}
                height={cellSize - 1}
                rx={2}
                fill="#1e1b4b"
              />
            ) : null,
          ),
        )}
      </svg>
      <p className="mt-2 text-[9px] text-slate-400 font-mono">
        Install `qrcode` for real QR
      </p>
    </motion.div>
  );
}
