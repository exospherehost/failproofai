/**
 * Root layout — single dark theme, no toggle.
 *
 * An inline `<script>` in `<head>` adds the `dark` class to `<html>` before
 * first paint so any consumers reading `document.documentElement.classList`
 * see it synchronously. Light mode was removed in #332.
 */
import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { PostHogProvider } from "@/contexts/PostHogContext";
import { GlobalErrorListeners } from "@/app/components/global-error-listeners";
import { AutoRefreshProvider } from "@/contexts/AutoRefreshContext";
import { Navbar } from "@/components/navbar";
import { Toaster } from "@/app/components/toast";
import "./globals.css";

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

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
    <html lang="en" className={geistMono.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.add('dark');`,
          }}
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              #__loading {
                position: fixed; inset: 0; z-index: 9999;
                display: flex; align-items: center; justify-content: center;
                background: #0a0a0a;
                color: #fafafa;
                font-family: ui-monospace, "SFMono-Regular", Menlo, Monaco, Consolas, monospace;
                font-size: 0.95rem;
                letter-spacing: 0.02em;
                transition: opacity 0.15s;
              }
              #__loading::before {
                content: "▮";
                color: #06b6d4;
                margin-right: 0.6ch;
                animation: caret-blink 1s steps(1, end) infinite;
              }
              body > *:not(#__loading) { opacity: 0; }
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <div id="__loading">initializing&nbsp;failproof&nbsp;ai…</div>
        <PostHogProvider>
          <GlobalErrorListeners />
          <AutoRefreshProvider>
            <Navbar disabledPages={disabledPages} />
            {children}
          </AutoRefreshProvider>
          <Toaster />
        </PostHogProvider>
      </body>
    </html>
  );
}
