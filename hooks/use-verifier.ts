"use client";

import { useState, useCallback, useRef } from "react";
import {
  deserializeBundle,
  validateBundle,
  isExpired,
  type ClaimBundle,
} from "@/lib/claim-engine";
import {
  verifyProof as engineVerifyProof,
  type GeneratedProof,
} from "@/lib/zkp-engine";

export type VerifierState =
  | "AWAITING"
  | "PARSING"
  | "PARSED"
  | "VERIFYING"
  | "VALID"
  | "INVALID"
  | "APPROVED"
  | "REJECTED";

export interface VerificationResult {
  isValid: boolean;
  timestamp: number;
  checks: VerificationCheck[];
}

export interface VerificationCheck {
  label: string;
  passed: boolean;
  detail: string;
}

export interface ApprovalRecord {
  claimId: string;
  decision: "approved" | "rejected";
  decidedAt: number;
  reviewerNotes: string;
  referenceNumber: string;
}

function generateRefNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `APR-${ts}-${rand}`;
}

export function useVerifier() {
  const [state, setState] = useState<VerifierState>("AWAITING");
  const [bundle, setBundle] = useState<ClaimBundle | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [approval, setApproval] = useState<ApprovalRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearProgress = () => {
    if (progressRef.current) clearInterval(progressRef.current);
    progressRef.current = null;
  };

  const startProgress = (speed: number, cap: number) => {
    clearProgress();
    progressRef.current = setInterval(() => {
      setProgress((p) => Math.min(p + Math.random() * speed, cap));
    }, 200);
  };

  const loadBundle = useCallback(async (input: string | File) => {
    try {
      setError(null);
      setState("PARSING");
      setProgress(0);

      let raw: string;
      if (typeof input === "string") {
        raw = input;
      } else {
        raw = await input.text();
      }

      await new Promise((r) => setTimeout(r, 800));

      const parsed = deserializeBundle(raw);
      if (!parsed) {
        throw new Error(
          "Invalid claim bundle format. Expected a MedZK claim JSON.",
        );
      }

      const validation = validateBundle(parsed);
      if (!validation.valid) {
        throw new Error(
          `Bundle validation failed: ${validation.errors.join(", ")}`,
        );
      }

      setBundle(parsed);
      setState("PARSED");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse bundle");
      setState("AWAITING");
    }
  }, []);

  const verify = useCallback(async () => {
    if (!bundle) return;

    try {
      setError(null);
      setState("VERIFYING");
      setProgress(0);
      startProgress(10, 88);

      const checks: VerificationCheck[] = [];

      await new Promise((r) => setTimeout(r, 400));
      const validation = validateBundle(bundle);
      checks.push({
        label: "Bundle Structure",
        passed: validation.valid,
        detail: validation.valid
          ? "All required fields present"
          : validation.errors.join(", "),
      });

      await new Promise((r) => setTimeout(r, 300));
      const expired = isExpired(bundle);
      checks.push({
        label: "Expiry Check",
        passed: !expired,
        detail: expired
          ? "Claim bundle has expired"
          : `Valid for ${Math.ceil((bundle.expiresAt - Date.now()) / 86400000)} more days`,
      });

      await new Promise((r) => setTimeout(r, 400));
      checks.push({
        label: "Circuit Identifier",
        passed: !!bundle.proof.circuit,
        detail: `Circuit: ${bundle.proof.circuit}`,
      });

      const proofData: GeneratedProof = {
        proof: bundle.proof.hash,
        publicSignals: bundle.proof.publicInputs,
      };
      const cryptoValid = await engineVerifyProof(
        proofData,
        bundle.proof.verificationKey,
      );
      checks.push({
        label: "Cryptographic Proof",
        passed: cryptoValid,
        detail: cryptoValid
          ? "Proof mathematically verified against verification key"
          : "Proof verification failed — invalid or tampered",
      });

      await new Promise((r) => setTimeout(r, 300));
      checks.push({
        label: "Public Inputs",
        passed: bundle.proof.publicInputs.length > 0,
        detail: `${bundle.proof.publicInputs.length} public signals verified`,
      });

      clearProgress();
      setProgress(100);

      const allPassed = checks.every((c) => c.passed);

      setResult({
        isValid: allPassed,
        timestamp: Date.now(),
        checks,
      });

      await new Promise((r) => setTimeout(r, 400));
      setState(allPassed ? "VALID" : "INVALID");
      setProgress(0);
    } catch (err) {
      clearProgress();
      setError(err instanceof Error ? err.message : "Verification failed");
      setState("PARSED");
      setProgress(0);
    }
  }, [bundle]);

  const approveClaim = useCallback(
    (reviewerNotes: string) => {
      if (!bundle) return;
      const record: ApprovalRecord = {
        claimId: bundle.claimId,
        decision: "approved",
        decidedAt: Date.now(),
        reviewerNotes,
        referenceNumber: generateRefNumber(),
      };
      setApproval(record);
      setState("APPROVED");
    },
    [bundle],
  );

  const rejectClaim = useCallback(
    (reviewerNotes: string) => {
      if (!bundle) return;
      const record: ApprovalRecord = {
        claimId: bundle.claimId,
        decision: "rejected",
        decidedAt: Date.now(),
        reviewerNotes,
        referenceNumber: generateRefNumber(),
      };
      setApproval(record);
      setState("REJECTED");
    },
    [bundle],
  );

  const reset = useCallback(() => {
    clearProgress();
    setState("AWAITING");
    setBundle(null);
    setResult(null);
    setApproval(null);
    setError(null);
    setProgress(0);
  }, []);

  return {
    state,
    bundle,
    result,
    approval,
    error,
    progress,
    loadBundle,
    verify,
    approveClaim,
    rejectClaim,
    reset,
  };
}
