"use client";

import { useState } from "react";
import clsx from "clsx";
import { logoUrl } from "@/lib/api";

/**
 * The clinic's logo, taken from its website by the API (the logo it declares, else its icon). A chip by default; `fill`
 * is the 120×76 tile that stands in for the listing photo. Renders nothing, and tells the caller, when there is none.
 */
export function ClinicLogo({ site, placeId, fill, round, onMissing }: { site?: string | null; placeId?: string; fill?: boolean; /** A 44px circle, for the clinic switcher. */ round?: boolean; onMissing?: () => void }) {
  const [failed, setFailed] = useState(false);
  if (failed || (!site && !placeId)) return null;
  return (
    <span className={clsx("flex shrink-0 items-center justify-center overflow-hidden border border-[#ecedf5] bg-white", round ? "size-11 rounded-full p-[7px]" : fill ? "h-[76px] w-[120px] rounded-xl p-[10px]" : "h-[56px] w-[120px] rounded-xl")}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logoUrl({ site, placeId })} alt="" onError={() => { setFailed(true); onMissing?.(); }} className={clsx("object-contain", round || fill ? "max-h-full max-w-full" : "max-h-[48px] max-w-[108px]")} data-testid="clinic-logo" />
    </span>
  );
}
