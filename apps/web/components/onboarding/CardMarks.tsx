/** The cards we accept: each brand's own logo on a small white tile. The images live in public/cards. */
const BRANDS = [
  { id: "visa", name: "Visa", width: 297, height: 96 },
  { id: "mastercard", name: "Mastercard", width: 155, height: 96 },
  { id: "amex", name: "American Express", width: 354, height: 96 },
] as const;

export function CardMarks() {
  return (
    <span className="flex gap-2">
      {BRANDS.map((b) => (
        <span key={b.id} className="grid h-[32px] w-[56px] place-items-center rounded-md border border-[#e3e6f2] bg-white px-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/cards/${b.id}.png`} alt={b.name} width={b.width} height={b.height} className="h-[20px] w-full object-contain" />
        </span>
      ))}
    </span>
  );
}
