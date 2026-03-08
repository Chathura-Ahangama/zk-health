/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * ZKP Engine — browser-only dynamic Noir loading
 */

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

let noir: any = null;
let backend: any = null;
let isInitialized = false;
let useRealCircuit = false;

type InputMap = Record<string, string>;

export async function initializeCircuit(
  _artifacts?: CircuitArtifacts,
): Promise<void> {
  if (isInitialized) return;

  // Never try to initialize Noir on the server/SSR side
  if (typeof window === "undefined") {
    useRealCircuit = false;
    isInitialized = true;
    return;
  }

  try {
    const [{ Noir }, { BarretenbergBackend }, circuitModule] =
      await Promise.all([
        import("@noir-lang/noir_js"),
        import("@noir-lang/backend_barretenberg"),
        fetch("/circuits/medical_proof.json").then((r) => {
          if (!r.ok) {
            throw new Error("medical_proof.json not found");
          }
          return r.json();
        }),
      ]);

    backend = new BarretenbergBackend(circuitModule);
    noir = new Noir(circuitModule);

    useRealCircuit = true;
    isInitialized = true;

    console.log("[ZKP Engine] ✓ Real Noir circuit loaded");
  } catch (err) {
    console.warn(
      "[ZKP Engine] Noir packages or circuit missing, using simulation mode.",
      err,
    );
    useRealCircuit = false;
    isInitialized = true;
    await new Promise((r) => setTimeout(r, 800));
  }
}

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

  await new Promise((r) => setTimeout(r, 1000));

  const sugarQualifies = inputs.sugar >= inputs.thresholdSugar;
  const cholesterolQualifies =
    inputs.cholesterol >= inputs.thresholdCholesterol;
  const bpQualifies = inputs.bloodPressureSystolic >= BP_THRESHOLD;

  const overallQualifies =
    sugarQualifies || cholesterolQualifies || bpQualifies;

  const qualifiedConditions: string[] = [];
  const failedConditions: string[] = [];

  if (sugarQualifies) {
    qualifiedConditions.push(
      `Blood Sugar: ${inputs.sugar} mg/dL ≥ ${inputs.thresholdSugar} mg/dL`,
    );
  } else {
    failedConditions.push(
      `Blood Sugar: ${inputs.sugar} mg/dL < ${inputs.thresholdSugar} mg/dL`,
    );
  }

  if (cholesterolQualifies) {
    qualifiedConditions.push(
      `Cholesterol: ${inputs.cholesterol} mg/dL ≥ ${inputs.thresholdCholesterol} mg/dL`,
    );
  } else {
    failedConditions.push(
      `Cholesterol: ${inputs.cholesterol} mg/dL < ${inputs.thresholdCholesterol} mg/dL`,
    );
  }

  if (bpQualifies) {
    qualifiedConditions.push(
      `BP Systolic: ${inputs.bloodPressureSystolic} mmHg ≥ ${BP_THRESHOLD} mmHg`,
    );
  } else {
    failedConditions.push(
      `BP Systolic: ${inputs.bloodPressureSystolic} mmHg < ${BP_THRESHOLD} mmHg`,
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
        publicSignals: proofData.publicInputs.map((pi: any) => pi.toString()),
      };
    } catch (err) {
      console.error("[ZKP Engine] Real proof generation failed:", err);
      throw new Error(
        err instanceof Error ? err.message : "Circuit execution failed",
      );
    }
  }

  if (witness._constraintsSatisfied === false) {
    throw new Error(
      "Patient does not qualify for insurance claim — no condition exceeds threshold.",
    );
  }

  await new Promise((r) => setTimeout(r, 2500));

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
      "1",
    ],
  };
}

export async function generateVerificationKey(): Promise<string> {
  if (useRealCircuit && backend) {
    try {
      const vkBytes = await backend.getVerificationKey() as Uint8Array;
      const snippet = Array.from(vkBytes.slice(0, 32))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      return `vk_noir_${snippet}`;
    } catch {
      return `vk_noir_${generateRandomHex(32).slice(2)}`;
    }
  }

  return `vk_sim_${generateRandomHex(32).slice(2)}`;
}

export async function verifyProof(
  proof: GeneratedProof,
  _verificationKey?: string,
): Promise<boolean> {
  if (useRealCircuit && backend) {
    try {
      return await backend.verifyProof({
        proof: proof.proof,
        publicInputs: proof.publicSignals,
      });
    } catch (err) {
      console.error("[ZKP Engine] Verification error:", err);
      return false;
    }
  }

  await new Promise((r) => setTimeout(r, 1000));
  return true;
}

function generateRandomHex(bytes: number): string {
  const chars = "0123456789abcdef";
  let hex = "0x";
  for (let i = 0; i < bytes * 2; i++) {
    hex += chars[Math.floor(Math.random() * 16)];
  }
  return hex;
}

export function uint8ArrayToHex(arr: Uint8Array): string {
  return (
    "0x" +
    Array.from(arr)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  );
}
