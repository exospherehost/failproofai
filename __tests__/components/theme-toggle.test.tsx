import { describe, it, expect, vi } from "vitest";
import { screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeToggle } from "@/components/theme-toggle";
import { renderWithProviders } from "../helpers/test-utils";

describe("ThemeToggle", () => {
  it("renders button with accessible label", () => {
    renderWithProviders(<ThemeToggle />);
    // Default theme is "dark", so label says "Switch to light mode"
    expect(screen.getByLabelText("Switch to light mode")).toBeInTheDocument();
  });

  it("toggles between light and dark themes", async () => {
    // Patch MutationObserver so we can manually flush observer callbacks.
    // jsdom's built-in MutationObserver doesn't reliably fire in all CI
    // environments (Bun + happy-dom / jsdom), so we ensure deterministic
    // delivery by capturing the callback and invoking it after the DOM
    // mutation.
    const observers: { cb: MutationCallback; obs: MutationObserver }[] = [];
    const OriginalMO = globalThis.MutationObserver;
    vi.stubGlobal(
      "MutationObserver",
      class StubMutationObserver {
        private cb: MutationCallback;
        private real: MutationObserver;
        constructor(cb: MutationCallback) {
          this.cb = cb;
          this.real = new OriginalMO(cb);
          observers.push({ cb, obs: this.real });
        }
        observe(...args: Parameters<MutationObserver["observe"]>) {
          this.real.observe(...args);
        }
        disconnect() {
          this.real.disconnect();
        }
        takeRecords() {
          return this.real.takeRecords();
        }
      },
    );

    const user = userEvent.setup();
    renderWithProviders(<ThemeToggle />);

    // Start in dark mode → button says "Switch to light mode"
    const btn = screen.getByLabelText("Switch to light mode");
    await user.click(btn);

    // The click called setTheme("light") which mutated documentElement.classList.
    // Flush any pending MutationObserver records so useSyncExternalStore re-reads.
    await act(() => {
      for (const { cb, obs } of observers) {
        const records = obs.takeRecords();
        if (records.length > 0) cb(records, obs);
      }
    });

    expect(screen.getByLabelText("Switch to dark mode")).toBeInTheDocument();

    vi.unstubAllGlobals();
  });
});
