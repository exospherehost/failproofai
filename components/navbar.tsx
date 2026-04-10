/** Top navigation bar with logo, app title, and theme toggle. */
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderOpen, Shield } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { ReachDevelopers } from "@/components/reach-developers";
import { RefreshButton } from "@/app/components/refresh-button";

const NAV_LINKS = [
  { href: "/policies", label: "Policies", icon: Shield },
  { href: "/projects", label: "Projects", icon: FolderOpen },
];

export const Navbar: React.FC<{ disabledPages?: string[] }> = ({ disabledPages = [] }) => {
  const pathname = usePathname();

  return (
    <header className="relative z-50 border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/exospherehost/failproofai"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <Logo width={28} height={28} className="flex-shrink-0" />
              <h1 className="text-lg font-semibold text-foreground leading-tight tracking-tight">
                Failproof AI
              </h1>
            </a>
            {process.env.NEXT_PUBLIC_APP_VERSION && (
              <span className="text-[0.6rem] font-mono leading-none text-muted-foreground/70 border border-border/60 rounded-md px-1.5 py-0.5 select-none tracking-wide">
                v{process.env.NEXT_PUBLIC_APP_VERSION}
              </span>
            )}

            <div className="w-px h-8 bg-border ml-2" />

            <nav className="flex items-center h-16">
              {NAV_LINKS.filter(({ href }) => {
                const key = href.slice(1);
                return !disabledPages.includes(key);
              }).map(({ href, label, icon: Icon }) => {
                const active = href === "/projects"
                  ? pathname === "/projects" || pathname.startsWith("/project/")
                  : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`relative flex items-center gap-1.5 px-3 h-full text-sm transition-colors ${
                      active
                        ? "text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? "text-primary" : ""}`} />
                    {label}
                    <span
                      className={`absolute inset-x-1 bottom-0 h-[2px] rounded-full transition-all ${
                        active
                          ? "bg-primary"
                          : "bg-transparent group-hover:bg-muted"
                      }`}
                    />
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-1">
            <RefreshButton />
            <div className="w-px h-6 bg-border mx-1" />
            <ReachDevelopers />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
};
