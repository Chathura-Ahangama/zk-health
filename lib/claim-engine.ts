/**
 * ═══════════════════════════════════════════════════════════════
 * Claim Engine — Insurance Claim Bundle Management
 * ═══════════════════════════════════════════════════════════════
 *
 * Handles creation, serialization, and validation of claim bundles
 * that get shared with insurance companies.
 *
 * IMPORTANT: The claim bundle contains ONLY:
 *  - The ZK proof (opaque bytes — reveals nothing)
 *  - Public inputs (thresholds, not actual values)
 *  - Claim metadata (policy, type, timestamps)
 *
 * It NEVER contains private medical values.
 * ═══════════════════════════════════════════════════════════════
 */

import type { ZKProof } from "@/hooks/use-zkp";

/* ── Types ────────────────────────────────────────────────── */

export interface ClaimDetails {
  policyNumber: string;
  claimType: ClaimType;
  insurerName: string;
  notes: string;
}

export type ClaimType =
  | "diabetes_diagnosis"
  | "cholesterol_screening"
  | "cardiac_assessment"
  | "general_health"
  | "prescription_eligibility";

export const CLAIM_TYPES: Record<
  ClaimType,
  { label: string; description: string }
> = {
  diabetes_diagnosis: {
    label: "Diabetes Diagnosis Verification",
    description:
      "Proves blood sugar exceeds diagnostic threshold without revealing exact value",
  },
  cholesterol_screening: {
    label: "Cholesterol Screening",
    description: "Proves cholesterol is within or outside policy range",
  },
  cardiac_assessment: {
    label: "Cardiac Risk Assessment",
    description:
      "Proves blood pressure and related markers meet assessment criteria",
  },
  general_health: {
    label: "General Health Verification",
    description: "Proves multiple health markers satisfy policy requirements",
  },
  prescription_eligibility: {
    label: "Prescription Eligibility",
    description: "Proves medical conditions warrant specific prescriptions",
  },
};

export interface ClaimBundle {
  version: "1.0.0";
  claimId: string;

  // Claim metadata
  policy: {
    number: string;
    claimType: ClaimType;
    claimTypeLabel: string;
    insurerName: string;
    notes: string;
  };

  // Proof (no private data)
  proof: {
    hash: string;
    publicInputs: string[];
    verificationKey: string;
    circuit: string;
    constraintCount: number;
    provingTimeMs: number;
  };

  // Public parameters
  publicParams: {
    thresholds: Record<string, number>;
    labIdentifier: string;
  };

  // Timestamps
  createdAt: number;
  expiresAt: number;

  // Submitter pseudonymous ID
  submitterId: string;
}

export type ClaimStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "verified"
  | "approved"
  | "rejected";

/* ── Functions ────────────────────────────────────────────── */

export function generateClaimId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CLM-${timestamp}-${random}`;
}

export function generateSubmitterId(): string {
  const chars = "0123456789abcdef";
  let id = "0x";
  for (let i = 0; i < 16; i++) {
    id += chars[Math.floor(Math.random() * 16)];
  }
  return id;
}

export function buildClaimBundle(
  proof: ZKProof,
  details: ClaimDetails,
  labName: string,
): ClaimBundle {
  const now = Date.now();
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

  return {
    version: "1.0.0",
    claimId: generateClaimId(),
    policy: {
      number: details.policyNumber,
      claimType: details.claimType,
      claimTypeLabel: CLAIM_TYPES[details.claimType].label,
      insurerName: details.insurerName,
      notes: details.notes,
    },
    proof: {
      hash: proof.proofHash,
      publicInputs: proof.publicInputs,
      verificationKey: proof.verificationKey,
      circuit: proof.circuit,
      constraintCount: proof.constraintCount,
      provingTimeMs: proof.provingTimeMs,
    },
    publicParams: {
      thresholds: { sugar: 126, cholesterol: 200 },
      labIdentifier: labName,
    },
    createdAt: now,
    expiresAt: now + THIRTY_DAYS_MS,
    submitterId: generateSubmitterId(),
  };
}

export function serializeBundle(bundle: ClaimBundle): string {
  return JSON.stringify(bundle, null, 2);
}

export function deserializeBundle(raw: string): ClaimBundle | null {
  try {
    const parsed = JSON.parse(raw);
    if (parsed.version && parsed.claimId && parsed.proof?.hash) {
      return parsed as ClaimBundle;
    }
    return null;
  } catch {
    return null;
  }
}

export function validateBundle(bundle: ClaimBundle): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!bundle.version) errors.push("Missing version");
  if (!bundle.claimId) errors.push("Missing claim ID");
  if (!bundle.proof?.hash) errors.push("Missing proof hash");
  if (!bundle.proof?.verificationKey) errors.push("Missing verification key");
  if (!bundle.proof?.publicInputs?.length) errors.push("Missing public inputs");
  if (!bundle.policy?.number) errors.push("Missing policy number");
  if (!bundle.policy?.claimType) errors.push("Missing claim type");

  if (bundle.expiresAt && bundle.expiresAt < Date.now()) {
    errors.push("Claim bundle has expired");
  }

  return { valid: errors.length === 0, errors };
}

export function isExpired(bundle: ClaimBundle): boolean {
  return bundle.expiresAt < Date.now();
}

export function getExpiryDays(bundle: ClaimBundle): number {
  const remaining = bundle.expiresAt - Date.now();
  return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)));
}
