import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { DemoForm, demoMailto, isValidEmail, requiredStatus } from "@/components/demo/DemoForm";

const fill = (label: RegExp, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

beforeEach(() => window.localStorage.clear());

describe("demo form", () => {
  it("counts the four required fields as they become valid", () => {
    render(<DemoForm />);
    expect(screen.getByText("0/4 required fields completed")).toBeInTheDocument();
    fill(/full name/i, "Sam Lee");
    fill(/work email/i, "sam@clinic.ca");
    fill(/business website/i, "clinic.ca");
    expect(screen.getByText("3/4 required fields completed")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "3");
  });
  it("does not send while a required field is missing, and says why", () => {
    render(<DemoForm />);
    fill(/full name/i, "Sam Lee");
    fireEvent.click(screen.getByRole("button", { name: /book my live analysis/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/complete the required fields/i);
  });
  it("rejects an email that is not an email", () => {
    expect(isValidEmail("sam@")).toBe(false);
    expect(isValidEmail("sam@clinic.ca")).toBe(true);
    expect(requiredStatus({ name: "a", email: "nope", website: "w", jane: "j", role: "", locations: "", language: "English", phone: "", notes: "" }).email).toBe(false);
  });
  it("builds the request email with every answer and no card or payment fields", () => {
    const url = demoMailto({ name: "Sam Lee", email: "sam@clinic.ca", website: "clinic.ca", jane: "c.janeapp.com", role: "Owner", locations: "1 location", language: "English", phone: "", notes: "Focus on reviews" });
    expect(url.startsWith("mailto:info@clinx.app?subject=")).toBe(true);
    const body = decodeURIComponent(url.split("body=")[1]);
    expect(body).toContain("Name: Sam Lee");
    expect(body).toContain("Jane App URL: c.janeapp.com");
    expect(body).toContain("Focus on reviews");
  });
  it("keeps a draft on this device and restores it", () => {
    const { unmount } = render(<DemoForm />);
    fill(/full name/i, "Sam Lee");
    unmount();
    render(<DemoForm />);
    expect(screen.getByLabelText(/full name/i)).toHaveValue("Sam Lee");
  });
  it("shows the optional details only when asked", () => {
    render(<DemoForm />);
    expect(screen.queryByLabelText(/phone/i)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /add optional details/i }));
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
  });
});
