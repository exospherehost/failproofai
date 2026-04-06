/** Dropdown menu for users to reach the development team via email. */
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Mail, Lightbulb, Bug, MessageSquare, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const CONTACT_EMAIL = "failproofai@exosphere.host";

const options = [
  {
    label: "Request a Feature",
    icon: Lightbulb,
    subject: "Feature Request: ",
  },
  {
    label: "Report a Bug",
    icon: Bug,
    subject: "Bug Report: ",
  },
  {
    label: "General Inquiry",
    icon: MessageSquare,
    subject: "General Inquiry: ",
  },
] as const;

export const ReachDevelopers: React.FC = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape" && open) {
      setOpen(false);
    }
  }, [open]);

  return (
    <div ref={ref} className="relative" onKeyDown={handleKeyDown}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
      >
        <Mail className="h-4 w-4" />
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
            {options.map(({ label, icon: Icon, subject }) => (
              <a
                key={label}
                href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`}
                role="menuitem"
                className="flex items-center gap-2.5 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                onClick={() => setOpen(false)}
              >
                <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                {label}
              </a>
            ))}
          </div>
          <div className="px-3 py-2 border-t border-border">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-[0.65rem] text-primary hover:text-primary/80 transition-colors"
            >
              {CONTACT_EMAIL}
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
