import { db } from "@/lib/db";

export interface ProductOptions {
  fabrics: string[];
  weaves: string[];
  regions: string[];
  occasions: string[];
}

const DEFAULTS: ProductOptions = {
  fabrics:   ["Silk", "Cotton", "Linen", "Georgette", "Chiffon", "Crepe", "Organza", "Net", "Tussar", "Khadi"],
  weaves:    ["Handloom", "Powerloom", "Banarasi", "Kanjivaram", "Chanderi", "Patola", "Jamdani", "Ikat"],
  regions:   ["Tamil Nadu", "Uttar Pradesh", "Gujarat", "Madhya Pradesh", "Karnataka", "Odisha", "West Bengal", "Rajasthan"],
  occasions: ["Wedding", "Festival", "Casual", "Office", "Party", "Puja", "Reception", "Sangeet"],
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
