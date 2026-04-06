import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ErrorFallback from "@/app/components/error-fallback";

describe("ErrorFallback", () => {
  const defaultProps = {
    error: Object.assign(new Error("Something went wrong"), { digest: undefined }),
    reset: vi.fn(),
    heading: "Error Occurred",
    defaultMessage: "An unexpected error occurred",
  };

  it("displays heading and error message", () => {
    render(<ErrorFallback {...defaultProps} />);
    expect(screen.getByText("Error Occurred")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("shows defaultMessage when error.message is empty", () => {
    const props = {
      ...defaultProps,
      error: Object.assign(new Error(""), { digest: undefined }),
    };
    render(<ErrorFallback {...props} />);
    expect(screen.getByText("An unexpected error occurred")).toBeInTheDocument();
  });

  it("reset button calls reset callback", async () => {
    const user = userEvent.setup();
    const reset = vi.fn();
    render(<ErrorFallback {...defaultProps} reset={reset} />);
    await user.click(screen.getByText("Try again"));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
