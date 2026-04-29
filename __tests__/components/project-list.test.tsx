import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProjectList from "@/app/components/project-list";
import type { ProjectFolder } from "@/lib/projects";

// Mock next/link to render plain anchor
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock next/navigation for useSearchParams, useRouter, usePathname
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/",
}));

// Mock lucide-react icons to simple spans
vi.mock("lucide-react", () => ({
  Folder: ({ className }: any) => <span data-testid="folder-icon" className={className} />,
  Search: ({ className }: any) => <span data-testid="search-icon" className={className} />,
  X: ({ className }: any) => <span data-testid="x-icon" className={className} />,
  Calendar: ({ className }: any) => <span data-testid="calendar-icon" className={className} />,
  ChevronLeft: ({ className }: any) => <span data-testid="chevron-left" className={className} />,
  ChevronRight: ({ className }: any) => <span data-testid="chevron-right" className={className} />,
  RefreshCw: ({ className }: any) => <span data-testid="refresh-icon" className={className} />,
}));

function makeFolders(count: number): ProjectFolder[] {
  return Array.from({ length: count }, (_, i) => ({
    name: `-home-user-project${i}`,
    path: `/mock/.claude/projects/-home-user-project${i}`,
    isDirectory: true,
    lastModified: new Date(Date.now() - i * 86400000),
    lastModifiedFormatted: `Jun ${15 - i}, 2024`,
    cli: ["claude"],
  }));
}

describe("ProjectList", () => {
  it("renders project folders in table", () => {
    const folders = makeFolders(3);
    render(<ProjectList folders={folders} />);
    expect(screen.getByText("Agent Root")).toBeInTheDocument();
    expect(screen.getByText("/home/user/project0")).toBeInTheDocument();
    expect(screen.getByText("/home/user/project1")).toBeInTheDocument();
    expect(screen.getByText("/home/user/project2")).toBeInTheDocument();
  });

  it("decodes folder names for display", () => {
    const folders: ProjectFolder[] = [
      {
        name: "C--code-myapp",
        path: "/mock/C--code-myapp",
        isDirectory: true,
        lastModified: new Date(),
        lastModifiedFormatted: "Jun 15, 2024",
        cli: ["claude"],
      },
    ];
    render(<ProjectList folders={folders} />);
    expect(screen.getByText("C:/code/myapp")).toBeInTheDocument();
  });

  it("renders a Claude Code badge for cli=['claude']", () => {
    const folders = makeFolders(1);
    render(<ProjectList folders={folders} />);
    expect(screen.getByText("Claude Code")).toBeInTheDocument();
    expect(screen.queryByText("OpenAI Codex")).not.toBeInTheDocument();
  });

  it("renders an OpenAI Codex badge for cli=['codex']", () => {
    const folders: ProjectFolder[] = [
      {
        name: "-home-u-codex",
        path: "/home/u/codex",
        isDirectory: true,
        lastModified: new Date(),
        lastModifiedFormatted: "Jun 15, 2024",
        cli: ["codex"],
      },
    ];
    render(<ProjectList folders={folders} />);
    expect(screen.getByText("OpenAI Codex")).toBeInTheDocument();
    expect(screen.queryByText("Claude Code")).not.toBeInTheDocument();
  });

  it("renders both badges when cli=['claude','codex']", () => {
    const folders: ProjectFolder[] = [
      {
        name: "-home-u-shared",
        path: "/mock/.claude/projects/-home-u-shared",
        isDirectory: true,
        lastModified: new Date(),
        lastModifiedFormatted: "Jun 15, 2024",
        cli: ["claude", "codex"],
      },
    ];
    render(<ProjectList folders={folders} />);
    expect(screen.getByText("Claude Code")).toBeInTheDocument();
    expect(screen.getByText("OpenAI Codex")).toBeInTheDocument();
  });

  it("links to /project/[name]", () => {
    const folders = makeFolders(1);
    render(<ProjectList folders={folders} />);
    const link = screen.getByText("/home/user/project0").closest("a");
    expect(link).toHaveAttribute("href", expect.stringContaining("/project/"));
  });

  it("shows empty state when no folders", () => {
    render(<ProjectList folders={[]} />);
    expect(screen.getByText("No projects found")).toBeInTheDocument();
  });

  it("keyword filtering with / to - normalization", async () => {
    const user = userEvent.setup();
    const folders = makeFolders(3);
    render(<ProjectList folders={folders} />);

    const input = screen.getByPlaceholderText("Enter keyword and press Enter");
    await user.type(input, "/home/user/project0{Enter}");

    expect(screen.getByText(/Showing 1-1 of 1 projects/)).toBeInTheDocument();
  });

  it("pagination (25 per page)", () => {
    const folders = makeFolders(30);
    render(<ProjectList folders={folders} />);
    expect(screen.getByText(/Showing 1-25 of 30 projects/)).toBeInTheDocument();
  });
});
