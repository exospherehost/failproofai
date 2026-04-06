import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RefreshButton } from "@/app/components/refresh-button";
import { renderWithProviders } from "@/__tests__/helpers/test-utils";

const mockRefresh = vi.fn();

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
  usePathname: () => "/",
}));

// Mock lucide-react
vi.mock("lucide-react", () => ({
  RefreshCw: ({ className }: any) => (
    <span data-testid="refresh-icon" className={className} />
  ),
}));

describe("RefreshButton", () => {
  it("renders refresh button and auto-refresh interval group", () => {
    renderWithProviders(<RefreshButton />);
    expect(screen.getByTitle("Refresh")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Auto-refresh interval" })).toBeInTheDocument();
  });

  it("calls router.refresh on click", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RefreshButton />);

    await user.click(screen.getByTitle("Refresh"));

    expect(mockRefresh).toHaveBeenCalled();
  });

  it("renders auto-refresh options as buttons", () => {
    renderWithProviders(<RefreshButton />);
    const group = screen.getByRole("group", { name: "Auto-refresh interval" });
    const buttons = group.querySelectorAll("button");
    expect(buttons).toHaveLength(4);
    expect(buttons[0].textContent).toBe("Off");
    expect(buttons[1].textContent).toBe("5s");
    expect(buttons[2].textContent).toBe("10s");
    expect(buttons[3].textContent).toBe("30s");
  });

  it("applies custom className", () => {
    const { container } = renderWithProviders(<RefreshButton className="my-class" />);
    expect(container.firstChild).toHaveClass("my-class");
  });
});
