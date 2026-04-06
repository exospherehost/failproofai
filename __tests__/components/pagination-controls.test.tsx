import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PaginationControls from "@/app/components/pagination-controls";

describe("PaginationControls", () => {
  it("returns null for totalPages <= 1", () => {
    const { container } = render(
      <PaginationControls currentPage={1} totalPages={1} onPageChange={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders all pages for totalPages <= 7", () => {
    render(
      <PaginationControls currentPage={1} totalPages={5} onPageChange={vi.fn()} />
    );
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByLabelText(`Page ${i}`)).toBeInTheDocument();
    }
  });

  it("renders ellipsis for 8+ pages", () => {
    render(
      <PaginationControls currentPage={4} totalPages={10} onPageChange={vi.fn()} />
    );
    // Should have "..." rendered somewhere
    const ellipses = screen.getAllByText("...");
    expect(ellipses.length).toBeGreaterThanOrEqual(1);
  });

  it('highlights current page with aria-current="page"', () => {
    render(
      <PaginationControls currentPage={3} totalPages={5} onPageChange={vi.fn()} />
    );
    const currentBtn = screen.getByLabelText("Page 3");
    expect(currentBtn).toHaveAttribute("aria-current", "page");
    // Other pages should not have aria-current
    expect(screen.getByLabelText("Page 1")).not.toHaveAttribute("aria-current");
  });

  it("Previous disabled on page 1", () => {
    render(
      <PaginationControls currentPage={1} totalPages={5} onPageChange={vi.fn()} />
    );
    expect(screen.getByLabelText("Previous page")).toBeDisabled();
  });

  it("Next disabled on last page", () => {
    render(
      <PaginationControls currentPage={5} totalPages={5} onPageChange={vi.fn()} />
    );
    expect(screen.getByLabelText("Next page")).toBeDisabled();
  });

  it("page change callbacks fire correctly", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(
      <PaginationControls currentPage={3} totalPages={5} onPageChange={onPageChange} />
    );

    await user.click(screen.getByLabelText("Page 4"));
    expect(onPageChange).toHaveBeenCalledWith(4);

    await user.click(screen.getByLabelText("Previous page"));
    expect(onPageChange).toHaveBeenCalledWith(2);

    await user.click(screen.getByLabelText("Next page"));
    expect(onPageChange).toHaveBeenCalledWith(4);
  });
});
