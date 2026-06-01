"use client";

/**
 * Section 01 — IDENTITY. The hero. Big archetype name with hard-offset
 * stamp shadow, sigil to the right, keywords strip, "common in / primary
 * risk" meta grid, and the closing one-liner.
 *
 * Layout uses the ported `.archetype-frame` / `.arch-mast` / `.arch-body`
 * classes from audit-styles.css. Data sources from `src/audit/archetypes.ts`.
 *
 * The variant copy (tagline / keywords / common / risk / closing) is
 * picked deterministically from a multi-variant catalog using the `seed`
 * prop — typically the inferred project name. Same seed → same persona
 * blurb across renders; different seeds → different copy. So two users
 * who both land on "the optimist" see different language for it.
 *
 * Exposes a `frameRef` forwarded onto the `.archetype-frame` element so
 * the ShowOff "make poster" action can capture it via html2canvas.
 */
import React, { forwardRef, useState } from "react";
import { ARCHETYPES, pickArchetypeVariant, type ArchetypeKey } from "@/src/audit/archetypes";
import { type Grade } from "@/src/audit/scoring";
import { Sigil } from "./sigil";

const SITE_URL = "https://failproof.ai";
const X_INTENT = (text: string) =>
  `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
const LI_INTENT = (text: string) =>
  `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(SITE_URL)}&summary=${encodeURIComponent(text)}`;

function buildXTemplate(score: number, archetypeName: string, grade: Grade, missing: number): string {
  const gradeLines: Record<Grade, string> = {
    S: "every prescribed policy live. running at peak. this is what secure looks like.",
    A: `${missing} polic${missing === 1 ? "y" : "ies"} from elite tier. almost there.`,
    B: `solid baseline. ${missing} policy gap${missing === 1 ? "" : "s"} to close before i'm comfortable.`,
    C: `${missing} prescribed polic${missing === 1 ? "y" : "ies"} between here and the next tier. they're named. they're waiting.`,
    D: `${missing} prescribed polic${missing === 1 ? "y" : "ies"} unaddressed. agents without guardrails aren't ready for prod.`,
    F: `exposure is real. ${missing} polic${missing === 1 ? "y" : "ies"} away from stable ground — starting today.`,
  };
  return `just audited my AI agent with failproofai ✦\n\narchetype: ${archetypeName.toLowerCase()} · ${score}/100 · ${grade} tier\n${gradeLines[grade]}\n\nrun yours → ${SITE_URL}`;
}

function buildLinkedInTemplate(score: number, archetypeName: string, grade: Grade, missing: number): string {
  const verdict = (grade === "S" || grade === "A")
    ? `${score}/100 — ${grade} tier. every key policy is live. the audit confirmed what good looks like.`
    : `${score}/100 — ${grade} tier. ${missing} prescribed polic${missing === 1 ? "y" : "ies"} uncovered — each one is a real attack surface.`;
  return `We ran a failproofai security audit on our AI agent stack.\n\n${verdict}\n\nArchetype: ${archetypeName.toLowerCase()}. failproofai maps your agent\'s behavior pattern, identifies the exposure, and prescribes the exact policies to close it.\n\nFree. Open-source. 30 seconds to run: ${SITE_URL}`;
}

interface Props {
  archetypeKey: ArchetypeKey;
  secondaryKey: ArchetypeKey;
  toolCalls: number;
  sessions: number;
  /** "30d", "7d", etc. shown in the target line; "all time" otherwise. */
  window: string;
  /** Stable seed for variant selection (project name is the natural fit). */
  seed: string;
  score: number;
  grade: Grade;
  missing: number;
}

export const IdentitySection = forwardRef<HTMLDivElement, Props>(function IdentitySection(
  { archetypeKey, secondaryKey, toolCalls, sessions, window, seed, score, grade, missing }: Props,
  frameRef,
) {
  const archetype = pickArchetypeVariant(archetypeKey, seed);
  const secondary = secondaryKey !== archetypeKey ? ARCHETYPES[secondaryKey] : null;
  const [downloadState, setDownloadState] = useState<"idle" | "busy" | "done" | "error">("idle");

  const captureCard = async (): Promise<boolean> => {
    const node = typeof frameRef === "function" ? null : frameRef?.current;
    if (!node) return false;
    node.classList.add("capturing");
    try {
      if (typeof document !== "undefined" && document.fonts?.ready) await document.fonts.ready;
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(node, {
        backgroundColor: "#0e0e11",
        scale: 2,
        logging: false,
        useCORS: true,
      });
      await new Promise<void>((resolve) => {
        canvas.toBlob((blob) => {
          if (!blob) { resolve(); return; }
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `failproofai-identity-${grade.toLowerCase()}-${score}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          resolve();
        }, "image/png");
      });
      return true;
    } finally {
      node.classList.remove("capturing");
    }
  };

  const handleDownload = async () => {
    if (downloadState === "busy") return;
    setDownloadState("busy");
    try {
      await captureCard();
      setDownloadState("done");
      setTimeout(() => setDownloadState("idle"), 2000);
    } catch {
      setDownloadState("error");
      setTimeout(() => setDownloadState("idle"), 2000);
    }
  };

  const handleShareX = async () => {
    const text = buildXTemplate(score, archetype.name, grade, missing);
    await captureCard().catch(() => null);
    globalThis.open(X_INTENT(text), "_blank", "noopener,noreferrer");
  };

  const handleShareLI = async () => {
    const text = buildLinkedInTemplate(score, archetype.name, grade, missing);
    await captureCard().catch(() => null);
    globalThis.open(LI_INTENT(text), "_blank", "noopener,noreferrer");
  };

  return (
    <section className="identity" data-screen-label="01 Identity">
      <div className="archetype-frame" ref={frameRef}>
        <span className="corner tl">┌ identity</span>
        <span className="corner tr">v1.0 ┐</span>
        <span className="corner bl">└ № {archetype.index} / 08</span>
        <span className="corner br">archetype ┘</span>

        <div className="arch-mast">
          <div className="arch-mast-left">
            <div className="arch-eyebrow">
              ━━ identity <span className="ix">·</span> your agent&apos;s archetype
            </div>
            <div className="arch-target">
              detected from{" "}
              <span style={{ color: "var(--ink)" }}>{toolCalls.toLocaleString()}</span>
              {" "}tool calls
              <span className="slash">/</span>
              <span style={{ color: "var(--ink)" }}>{sessions}</span>
              {" "}sessions
              <span className="slash">/</span>
              <span style={{ color: "var(--ink)" }}>{window}</span>
              <span className="live">
                <span className="dot-live"></span>live
              </span>
            </div>
          </div>
          <div className="arch-counter">
            <div>
              № {archetype.index}<span className="of"> of 08</span>
            </div>
            <div style={{ color: "var(--ink-2)", marginTop: 4 }}>archetype</div>
          </div>
        </div>

        <div className="arch-body">
          <div>
            <h1 className="arch-name">{archetype.name}</h1>
            <p className="arch-tagline">{archetype.tagline}</p>

            {secondary && (
              <div className="arch-secondary">
                <span className="with">with</span>
                <span className="name">{secondary.name.replace("the ", "")}</span>
                <span className="with">tendencies</span>
              </div>
            )}

            <div className="arch-keywords">
              {archetype.keywords.map((k, i) => (
                <React.Fragment key={k}>
                  <span className="kw">{k}</span>
                  {i < archetype.keywords.length - 1 && (
                    <span className="kw-sep">·</span>
                  )}
                </React.Fragment>
              ))}
            </div>

            <div className="arch-meta-grid">
              <div className="arch-meta-item">
                <span className="label">common in</span>
                <span className="body">{archetype.common}</span>
              </div>
              <div className="arch-meta-item">
                <span className="label p">primary risk</span>
                <span className="body">{archetype.risk}</span>
              </div>
            </div>

            <div className="arch-closing">— {archetype.closing}</div>
          </div>

          <Sigil archetypeKey={archetypeKey} />
        </div>

        <div className="identity-share-btns">
          <button type="button" className="identity-share-btn" onClick={handleShareX}>
            <span className="isb-glyph" aria-hidden="true">x</span>
            <span className="isb-text">share on x</span>
          </button>
          <button type="button" className="identity-share-btn" onClick={handleShareLI}>
            <span className="isb-glyph" aria-hidden="true">in</span>
            <span className="isb-text">share on linkedin</span>
          </button>
          <button
            type="button"
            className="identity-share-btn"
            onClick={handleDownload}
            disabled={downloadState === "busy"}
          >
            <span className="isb-glyph" aria-hidden="true">↓</span>
            <span className="isb-text">
              {downloadState === "busy" ? "rendering…"
                : downloadState === "done" ? "downloaded ✓"
                : downloadState === "error" ? "render failed"
                : "download audit-card"}
            </span>
          </button>
        </div>
      </div>
    </section>
  );
});
