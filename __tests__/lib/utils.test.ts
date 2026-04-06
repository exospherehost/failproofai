import { describe, it, expect } from "vitest";
import { cn, formatDate } from "@/lib/utils";

describe("cn", () => {
  it("merges multiple class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("resolves Tailwind conflicts (last wins)", () => {
    expect(cn("px-4", "px-2")).toBe("px-2");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("handles null and undefined inputs", () => {
    expect(cn("base", null, undefined, "end")).toBe("base end");
  });

  it("returns empty string for no inputs", () => {
    expect(cn()).toBe("");
  });
});

describe("formatDate", () => {
  it("formats a date to en-US locale string", () => {
    // Use a fixed date to avoid timezone issues
    const date = new Date("2024-01-15T15:45:00Z");
    const result = formatDate(date);
    // Should contain month, day, year, and time components
    expect(result).toContain("Jan");
    expect(result).toContain("15");
    expect(result).toContain("2024");
  });

  it("includes time in the formatted output", () => {
    const date = new Date("2024-06-20T09:30:00Z");
    const result = formatDate(date);
    expect(result).toContain("Jun");
    expect(result).toContain("20");
    expect(result).toContain("2024");
  });
});
