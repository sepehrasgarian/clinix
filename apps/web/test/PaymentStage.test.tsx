import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PaymentStage } from "@/components/onboarding/PaymentStage";
import type { Billing } from "@/components/onboarding/PlanStage";
import type { PlanId } from "@/lib/pricing";

const clinic = { name: "Réhabital", address: "5800 Boul. Cavendish D4, Côte Saint-Luc, QC H4W 2T5, Canada", city: "Côte Saint-Luc" };

function setup(over: { plan?: PlanId; billing?: Billing } = {}) {
  const fns = { onDraft: vi.fn(), onBilling: vi.fn(), onBack: vi.fn(), onContinue: vi.fn() };
  render(<PaymentStage clinic={clinic} plan={over.plan ?? "growth"} billing={over.billing ?? "annual"} {...fns} />);
  return fns;
}
const type = (label: string | RegExp, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const fillAll = (number = "4242424242424242") => {
  type(/Billing contact full name/, "Hasan A.");
  type(/Billing email/, "hasan@clinic.ca");
  type(/Name on card/, "Hasan A.");
  type(/Card number/, number);
  type(/Expiration date/, "1229");
  type(/Security code/, "123");
};
const pay = () => screen.getByRole("button", { name: /^Pay CAD|Processing/ });

describe("Payment (demo checkout)", () => {
  it("says plainly that it is a prototype and fills in the clinic's own details", () => {
    setup();
    expect(screen.getByRole("note")).toHaveTextContent("Prototype checkout — no charge is made and no card data is stored.");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Complete your subscription");
    expect(screen.getByLabelText(/Legal business name/)).toHaveValue("Réhabital");
    expect(screen.getByLabelText(/Street address/)).toHaveValue("5800 Boul. Cavendish D4");
    expect(screen.getByLabelText(/Postal code/)).toHaveValue("H4W 2T5");
    expect(screen.getByLabelText(/Province/)).toHaveValue("QC");
  });

  it("prices the order line by line with Québec's taxes, and the total follows the province and the billing period", () => {
    setup();
    expect(screen.getByText("$4,188.00")).toBeInTheDocument();
    expect(screen.getByText("−$698.00")).toBeInTheDocument();
    expect(screen.getByText("Subtotal (before tax)").nextSibling).toHaveTextContent("$3,490.00");
    expect(screen.getByText("GST (5%)").nextSibling).toHaveTextContent("$174.50");
    expect(screen.getByText("Québec QST (9.975%)").nextSibling).toHaveTextContent("$348.13");
    expect(screen.getByText("$4,012.63")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Province/), { target: { value: "AB" } });
    expect(screen.getByText("$3,664.50")).toBeInTheDocument();
    expect(screen.queryByText(/QST/)).toBeNull();
  });

  it("switches billing from the order and reports it", () => {
    const { onBilling } = setup();
    fireEvent.click(screen.getByRole("radio", { name: /Monthly/ }));
    expect(onBilling).toHaveBeenCalledWith("monthly");
  });

  it("will not pay until billing and card are complete, and shows what is wrong", () => {
    setup();
    expect(pay()).toBeDisabled();
    fireEvent.blur(screen.getByLabelText(/Billing email/));
    expect(screen.getByRole("alert")).toHaveTextContent(/email address/);
    fillAll("4242424242424243");
    fireEvent.blur(screen.getByLabelText(/Card number/));
    expect(screen.getByText(/card number doesn't look right/)).toBeInTheDocument();
    expect(pay()).toBeDisabled();
    type(/Card number/, "4242424242424242");
    expect(pay()).toBeEnabled();
  });

  it("formats the card as it is typed and keeps the billing details, never the card", () => {
    const { onDraft } = setup();
    type(/Card number/, "4242424242424242");
    expect(screen.getByLabelText(/Card number/)).toHaveValue("4242 4242 4242 4242");
    type(/Expiration date/, "1229");
    expect(screen.getByLabelText(/Expiration date/)).toHaveValue("12 / 29");
    type(/Billing contact full name/, "Hasan A.");
    expect(onDraft).toHaveBeenLastCalledWith(expect.objectContaining({ contactName: "Hasan A." }));
    expect(JSON.stringify(onDraft.mock.calls)).not.toContain("4242");
  });

  it("pays with a test card, continues, and clears the card", async () => {
    const { onContinue } = setup();
    fillAll();
    fireEvent.click(pay());
    expect(screen.getByRole("button", { name: "Processing…" })).toBeDisabled();
    await waitFor(() => expect(onContinue).toHaveBeenCalledOnce(), { timeout: 3000 });
  });

  it("shows a declined card and lets the owner try again", async () => {
    const { onContinue } = setup();
    fillAll("4000000000000002");
    fireEvent.click(pay());
    expect(await screen.findByRole("alert", {}, { timeout: 3000 })).toHaveTextContent(/declined/);
    expect(onContinue).not.toHaveBeenCalled();
    type(/Card number/, "4242424242424242");
    fireEvent.click(pay());
    await waitFor(() => expect(onContinue).toHaveBeenCalledOnce(), { timeout: 3000 });
  });

  it("asks for extra verification on the 3-D Secure test card before continuing", async () => {
    const { onContinue } = setup();
    fillAll("4000002760003184");
    fireEvent.click(pay());
    const dialog = await screen.findByRole("dialog", { name: "Extra verification" }, { timeout: 3000 });
    expect(onContinue).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole("button", { name: "Complete verification" }));
    expect(onContinue).toHaveBeenCalledOnce();
  });

  it("lets the owner type a postal code the clinic's address did not have, even while 'same as clinic'", () => {
    render(<PaymentStage clinic={{ name: "Finch", address: "77 Finch Ave E", city: "Toronto" }} plan="growth" billing="annual" onDraft={vi.fn()} onBilling={vi.fn()} onBack={vi.fn()} onContinue={vi.fn()} />);
    expect(screen.getByLabelText(/Postal code/)).not.toHaveAttribute("readonly");
    expect(screen.getByLabelText(/Street address/)).toHaveAttribute("readonly");
    for (const typed of ["H", "H4", "H4W", "H4W2", "H4W 2T", "h4w2t5"]) type(/Postal code/, typed);
    expect(screen.getByLabelText(/Postal code/)).toHaveValue("H4W 2T5");
    expect(screen.getByLabelText(/Postal code/)).not.toHaveAttribute("readonly");
  });

  it("takes the owner back to the plan from three places", () => {
    const { onBack } = setup();
    fireEvent.click(screen.getByRole("button", { name: /Back to plans/ }));
    fireEvent.click(screen.getByRole("button", { name: "Edit plan" }));
    fireEvent.click(screen.getByRole("button", { name: /^← Back$/ }));
    expect(onBack).toHaveBeenCalledTimes(3);
  });

  it("an individual is asked for a name, not a business, and has no business tax section", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Individual" }));
    expect(screen.getByLabelText(/Full name/)).toBeInTheDocument();
    expect(screen.queryByText(/Additional business/)).toBeNull();
  });
});

describe("accepted cards", () => {
  it("shows the Visa, Mastercard and American Express marks, not text stand-ins", () => {
    setup();
    for (const brand of ["Visa", "Mastercard", "American Express"]) expect(screen.getByAltText(brand)).toBeInTheDocument();
    expect(screen.queryByText("VISA")).toBeNull();
  });
});
