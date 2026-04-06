"use server";

import {
  getHookActivityHistory,
  searchHookActivity,
  type HookActivityEntry,
  type HookActivityFilters,
  type HookActivityStats,
} from "@/src/hooks/hook-activity-store";

export interface HookActivityPayload {
  entries: HookActivityEntry[];
  totalPages: number;
  page: number;
  stats: HookActivityStats;
}

export async function getHookActivityAction(page: number): Promise<HookActivityPayload> {
  return getHookActivityHistory(page);
}

export async function searchHookActivityAction(
  filters: HookActivityFilters,
  page: number,
): Promise<HookActivityPayload> {
  return searchHookActivity(filters, page);
}
