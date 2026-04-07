/**
 * policies-notification.js — Notification and SessionEnd event examples
 *
 * Forwards Claude's idle notifications and session-end events to Slack.
 *
 * Prerequisites:
 *   Set the SLACK_WEBHOOK_URL environment variable to your Slack incoming webhook URL.
 *
 * Install:
 *   failproofai --install-hooks custom ./examples/policies-notification.js
 *
 * Test by letting Claude finish a task and go idle — you should receive a Slack message.
 * Test session end by exiting Claude — you should receive a session summary message.
 */
import { customPolicies, allow, instruct } from "failproofai";

// Forward Claude idle notifications to Slack
customPolicies.add({
  name: "slack-on-idle-notification",
  description: "Forward Claude idle notifications to Slack (set SLACK_WEBHOOK_URL env var)",
  match: { events: ["Notification"] },
  fn: async (ctx) => {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) return allow(); // skip if not configured

    const message = String(ctx.payload?.message ?? "Claude is waiting for input");
    const cwd = ctx.session?.cwd ?? "unknown";
    const sessionId = ctx.session?.sessionId ?? "unknown";

    // Await so the request completes before process.exit() is called by the CLI
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blocks: [
            {
              type: "header",
              text: { type: "plain_text", text: "💬 Claude is waiting for you", emoji: true },
            },
            {
              type: "section",
              text: { type: "mrkdwn", text: message },
            },
            {
              type: "section",
              fields: [
                { type: "mrkdwn", text: `*Project*\n\`${cwd}\`` },
                { type: "mrkdwn", text: `*Session*\n\`${sessionId}\`` },
              ],
            },
          ],
        }),
        signal: AbortSignal.timeout(5000),
      });
    } catch {
      // Never block Claude if Slack is unreachable
    }

    return instruct(`We have sent the notification to the user on Slack about: ${message}`);
  },
});

// Notify Slack when a Claude session ends
customPolicies.add({
  name: "slack-on-session-end",
  description: "Notify Slack when a Claude session ends (set SLACK_WEBHOOK_URL env var)",
  match: { events: ["SessionEnd"] },
  fn: async (ctx) => {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) return allow(); // skip if not configured

    const cwd = ctx.session?.cwd ?? "unknown";
    const sessionId = ctx.session?.sessionId ?? "unknown";

    // Await so the request completes before process.exit() is called by the CLI
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blocks: [
            {
              type: "header",
              text: { type: "plain_text", text: "✅ Claude session ended", emoji: true },
            },
            {
              type: "section",
              fields: [
                { type: "mrkdwn", text: `*Project*\n\`${cwd}\`` },
                { type: "mrkdwn", text: `*Session*\n\`${sessionId}\`` },
              ],
            },
          ],
        }),
        signal: AbortSignal.timeout(5000),
      });
    } catch {
      // Never block Claude if Slack is unreachable
    }

    return instruct(`We have sent the notification to the user on Slack about: Claude session ended (project: ${cwd}, session: ${sessionId})`);
  },
});
