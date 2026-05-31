"use client";

/**
 * Auth dialog — modal overlay shown when an unauthenticated user clicks
 * "[ set a reminder ]". Two-step flow:
 *
 *   1. Email entry  → POST /api/auth/login-request
 *   2. OTP entry    → POST /api/auth/login-verify
 *
 * Styled to match the rest of the /audit page: pixel brackets, sharp pink
 * accent, terminal-style frame. The dialog never sees the refresh token —
 * the dashboard's API route writes it to ~/.failproofai/auth.json.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";

export interface AuthedUser {
  id: string;
  email: string;
}

interface Props {
  open: boolean;
  /** Copy shown above the title, e.g. "oops — you are unknown." */
  headline?: string;
  /** Copy under the title explaining why we need auth right now. */
  reason?: string;
  onClose: () => void;
  /** Fired after successful verify. Caller decides what to do next. */
  onAuthed: (user: AuthedUser) => void;
}

type Step =
  | { kind: "email"; error: string | null }
  | { kind: "code"; email: string; error: string | null; expiresIn: number; resendIn: number }
  | { kind: "done"; user: AuthedUser };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthDialog({
  open,
  headline = "oops — you are unknown.",
  reason = "verify yourself to continue.",
  onClose,
  onAuthed,
}: Props): React.ReactElement | null {
  const [step, setStep] = useState<Step>({ kind: "email", error: null });
  const [busy, setBusy] = useState(false);
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const codeInputRef = useRef<HTMLInputElement | null>(null);

  // Reset internal state every time the dialog opens.
  useEffect(() => {
    if (open) {
      setStep({ kind: "email", error: null });
      setBusy(false);
    }
  }, [open]);

  // Autofocus the right input as the step changes.
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      if (step.kind === "email") emailInputRef.current?.focus();
      else if (step.kind === "code") codeInputRef.current?.focus();
    }, 50);
    return () => clearTimeout(t);
  }, [open, step.kind]);

  // ESC to close.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  // Resend countdown ticker.
  const resendActive = step.kind === "code" && step.resendIn > 0;
  useEffect(() => {
    if (!resendActive) return;
    const id = setInterval(() => {
      setStep((s) =>
        s.kind === "code" ? { ...s, resendIn: Math.max(0, s.resendIn - 1) } : s,
      );
    }, 1000);
    return () => clearInterval(id);
  }, [resendActive]);

  const requestCode = useCallback(
    async (email: string): Promise<void> => {
      setBusy(true);
      try {
        const res = await fetch("/api/auth/login-request", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const body = (await res.json().catch(() => ({}))) as {
          code?: string;
          message?: string;
          expires_in?: number;
          resend_available_in?: number;
          retry_after_secs?: number;
        };
        if (!res.ok) {
          let msg = body.message ?? "could not send code.";
          if (body.code === "rate_limited" && body.retry_after_secs !== undefined) {
            msg = `too many tries. wait ${body.retry_after_secs}s and try again.`;
          } else if (body.code === "upstream_unreachable") {
            msg = "api-server unreachable. is it running on :8080?";
          }
          setStep({ kind: "email", error: msg });
          return;
        }
        setStep({
          kind: "code",
          email,
          error: null,
          expiresIn: body.expires_in ?? 600,
          resendIn: body.resend_available_in ?? 30,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setStep({ kind: "email", error: `network error: ${message}` });
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  const verifyCode = useCallback(
    async (email: string, code: string): Promise<void> => {
      setBusy(true);
      try {
        const res = await fetch("/api/auth/login-verify", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, code }),
        });
        const body = (await res.json().catch(() => ({}))) as {
          authenticated?: boolean;
          user?: AuthedUser;
          code?: string;
          message?: string;
        };
        if (!res.ok || !body.authenticated || !body.user) {
          let msg = body.message ?? "invalid code.";
          if (body.code === "invalid_code") msg = "wrong code, or it expired. try again.";
          setStep((s) =>
            s.kind === "code" ? { ...s, error: msg } : s,
          );
          return;
        }
        setStep({ kind: "done", user: body.user });
        onAuthed(body.user);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setStep((s) =>
          s.kind === "code" ? { ...s, error: `network error: ${message}` } : s,
        );
      } finally {
        setBusy(false);
      }
    },
    [onAuthed],
  );

  const onEmailSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (busy || step.kind !== "email") return;
      const fd = new FormData(e.currentTarget);
      const email = String(fd.get("email") ?? "").trim().toLowerCase();
      if (!EMAIL_RE.test(email)) {
        setStep({ kind: "email", error: "that doesn't look like an email." });
        return;
      }
      await requestCode(email);
    },
    [busy, step, requestCode],
  );

  const onCodeSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (busy || step.kind !== "code") return;
      const fd = new FormData(e.currentTarget);
      const code = String(fd.get("code") ?? "").trim();
      if (code.length < 4 || code.length > 12) {
        setStep((s) =>
          s.kind === "code" ? { ...s, error: "code is 4–12 characters." } : s,
        );
        return;
      }
      await verifyCode(step.email, code);
    },
    [busy, step, verifyCode],
  );

  const onResend = useCallback(async () => {
    if (step.kind !== "code" || step.resendIn > 0 || busy) return;
    await requestCode(step.email);
  }, [step, busy, requestCode]);

  if (!open) return null;

  return (
    <div
      className="auth-dialog-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-dialog-title"
      onClick={(e) => {
        if (!busy && e.target === e.currentTarget) onClose();
      }}
    >
      <div className="auth-dialog">
        <span className="corner tl">┌</span>
        <span className="corner tr">┐</span>
        <span className="corner bl">└</span>
        <span className="corner br">┘</span>

        <button
          type="button"
          className="auth-close"
          onClick={onClose}
          disabled={busy}
          aria-label="close"
        >
          [ x ]
        </button>

        <div className="auth-label">━━ identity check</div>
        <h2 id="auth-dialog-title" className="auth-headline">
          {headline}
        </h2>

        {step.kind === "email" && (
          <>
            <p className="auth-sub">{reason}</p>
            <form onSubmit={onEmailSubmit} className="auth-form">
              <label className="auth-field-label" htmlFor="auth-dialog-email">
                email
              </label>
              <input
                ref={emailInputRef}
                id="auth-dialog-email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                spellCheck={false}
                placeholder="you@yourdomain.com"
                disabled={busy}
                className="auth-input"
                required
              />
              {step.error && <div className="auth-error">{step.error}</div>}
              <div className="auth-actions">
                <button type="submit" className="auth-btn primary" disabled={busy}>
                  {busy ? "[ sending… ]" : "[ send code ]"}
                </button>
                <button
                  type="button"
                  className="auth-btn"
                  onClick={onClose}
                  disabled={busy}
                >
                  [ cancel ]
                </button>
              </div>
            </form>
          </>
        )}

        {step.kind === "code" && (
          <>
            <p className="auth-sub">
              we sent a code to <span className="auth-email">{step.email}</span>.
              <br />
              check your inbox — it expires in {Math.ceil(step.expiresIn / 60)} min.
            </p>
            <form onSubmit={onCodeSubmit} className="auth-form">
              <label className="auth-field-label" htmlFor="auth-dialog-code">
                one-time code
              </label>
              <input
                ref={codeInputRef}
                id="auth-dialog-code"
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                spellCheck={false}
                placeholder="123456"
                disabled={busy}
                className="auth-input auth-input-code"
                maxLength={12}
                required
              />
              {step.error && <div className="auth-error">{step.error}</div>}
              <div className="auth-actions">
                <button type="submit" className="auth-btn primary" disabled={busy}>
                  {busy ? "[ verifying… ]" : "[ verify ]"}
                </button>
                <button
                  type="button"
                  className="auth-btn"
                  onClick={onResend}
                  disabled={busy || step.resendIn > 0}
                >
                  {step.resendIn > 0
                    ? `[ resend in ${step.resendIn}s ]`
                    : "[ resend code ]"}
                </button>
              </div>
              <button
                type="button"
                className="auth-back"
                onClick={() => setStep({ kind: "email", error: null })}
                disabled={busy}
              >
                ← use a different email
              </button>
            </form>
          </>
        )}

        {step.kind === "done" && (
          <>
            <p className="auth-sub">
              <span className="auth-ok">✓</span> you are{" "}
              <span className="auth-email">{step.user.email}</span>.
            </p>
            <p className="auth-sub" style={{ marginTop: 8 }}>
              session saved locally.
            </p>
            <div className="auth-actions">
              <button type="button" className="auth-btn primary" onClick={onClose}>
                [ continue ]
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
