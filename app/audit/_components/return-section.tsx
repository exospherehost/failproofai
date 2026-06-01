"use client";

/**
 * Section 06 — NEXT AUDIT / "come back better." Re-audit loop CTA.
 *
 * Behavior matrix:
 *   - unknown (probe in flight)  → buttons disabled
 *   - anon (no session)          → [ set a reminder ] opens AuthDialog,
 *                                  on success we flip to the authed panel
 *                                  below and persist the 7-day reminder.
 *   - authed (any)               → consolidated status panel: "signed in as
 *                                  …" + either the persisted "next audit in
 *                                  X days" line OR a "no reminder set yet"
 *                                  line with an inline [ set a reminder ]
 *                                  button. The reminder persists across
 *                                  reloads via ~/.failproofai/next-audit.json
 *                                  — same as the CLI's auth.json.
 *
 * Also exposes [ re-audit now ] next to [ install policies ] so the user
 * can trigger a fresh scan inline without leaving the page. The button
 * fires POST /api/audit/run (same backend the empty-state CTA uses).
 */
import React, { useCallback, useEffect, useState } from "react";
import type { AuditResult } from "@/src/audit/types";
import { AuthDialog, type AuthedUser } from "./auth-dialog";
import { triggerRun } from "./rerun-button";

interface Props {
  result: AuditResult;
}

const BULK_INSTALL_CMD = "failproofai policies --install";
const DEFAULT_REMINDER_DAYS = 7;

type AuthStatus =
  | { kind: "unknown" }
  | { kind: "anon" }
  | { kind: "authed"; user: { id: string; email: string } };

interface Reminder {
  next_audit_at: number; // unix seconds
  user_email: string;
  set_at: number;
}

function daysUntil(unixSecs: number): number {
  const nowSecs = Math.floor(Date.now() / 1000);
  return Math.max(0, Math.ceil((unixSecs - nowSecs) / 86400));
}

function formatNextAudit(unixSecs: number): string {
  const d = new Date(unixSecs * 1000);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function ReturnSection({ result }: Props) {
  const hasUnenabled = result.results.some(
    (r) => r.source === "builtin" && !r.enabledInConfig && r.hits > 0,
  );

  const [copied, setCopied] = useState(false);
  const [authStatus, setAuthStatus] = useState<AuthStatus>({ kind: "unknown" });
  const [reminder, setReminder] = useState<Reminder | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reminderBusy, setReminderBusy] = useState(false);
  const [rerunBusy, setRerunBusy] = useState(false);

  // Probe /api/auth/status on mount — also returns the persisted reminder
  // when one exists and belongs to the active session.
  const refreshStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/status", { cache: "no-store" });
      const body = (await res.json()) as {
        authenticated?: boolean;
        user?: { id: string; email: string };
        reminder?: Reminder | null;
      };
      if (body.authenticated && body.user) {
        setAuthStatus({ kind: "authed", user: body.user });
        setReminder(body.reminder ?? null);
      } else {
        setAuthStatus({ kind: "anon" });
        setReminder(null);
      }
    } catch {
      setAuthStatus({ kind: "anon" });
      setReminder(null);
    }
  }, []);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  const persistReminder = useCallback(async (): Promise<Reminder | null> => {
    try {
      setReminderBusy(true);
      const res = await fetch("/api/auth/reminder", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ in_days: DEFAULT_REMINDER_DAYS }),
      });
      if (!res.ok) return null;
      const body = (await res.json()) as { reminder?: Reminder };
      return body.reminder ?? null;
    } catch {
      return null;
    } finally {
      setReminderBusy(false);
    }
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

  const handleSetReminder = useCallback(async () => {
    if (authStatus.kind === "unknown") return;
    if (authStatus.kind === "authed") {
      const next = await persistReminder();
      if (next) setReminder(next);
      return;
    }
    setDialogOpen(true);
  }, [authStatus, persistReminder]);

  const handleAuthed = useCallback(
    async (user: AuthedUser) => {
      setAuthStatus({ kind: "authed", user });
      // The dialog opened because the user wanted a reminder → persist
      // immediately, no second click required.
      const next = await persistReminder();
      if (next) setReminder(next);
    },
    [persistReminder],
  );

  const handleRerun = useCallback(async () => {
    if (rerunBusy) return;
    setRerunBusy(true);
    try {
      await triggerRun({ cli: [], since: "30d" });
      // Reload the page after the run so the cached result + dashboard cache
      // get re-hydrated against the new scan. Cheaper than threading state.
      window.location.reload();
    } finally {
      setRerunBusy(false);
    }
  }, [rerunBusy]);

  const authed = authStatus.kind === "authed";
  const hasReminder = authed && reminder !== null;
  const days = reminder ? daysUntil(reminder.next_audit_at) : 0;
  const authedEmail =
    authStatus.kind === "authed" ? authStatus.user.email : "";

  return (
    <section className="section" data-screen-label="06 Next audit">
      <div className="section-mast">
        <div className="section-label">
          <span className="glyph">━━</span> next audit{" "}
          <span style={{ color: "var(--dim)" }}>·</span> improvement
        </div>
        <div className="section-meta">
          <span className="g">●</span> recommended in 7d
        </div>
      </div>
      <h2 className="section-h">come back better.</h2>

      <div className="return-hook">
        <div className="label">━━ the loop</div>
        <h3>re-audit in 7 days.</h3>
        <p>
          after the prescribed policies have been live for a week, we&apos;ll show
          your before/after score and which detectors went quiet.
        </p>
        <p style={{ marginTop: 16, color: "var(--dim)" }}>
          most agents move from C to B in one session. some make it in a day.
        </p>

        {/* Once authed, the section stays in the consolidated status panel —
            with the reminder line if one is set, or a "no reminder yet" line
            + inline [ set a reminder ] button otherwise. The anonymous CTA
            layout only shows for genuinely-unauthed sessions. */}
        {authed ? (
          <div className="return-status">
            {hasReminder && reminder ? (
              <div className="rs-row rs-row-primary">
                <span className="rs-dot rs-dot-pink" aria-hidden="true" />
                <span>
                  next audit set for{" "}
                  <span className="rs-strong">{formatNextAudit(reminder.next_audit_at)}</span>
                  {" "}<span style={{ color: "var(--dim)" }}>·</span>{" "}
                  <span className="rs-strong">in {days} day{days === 1 ? "" : "s"}</span>
                </span>
              </div>
            ) : (
              <div className="rs-row rs-row-primary">
                <span className="rs-dot rs-dot-pink" aria-hidden="true" />
                <span>
                  <span className="rs-strong">no reminder set yet</span>
                  {" "}<span style={{ color: "var(--dim)" }}>·</span>{" "}
                  recommended in {DEFAULT_REMINDER_DAYS} days
                </span>
              </div>
            )}
            <div className="rs-row">
              <span className="rs-dot rs-dot-green" aria-hidden="true" />
              <span>
                signed in as <span className="rs-email">{authedEmail}</span>
              </span>
            </div>
            <div className="return-actions" style={{ marginTop: 18 }}>
              {!hasReminder && (
                <button
                  type="button"
                  className="share-btn"
                  onClick={handleSetReminder}
                  disabled={reminderBusy}
                >
                  {reminderBusy ? "[ saving… ]" : "[ set a reminder ]"}
                </button>
              )}
              <button
                type="button"
                className="share-btn alt"
                onClick={handleRerun}
                disabled={rerunBusy}
              >
                {rerunBusy ? "[ scanning… ]" : "[ re-audit now ]"}
              </button>
              {hasUnenabled && (
                <button type="button" className="share-btn alt" onClick={handleInstall}>
                  {copied ? "[ ✓ copied — paste in your shell ]" : "[ install policies ]"}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="return-actions">
            <button
              type="button"
              className="share-btn"
              onClick={handleSetReminder}
              disabled={authStatus.kind === "unknown" || reminderBusy}
            >
              {reminderBusy ? "[ saving… ]" : "[ set a reminder ]"}
            </button>
            <button
              type="button"
              className="share-btn alt"
              onClick={handleRerun}
              disabled={rerunBusy}
            >
              {rerunBusy ? "[ scanning… ]" : "[ re-audit now ]"}
            </button>
            {hasUnenabled && (
              <button type="button" className="share-btn alt" onClick={handleInstall}>
                {copied ? "[ ✓ copied — paste in your shell ]" : "[ install policies ]"}
              </button>
            )}
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
          void handleAuthed(u);
        }}
      />
    </section>
  );
}
