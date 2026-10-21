"use client";

import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { useLanding } from "@/components/i18n/LangProvider";

/** The four ways to reach the team. Email and phone come from the footer so they are written once. */
export function ContactDetails() {
  const landing = useLanding();
  const t = landing.contact.details;
  const { email, phone } = landing.footer;
  const rows = [
    { icon: Mail, label: t.email, value: email, href: `mailto:${email}` },
    { icon: Phone, label: t.phone, value: phone, href: `tel:${phone.replace(/[^+\d]/g, "")}` },
    { icon: MapPin, label: t.address, value: t.addressValue },
    { icon: Clock, label: t.hours, value: t.hoursValue },
  ];
  return (
    <aside aria-labelledby="contact-details-title" className="rounded-[28px] bg-white p-[29px] shadow-[0_40px_80px_-40px_rgba(14,21,38,.4)]">
      <h2 id="contact-details-title" className="text-[13px] font-bold tracking-[0.25em] text-[#3730a3] uppercase">{t.title}</h2>
      <ul className="mt-1.5">
        {rows.map(({ icon: Icon, label, value, href }) => (
          <li key={label} className="flex items-center gap-[16px] border-b border-[#ecedf5] py-[17px] last:border-0 last:pb-0">
            <span className="grid size-[40px] shrink-0 place-items-center rounded-full bg-[#eeeaff] text-[#4f46e5]"><Icon size={17} strokeWidth={1.7} aria-hidden /></span>
            <span className="min-w-0">
              <span className="block text-[11.5px] font-semibold tracking-[0.15em] text-ink-grey uppercase">{label}</span>
              {href ? <a href={href} className="mt-0.5 block text-[15px] font-bold hover:text-primary">{value}</a> : <span className="mt-0.5 block text-[15px] leading-snug font-bold">{value}</span>}
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
