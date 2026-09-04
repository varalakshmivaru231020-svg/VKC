import { db } from "@/lib/db";

export interface ProductOptions {
  fabrics: string[];
  weaves: string[];
  regions: string[];
  occasions: string[];
}

// Empty by default — the fabric/weave/region/occasion lists from the previous
// catalogue were removed for the vkcgoldikshu (jaggery) catalogue. The admin can add their
// own values under Settings → Product Options if any dropdowns are wanted.
const DEFAULTS: ProductOptions = {
  fabrics:   [],
  weaves:    [],
  regions:   [],
  occasions: [],
};

function parseCSV(value: string): string[] {
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

export async function getProductOptions(): Promise<ProductOptions> {
  try {
    const rows = await db.siteSetting.findMany({
      where: { group: "options" },
    });
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return {
      fabrics:   map["options.fabrics"]   ? parseCSV(map["options.fabrics"])   : DEFAULTS.fabrics,
      weaves:    map["options.weaves"]    ? parseCSV(map["options.weaves"])    : DEFAULTS.weaves,
      regions:   map["options.regions"]   ? parseCSV(map["options.regions"])   : DEFAULTS.regions,
      occasions: map["options.occasions"] ? parseCSV(map["options.occasions"]) : DEFAULTS.occasions,
    };
  } catch {
    return DEFAULTS;
  }
}
