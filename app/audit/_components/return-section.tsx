"use client";

/**
 * Section 06 — NEXT AUDIT / "come back better." Re-audit loop CTA.
 *
 * Two actions: [ set a reminder ] gates on auth — if the visitor isn't
 * signed in, we open the AuthDialog to collect their email + verify a
 * one-time code. The actual mail scheduling is wired later; this just
 * proves identity for now.
 *
 * [ install policies ] copies the bulk install command (unchanged).
 */
import React, { useCallback, useEffect, useState } from "react";
import type { AuditResult } from "@/src/audit/types";
import { AuthDialog, type AuthedUser } from "./auth-dialog";

interface Props {
  result: AuditResult;
}

const BULK_INSTALL_CMD = "failproofai policies --install";

type AuthStatus =
  | { kind: "unknown" }
  | { kind: "anon" }
  | { kind: "authed"; user: { id: string; email: string } };

type ReminderState =
  | { kind: "idle" }
  | { kind: "queued" };

export function ReturnSection({ result }: Props) {
  const hasUnenabled = result.results.some(
    (r) => r.source === "builtin" && !r.enabledInConfig && r.hits > 0,
  );

  const [copied, setCopied] = useState(false);
  const [authStatus, setAuthStatus] = useState<AuthStatus>({ kind: "unknown" });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reminder, setReminder] = useState<ReminderState>({ kind: "idle" });

  // Probe /api/auth/status once on mount. The endpoint is cheap and never
  // throws — it returns { authenticated: false } when no session exists.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/auth/status", { cache: "no-store" });
        const body = (await res.json()) as {
          authenticated?: boolean;
          user?: { id: string; email: string };
        };
        if (cancelled) return;
        if (body.authenticated && body.user) {
          setAuthStatus({ kind: "authed", user: body.user });
        } else {
          setAuthStatus({ kind: "anon" });
        }
      } catch {
        if (!cancelled) setAuthStatus({ kind: "anon" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleInstall = async () => {
    try {
      await navigator.clipboard.writeText(BULK_INSTALL_CMD);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const handleReminderClick = useCallback(() => {
    if (authStatus.kind === "authed") {
      // Mail-scheduling implementation is deferred; for now just confirm.
      setReminder({ kind: "queued" });
      setTimeout(() => setReminder({ kind: "idle" }), 3500);
      return;
    }
    setDialogOpen(true);
  }, [authStatus.kind]);

  const handleAuthed = useCallback((user: AuthedUser) => {
    setAuthStatus({ kind: "authed", user });
    // Treat a successful sign-in via this dialog as intent to set the
    // reminder. Once mail scheduling is wired, swap this for a real POST.
    setReminder({ kind: "queued" });
    setTimeout(() => setReminder({ kind: "idle" }), 3500);
  }, []);

  const reminderLabel =
    reminder.kind === "queued"
      ? `[ ✓ reminder queued for ${
          authStatus.kind === "authed" ? authStatus.user.email : "you"
        } ]`
      : "[ set a reminder ]";

  return (
    <section className="section" data-screen-label="06 Next audit">
      <div className="section-mast">
        <div className="section-label">
          <span className="glyph">━━</span> next audit{" "}
          <span style={{ color: "var(--dim)" }}>·</span> improvement
        </div>
        <div className="section-meta"><span className="g">●</span> recommended in 7d</div>
      </div>
      <h2 className="section-h">come back better.</h2>
      <div className="return-hook">
        <div className="label">━━ the loop</div>
        <h3>re-audit in 7 days.</h3>
        <p>
          after the prescribed policies have been live for a week, we&apos;ll
          show your before/after score and which detectors went quiet.
        </p>
        <p style={{ marginTop: 16, color: "var(--dim)" }}>
          most agents move from C to B in one session. some make it in a day.
        </p>
        <div className="return-actions">
          <button
            type="button"
            className="share-btn"
            onClick={handleReminderClick}
            disabled={authStatus.kind === "unknown"}
          >
            {reminderLabel}
          </button>
          {hasUnenabled && (
            <button type="button" className="share-btn alt" onClick={handleInstall}>
              {copied
                ? `[ ✓ copied — paste in your shell ]`
                : `[ install policies ]`}
            </button>
          )}
        </div>
        {authStatus.kind === "authed" && (
          <div className="auth-status-pill">
            <span className="dot" aria-hidden="true" />
            signed in as <span className="email">{authStatus.user.email}</span>
          </div>
        )}
      </div>

      <AuthDialog
        open={dialogOpen}
        headline="oops — you are unknown."
        reason="verify yourself to get the re-audit reminder."
        onClose={() => setDialogOpen(false)}
        onAuthed={(u) => {
          setDialogOpen(false);
          handleAuthed(u);
        }}
      />
    </section>
  );
}
