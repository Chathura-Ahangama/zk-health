"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  subscribeToClaimUpdates,
  getClaimRecord,
  publishStatusUpdate,
  type ClaimStatusType,
  type ClaimStatusUpdate,
  type ClaimRecord,
} from "@/lib/claim-sync";

export interface StatusStep {
  id: ClaimStatusType;
  label: string;
  description: string;
  status: "complete" | "current" | "pending";
  timestamp?: number;
  data?: ClaimStatusUpdate["data"];
}

const STATUS_ORDER: ClaimStatusType[] = [
  "proof_generated",
  "claim_submitted",
  "under_review",
  "verified",
  "approved",
];

const STATUS_META: Record<
  ClaimStatusType,
  { label: string; description: string }
> = {
  proof_generated: {
    label: "Proof Generated",
    description: "Zero-knowledge proof created locally on your device",
  },
  claim_submitted: {
    label: "Claim Submitted",
    description: "Claim bundle shared with insurance company",
  },
  under_review: {
    label: "Under Review",
    description: "Insurance company reviewing the claim",
  },
  verified: {
    label: "Proof Verified",
    description: "Cryptographic proof verified successfully",
  },
  approved: {
    label: "Claim Approved",
    description: "Insurance claim approved — payout initiated",
  },
  rejected: {
    label: "Claim Rejected",
    description: "Insurance claim was rejected",
  },
};

function getStatusIndex(status: ClaimStatusType): number {
  if (status === "rejected") return STATUS_ORDER.indexOf("approved");
  return STATUS_ORDER.indexOf(status);
}

export function useClaimStatus(claimId: string | null) {
  const [record, setRecord] = useState<ClaimRecord | null>(null);
  const [steps, setSteps] = useState<StatusStep[]>([]);
  const [latestUpdate, setLatestUpdate] = useState<ClaimStatusUpdate | null>(
    null,
  );
  const [isLive, setIsLive] = useState(false);
  const prevStatusRef = useRef<ClaimStatusType | null>(null);

  // Build the step list from the current status
  const buildSteps = useCallback(
    (
      currentStatus: ClaimStatusType,
      history: ClaimStatusUpdate[],
    ): StatusStep[] => {
      const currentIdx = getStatusIndex(currentStatus);
      const isRejected = currentStatus === "rejected";

      return STATUS_ORDER.map((statusId, idx) => {
        // Find the matching history entry
        const historyEntry = history.find((h) => h.status === statusId);

        // For rejected: show "rejected" instead of "approved" at the last step
        if (idx === STATUS_ORDER.length - 1 && isRejected) {
          const rejectedEntry = history.find((h) => h.status === "rejected");
          return {
            id: "rejected" as ClaimStatusType,
            label: STATUS_META.rejected.label,
            description: STATUS_META.rejected.description,
            status: "current" as const,
            timestamp: rejectedEntry?.timestamp,
            data: rejectedEntry?.data,
          };
        }

        let stepStatus: "complete" | "current" | "pending";
        if (idx < currentIdx) {
          stepStatus = "complete";
        } else if (idx === currentIdx && !isRejected) {
          stepStatus = "current";
        } else {
          stepStatus = "pending";
        }

        return {
          id: statusId,
          label: STATUS_META[statusId].label,
          description: historyEntry?.data?.reviewerNotes
            ? historyEntry.data.reviewerNotes
            : STATUS_META[statusId].description,
          status: stepStatus,
          timestamp: historyEntry?.timestamp,
          data: historyEntry?.data,
        };
      });
    },
    [],
  );

  // Initialize: publish initial statuses and load from storage
  const initializeClaim = useCallback(
    (
      id: string,
      initialStatuses: {
        status: ClaimStatusType;
        data?: ClaimStatusUpdate["data"];
      }[],
    ) => {
      initialStatuses.forEach((s) => {
        publishStatusUpdate({
          claimId: id,
          status: s.status,
          timestamp: Date.now(),
          data: s.data,
        });
      });
    },
    [],
  );

  // Subscribe to live updates
  useEffect(() => {
    if (!claimId) return;

    // Load existing record
    const existing = getClaimRecord(claimId);
    if (existing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRecord(existing);
      setSteps(buildSteps(existing.currentStatus, existing.history));
      prevStatusRef.current = existing.currentStatus;
    }

    setIsLive(true);

    const unsubscribe = subscribeToClaimUpdates(claimId, (update) => {
      setLatestUpdate(update);

      // Reload full record from storage
      const updated = getClaimRecord(claimId);
      if (updated) {
        setRecord(updated);
        setSteps(buildSteps(updated.currentStatus, updated.history));

        // Detect if status actually changed
        if (prevStatusRef.current !== updated.currentStatus) {
          prevStatusRef.current = updated.currentStatus;
        }
      }
    });

    return () => {
      unsubscribe();
      setIsLive(false);
    };
  }, [claimId, buildSteps]);

  return {
    record,
    steps,
    latestUpdate,
    isLive,
    currentStatus: record?.currentStatus ?? null,
    isApproved: record?.currentStatus === "approved",
    isRejected: record?.currentStatus === "rejected",
    isDecided:
      record?.currentStatus === "approved" ||
      record?.currentStatus === "rejected",
    initializeClaim,
  };
}
