import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ContactDetails } from "@/components/contact/ContactDetails";
import { ContactForm, contactMailto, isComplete, isValidEmail } from "@/components/contact/ContactForm";
import { LangProvider } from "@/components/i18n/LangProvider";
import { landingFor } from "@/lib/i18n/landing";
import ContactPage from "@/app/contact/page";

const fill = (label: string | RegExp, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe("contact form", () => {
  it("starts on a general question and offers the five topics", () => {
    render(<ContactForm />);
    const topic = screen.getByLabelText("Topic") as HTMLSelectElement;
    expect(topic.value).toBe("General question");
    expect(within(topic).getAllByRole("option").map((o) => o.textContent)).toEqual(["General question", "Product demo", "Pricing", "Support", "Partnership"]);
  });
  it("will not send without a name, a valid email and a message, and says so", () => {
    render(<ContactForm />);
    fireEvent.click(screen.getByRole("button", { name: /send message/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/name, a valid email and a message/i);
    fill("Full name", "Sam Lee");
    fill("Email", "sam@");
    fill("Message", "Hello");
    fireEvent.click(screen.getByRole("button", { name: /send message/i }));
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
  it("checks completeness and email shape", () => {
    expect(isValidEmail("a@b.ca")).toBe(true);
    expect(isValidEmail("a@b")).toBe(false);
    expect(isComplete({ topic: "x", name: "A", email: "a@b.ca", message: "hi" })).toBe(true);
    expect(isComplete({ topic: "x", name: "A", email: "a@b.ca", message: "  " })).toBe(false);
  });
  it("builds the email to the team with the topic, the sender and the message", () => {
    const url = contactMailto({ topic: "Pricing", name: "Sam Lee", email: "sam@clinic.ca", message: "How much for 2 sites?" });
    expect(url.startsWith("mailto:info@clinx.app?subject=")).toBe(true);
    expect(decodeURIComponent(url)).toContain("Message from the website: Pricing");
    const body = decodeURIComponent(url.split("body=")[1]);
    expect(body).toContain("Name: Sam Lee");
    expect(body).toContain("Email: sam@clinic.ca");
    expect(body).toContain("How much for 2 sites?");
  });
  it("shows the confirmation once a complete message is sent", () => {
    render(<ContactForm />);
    fill("Full name", "Sam Lee");
    fill("Email", "sam@clinic.ca");
    fill("Message", "Hello");
    fireEvent.click(screen.getByRole("button", { name: /send message/i }));
    expect(screen.getByRole("status")).toHaveTextContent(/email app should have opened/i);
  });
  it("is written in the visitor's language", () => {
    render(<LangProvider lang="fr" landing={landingFor("fr")}><ContactForm /></LangProvider>);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Envoyez-nous un message");
    expect(screen.getByRole("button", { name: "Envoyer le message" })).toBeInTheDocument();
  });
});

describe("contact details", () => {
  it("lists email, phone, address and hours, with email and phone as links", () => {
    render(<ContactDetails />);
    expect(screen.getByRole("link", { name: "info@clinx.app" })).toHaveAttribute("href", "mailto:info@clinx.app");
    expect(screen.getByRole("link", { name: "+1 (263) 880-8080" })).toHaveAttribute("href", "tel:+12638808080");
    expect(screen.getByText("Toronto, Ontario, Canada")).toBeInTheDocument();
    expect(screen.getByText(/Monday–Friday, 9:00 AM–5:00 PM Eastern/)).toBeInTheDocument();
  });
});

describe("contact page", () => {
  it("opens with the question and both cards", async () => {
    render(await ContactPage());
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("How can we help?");
    expect(screen.getByRole("heading", { name: "Send us a message" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /contact details/i })).toBeInTheDocument();
  });
});
