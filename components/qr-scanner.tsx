"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Camera, CameraOff, ScanLine, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface QRScannerProps {
  onScan: (data: string) => void;
  className?: string;
}

export function QRScanner({ onScan, className }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const scanFrameRef = useRef<() => void>(() => {});
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasScanned, setHasScanned] = useState(false);

  const stopCamera = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsActive(false);
  }, []);

  // Keep the scan function in a ref to avoid "accessed before declared" error
  const scanFrame = useCallback(() => {
    if (
      !videoRef.current ||
      !canvasRef.current ||
      hasScanned ||
      videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA
    ) {
      if (!hasScanned) {
        // Use the ref instead of direct self-reference
        animationRef.current = requestAnimationFrame(() =>
          scanFrameRef.current(),
        );
      }
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if ("BarcodeDetector" in window) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detector = new (window as any).BarcodeDetector({
        formats: ["qr_code"],
      });

      detector
        .detect(canvas)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then((barcodes: any[]) => {
          if (barcodes.length > 0 && !hasScanned) {
            setHasScanned(true);
            stopCamera();
            onScan(barcodes[0].rawValue);
          }
        })
        .catch(() => {
          // Detection failed, try next frame
        });
    }

    if (!hasScanned) {
      // Use the ref instead of direct self-reference
      animationRef.current = requestAnimationFrame(() =>
        scanFrameRef.current(),
      );
    }
  }, [hasScanned, onScan, stopCamera]);

  // Keep the ref in sync with the latest scanFrame
  useEffect(() => {
    scanFrameRef.current = scanFrame;
  }, [scanFrame]);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      setHasScanned(false);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsActive(true);

        if (!("BarcodeDetector" in window)) {
          setError(
            "QR scanning not supported in this browser. Please use Chrome, Edge, or upload the JSON file instead.",
          );
          return;
        }

        // Start scanning via the ref
        animationRef.current = requestAnimationFrame(() =>
          scanFrameRef.current(),
        );
      }
    } catch (err) {
      if (err instanceof Error) {
        if (
          err.name === "NotAllowedError" ||
          err.name === "PermissionDeniedError"
        ) {
          setError("Camera permission denied. Please allow camera access.");
        } else if (
          err.name === "NotFoundError" ||
          err.name === "DevicesNotFoundError"
        ) {
          setError("No camera found on this device.");
        } else {
          setError(
            "Could not access camera. Try uploading the JSON file instead.",
          );
        }
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div className="relative w-full max-w-sm aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-slate-700/50">
        <video
          ref={videoRef}
          className={cn(
            "absolute inset-0 w-full h-full object-cover",
            !isActive && "hidden",
          )}
          playsInline
          muted
        />
        <canvas ref={canvasRef} className="hidden" />

        {isActive && (
          <>
            <div className="absolute inset-0 p-8 sm:p-12">
              <div className="relative w-full h-full">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-3 border-l-3 border-indigo-400 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-3 border-r-3 border-indigo-400 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-3 border-l-3 border-indigo-400 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-3 border-r-3 border-indigo-400 rounded-br-lg" />
              </div>
            </div>
            <motion.div
              className="absolute left-8 right-8 sm:left-12 sm:right-12 h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent"
              animate={{ top: ["15%", "85%", "15%"] }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <div className="absolute bottom-4 left-0 right-0 text-center">
              <span className="px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm text-white text-[10px] sm:text-xs font-medium">
                <ScanLine className="w-3 h-3 inline mr-1.5" />
                Point at QR code
              </span>
            </div>
          </>
        )}

        {!isActive && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-slate-400">
            <Camera className="w-10 h-10 opacity-40" />
            <p className="text-xs font-medium">Camera inactive</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <CameraOff className="w-8 h-8 text-red-400" />
            <p className="text-xs text-red-300">{error}</p>
          </div>
        )}

        {hasScanned && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-emerald-900/80">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center"
            >
              <ScanLine className="w-8 h-8 text-white" />
            </motion.div>
            <p className="text-sm font-semibold text-white">QR Code Scanned!</p>
          </div>
        )}
      </div>

      {!hasScanned && (
        <motion.button
          onClick={isActive ? stopCamera : startCamera}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all",
            isActive
              ? "bg-red-50 border border-red-200 text-red-600 hover:bg-red-100"
              : "bg-indigo-600 text-white shadow-md shadow-indigo-300/25 hover:bg-indigo-700",
          )}
        >
          {isActive ? (
            <>
              <CameraOff className="w-4 h-4" />
              Stop Camera
            </>
          ) : (
            <>
              <Camera className="w-4 h-4" />
              Start Camera
            </>
          )}
        </motion.button>
      )}

      {!("BarcodeDetector" in (typeof window !== "undefined" ? window : {})) &&
        !isActive && (
          <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200/60 max-w-sm">
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-700">
              QR scanning works best in Chrome or Edge. You can also upload the
              JSON file or paste the claim bundle directly.
            </p>
          </div>
        )}
    </div>
  );
}
