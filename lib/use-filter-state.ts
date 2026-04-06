"use client";

import { useState, useCallback } from "react";
import type { FilterPreset, DateRange } from "./date-filters";

export interface FilterState {
  filterPreset: FilterPreset;
  dateRange: DateRange;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  handlePresetChange: (preset: FilterPreset) => void;
  handleDateRangeChange: (field: "from" | "to", value: string) => void;
  clearFilters: () => void;
}

/** Optional initial values for seeding filter state (e.g. from URL params). */
export interface FilterInitialValues {
  filterPreset?: FilterPreset;
  dateRange?: DateRange;
  currentPage?: number;
}

/**
 * Shared filter state for project-list and sessions-list.
 * Manages preset/custom date filtering and pagination reset.
 * Pass additional deps that should also reset the page (e.g. keyword array).
 */
export function useFilterState(
  extraResetDeps: unknown[] = [],
  initialValues?: FilterInitialValues,
): FilterState {
  const [filterPreset, setFilterPreset] = useState<FilterPreset>(initialValues?.filterPreset ?? "all");
  const [dateRange, setDateRange] = useState<DateRange>(initialValues?.dateRange ?? { from: null, to: null });
  const [currentPage, setCurrentPage] = useState(initialValues?.currentPage ?? 1);

  // Reset page to 1 when filter deps change (React render-time state comparison pattern)
  const filterKey = `${filterPreset}|${JSON.stringify(dateRange)}|${JSON.stringify(extraResetDeps)}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setCurrentPage(1);
  }

  const handlePresetChange = useCallback((preset: FilterPreset) => {
    setFilterPreset(preset);
    if (preset !== "custom") setDateRange({ from: null, to: null });
  }, []);

  const handleDateRangeChange = useCallback((field: "from" | "to", value: string) => {
    setFilterPreset("custom");
    setDateRange((prev) => ({ ...prev, [field]: value ? new Date(value) : null }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilterPreset("all");
    setDateRange({ from: null, to: null });
  }, []);

  return {
    filterPreset,
    dateRange,
    currentPage,
    setCurrentPage,
    handlePresetChange,
    handleDateRangeChange,
    clearFilters,
  };
}
