import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { fixtureChat, fixtureReviews } from "@clinix/contracts/fixtures";
import { ChatDrawer } from "../components/shell/ChatDrawer";

const api = vi.hoisted(() => ({
  getChatHistory: vi.fn(async () => ({ messages: fixtureChat, reviews: fixtureReviews.filter((r) => r.id === "rev_own_2") })),
  sendChatMessage: vi.fn(async (_id: string, message: string) => ({
    answer: { id: "msg_new", role: "assistant" as const, content: `Answer to: ${message}`, citedReviewIds: ["rev_ys_1"], createdAt: new Date().toISOString() },
    reviews: fixtureReviews.filter((r) => r.id === "rev_ys_1"),
  })),
}));
vi.mock("@/lib/api", async (orig) => ({ ...(await orig<typeof import("@/lib/api")>()), ...api }));

describe("ChatDrawer", () => {
  it("loads the history with cited reviews, sends a question, and shows the new citation", async () => {
    render(<ChatDrawer open onClose={vi.fn()} clinicId="clinic_demo" competitorNames={{ place_yonge_smile: "Yonge Smile Studio" }} />);
    await waitFor(() => expect(screen.getByText(/not yet measurable/i)).toBeInTheDocument());
    expect(screen.getAllByTestId("evidence-card")).toHaveLength(1);

    fireEvent.change(screen.getByLabelText(/ask about/i), { target: { value: "Why do they win?" } });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));
    await waitFor(() => expect(screen.getByText("Answer to: Why do they win?")).toBeInTheDocument());
    expect(api.sendChatMessage).toHaveBeenCalledWith("clinic_demo", "Why do they win?");
    expect(screen.getAllByTestId("evidence-card")).toHaveLength(2);
    expect(screen.getByText("Yonge Smile Studio")).toBeInTheDocument();
  });

  it("shows the owner-facing error when the API refuses", async () => {
    const { ApiError } = await import("../lib/api");
    api.sendChatMessage.mockRejectedValueOnce(new ApiError("Your first report is not ready yet. Ask again once it is.", 409));
    render(<ChatDrawer open onClose={vi.fn()} clinicId="clinic_demo" />);
    await waitFor(() => expect(api.getChatHistory).toHaveBeenCalled());
    fireEvent.change(screen.getByLabelText(/ask about/i), { target: { value: "hi" } });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/not ready yet/));
  });
});
