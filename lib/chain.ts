/* eslint-disable @typescript-eslint/no-explicit-any */
import { ethers } from "ethers";
import ABI from "./abi";
import type { ClaimBundle } from "@/lib/claim-engine";

const SEPOLIA_CHAIN_ID = 11155111;
const CLAIM_MANAGER_ADDRESS = "0x33572879683C50Cd162905D02D353e33BC47297C";

const SEPOLIA_RPC_URL =
  process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ??
  "https://ethereum-sepolia-rpc.publicnode.com";

const CLAIM_MANAGER_ABI = ABI;

export type OnChainStatus = "Submitted" | "Approved" | "Rejected" | "Unknown";

function getHashPayload(bundle: ClaimBundle) {
  return {
    version: bundle.version,
    claimId: bundle.claimId,
    policy: bundle.policy,
    proof: bundle.proof,
    publicParams: bundle.publicParams,
    createdAt: bundle.createdAt,
    expiresAt: bundle.expiresAt,
    submitterId: bundle.submitterId,
  };
}

export function hashBundle(bundle: ClaimBundle): string {
  const json = JSON.stringify(getHashPayload(bundle));
  return ethers.keccak256(ethers.toUtf8Bytes(json));
}

function toBytes32(value: string): string {
  const v = value.trim();

  if (/^0x[0-9a-fA-F]+$/.test(v)) {
    return ethers.zeroPadValue(v, 32);
  }

  if (/^\d+$/.test(v)) {
    return ethers.toBeHex(BigInt(v), 32);
  }

  return ethers.zeroPadValue(ethers.hexlify(ethers.toUtf8Bytes(v)), 32);
}

function proofToHex(proof: string): string {
  if (proof.startsWith("0x")) return proof;
  return ethers.hexlify(ethers.toUtf8Bytes(proof));
}

async function getBrowserProvider() {
  if (typeof window === "undefined" || !(window as any).ethereum) {
    throw new Error("MetaMask not found");
  }

  const provider = new ethers.BrowserProvider((window as any).ethereum);
  await provider.send("eth_requestAccounts", []);

  const network = await provider.getNetwork();
  if (Number(network.chainId) !== SEPOLIA_CHAIN_ID) {
    try {
      await (window as any).ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xaa36a7" }],
      });
    } catch {
      throw new Error("Please switch MetaMask to Sepolia");
    }
  }

  return provider;
}

export function getAddressUrl(address: string) {
  return `https://sepolia.etherscan.io/address/${address}`;
}

export async function signBundleAsLab(bundle: ClaimBundle) {
  const provider = await getBrowserProvider();
  const signer = await provider.getSigner();

  const bundleHash = hashBundle(bundle);
  const labAddress = await signer.getAddress();
  const signature = await signer.signMessage(ethers.getBytes(bundleHash));

  return {
    labAddress,
    bundleHash,
    signature,
    signedAt: Date.now(),
  };
}

export async function submitBundleOnChain(bundle: ClaimBundle) {
  if (!CLAIM_MANAGER_ADDRESS) {
    throw new Error("NEXT_PUBLIC_CLAIM_MANAGER_ADDRESS is missing");
  }

  if (!bundle.issuer) {
    throw new Error("Bundle must be signed by lab before on-chain submit");
  }

  const provider = await getBrowserProvider();
  const signer = await provider.getSigner();

  const contract = new ethers.Contract(
    CLAIM_MANAGER_ADDRESS,
    CLAIM_MANAGER_ABI,
    signer,
  );

  const proofHex = proofToHex(bundle.proof.hash);
  const publicInputs = bundle.proof.publicInputs.map(toBytes32);

  const tx = await contract.submitClaim(
    bundle.issuer.bundleHash,
    bundle.issuer.signature,
    proofHex,
    publicInputs,
  );

  const receipt = await tx.wait();
  const onChainClaimId = ethers.keccak256(bundle.issuer.bundleHash);

  return {
    claimId: onChainClaimId,
    txHash: receipt.hash,
    contractAddress: CLAIM_MANAGER_ADDRESS,
    chainId: SEPOLIA_CHAIN_ID,
    submittedAt: Date.now(),
  };
}

export async function getClaimStatus(claimId: string): Promise<OnChainStatus> {
  if (!CLAIM_MANAGER_ADDRESS) return "Unknown";

  const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
  const contract = new ethers.Contract(
    CLAIM_MANAGER_ADDRESS,
    CLAIM_MANAGER_ABI,
    provider,
  );

  try {
    const status = Number(await contract.getClaimStatus(claimId));
    if (status === 0) return "Submitted";
    if (status === 1) return "Approved";
    if (status === 2) return "Rejected";
    return "Unknown";
  } catch {
    return "Unknown";
  }
}

export function getTxUrl(txHash: string) {
  return `https://sepolia.etherscan.io/tx/${txHash}`;
}

export async function verifyBundleSignatureLocal(bundle: ClaimBundle): Promise<{
  valid: boolean;
  recoveredAddress?: string;
}> {
  if (!bundle.issuer) {
    return { valid: false };
  }

  try {
    const expectedHash = hashBundle(bundle);

    if (expectedHash.toLowerCase() !== bundle.issuer.bundleHash.toLowerCase()) {
      return { valid: false };
    }

    const recovered = ethers.verifyMessage(
      ethers.getBytes(bundle.issuer.bundleHash),
      bundle.issuer.signature,
    );

    return {
      valid: recovered.toLowerCase() === bundle.issuer.labAddress.toLowerCase(),
      recoveredAddress: recovered,
    };
  } catch {
    return { valid: false };
  }
}

export async function isLabRegisteredOnChain(
  labAddress: string,
): Promise<boolean> {
  if (!CLAIM_MANAGER_ADDRESS) return false;

  const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
  const contract = new ethers.Contract(
    CLAIM_MANAGER_ADDRESS,
    CLAIM_MANAGER_ABI,
    provider,
  );

  try {
    return await contract.isLabRegistered(labAddress);
  } catch {
    return false;
  }
}
