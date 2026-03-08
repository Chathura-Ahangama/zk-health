# zkHealth — Privacy-First Medical Insurance Claims

> An authorized medical lab can issue a privacy-preserving claim bundle that proves a patient qualifies for an insurance claim without revealing the patient’s raw medical data.

## The Problem

Healthcare claims are still built on over-disclosure.

- Patients often lose privacy because insurers request full medical reports for simple claims
- Labs and hospitals issue sensitive diagnostic data that can be leaked, mishandled, or overshared
- Insurance verification is slow, manual, and difficult to automate across organizations
- There is no clean way to prove a condition exists without exposing the underlying medical values

## The Solution

zkHealth lets an authorized lab generate a claim bundle containing:

- a zero-knowledge medical proof
- public threshold conditions
- insurer-facing metadata
- a lab wallet signature proving the bundle came from an authentic issuer

The insurer learns statements like:

- “This patient’s blood sugar exceeds the diabetic threshold”
- “This patient qualifies for a claim under the medical criteria”

The insurer never learns:

- the exact blood sugar value
- the full lab report
- other unrelated medical data

## How It Works

1. A medical lab uploads a patient’s report
2. A zero-knowledge proof is generated locally
3. The lab signs the claim bundle with its wallet
4. The signed bundle is shared with the insurer
5. The insurer verifies the bundle without seeing private medical values
6. Optionally, the bundle can be submitted on-chain for auditable processing

## Why This Matters

zkHealth changes the claim model from:

**“Show me all your medical data”**

to:

**“Prove you qualify, without revealing the data itself.”**

This reduces data exposure, improves patient privacy, and creates a path toward faster and more automatable insurance claim processing.

## Current Demo Flow

### Lab / Issuer Side

- Upload medical report JSON
- Generate zero-knowledge proof locally
- Review extracted values in privacy-preserving UI
- Sign claim bundle as lab using MetaMask
- Share bundle by JSON, QR code, or link
- Optionally submit the signed bundle on-chain on Sepolia

### Insurer Side

- Upload, paste, or scan the claim bundle
- Verify the proof locally in the portal
- Check whether the bundle is signed by a registered lab
- Read the on-chain claim status if submitted to Sepolia

## Chainlink Use Case

zkHealth uses Chainlink to make claim processing automatable.

### Chainlink Automation

When a signed claim bundle is submitted on-chain:

- the claim enters the `Submitted` state
- Chainlink Automation monitors pending claims
- Automation triggers contract processing after the configured delay
- the claim becomes `Approved` or `Rejected` automatically

This demonstrates how medical proof issuance can move from a manual workflow to an automated trust-minimized pipeline.

## Tech Stack

- Next.js 15 App Router
- Tailwind CSS 4
- Framer Motion
- Lucide React
- Noir-compatible ZK architecture
- Sepolia testnet
- Solidity smart contracts
- Chainlink Automation
- MetaMask wallet signatures

## Current Implementation Notes

This version focuses on the full product flow and issuer trust model.

Implemented now:

- local proof generation flow
- lab wallet signature
- registered lab checking on-chain
- optional on-chain claim submission
- Chainlink Automation processing
- insurer-side signature validation

Current limitation:

- the on-chain ZK verifier is mocked for demo speed
- the next upgrade is replacing it with the real Noir-generated verifier contract

## Try It

### Tab 1 — Lab / Issuer Portal

1. Open the main app
2. Upload the sample medical report
3. Generate proof
4. Prepare claim
5. Sign as lab with MetaMask
6. Build claim bundle
7. Optionally submit on-chain
8. Share by QR, JSON, or link

### Tab 2 — Insurer Portal

1. Open `/verify`
2. Upload, paste, or scan the bundle
3. Check signature status
4. Verify proof
5. If submitted on-chain, refresh the on-chain status card to view the Sepolia status

## Architecture

```text
Medical Lab / Issuer
        │
        │ Upload medical report
        ▼
 Local ZK Proof Generation
        │
        │ Sign bundle with lab wallet
        ▼
 Signed Claim Bundle
        ├──────────────► Insurer Portal
        │                - verify proof
        │                - verify signature
        │                - check lab authenticity
        │
        └──────────────► Sepolia
                         - submit claim
                         - Chainlink Automation processes it
                         - status becomes approved/rejected
```
