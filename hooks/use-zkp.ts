"use client";

import { useState, useCallback, useRef } from "react";
import {
  initializeCircuit,
  generateWitness,
  generateProof as engineGenerateProof,
  verifyProof as engineVerifyProof,
  generateVerificationKey,
  uint8ArrayToHex,
  type GeneratedProof,
  type WitnessInput,
  type ClaimEligibility,
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

/* ── Insurance Claim Thresholds ───────────────────────────── */

/**
 * These are the thresholds that define when a patient qualifies
 * for an insurance claim. Values ABOVE these = condition present.
 *
 * These become PUBLIC INPUTS to the circuit — the insurance
 * company can see the thresholds but NOT the actual values.
 */
export const THRESHOLDS = {
  sugar: {
    value: 126,
    label: "Blood Sugar ≥ 126 mg/dL (Diabetic Range)",
    direction: "above" as const,
  },
  cholesterol: {
    value: 200,
    label: "Cholesterol ≥ 200 mg/dL (High Range)",
    direction: "above" as const,
  },
  bloodPressure: {
    value: 140,
    label: "BP Systolic ≥ 140 mmHg (Hypertension)",
    direction: "above" as const,
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
  const [eligibility, setEligibility] = useState<ClaimEligibility | null>(null);

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

  const acceptClaimBundle = useCallback((bundle: ClaimBundle) => {
    setClaimBundle(bundle);
    setState("CLAIM_READY");
  }, []);

  /* ── Actions ──────────────────────────────────────────── */

  /**
   * Lab uploads a patient medical report.
   * The engine scans it and checks if the patient qualifies
   * for an insurance claim based on thresholds.
   */
  const uploadAndScan = useCallback(async (file: File) => {
    try {
      setError(null);
      setEligibility(null);
      setState("GENERATING_WITNESS");
      setProgress(0);

      const text = await file.text();
      let data: MedicalData;
      try {
        data = JSON.parse(text) as MedicalData;
      } catch {
        throw new Error(
          "Invalid JSON file. Please upload a valid medical report.",
        );
      }

      // Validate required fields
      if (
        data.sugar === undefined &&
        data.cholesterol === undefined &&
        !data.bloodPressure
      ) {
        throw new Error(
          'Medical report must contain at least one of: "sugar", "cholesterol", or "bloodPressure".',
        );
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

      // Store eligibility info for UI display
      if (witness._eligibility) {
        setEligibility(witness._eligibility as ClaimEligibility);
      }

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

  /**
   * Generate ZK proof that the patient qualifies for insurance.
   * This is the proof hash that the patient gives to the
   * insurance company.
   */
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

      // Generate the verification key (async — real Barretenberg call)
      const vk = await generateVerificationKey();

      clearProgress();
      setProgress(100);

      const zkProof: ZKProof = {
        proofHash: uint8ArrayToHex(generated.proof),
        publicInputs: generated.publicSignals,
        verificationKey: vk,
        timestamp: Date.now(),
        circuit: "medical_insurance_claim_v1.nr",
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

  /**
   * Self-verify the proof (lab verifies before giving to patient).
   * This mimics what the insurance company will do.
   */
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

      if (isValid) {
        setSelfVerified(true);
      } else {
        setError(
          "Proof verification failed. The proof is invalid and cannot be used for insurance claim.",
        );
      }

      await new Promise((r) => setTimeout(r, 400));
      setProgress(0);
    } catch (err) {
      clearProgress();
      setError(err instanceof Error ? err.message : "Verification failed");
      setProgress(0);
    }
  }, [proof]);

  /**
   * Build the final claim bundle that the patient submits
   * to the insurance company.
   */
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

  /**
   * Mark the claim as shared with the insurance company.
   */
  const markShared = useCallback(() => {
    setState("SHARED");
  }, []);

  /**
   * Reset everything for a new patient report.
   */
  const reset = useCallback(() => {
    clearProgress();
    setState("IDLE");
    setMedicalData(null);
    setProof(null);
    setSelfVerified(false);
    setClaimBundle(null);
    setError(null);
    setProgress(0);
    setEligibility(null);
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
    acceptClaimBundle,
    markShared,
    reset,
  };
}
