import { db } from "@/lib/db";

/**
 * Length of the returns window, in days.
 *
 * This used to be written by hand in each place it appeared, and the numbers
 * had drifted apart — the home page promised 15 days while checkout and the
 * invoice said 7. It now comes from the `returns_days` site setting so the
 * storefront, checkout and invoice can never contradict each other again.
 */
export const DEFAULT_RETURNS_DAYS = 7;

export async function getReturnsDays(): Promise<number> {
  const row = await db.siteSetting
    .findUnique({ where: { key: "returns_days" } })
    .catch(() => null);

  const n = Number(row?.value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : DEFAULT_RETURNS_DAYS;
}
