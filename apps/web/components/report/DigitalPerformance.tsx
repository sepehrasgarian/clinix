"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, ChevronDown } from "lucide-react";
import type { SeoAudit } from "@clinix/contracts";
import { Card } from "@/components/ui/Card";
import { siteHealthGroups, type CheckGroup } from "@/lib/siteHealth";

/** Digital performance: four groups of measured checks, problems first, passed ones folded away. */
export function DigitalPerformance({ audit }: { audit: SeoAudit | null | undefined }) {
  if (!audit) return <Card className="p-5 text-sm text-muted">The website and Google profile checks are not available this time. They run again with your next analysis.</Card>;
  const groups = siteHealthGroups(audit);
  return (
    <div className="flex flex-col gap-4">
      {!audit.website && (
        <Card className="border-alert/30 bg-alert-soft p-5">
          <p className="font-semibold text-alert">No website on file.</p>
          <p className="mt-1 text-sm">The website checks were skipped. Getting a site live is the highest-leverage fix available.</p>
        </Card>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {groups.filter((g) => g.toFix.length + g.passed.length > 0).map((g) => <GroupCard key={g.key} group={g} />)}
      </div>
    </div>
  );
}

function GroupCard({ group }: { group: CheckGroup }) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-semibold">{group.title}</h3>
        <p className="font-mono text-xs text-muted tabular-nums">
          {group.toFix.length > 0 && <span className="text-alert">{group.toFix.length} to fix</span>}
          {group.toFix.length > 0 && group.passed.length > 0 && " · "}
          {group.passed.length > 0 && <span className="text-success">{group.passed.length} passed</span>}
        </p>
      </div>
      {group.toFix.length > 0 ? (
        <ul className="mt-3 space-y-3">
          {group.toFix.map((c) => (
            <li key={c.id} className="flex gap-2.5 text-sm">
              <AlertCircle size={16} aria-hidden className="mt-0.5 shrink-0 text-alert" />
              <span>
                <span className="block font-medium">{c.title}</span>
                {c.why && <span className="block text-muted">{c.why}</span>}
                {c.action && <span className="mt-1 block"><span className="text-xs font-semibold tracking-wide text-faint uppercase">Recommended action</span><br />{c.action}</span>}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-success">Nothing to fix here.</p>
      )}
      {group.passed.length > 0 && (
        <>
          <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="mt-3 inline-flex min-h-9 items-center gap-1 text-sm font-medium text-primary">
            All {group.passed.length} passed checks <ChevronDown size={14} aria-hidden className={open ? "rotate-180" : ""} />
          </button>
          {open && (
            <ul className="mt-2 space-y-1.5">
              {group.passed.map((c) => (
                <li key={c.id} className="flex gap-2 text-sm text-muted"><CheckCircle2 size={15} aria-hidden className="mt-0.5 shrink-0 text-success" />{c.title}</li>
              ))}
            </ul>
          )}
        </>
      )}
    </Card>
  );
}
