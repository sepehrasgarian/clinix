"use client";

import type { EvidenceLedger } from "@clinix/contracts";
import { ShieldCheck } from "lucide-react";
import { copy } from "@/lib/copy";

/** The evidence ledger: how many findings survived verification, and a toggle to inspect the rest. */
export function LedgerCounter({ ledger, showRejected, onToggle }: { ledger: EvidenceLedger; showRejected: boolean; onToggle: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-card px-4 py-3 text-sm" data-testid="ledger">
      <ShieldCheck aria-hidden size={18} className="text-success" />
      <span>
        <strong className="font-mono text-base tabular-nums">{ledger.kept}</strong> {copy.findings.kept}
      </span>
      <span aria-hidden className="text-line">|</span>
      <span>
        <strong className="font-mono text-base tabular-nums">{ledger.rejected}</strong> {copy.findings.rejected}
      </span>
      {ledger.rejected > 0 && (
        <button type="button" onClick={onToggle} className="ml-auto min-h-11 rounded-lg px-3 font-medium text-primary hover:bg-primary-soft" aria-pressed={showRejected}>
          {showRejected ? copy.findings.hideRejected : copy.findings.showRejected}
        </button>
      )}
    </div>
  );
}
