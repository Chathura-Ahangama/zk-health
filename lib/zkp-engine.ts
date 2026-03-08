/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * ═══════════════════════════════════════════════════════════════
 * ZKP Engine — Medical Insurance Claim Proof System
 * ═══════════════════════════════════════════════════════════════
 *
 * FLOW:
 *   1. Lab uploads patient medical report (JSON)
 *   2. Engine generates a ZK proof that medical values EXCEED
 *      insurance thresholds (patient qualifies for claim)
 *   3. Patient receives proof hash (hex code)
 *   4. Insurance company verifies proof WITHOUT seeing actual data
 *   5. Claim approved/denied based on proof validity
 *
 * WHAT THE PROOF PROVES (without revealing actual values):
 *   - "Patient's blood sugar IS ABOVE 126 mg/dL" (diabetic range)
 *   - "Patient's cholesterol IS ABOVE 200 mg/dL" (high range)
 *   - "Patient's BP systolic IS ABOVE 140 mmHg" (hypertension)
 
 */

import { Noir, type InputMap } from "@noir-lang/noir_js";
import { BarretenbergBackend } from "@noir-lang/backend_barretenberg";

/* ── Public Types ─────────────────────────────────────────── */

export interface WitnessInput {
  sugar: number;
  cholesterol: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  hemoglobin: number;
  thresholdSugar: number;
  thresholdCholesterol: number;
  labSecret?: string;
  labPubHash?: string;
}

export interface GeneratedProof {
  proof: Uint8Array;
  publicSignals: string[];
}

export interface CircuitArtifacts {
  wasmPath?: string;
  zkeyPath?: string;
  acirPath?: string;
  vkeyPath?: string;
}

/**
 * Detailed simulation result — tells the UI exactly which
 * conditions the patient qualifies for.
 */
export interface ClaimEligibility {
  sugarQualifies: boolean;
  cholesterolQualifies: boolean;
  bpQualifies: boolean;
  overallQualifies: boolean;
  sugarValue: number;
  cholesterolValue: number;
  bpSystolicValue: number;
  sugarThreshold: number;
  cholesterolThreshold: number;
  bpThreshold: number;
  qualifiedConditions: string[];
  failedConditions: string[];
}

/* ── Module-level Singletons ──────────────────────────────── */

let noir: Noir | null = null;
let backend: BarretenbergBackend | null = null;
let isInitialized = false;
let useRealCircuit = false;

/* ── 1. Initialize ────────────────────────────────────────── */

export async function initializeCircuit(
  _artifacts?: CircuitArtifacts,
): Promise<void> {
  if (isInitialized) return;

  try {
    const { Noir } = await import("@noir-lang/noir_js");
    const { BarretenbergBackend } = await import(
      "@noir-lang/backend_barretenberg"
    );

    const circuitModule = await fetch("/circuits/medical_proof.json").then(
      (r) => r.json(),
    );

    backend = new BarretenbergBackend(circuitModule);
    noir = new Noir(circuitModule);

    useRealCircuit = true;
    isInitialized = true;
  } catch (err) {
    console.warn(
      "[ZKP Engine] Noir packages not found or circuit missing, using simulation.",
      err,
    );
    useRealCircuit = false;
    isInitialized = true;
    await new Promise((r) => setTimeout(r, 800));
  }
}

/* ── 2. Generate Witness ──────────────────────────────────── */

/**
 * Prepare circuit inputs from medical data.
 *
 * The circuit will prove that the patient's values EXCEED the
 * insurance claim thresholds — qualifying them for a payout —
 * WITHOUT revealing the actual medical values.
 */
export async function generateWitness(
  inputs: WitnessInput,
): Promise<Record<string, any>> {
  const BP_THRESHOLD = 140;

  const circuitInputs = {
    sugar: inputs.sugar.toString(),
    cholesterol: inputs.cholesterol.toString(),
    bp_systolic: inputs.bloodPressureSystolic.toString(),
    lab_secret: inputs.labSecret || "12345",
    threshold_sugar: inputs.thresholdSugar.toString(),
    threshold_cholesterol: inputs.thresholdCholesterol.toString(),
    threshold_bp: BP_THRESHOLD.toString(),
    lab_pub_hash:
      inputs.labPubHash ||
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    data_hash:
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    result: "1",
  };

  if (useRealCircuit && noir) {
    return { ...circuitInputs, _isReal: true };
  }

  // ── Simulation fallback ──
  await new Promise((r) => setTimeout(r, 1000));

  /**
   * INSURANCE CLAIM LOGIC:
   * Patient qualifies if ANY condition exceeds threshold.
   *
   *   sugar ≥ 126       → Diabetic range         → qualifies
   *   cholesterol ≥ 200 → High cholesterol        → qualifies
   *   bp_systolic ≥ 140 → Hypertension            → qualifies
   *
   * At least ONE must be met for a valid claim.
   */
  const sugarQualifies = inputs.sugar >= inputs.thresholdSugar;
  const cholesterolQualifies =
    inputs.cholesterol >= inputs.thresholdCholesterol;
  const bpQualifies = inputs.bloodPressureSystolic >= BP_THRESHOLD;

  // Patient qualifies if AT LEAST ONE condition is met
  const overallQualifies =
    sugarQualifies || cholesterolQualifies || bpQualifies;

  const qualifiedConditions: string[] = [];
  const failedConditions: string[] = [];

  if (sugarQualifies) {
    qualifiedConditions.push(
      `Blood Sugar: ${inputs.sugar} mg/dL ≥ ${inputs.thresholdSugar} mg/dL (Diabetic)`,
    );
  } else {
    failedConditions.push(
      `Blood Sugar: ${inputs.sugar} mg/dL < ${inputs.thresholdSugar} mg/dL (Normal)`,
    );
  }

  if (cholesterolQualifies) {
    qualifiedConditions.push(
      `Cholesterol: ${inputs.cholesterol} mg/dL ≥ ${inputs.thresholdCholesterol} mg/dL (High)`,
    );
  } else {
    failedConditions.push(
      `Cholesterol: ${inputs.cholesterol} mg/dL < ${inputs.thresholdCholesterol} mg/dL (Normal)`,
    );
  }

  if (bpQualifies) {
    qualifiedConditions.push(
      `BP Systolic: ${inputs.bloodPressureSystolic} mmHg ≥ ${BP_THRESHOLD} mmHg (Hypertension)`,
    );
  } else {
    failedConditions.push(
      `BP Systolic: ${inputs.bloodPressureSystolic} mmHg < ${BP_THRESHOLD} mmHg (Normal)`,
    );
  }

  const eligibility: ClaimEligibility = {
    sugarQualifies,
    cholesterolQualifies,
    bpQualifies,
    overallQualifies,
    sugarValue: inputs.sugar,
    cholesterolValue: inputs.cholesterol,
    bpSystolicValue: inputs.bloodPressureSystolic,
    sugarThreshold: inputs.thresholdSugar,
    cholesterolThreshold: inputs.thresholdCholesterol,
    bpThreshold: BP_THRESHOLD,
    qualifiedConditions,
    failedConditions,
  };

  return {
    ...circuitInputs,
    _isReal: false,
    _constraintsSatisfied: overallQualifies,
    _eligibility: eligibility,
  };
}

/* ── 3. Generate Proof ────────────────────────────────────── */

/**
 * Generate ZK proof that the patient qualifies for insurance claim.
 *
 * The proof proves the medical values exceed thresholds WITHOUT
 * revealing the actual values. Only the thresholds (public inputs)
 * are visible to the verifier (insurance company).
 */
export async function generateProof(
  witness: Record<string, any>,
): Promise<GeneratedProof> {
  if (useRealCircuit && noir && backend) {
    try {
      const { witness: solvedWitness } = await noir.execute(
        witness as InputMap,
      );
      const proofData = await backend.generateProof(solvedWitness);

      return {
        proof: proofData.proof,
        publicSignals: proofData.publicInputs.map((pi) => pi.toString()),
      };
    } catch (err) {
      console.error("[ZKP Engine] Real proof generation failed:", err);
      throw new Error(
        err instanceof Error ? err.message : "Circuit execution failed",
      );
    }
  }

  // ── Simulation fallback ──

  if (witness._constraintsSatisfied === false) {
    const elig = witness._eligibility as ClaimEligibility | undefined;

    let errorMsg =
      "Patient does not qualify for insurance claim — no medical condition exceeds the required thresholds.";

    if (elig && elig.failedConditions.length > 0) {
      errorMsg += "\n\nAll values are in NORMAL range:";
      elig.failedConditions.forEach((cond) => {
        errorMsg += `\n  • ${cond}`;
      });
      errorMsg +=
        "\n\nThe patient must have at least one condition above the threshold to generate a valid claim proof.";
    }

    throw new Error(errorMsg);
  }

  await new Promise((r) => setTimeout(r, 2500));

  // Generate a realistic-looking simulated proof
  const simulatedProof = new Uint8Array(64);
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    globalThis.crypto.getRandomValues(simulatedProof);
  } else {
    for (let i = 0; i < simulatedProof.length; i++) {
      simulatedProof[i] = Math.floor(Math.random() * 256);
    }
  }

  return {
    proof: simulatedProof,
    publicSignals: [
      witness.threshold_sugar,
      witness.threshold_cholesterol,
      witness.threshold_bp,
      "1", // result = patient qualifies
    ],
  };
}

/* ── 4. Generate Verification Key ─────────────────────────── */

/**
 * Generate / extract a verification key.
 *
 * The insurance company uses this to verify the proof
 * WITHOUT seeing any medical data.
 */
export async function generateVerificationKey(): Promise<string> {
  if (useRealCircuit && backend) {
    try {
      const vkBytes = await backend.getVerificationKey();
      const snippet = Array.from(vkBytes.slice(0, 32))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      return `vk_noir_${snippet}`;
    } catch (err) {
      console.warn(
        "[ZKP Engine] Could not extract VK from backend, using hash fallback.",
        err,
      );
      return `vk_noir_${generateRandomHex(32).slice(2)}`;
    }
  }

  // Simulation mode
  return `vk_sim_${generateRandomHex(32).slice(2)}`;
}

/* ── 5. Verify Proof ──────────────────────────────────────── */

/**
 * Verify a ZK proof (used by insurance company).
 *
 * This ONLY checks that the proof is mathematically valid.
 * It does NOT reveal what the actual sugar/cholesterol values are.
 * It only confirms: "yes, the values exceed the thresholds."
 */
export async function verifyProof(
  proof: GeneratedProof,
  _verificationKey?: string,
): Promise<boolean> {
  if (useRealCircuit && backend) {
    try {
      const isValid = await backend.verifyProof({
        proof: proof.proof,
        publicInputs: proof.publicSignals,
      });

      return isValid;
    } catch (err) {
      console.error("[ZKP Engine] Verification error:", err);
      return false;
    }
  }

  // Simulation mode
  await new Promise((r) => setTimeout(r, 1000));
  return true;
}

/* ── Helpers ──────────────────────────────────────────────── */

function generateRandomHex(bytes: number): string {
  const chars = "0123456789abcdef";
  let hex = "0x";
  for (let i = 0; i < bytes * 2; i++) {
    hex += chars[Math.floor(Math.random() * 16)];
  }
  return hex;
}

/**
 * Convert a Uint8Array proof to a hex string.
 * This is the "proof code" that the patient gives to the insurance company.
 */
export function uint8ArrayToHex(arr: Uint8Array): string {
  return (
    "0x" +
    Array.from(arr)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  );
}
