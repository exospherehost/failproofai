/**
 * Sessions List — displays session log files for a project with date
 * preset / custom-range filtering, session ID search, and pagination.
 */
"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { SessionFile } from "@/lib/projects";
import { formatDate } from "@/lib/format-date";
import {
  FILTER_PRESETS,
  ITEMS_PER_PAGE,
  filterByDate,
  rehydrateDates,
} from "@/lib/date-filters";
import { useFilterState } from "@/lib/use-filter-state";
import { useUrlParams } from "@/lib/use-url-params";
import {
  presetToParam, paramToPreset,
  dateRangeToParams, paramsToDateRange,
  pageToParam, paramToPage,
} from "@/lib/url-filter-serializers";
import { File, Search } from "lucide-react";
import Link from "next/link";
import PaginationControls from "./pagination-controls";
import DatePickerInput from "./date-picker-input";
import { CopyButton } from "./copy-button";


interface SessionsListProps {
  files: SessionFile[];
  projectName: string;
}

function filterBySessionId(files: SessionFile[], query: string): SessionFile[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return files;
  return files.filter((f) => f.sessionId?.toLowerCase().includes(trimmed));
}

export default function SessionsList({ files, projectName }: SessionsListProps) {
  const url = useUrlParams();
  const mountedRef = useRef(false);

  // Read initial state from URL
  const [sessionIdFilter, setSessionIdFilter] = useState(() => url.get("sid") ?? "");

  const {
    filterPreset, dateRange, currentPage, setCurrentPage,
    handlePresetChange, handleDateRangeChange, clearFilters: clearDateFilters,
  } = useFilterState([sessionIdFilter], {
    filterPreset: paramToPreset(url.get("preset")),
    dateRange: paramsToDateRange(url.get("from"), url.get("to")),
    currentPage: paramToPage(url.get("page")),
  });

  // Write state changes back to URL
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    url.setAll({
      preset: presetToParam(filterPreset),
      ...dateRangeToParams(dateRange),
      sid: sessionIdFilter || undefined,
      page: pageToParam(currentPage),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterPreset, dateRange, sessionIdFilter, currentPage]);

  const clearFilters = () => {
    clearDateFilters();
    setSessionIdFilter("");
  };

  const normalizedFiles = useMemo(() => rehydrateDates(files), [files]);

  const filteredFiles = useMemo(() => {
    const byDate = filterByDate(normalizedFiles, filterPreset, dateRange);
    const byId = filterBySessionId(byDate, sessionIdFilter);
    return byId.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
  }, [normalizedFiles, sessionIdFilter, filterPreset, dateRange]);

  const totalPages = Math.max(1, Math.ceil(filteredFiles.length / ITEMS_PER_PAGE));
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages, setCurrentPage]);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredFiles.length);
  const paginatedFiles = filteredFiles.slice(startIndex, endIndex);

  const hasActiveFilters =
    filterPreset !== "all" || dateRange.from !== null || dateRange.to !== null || sessionIdFilter !== "";

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-4 flex flex-col gap-4">
        {/* Preset Filters + Refresh */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-foreground">Filter by:</span>
          {FILTER_PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => handlePresetChange(preset.value)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                filterPreset === preset.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {preset.label}
            </button>
          ))}

        </div>

        {/* Custom Date Range */}
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-foreground">Custom Range:</span>
          <div className="flex items-center gap-2">
            <DatePickerInput id="date-from" value={dateRange.from} onChange={(v) => handleDateRangeChange("from", v)} aria-label="Filter from date" />
            <span className="text-muted-foreground">to</span>
            <DatePickerInput id="date-to" value={dateRange.to} onChange={(v) => handleDateRangeChange("to", v)} aria-label="Filter to date" />
          </div>
        </div>

        {/* Session ID Search */}
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Filter by Session ID:</span>
          <input
            type="text"
            value={sessionIdFilter}
            onChange={(e) => setSessionIdFilter(e.target.value)}
            placeholder="Enter session ID (UUID)"
            className="px-3 py-2 text-sm bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all hover:border-primary/50 flex-1 max-w-md"
            aria-label="Filter by session ID"
          />
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-sm bg-muted text-muted-foreground hover:bg-muted/80 rounded-md transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Results Count */}
        <div className="text-sm text-muted-foreground">
          {filteredFiles.length === 0 ? (
            "No sessions found"
          ) : (
            <>
              Showing {startIndex + 1}-{endIndex} of {filteredFiles.length} sessions
              {filteredFiles.length !== normalizedFiles.length && (
                <span className="ml-1">(filtered from {normalizedFiles.length} total)</span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-foreground w-12">
                  <span className="sr-only">Icon</span>
                </th>
                <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-foreground">SessionId</th>
                <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-foreground">Modified</th>
              </tr>
            </thead>
            <tbody>
              {paginatedFiles.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                    No sessions found matching the filter.
                  </td>
                </tr>
              ) : (
                paginatedFiles.map((file) => (
                  <tr key={file.path} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <File className="w-5 h-5 text-primary" />
                    </td>
                    <td className="px-4 py-3 max-w-md">
                      <div className="flex items-center gap-1">
                        {file.sessionId ? (
                          <>
                            <Link
                              href={`/project/${encodeURIComponent(projectName)}/session/${encodeURIComponent(file.sessionId)}`}
                              className="font-semibold text-foreground hover:text-primary transition-colors break-words break-all inline-block max-w-full"
                            >
                              {file.name.replace(/\.jsonl$/, "")}
                            </Link>
                            <CopyButton text={file.sessionId} />
                          </>
                        ) : (
                          <span className="font-semibold text-foreground break-words break-all inline-block max-w-full">
                            {file.name.replace(/\.jsonl$/, "")}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {file.lastModifiedFormatted || formatDate(file.lastModified)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredFiles.length > 0 && (
          <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        )}
      </div>
    </div>
  );
}
