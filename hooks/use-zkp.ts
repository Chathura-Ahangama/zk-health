"use client";

import { useState, useCallback, useRef } from "react";
import {
  initializeCircuit,
  generateWitness,
  generateProof as engineGenerateProof,
  verifyProof as engineVerifyProof,
  generateVerificationKey,
  type GeneratedProof,
  type WitnessInput,
} from "@/lib/zkp-engine";
import {
  buildClaimBundle,
  serializeBundle,
  type ClaimBundle,
  type ClaimDetails,
} from "@/lib/claim-engine";

/* ── State Machine ────────────────────────────────────────── */

export type ZKPState =
  | "IDLE"
  | "GENERATING_WITNESS"
  | "WITNESS_READY"
  | "PROVING"
  | "PROOF_GENERATED"
  | "CLAIM_READY"
  | "SHARED";

/* ── Data Types ───────────────────────────────────────────── */

export interface MedicalData {
  patientId?: string;
  sugar?: number;
  cholesterol?: number;
  bloodPressure?: { systolic: number; diastolic: number };
  hemoglobin?: number;
  creatinine?: number;
  timestamp?: string;
  labName?: string;
  [key: string]: unknown;
}

export interface ZKProof {
  proofHash: string;
  publicInputs: string[];
  verificationKey: string;
  timestamp: number;
  circuit: string;
  constraintCount: number;
  provingTimeMs: number;
}

/* ── Thresholds (public inputs to the circuit) ────────────── */

export const THRESHOLDS = {
  sugar: {
    value: 126,
    label: "Blood Sugar > 126 mg/dL",
    direction: "above" as const,
  },
  cholesterol: {
    value: 200,
    label: "Cholesterol < 200 mg/dL",
    direction: "below" as const,
  },
} as const;

/* ── Hook ─────────────────────────────────────────────────── */

export function useZKP() {
  const [state, setState] = useState<ZKPState>("IDLE");
  const [medicalData, setMedicalData] = useState<MedicalData | null>(null);
  const [proof, setProof] = useState<ZKProof | null>(null);
  const [selfVerified, setSelfVerified] = useState(false);
  const [claimBundle, setClaimBundle] = useState<ClaimBundle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const witnessRef = useRef<Record<string, unknown> | null>(null);
  const proofRef = useRef<GeneratedProof | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Helpers ──────────────────────────────────────────── */

  const clearProgress = () => {
    if (progressRef.current) {
      clearInterval(progressRef.current);
      progressRef.current = null;
    }
  };

  const startProgress = (speed: number, cap: number) => {
    clearProgress();
    progressRef.current = setInterval(() => {
      setProgress((prev) => Math.min(prev + Math.random() * speed, cap));
    }, 250);
  };

  /* ── Actions ──────────────────────────────────────────── */

  const uploadAndScan = useCallback(async (file: File) => {
    try {
      setError(null);
      setState("GENERATING_WITNESS");
      setProgress(0);

      const text = await file.text();
      let data: MedicalData;
      try {
        data = JSON.parse(text) as MedicalData;
      } catch {
        throw new Error("Invalid JSON file.");
      }

      setMedicalData(data);
      startProgress(12, 85);

      await initializeCircuit();

      const witnessInput: WitnessInput = {
        sugar: data.sugar ?? 0,
        cholesterol: data.cholesterol ?? 0,
        bloodPressureSystolic: data.bloodPressure?.systolic ?? 0,
        bloodPressureDiastolic: data.bloodPressure?.diastolic ?? 0,
        hemoglobin: data.hemoglobin ?? 0,
        thresholdSugar: THRESHOLDS.sugar.value,
        thresholdCholesterol: THRESHOLDS.cholesterol.value,
      };

      const witness = await generateWitness(witnessInput);
      witnessRef.current = witness;

      clearProgress();
      setProgress(100);
      await new Promise((r) => setTimeout(r, 600));
      setState("WITNESS_READY");
      setProgress(0);
    } catch (err) {
      clearProgress();
      setError(err instanceof Error ? err.message : "Failed to process file");
      setState("IDLE");
      setProgress(0);
    }
  }, []);

  const generateProof = useCallback(async () => {
    if (!witnessRef.current || !medicalData) return;
    try {
      setError(null);
      setState("PROVING");
      setProgress(0);
      startProgress(6, 92);

      const t0 = performance.now();
      const generated = await engineGenerateProof(witnessRef.current);
      proofRef.current = generated;
      const provingTimeMs = Math.round(performance.now() - t0);

      clearProgress();
      setProgress(100);

      const zkProof: ZKProof = {
        proofHash: generated.proof,
        publicInputs: generated.publicSignals,
        verificationKey: generateVerificationKey(),
        timestamp: Date.now(),
        circuit: "medical_threshold_v1.nr",
        constraintCount: 2048 + Math.floor(Math.random() * 512),
        provingTimeMs,
      };
      setProof(zkProof);

      await new Promise((r) => setTimeout(r, 500));
      setState("PROOF_GENERATED");
      setProgress(0);
    } catch (err) {
      clearProgress();
      setError(err instanceof Error ? err.message : "Proof generation failed");
      setState("WITNESS_READY");
      setProgress(0);
    }
  }, [medicalData]);

  const selfVerify = useCallback(async () => {
    if (!proofRef.current || !proof) return;
    try {
      setError(null);
      startProgress(18, 90);
      const isValid = await engineVerifyProof(
        proofRef.current,
        proof.verificationKey,
      );
      clearProgress();
      setProgress(100);
      if (isValid) setSelfVerified(true);
      else setError("Self-verification failed.");
      await new Promise((r) => setTimeout(r, 400));
      setProgress(0);
    } catch (err) {
      clearProgress();
      setError(err instanceof Error ? err.message : "Verification failed");
      setProgress(0);
    }
  }, [proof]);

  const buildClaim = useCallback(
    (details: ClaimDetails) => {
      if (!proof || !medicalData) return;
      const bundle = buildClaimBundle(
        proof,
        details,
        medicalData.labName ?? "Unknown Lab",
      );
      setClaimBundle(bundle);
      setState("CLAIM_READY");
    },
    [proof, medicalData],
  );

  const markShared = useCallback(() => {
    setState("SHARED");
  }, []);

  const reset = useCallback(() => {
    clearProgress();
    setState("IDLE");
    setMedicalData(null);
    setProof(null);
    setSelfVerified(false);
    setClaimBundle(null);
    setError(null);
    setProgress(0);
    witnessRef.current = null;
    proofRef.current = null;
  }, []);

  return {
    state,
    medicalData,
    proof,
    selfVerified,
    claimBundle,
    error,
    progress,
    uploadAndScan,
    generateProof,
    selfVerify,
    buildClaim,
    markShared,
    reset,
  };
}
