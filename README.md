# MedZK — Privacy-First Medical Insurance Claims

> Prove you qualify for insurance without revealing your health data.
> Zero-knowledge proofs make it mathematically impossible for the
> insurer to learn your actual medical values.

## The Problem

- 400M+ medical records breached since 2009
- Patients hand over entire medical histories for simple claims
- Insurance claims take 30+ days due to manual verification
- No privacy-preserving alternative exists

## The Solution

MedZK uses zero-knowledge proofs to let patients prove their
medical data meets insurance policy thresholds WITHOUT revealing
the actual values.

The insurer learns: "This patient's sugar IS above 126 mg/dL"
The insurer NEVER sees: "This patient's sugar is exactly 142 mg/dL"

## How It Works

1. Patient uploads lab report (JSON)
2. ZK proof is generated locally (nothing leaves the device)
3. Patient builds a claim and shares it with insurer
4. Insurer verifies the proof cryptographically
5. Claim is approved — no private data was ever revealed

## Tech Stack

- Next.js 15 (App Router)
- Tailwind CSS 4.0
- Framer Motion
- ZKP Circuit (Noir-compatible architecture)
- BroadcastChannel API for real-time cross-tab sync

## Try It

1. Open Tab 1: [your-vercel-url.vercel.app](/)
2. Upload the sample medical report (download button provided)
3. Generate proof → Build claim → Share
4. Open Tab 2: [your-vercel-url.vercel.app/verify](/verify)
5. Upload the downloaded claim bundle
6. Verify → Approve → Watch Tab 1 update in real time

## Architecture

Patient Device Insurer Portal
───────────── ──────────────
Lab Report (private)
│
ZK Circuit
│
Proof (opaque) ────► Verify Proof
│ │
Claim Bundle ────► Approve/Reject
│ │
Status Updated ◄──── Decision Synced

## Team

Chathura Ahangama
Li Dantong
