"use client";

/**
 * Section 03 — SCORE CARD.
 *
 * Left column only: YOUR AUDIT SCORE (big number, tier badge, progress
 * bar, 3 stat boxes, prescribed-policies chip strip).
 *
 * Share actions have moved to IdentitySection below the archetype sigil.
 */
import React, { useMemo } from "react";
import type { AuditResult } from "@/src/audit/types";
import { ARCHETYPES, type ArchetypeKey } from "@/src/audit/archetypes";
import { type Grade } from "@/src/audit/scoring";

interface Props {
  result: AuditResult;
  score: number;
  grade: Grade;
  archetypeKey: ArchetypeKey;
  /** Display name shown in the card header. */
  project: string;
}

export function ScoreSection({ result, score, grade, archetypeKey, project }: Props) {
  const archetype = ARCHETYPES[archetypeKey];
  const pointsToNext = useMemo(() => {
    const thresholds: { g: Grade; t: number }[] = [
      { g: "S", t: 90 }, { g: "A", t: 80 }, { g: "B", t: 71 },
      { g: "C", t: 55 }, { g: "D", t: 40 },
    ];
    for (const { g, t } of thresholds) {
      if (score < t) return { next: g, delta: t - score };
    }
    return { next: "S" as Grade, delta: 0 };
  }, [score]);

  /** Slipping-through builtin policies (the same heuristic ReturnSection uses
   *  for its [install policies] CTA). Used as the "policies missing" stat. */
  const missing = useMemo(
    () => result.results.filter((r) => r.source === "builtin" && !r.enabledInConfig && r.hits > 0).length,
    [result],
  );

  /** Rough "days to fix" — capped 1..14. One day per slipping policy, with a
   *  baseline of 3d on any non-S grade. */
  const daysToFix = useMemo(() => {
    if (grade === "S" || missing === 0) return 0;
    return Math.max(1, Math.min(14, missing + 1));
  }, [grade, missing]);

  /** % of 0–100 bar to fill — simply score/100. */
  const progressPct = score;

  /** Top-N slipping policies → chip strip on the left card. Capped at 6. */
  const policyChips = useMemo(() => {
    const slipping = result.results
      .filter((r) => r.source === "builtin" && !r.enabledInConfig && r.hits > 0)
      .sort((a, b) => b.hits - a.hits)
      .slice(0, 6)
      .map((r) => ({ name: shortPolicyLabel(r.name), missing: true as const }));
    const enabled = result.results
      .filter((r) => r.source === "builtin" && r.enabledInConfig)
      .slice(0, Math.max(0, 6 - slipping.length))
      .map((r) => ({ name: shortPolicyLabel(r.name), missing: false as const }));
    return [...slipping, ...enabled];
  }, [result]);

  return (
    <section className="section" data-screen-label="03 Score">
      <div className="section-mast">
        <div className="section-label">
          <span className="glyph">━━</span> score
          <span style={{ color: "var(--accent-green)", marginLeft: 10, letterSpacing: "0.04em", textTransform: "none", fontSize: 11 }}>· see how your agent is performing</span>
        </div>
      </div>
      <h2 className="section-h">your audit score.</h2>

      <div className="panel score-share-card">
        <div className="score-card-header">
          <span style={{ color: "var(--ink)" }}>{project}</span>
          <span style={{ color: "var(--dim)" }}> · </span>
          <span style={{ color: "var(--accent-pink)" }}>{archetype.name.toLowerCase()}</span>
        </div>

        <div className="ss-score-row">
          <span className={"ss-score g-" + grade}>{score}</span>
          <span className="ss-score-of">/100</span>
        </div>

        <div className="ss-tier-row">
          <span className={"ss-tier-badge g-" + grade}>{grade} tier</span>
          <span className="ss-arch">{archetype.name.toLowerCase()}</span>
        </div>

        <div className="ss-progress-label">
          <span style={{ color: "var(--dim)" }}>score</span>
          {pointsToNext.delta > 0 ? (
            <span style={{ color: "var(--accent-pink)" }}>
              +{pointsToNext.delta} pts to {pointsToNext.next} tier
            </span>
          ) : (
            <span style={{ color: "var(--accent-green)" }}>top tier ✓</span>
          )}
        </div>
        <div className="ss-progress-track">
          {[40, 55, 71, 80, 90].map((t) => (
            <div key={t} className="ss-progress-tick" style={{ left: `${t}%` }} />
          ))}
          <div
            className="ss-progress-fill audit-bar-fill"
            style={{ ["--bar-width" as string]: `${progressPct}%` }}
          />
        </div>
        <div className="ss-grade-stops">
          {(["D", "C", "B", "A", "S"] as Grade[]).map((g, i) => {
            const pos = [40, 55, 71, 80, 90][i];
            return (
              <span
                key={g}
                className={"ss-grade-stop" + (grade === g ? " active" : "")}
                style={{ left: `${pos}%` }}
              >{g}</span>
            );
          })}
        </div>

        <div className="ss-stats">
          <div className="ss-stat">
            <div className="ss-stat-n" style={{ color: "var(--amber)" }}>{missing}</div>
            <div className="ss-stat-l">policies<br />missing</div>
          </div>
          <div className="ss-stat">
            <div className="ss-stat-n" style={{ color: "var(--accent-pink)" }}>
              +{pointsToNext.delta}
            </div>
            <div className="ss-stat-l">pts to<br />{pointsToNext.next} tier</div>
          </div>
          <div className="ss-stat">
            <div className="ss-stat-n" style={{ color: "var(--accent-green)" }}>
              {daysToFix === 0 ? "—" : `~${daysToFix}d`}
            </div>
            <div className="ss-stat-l">est.<br />to fix</div>
          </div>
        </div>

        {policyChips.length > 0 && (
          <>
            <div className="ss-policy-label">policy status</div>
            <div className="ss-policy-chips">
              {policyChips.map((p, i) => (
                <span
                  key={i}
                  className={"ss-chip" + (p.missing ? " missing" : " enabled")}
                >
                  <span className="dot" aria-hidden="true" />
                  {p.name}
                </span>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

/** Drop the "failproofai/" namespace prefix builtin policies carry so chips
 *  stay compact (`block-sudo` reads better than `failproofai/block-sudo`). */
function shortPolicyLabel(name: string): string {
  const slash = name.indexOf("/");
  return slash >= 0 ? name.slice(slash + 1) : name;
}
