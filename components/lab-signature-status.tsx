"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, ShieldAlert, ShieldX, Loader2 } from "lucide-react";
import { GlassCard } from "@/components/glass-card";
import type { ClaimBundle } from "@/lib/claim-engine";
import {
  verifyBundleSignatureLocal,
  isLabRegisteredOnChain,
} from "@/lib/chain";

type SignatureState =
  | "checking"
  | "unsigned"
  | "invalid"
  | "signed_unregistered"
  | "signed_registered";

export function LabSignatureStatus({ bundle }: { bundle: ClaimBundle }) {
  const [state, setState] = useState<SignatureState>("checking");
  const [labAddress, setLabAddress] = useState<string>("");

  useEffect(() => {
    let mounted = true;

    async function run() {
      if (!bundle.issuer) {
        if (mounted) setState("unsigned");
        return;
      }

      const local = await verifyBundleSignatureLocal(bundle);

      if (!local.valid) {
        if (mounted) {
          setState("invalid");
          setLabAddress(local.recoveredAddress ?? "");
        }
        return;
      }

      const registered = await isLabRegisteredOnChain(bundle.issuer.labAddress);

      if (!mounted) return;

      setLabAddress(bundle.issuer.labAddress);
      setState(registered ? "signed_registered" : "signed_unregistered");
    }

    run();
    return () => {
      mounted = false;
    };
  }, [bundle]);

  if (state === "checking") {
    return (
      <GlassCard padding="sm" className="bg-slate-50/50">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Checking lab signature...
        </div>
      </GlassCard>
    );
  }

  if (state === "unsigned") {
    return (
      <GlassCard padding="sm" className="bg-amber-50/60 border-amber-200/50">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-amber-800">
              Bundle is not signed by a lab
            </p>
            <p className="text-[11px] text-amber-700">
              No issuer signature found in this claim bundle.
            </p>
          </div>
        </div>
      </GlassCard>
    );
  }

  if (state === "invalid") {
    return (
      <GlassCard padding="sm" className="bg-red-50/60 border-red-200/50">
        <div className="flex items-center gap-3">
          <ShieldX className="w-4 h-4 text-red-600 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-red-800">
              Invalid lab signature
            </p>
            <p className="text-[11px] text-red-700 break-all">
              Recovered signer: {labAddress || "unknown"}
            </p>
          </div>
        </div>
      </GlassCard>
    );
  }

  if (state === "signed_unregistered") {
    return (
      <GlassCard padding="sm" className="bg-amber-50/60 border-amber-200/50">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-amber-800">
              Signed, but lab is not registered on-chain
            </p>
            <p className="text-[11px] text-amber-700 break-all">{labAddress}</p>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard padding="sm" className="bg-emerald-50/60 border-emerald-200/50">
      <div className="flex items-center gap-3">
        <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        <div>
          <p className="text-xs font-semibold text-emerald-800">
            Signed by a registered lab
          </p>
          <p className="text-[11px] text-emerald-700 break-all">{labAddress}</p>
        </div>
      </div>
    </GlassCard>
  );
}
