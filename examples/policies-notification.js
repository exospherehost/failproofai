/**
 * policies-notification.js — Notification event example
 *
 * Forwards Claude's idle notifications to Slack.
 *
 * Prerequisites:
 *   Set the SLACK_WEBHOOK_URL environment variable to your Slack incoming webhook URL.
 *
 * Install:
 *   failproofai --install-hooks custom ./examples/policies-notification.js
 *
 * Test by letting Claude finish a task and go idle — you should receive a Slack message.
 */
import { customPolicies, allow } from "failproofai";

// Forward Claude idle notifications to Slack
customPolicies.add({
  name: "slack-on-idle-notification",
  description: "Forward Claude idle notifications to Slack (set SLACK_WEBHOOK_URL env var)",
  match: { events: ["Notification"] },
  fn: async (ctx) => {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) return allow(); // skip if not configured

    const type = String(ctx.payload?.notification_type ?? "");
    if (type !== "idle") return allow(); // only forward idle notifications

    const message = String(ctx.payload?.message ?? "Claude is waiting for input");
    const cwd = ctx.session?.cwd ?? "unknown";
    const sessionId = ctx.session?.sessionId ?? "unknown";

    // Fire-and-forget — never block Claude if Slack is unreachable
    fetch(webhookUrl, {
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
    }).catch(() => {});

    return allow(); // Notification hooks must always return allow
  },
});
