import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReachDevelopers } from "@/components/reach-developers";

describe("ReachDevelopers", () => {
  it("renders trigger button", () => {
    render(<ReachDevelopers />);
    // The button has the Mail icon and "Reach Us" text (hidden on mobile)
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it("dropdown hidden initially, shown on click", async () => {
    const user = userEvent.setup();
    render(<ReachDevelopers />);

    // Dropdown content should not be visible initially
    expect(screen.queryByText("Request a Feature")).not.toBeInTheDocument();

    // Click the trigger button
    const btn = screen.getAllByRole("button")[0];
    await user.click(btn);

    // Dropdown should now be visible
    expect(screen.getByText("Request a Feature")).toBeInTheDocument();
    expect(screen.getByText("Report a Bug")).toBeInTheDocument();
    expect(screen.getByText("General Inquiry")).toBeInTheDocument();
  });

  it("contains correct mailto links with subjects", async () => {
    const user = userEvent.setup();
    render(<ReachDevelopers />);

    const btn = screen.getAllByRole("button")[0];
    await user.click(btn);

    const featureLink = screen.getByText("Request a Feature").closest("a");
    expect(featureLink).toHaveAttribute(
      "href",
      expect.stringContaining("mailto:failproofai@exosphere.host")
    );
    expect(featureLink).toHaveAttribute(
      "href",
      expect.stringContaining("subject=")
    );

    const bugLink = screen.getByText("Report a Bug").closest("a");
    expect(bugLink).toHaveAttribute(
      "href",
      expect.stringContaining("mailto:failproofai@exosphere.host")
    );
  });

  it("click outside closes dropdown", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <ReachDevelopers />
      </div>
    );

    // Open dropdown
    const btn = screen.getAllByRole("button")[0];
    await user.click(btn);
    expect(screen.getByText("Request a Feature")).toBeInTheDocument();

    // Click outside
    await user.click(screen.getByTestId("outside"));
    expect(screen.queryByText("Request a Feature")).not.toBeInTheDocument();
  });

  // ARIA attribute tests
  it("button has aria-expanded=false when closed", () => {
    render(<ReachDevelopers />);
    const btn = screen.getAllByRole("button")[0];
    expect(btn).toHaveAttribute("aria-expanded", "false");
  });

  it("button has aria-expanded=true when open", async () => {
    const user = userEvent.setup();
    render(<ReachDevelopers />);
    const btn = screen.getAllByRole("button")[0];
    await user.click(btn);
    expect(btn).toHaveAttribute("aria-expanded", "true");
  });

  it("button has aria-haspopup=true", () => {
    render(<ReachDevelopers />);
    const btn = screen.getAllByRole("button")[0];
    expect(btn).toHaveAttribute("aria-haspopup", "true");
  });

  it("dropdown has role=menu when open", async () => {
    const user = userEvent.setup();
    render(<ReachDevelopers />);
    const btn = screen.getAllByRole("button")[0];
    await user.click(btn);
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("menu items have role=menuitem", async () => {
    const user = userEvent.setup();
    render(<ReachDevelopers />);
    const btn = screen.getAllByRole("button")[0];
    await user.click(btn);
    const menuItems = screen.getAllByRole("menuitem");
    expect(menuItems).toHaveLength(3);
  });

  it("Escape key closes dropdown", async () => {
    const user = userEvent.setup();
    render(<ReachDevelopers />);
    const btn = screen.getAllByRole("button")[0];
    await user.click(btn);
    expect(screen.getByText("Request a Feature")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByText("Request a Feature")).not.toBeInTheDocument();
  });
});
