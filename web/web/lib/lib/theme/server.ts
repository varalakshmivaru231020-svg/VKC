import { cache } from "react";
import { db } from "@/lib/db";
import { DEFAULT_THEME, buildThemeStyle } from "./defaults";
import { buildGoogleFontsUrl } from "./fonts";
import type { ThemeSettings } from "./types";

/** Fetch active theme from DB — cached per-request via React cache() */
export const getThemeSettings = cache(async (): Promise<ThemeSettings> => {
  try {
    const rows = await db.siteSetting.findMany();
    const fromDb: Partial<ThemeSettings> = {};
    for (const row of rows) {
      (fromDb as Record<string, string>)[row.key] = row.value;
    }
    return { ...DEFAULT_THEME, ...fromDb };
  } catch {
    // DB not yet available during initial setup — use defaults
    return DEFAULT_THEME;
  }
});

/** Returns the <style> innerHTML and Google Fonts URL for use in layout */
export async function getThemeInjection(): Promise<{
  styleContent: string;
  fontsUrl: string;
  siteName: string;
  tagline: string;
  announcement: string;
  announcementActive: boolean;
}> {
  const settings = await getThemeSettings();
  return {
    styleContent: buildThemeStyle(settings),
    fontsUrl: buildGoogleFontsUrl(settings["font.heading"], settings["font.body"]),
    siteName: settings["site.name"],
    tagline: settings["site.tagline"],
    announcement: settings["site.announcement"],
    announcementActive: settings["site.announcement.active"] === "true",
  };
}
