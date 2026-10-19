"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Refreshes the server-rendered run page every few seconds while the pipeline works. */
export function RunPoller({ ms = 3000 }: { ms?: number }) {
  const router = useRouter();
  useEffect(() => {
    const handle = setInterval(() => router.refresh(), ms);
    return () => clearInterval(handle);
  }, [router, ms]);
  return null;
}
