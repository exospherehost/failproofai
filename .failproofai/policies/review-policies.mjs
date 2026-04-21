/**
 * review-policies.mjs — Require bot review comments to be resolved before stopping.
 *
 * Runs on the Stop event, after built-in workflow policies (require-ci-green-before-stop).
 * Uses the GitHub GraphQL API to check for unresolved review threads authored by bots.
 */
import { customPolicies, allow, deny } from "failproofai";
import { execSync } from "node:child_process";

customPolicies.add({
  name: "require-bot-reviews-resolved",
  description: "Require all bot review comments (e.g. CodeRabbit) to be resolved before stopping",
  match: { events: ["Stop"] },
  fn: async (ctx) => {
    const cwd = ctx.session?.cwd;
    if (!cwd) return allow("No working directory, skipping bot review check.");

    try {
      execSync("gh --version", { cwd, encoding: "utf8", timeout: 3000 });
    } catch {
      return allow("GitHub CLI (gh) not installed, skipping bot review check.");
    }

    let branch;
    try {
      branch = execSync("git rev-parse --abbrev-ref HEAD", {
        cwd,
        encoding: "utf8",
        timeout: 5000,
      }).trim();
    } catch {
      return allow("Could not determine branch, skipping bot review check.");
    }

    if (!branch || branch === "HEAD" || branch === "main" || branch === "master") {
      return allow("Not on a feature branch, skipping bot review check.");
    }

    let prNumber;
    try {
      const raw = execSync(`gh pr view "${branch}" --json number`, {
        cwd,
        encoding: "utf8",
        timeout: 10000,
      });
      prNumber = JSON.parse(raw).number;
    } catch {
      return allow("No PR found for this branch, skipping bot review check.");
    }

    let repoOwner, repoName;
    try {
      const raw = execSync("gh repo view --json owner,name", {
        cwd,
        encoding: "utf8",
        timeout: 5000,
      });
      const parsed = JSON.parse(raw);
      repoOwner = parsed.owner.login;
      repoName = parsed.name;
    } catch {
      return allow("Could not determine repository, skipping bot review check.");
    }

    const query = `query {
      repository(owner: "${repoOwner}", name: "${repoName}") {
        pullRequest(number: ${prNumber}) {
          reviewThreads(first: 100) {
            nodes {
              isResolved
              comments(first: 1) {
                nodes {
                  author { login __typename }
                }
              }
            }
          }
        }
      }
    }`.replace(/\n/g, " ");

    let threads;
    try {
      const raw = execSync(`gh api graphql -f query='${query}'`, {
        cwd,
        encoding: "utf8",
        timeout: 15000,
      });
      threads = JSON.parse(raw).data.repository.pullRequest.reviewThreads.nodes;
    } catch {
      return allow("Could not fetch review threads, skipping bot review check.");
    }

    const unresolvedBotThreads = threads.filter((t) => {
      if (t.isResolved) return false;
      const node = t.comments?.nodes?.[0];
      if (!node?.author) return false;
      return node.author.__typename === "Bot" || node.author.login.includes("[bot]");
    });

    if (unresolvedBotThreads.length > 0) {
      const authors = [
        ...new Set(unresolvedBotThreads.map((t) => t.comments.nodes[0].author.login)),
      ];
      return deny(
        `${unresolvedBotThreads.length} unresolved bot review comment(s) on PR #${prNumber} from: ${authors.join(", ")}. ` +
          `Address or resolve all bot review comments, then push your fixes before stopping.`,
      );
    }

    return allow();
  },
});
