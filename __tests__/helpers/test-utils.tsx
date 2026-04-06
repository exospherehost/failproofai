import React from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AutoRefreshProvider } from "@/contexts/AutoRefreshContext";

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AutoRefreshProvider>{children}</AutoRefreshProvider>
    </ThemeProvider>
  );
}

export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  return render(ui, { wrapper: Providers, ...options });
}
