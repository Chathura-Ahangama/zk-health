/**
 * ═══════════════════════════════════════════════════════════════
 * Claim Sync — Cross-Tab Real-Time Communication
 * ═══════════════════════════════════════════════════════════════
 *
 * Uses BroadcastChannel API for instant cross-tab sync
 * and localStorage as persistent backup.
 *
 * DEMO MODE:  BroadcastChannel + localStorage (same browser)
 * PRODUCTION: Replace with Supabase Realtime / Firebase / WebSocket
 *
 * ┌──────────────┐  BroadcastChannel  ┌──────────────────┐
 * │ Patient Tab  │◄──────────────────►│  Insurer Tab     │
 * │   (/)        │                    │  (/verify)       │
 * │              │    localStorage    │                  │
 * │  Listens for │◄──────────────────►│  Writes decision │
 * │  status      │    (backup)        │                  │
 * └──────────────┘                    └──────────────────┘
 *
 * UPGRADING TO PRODUCTION:
 * ────────────────────────────────────────────────────────
 * Replace this file with:
 *
 * ```ts
 * import { createClient } from '@supabase/supabase-js';
 *
 * const supabase = createClient(URL, KEY);
 *
 * export function subscribeToClaimUpdates(claimId, callback) {
 *   return supabase
 *     .channel(`claim:${claimId}`)
 *     .on('postgres_changes', {
 *       event: 'UPDATE',
 *       schema: 'public',
 *       table: 'claims',
 *       filter: `claim_id=eq.${claimId}`,
 *     }, payload => callback(payload.new))
 *     .subscribe();
 * }
 *
 * export async function updateClaimStatus(claimId, status, data) {
 *   await supabase
 *     .from('claims')
 *     .update({ status, ...data })
 *     .eq('claim_id', claimId);
 * }
 * ```
 * ═══════════════════════════════════════════════════════════════
 */

/* ── Types ────────────────────────────────────────────────── */

export type ClaimStatusType =
  | "proof_generated"
  | "claim_submitted"
  | "under_review"
  | "verified"
  | "approved"
  | "rejected";

export interface ClaimStatusUpdate {
  claimId: string;
  status: ClaimStatusType;
  timestamp: number;
  data?: {
    referenceNumber?: string;
    reviewerNotes?: string;
    decidedAt?: number;
    verifiedAt?: number;
  };
}

export interface ClaimRecord {
  claimId: string;
  history: ClaimStatusUpdate[];
  currentStatus: ClaimStatusType;
  lastUpdated: number;
}

type ClaimListener = (update: ClaimStatusUpdate) => void;

/* ── Constants ────────────────────────────────────────────── */

const CHANNEL_NAME = "medzk-claim-sync";
const STORAGE_PREFIX = "medzk_claim_";

/* ── BroadcastChannel singleton ───────────────────────────── */

let channel: BroadcastChannel | null = null;
const listeners = new Map<string, Set<ClaimListener>>();
const globalListeners = new Set<ClaimListener>();

function getChannel(): BroadcastChannel | null {
  if (typeof window === "undefined") return null;

  if (!channel) {
    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.onmessage = (event: MessageEvent<ClaimStatusUpdate>) => {
        const update = event.data;
        if (!update?.claimId) return;

        // Notify claim-specific listeners
        const claimListeners = listeners.get(update.claimId);
        if (claimListeners) {
          claimListeners.forEach((cb) => cb(update));
        }

        // Notify global listeners
        globalListeners.forEach((cb) => cb(update));
      };
    } catch {
      // BroadcastChannel not supported — fall back to storage events
      console.warn(
        "[ClaimSync] BroadcastChannel not supported, using localStorage fallback",
      );
    }
  }

  return channel;
}

/* ── Storage helpers ──────────────────────────────────────── */

function getStorageKey(claimId: string): string {
  return `${STORAGE_PREFIX}${claimId}`;
}

function loadRecord(claimId: string): ClaimRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(getStorageKey(claimId));
    return raw ? (JSON.parse(raw) as ClaimRecord) : null;
  } catch {
    return null;
  }
}

function saveRecord(record: ClaimRecord): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(record.claimId), JSON.stringify(record));
  } catch {
    console.warn("[ClaimSync] localStorage write failed");
  }
}

/* ── Public API ───────────────────────────────────────────── */

/**
 * Publish a status update for a claim.
 * Broadcasts to other tabs AND saves to localStorage.
 */
export function publishStatusUpdate(update: ClaimStatusUpdate): void {
  // 1. Save to localStorage
  const existing = loadRecord(update.claimId);
  const record: ClaimRecord = existing ?? {
    claimId: update.claimId,
    history: [],
    currentStatus: update.status,
    lastUpdated: update.timestamp,
  };

  record.history.push(update);
  record.currentStatus = update.status;
  record.lastUpdated = update.timestamp;
  saveRecord(record);

  // 2. Broadcast to other tabs
  const ch = getChannel();
  if (ch) {
    try {
      ch.postMessage(update);
    } catch {
      // Channel might be closed
    }
  }

  // 3. Also fire storage event for fallback listeners
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("medzk-claim-update", { detail: update }),
    );
  }

  // 4. Notify local listeners too (same tab)
  const claimListeners = listeners.get(update.claimId);
  if (claimListeners) {
    claimListeners.forEach((cb) => cb(update));
  }
  globalListeners.forEach((cb) => cb(update));
}

/**
 * Subscribe to updates for a specific claim.
 * Returns an unsubscribe function.
 */
export function subscribeToClaimUpdates(
  claimId: string,
  callback: ClaimListener,
): () => void {
  // Ensure channel is initialized
  getChannel();

  if (!listeners.has(claimId)) {
    listeners.set(claimId, new Set());
  }
  listeners.get(claimId)!.add(callback);

  // Also listen to storage events (fallback for when BroadcastChannel isn't available)
  const storageHandler = (e: StorageEvent) => {
    if (e.key === getStorageKey(claimId) && e.newValue) {
      try {
        const record = JSON.parse(e.newValue) as ClaimRecord;
        const latest = record.history[record.history.length - 1];
        if (latest) callback(latest);
      } catch {
        // ignore parse errors
      }
    }
  };

  // Custom event listener (same tab fallback)
  const customHandler = (e: Event) => {
    const detail = (e as CustomEvent<ClaimStatusUpdate>).detail;
    if (detail?.claimId === claimId) {
      // Already handled by direct listener call in publishStatusUpdate
      // but keeping for robustness
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("storage", storageHandler);
    window.addEventListener("medzk-claim-update", customHandler);
  }

  return () => {
    listeners.get(claimId)?.delete(callback);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", storageHandler);
      window.removeEventListener("medzk-claim-update", customHandler);
    }
  };
}

/**
 * Subscribe to ALL claim updates (useful for a dashboard view).
 */
export function subscribeToAllUpdates(callback: ClaimListener): () => void {
  getChannel();
  globalListeners.add(callback);

  return () => {
    globalListeners.delete(callback);
  };
}

/**
 * Get the full history of a claim from localStorage.
 */
export function getClaimRecord(claimId: string): ClaimRecord | null {
  return loadRecord(claimId);
}

/**
 * Get all stored claim records.
 */
export function getAllClaimRecords(): ClaimRecord[] {
  if (typeof window === "undefined") return [];

  const records: ClaimRecord[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) records.push(JSON.parse(raw) as ClaimRecord);
      } catch {
        // skip invalid entries
      }
    }
  }

  return records.sort((a, b) => b.lastUpdated - a.lastUpdated);
}

/**
 * Clear all stored claims (for reset).
 */
export function clearAllClaims(): void {
  if (typeof window === "undefined") return;

  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
}
