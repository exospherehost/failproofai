/** Dropdown menu for users to reach the development team via GitHub. */
"use client";

import React, { useState, useCallback } from "react";
import { GitBranch, Lightbulb, Bug, MessageSquare, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const GITHUB_REPO = "https://github.com/exospherehost/failproofai";
const CONTACT_EMAIL = "failproofai@exosphere.host";

const options = [
  {
    label: "Request a Feature",
    icon: Lightbulb,
    href: `${GITHUB_REPO}/issues/new?labels=enhancement&title=Feature+Request%3A+`,
  },
  {
    label: "Report an Issue",
    icon: Bug,
    href: `${GITHUB_REPO}/issues/new?labels=bug&title=Bug+Report%3A+`,
  },
  {
    label: "Ask a Question",
    icon: MessageSquare,
    href: `${GITHUB_REPO}/discussions/new?category=q-a`,
  },
] as const;

export const ReachDevelopers: React.FC = () => {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false);
  }, []);

  return (
    <div className="relative" onKeyDown={handleKeyDown}>
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={close}
          aria-hidden="true"
        />
      )}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="true"
        className="relative z-50 flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
      >
        <GitBranch className="h-4 w-4" />
        <span className="hidden sm:inline text-xs">Reach Us</span>
        <ChevronDown
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-lg border border-border bg-card shadow-lg z-50" role="menu">
          <div className="px-3 py-2 border-b border-border">
            <p className="text-xs font-medium text-foreground">Reach Developers</p>
            <p className="text-[0.65rem] text-muted-foreground mt-0.5">
              We&apos;d love to hear from you
            </p>
          </div>
          <div className="py-1">
            {options.map(({ label, icon: Icon, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                role="menuitem"
                className="flex items-center gap-2.5 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                onClick={close}
              >
                <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                {label}
              </a>
            ))}
          </div>
          <div className="px-3 py-2 border-t border-border">
            <p className="text-[0.65rem] text-muted-foreground">
              or email{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-primary hover:text-primary/80 transition-colors"
              >
                {CONTACT_EMAIL}
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
