import { db } from "@/lib/db";

/**
 * Maintenance / work-in-progress mode.
 *
 * When enabled, storefront visitors see a holding page instead of the site.
 * The admin panel, the auth routes and the API are deliberately NOT blocked —
 * otherwise enabling it would lock the owner out of the very screen that turns
 * it off again.
 */

export const MAINTENANCE_KEYS = {
  enabled: "maintenance_enabled",
  title:   "maintenance_title",
  message: "maintenance_message",
} as const;

export const MAINTENANCE_DEFAULTS = {
  title:   "We'll be back shortly",
  message: "Our store is undergoing scheduled maintenance. Please check back in a little while — thank you for your patience.",
};

export interface MaintenanceState {
  enabled: boolean;
  title: string;
  message: string;
}

export async function getMaintenance(): Promise<MaintenanceState> {
  const rows = await db.siteSetting
    .findMany({ where: { key: { in: Object.values(MAINTENANCE_KEYS) } } })
    .catch(() => [] as { key: string; value: string }[]);

  const s: Record<string, string> = {};
  rows.forEach((r) => { s[r.key] = r.value; });

  return {
    enabled: s[MAINTENANCE_KEYS.enabled] === "true",
    title:   s[MAINTENANCE_KEYS.title]?.trim()   || MAINTENANCE_DEFAULTS.title,
    message: s[MAINTENANCE_KEYS.message]?.trim() || MAINTENANCE_DEFAULTS.message,
  };
}
