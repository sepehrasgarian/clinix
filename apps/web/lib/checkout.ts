import { monthlyPrice, type PlanId } from "./pricing";

/** Amounts in whole cents, as a payment provider counts them. */
export type Order = { billing: "annual" | "monthly"; listCents: number; discountCents: number; subtotalCents: number };

/** Annual is twelve months listed with two of them taken off, so ten are charged. */
export function orderFor(plan: PlanId, billing: "annual" | "monthly"): Order {
  const month = monthlyPrice[plan] * 100;
  if (billing === "monthly") return { billing, listCents: month, discountCents: 0, subtotalCents: month };
  return { billing, listCents: month * 12, discountCents: month * 2, subtotalCents: month * 10 };
}

export const cents = (c: number, locale = "en-CA") => new Intl.NumberFormat(locale, { style: "currency", currency: "CAD", currencyDisplay: "narrowSymbol" }).format(c / 100);

export const digits = (s: string) => s.replace(/\D/g, "");

/** The Luhn check every real card number passes; it catches typos, not fakes. */
export function luhnValid(number: string): boolean {
  const d = digits(number);
  if (d.length < 13 || d.length > 19) return false;
  let sum = 0;
  for (let i = 0; i < d.length; i++) {
    let n = Number(d[d.length - 1 - i]);
    if (i % 2 === 1) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
  }
  return sum % 10 === 0;
}

export type Brand = "visa" | "mastercard" | "amex" | "other";
export const brandOf = (number: string): Brand => {
  const d = digits(number);
  return /^4/.test(d) ? "visa" : /^(5[1-5]|2[2-7])/.test(d) ? "mastercard" : /^3[47]/.test(d) ? "amex" : "other";
};

/** 4242 4242 4242 4242, or 4242 424242 42424 for American Express. */
export function groupCard(input: string): string {
  const d = digits(input).slice(0, 19);
  const g = brandOf(d) === "amex" ? [4, 6, 5] : [4, 4, 4, 4, 3];
  const out: string[] = [];
  let at = 0;
  for (const n of g) { if (at >= d.length) break; out.push(d.slice(at, at + n)); at += n; }
  return out.join(" ");
}

/** "0427" → "04 / 27". */
export function groupExpiry(input: string): string {
  const d = digits(input).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)} / ${d.slice(2)}` : d;
}

/** Valid when the month is real and the card has not expired (a card is good through the end of its month). */
export function expiryValid(text: string, now = new Date()): boolean {
  const d = digits(text);
  if (d.length !== 4) return false;
  const month = Number(d.slice(0, 2));
  const year = 2000 + Number(d.slice(2));
  return month >= 1 && month <= 12 && year * 12 + month >= now.getFullYear() * 12 + now.getMonth() + 1;
}

export const cvcValid = (cvc: string, number: string) => digits(cvc).length === (brandOf(number) === "amex" ? 4 : 3);

export const POSTAL = /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z] ?\d[ABCEGHJ-NPRSTV-Z]\d$/i;
export const normalPostal = (s: string) => { const t = s.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6); return t.length > 3 ? `${t.slice(0, 3)} ${t.slice(3)}` : t; };
export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** What the demo checkout does with a card. Nothing is sent anywhere; the number only picks the outcome, like a provider's test cards. */
export type DemoOutcome = "approved" | "declined" | "verify";
export function demoOutcome(number: string): DemoOutcome {
  const d = digits(number);
  return d === "4000000000000002" ? "declined" : d === "4000002760003184" ? "verify" : "approved";
}
