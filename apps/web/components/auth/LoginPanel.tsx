"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanding } from "@/components/i18n/LangProvider";
import { DEV_USER_ID, setDevUser } from "@/lib/identity";

/**
 * Shown only while Clerk is not configured (a clone without keys): says so, sends visitors to the free
 * analysis, and, outside production only, offers the test-user stand-in the setup flow already has.
 */
export function LoginPanel() {
  const t = useLanding().login;
  const router = useRouter();
  const continueAsTestUser = () => { setDevUser(DEV_USER_ID); router.push("/app"); };
  return (
    <div className="mx-auto w-[min(520px,100%-48px)] rounded-[28px] bg-white p-9 text-center shadow-[0_40px_80px_-40px_rgba(14,21,38,.4)]">
      <h1 className="text-[28px] font-bold tracking-[-0.03em]">{t.headline}</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-grey">{t.text}</p>
      <Link href="/start" className="mt-7 inline-flex h-[50px] w-full items-center justify-center rounded-2xl bg-[#4338ca] text-base font-bold text-white hover:bg-[#3730a3]">{t.start}</Link>
      {process.env.NODE_ENV !== "production" && (
        <div className="mt-5 border-t border-[#ecedf5] pt-5">
          <button type="button" onClick={continueAsTestUser} className="text-sm font-semibold text-primary hover:underline">{t.dev}</button>
          <p className="mt-1 text-xs text-faint">{t.devNote}</p>
        </div>
      )}
    </div>
  );
}
