/**
 * ═══════════════════════════════════════════════════════════════
 * Lab Signer — Simulates a medical lab signing patient data
 * ═══════════════════════════════════════════════════════════════
 *
 * In production, each lab would have their own signing key pair.
 * The lab signs the medical data before giving it to the patient.
 * The ZK circuit verifies this signature INSIDE the proof.
 *
 * Flow:
 *   Lab generates report → Signs with lab_secret → Patient receives
 *   Patient generates ZK proof (includes signature verification)
 *   Insurer verifies proof on-chain (lab identity is public input)
 * ═══════════════════════════════════════════════════════════════
 */

// ── NOTE: In the real Noir circuit, we use Pedersen hash ──
// This module simulates the same hashing for the frontend.
// When you compile the Noir circuit, the actual hashing
// happens inside the circuit. This is just for preparing inputs.

export interface LabIdentity {
  labName: string;
  labId: string;
  labSecret: string; // Private — only the lab knows this
  labPubHash: string; // Public — registered on-chain
}

export interface SignedMedicalData {
  sugar: number;
  cholesterol: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  dataHash: string; // Pedersen hash of [sugar, cholesterol, bp]
  labPubHash: string; // Lab's public identity
  labSecret: string; // Lab's secret (patient needs this for ZK proof)
  timestamp: string;
  labName: string;
  labId: string;
}

// ── Demo Labs ────────────────────────────────────────────

export const DEMO_LABS: LabIdentity[] = [
  {
    labName: "Metro Diagnostics Lab",
    labId: "LAB-001",
    labSecret: "12345",
    labPubHash: "", // Computed at runtime
  },
  {
    labName: "Shanghai Medical College Lab",
    labId: "LAB-002",
    labSecret: "67890",
    labPubHash: "",
  },
  {
    labName: "City General Hospital Lab",
    labId: "LAB-003",
    labSecret: "11111",
    labPubHash: "",
  },
];

/**
 * Simulate a lab signing medical data.
 *
 * In production, this happens at the lab's system.
 * The patient receives the signed data (including lab_secret
 * which they need to generate the ZK proof, but which stays
 * private inside the proof).
 *
 * NOTE: The lab_secret being given to the patient might seem
 * odd — in a real system, the lab would use EdDSA and give
 * the patient a signature (r, s) instead. For this hackathon
 * demo with Pedersen-hash-based "signatures", the patient
 * needs the secret to prove inside the circuit.
 *
 * Upgrade path: Use std::eddsa in Noir for real signatures.
 */
export function labSignData(
  lab: LabIdentity,
  sugar: number,
  cholesterol: number,
  bpSystolic: number,
  bpDiastolic: number,
): SignedMedicalData {
  return {
    sugar,
    cholesterol,
    bloodPressureSystolic: bpSystolic,
    bloodPressureDiastolic: bpDiastolic,
    dataHash: "", // Will be computed by the circuit
    labPubHash: lab.labPubHash,
    labSecret: lab.labSecret,
    timestamp: new Date().toISOString(),
    labName: lab.labName,
    labId: lab.labId,
  };
}

/**
 * Generate a sample signed medical report.
 * This is what the "Download Sample" button creates.
 */
export function generateSampleSignedReport(): SignedMedicalData {
  const lab = DEMO_LABS[0];
  return labSignData(lab, 142, 185, 128, 82);
}
