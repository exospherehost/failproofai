/**
 * Root layout — wraps every page with the theme provider and navbar.
 *
 * An inline `<script>` in `<head>` reads the user's theme preference
 * from `localStorage` (or falls back to `prefers-color-scheme`) and
 * applies the `light`/`dark` class to `<html>` *before* first paint,
 * preventing a flash of the wrong theme.
 */
import type { Metadata } from "next";
import { PostHogProvider } from "@/contexts/PostHogContext";
import { GlobalErrorListeners } from "@/app/components/global-error-listeners";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AutoRefreshProvider } from "@/contexts/AutoRefreshContext";
import { Navbar } from "@/components/navbar";
import { Toaster } from "@/app/components/toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "Failproof AI - Hooks & Project Monitor",
  description: "Open-source hooks, policies, and project visualization for Claude Code & Agents SDK",
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const disabledPages = (process.env.FAILPROOFAI_DISABLE_PAGES ?? "")
    .split(",").map((s) => s.trim()).filter(Boolean);
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Ensure we don't add duplicate classes
                  document.documentElement.classList.remove('light', 'dark');
                  
                  var theme = localStorage.getItem('theme');
                  if (theme && (theme === 'light' || theme === 'dark')) {
                    document.documentElement.classList.add(theme);
                  } else {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {
                  // Fallback to dark theme if there's any error
                  document.documentElement.classList.remove('light', 'dark');
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              #__loading {
                position: fixed; inset: 0; z-index: 9999;
                display: flex; align-items: center; justify-content: center;
                background: var(--background, #031035);
                color: var(--foreground, #f8fafc);
                font-family: system-ui, sans-serif;
                font-size: 1rem;
                transition: opacity 0.15s;
              }
              body > *:not(#__loading) { opacity: 0; }
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <div id="__loading">Loading…</div>
        <PostHogProvider>
          <GlobalErrorListeners />
          <ThemeProvider>
            <AutoRefreshProvider>
              <Navbar disabledPages={disabledPages} />
              {children}
            </AutoRefreshProvider>
            <Toaster />
          </ThemeProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
