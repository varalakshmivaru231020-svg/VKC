import { PrismaClient } from "@prisma/client";
import { DEFAULT_THEME } from "../lib/theme/defaults";

const db = new PrismaClient();

const SETTING_META: Record<string, { label: string; group: string; type: string; sortOrder: number }> = {
  "color.primary":        { label: "Primary Brand Color",    group: "colors",     type: "color",       sortOrder: 1  },
  "color.primary.dark":   { label: "Primary Dark",           group: "colors",     type: "color",       sortOrder: 2  },
  "color.primary.light":  { label: "Primary Light",          group: "colors",     type: "color",       sortOrder: 3  },
  "color.primary.50":     { label: "Primary Tint",           group: "colors",     type: "color",       sortOrder: 4  },
  "color.gold":           { label: "Gold / Accent",          group: "colors",     type: "color",       sortOrder: 5  },
  "color.gold.light":     { label: "Gold Light",             group: "colors",     type: "color",       sortOrder: 6  },
  "color.gold.dark":      { label: "Gold Dark",              group: "colors",     type: "color",       sortOrder: 7  },
  "color.ivory":          { label: "Page Background",        group: "colors",     type: "color",       sortOrder: 8  },
  "color.cream":          { label: "Section Background",     group: "colors",     type: "color",       sortOrder: 9  },
  "color.parchment":      { label: "Card Border / Divider",  group: "colors",     type: "color",       sortOrder: 10 },
  "color.sand":           { label: "Muted Border",           group: "colors",     type: "color",       sortOrder: 11 },
  "color.text.primary":   { label: "Text Primary",           group: "colors",     type: "color",       sortOrder: 12 },
  "color.text.secondary": { label: "Text Secondary",         group: "colors",     type: "color",       sortOrder: 13 },
  "color.text.muted":     { label: "Text Muted",             group: "colors",     type: "color",       sortOrder: 14 },
  "color.text.disabled":  { label: "Text Disabled",          group: "colors",     type: "color",       sortOrder: 15 },
  "color.text.inverse":   { label: "Text Inverse (on dark)", group: "colors",     type: "color",       sortOrder: 16 },
  "color.success":        { label: "Success Green",          group: "colors",     type: "color",       sortOrder: 17 },
  "color.success.bg":     { label: "Success Background",     group: "colors",     type: "color",       sortOrder: 18 },
  "color.error":          { label: "Error Red",              group: "colors",     type: "color",       sortOrder: 19 },
  "color.error.bg":       { label: "Error Background",       group: "colors",     type: "color",       sortOrder: 20 },
  "color.warning":        { label: "Warning Amber",          group: "colors",     type: "color",       sortOrder: 21 },
  "color.warning.bg":     { label: "Warning Background",     group: "colors",     type: "color",       sortOrder: 22 },
  "color.border":         { label: "Default Border",         group: "colors",     type: "color",       sortOrder: 23 },
  "font.heading":         { label: "Heading Font",           group: "typography", type: "font-family", sortOrder: 30 },
  "font.body":            { label: "Body / UI Font",         group: "typography", type: "font-family", sortOrder: 31 },
  "font.accent":          { label: "Accent Font",            group: "typography", type: "font-family", sortOrder: 32 },
  "text.display":         { label: "Display Size",           group: "typography", type: "font-size",   sortOrder: 40 },
  "text.h1":              { label: "H1 Size",                group: "typography", type: "font-size",   sortOrder: 41 },
  "text.h2":              { label: "H2 Size",                group: "typography", type: "font-size",   sortOrder: 42 },
  "text.h3":              { label: "H3 Size",                group: "typography", type: "font-size",   sortOrder: 43 },
  "text.h4":              { label: "H4 Size",                group: "typography", type: "font-size",   sortOrder: 44 },
  "text.h5":              { label: "H5 Size",                group: "typography", type: "font-size",   sortOrder: 45 },
  "text.body.xl":         { label: "Body XL Size",           group: "typography", type: "font-size",   sortOrder: 46 },
  "text.body":            { label: "Body Size",              group: "typography", type: "font-size",   sortOrder: 47 },
  "text.sm":              { label: "Small Text",             group: "typography", type: "font-size",   sortOrder: 48 },
  "text.xs":              { label: "Caption Size",           group: "typography", type: "font-size",   sortOrder: 49 },
  "text.price":           { label: "Price Display Size",     group: "typography", type: "font-size",   sortOrder: 50 },
  "text.price.sm":        { label: "Price Small Size",       group: "typography", type: "font-size",   sortOrder: 51 },
  "weight.heading":       { label: "Heading Weight",         group: "typography", type: "font-weight", sortOrder: 60 },
  "weight.subheading":    { label: "Subheading Weight",      group: "typography", type: "font-weight", sortOrder: 61 },
  "weight.body":          { label: "Body Weight",            group: "typography", type: "font-weight", sortOrder: 62 },
  "weight.label":         { label: "Label Weight",           group: "typography", type: "font-weight", sortOrder: 63 },
  "leading.display":      { label: "Display Line Height",    group: "typography", type: "line-height", sortOrder: 70 },
  "leading.heading":      { label: "Heading Line Height",    group: "typography", type: "line-height", sortOrder: 71 },
  "leading.body":         { label: "Body Line Height",       group: "typography", type: "line-height", sortOrder: 72 },
  "tracking.display":     { label: "Display Letter Spacing", group: "typography", type: "letter-spacing", sortOrder: 80 },
  "tracking.heading":     { label: "Heading Letter Spacing", group: "typography", type: "letter-spacing", sortOrder: 81 },
  "tracking.label":       { label: "Label Letter Spacing",   group: "typography", type: "letter-spacing", sortOrder: 82 },
  "site.name":                { label: "Store Name",           group: "general", type: "text",    sortOrder: 90 },
  "site.tagline":             { label: "Store Tagline",        group: "general", type: "text",    sortOrder: 91 },
  "site.announcement":        { label: "Announcement Text",    group: "general", type: "text",    sortOrder: 92 },
  "site.announcement.active": { label: "Show Announcement Bar",group: "general", type: "boolean", sortOrder: 93 },
  "site.currency.symbol":     { label: "Currency Symbol",      group: "general", type: "text",    sortOrder: 94 },
  "site.currency.code":       { label: "Currency Code",        group: "general", type: "text",    sortOrder: 95 },
};

// ─── Jaggery product data with realistic INR pricing ────────────────────────
// Note: `sareeLengthCm` and `sareeCode` are legacy column names kept in the
// schema. `sareeCode` now carries the product SKU (e.g. "VKC-BLK-001-1KG") and
// `sareeLengthCm` (non-nullable) holds a nominal block/pack dimension in cm.
// Variant `colorName` carries the pack size; `colorHex`/`colorHex2` are the
// warm jaggery shades shown as swatches.

const JAGGERY_PRODUCTS = [
  // ── JAGGERY BLOCKS ──────────────────────────────────────────────────────────
  {
    name: "VKC Cane Gold Jaggery Block",
    slug: "vkc-cane-gold-jaggery-block",
    shortDesc: "Pure, chemical-free jaggery block made from fresh Mandya sugarcane. No sulphur, no added colour — just slow-simmered cane juice.",
    description: "Our signature jaggery block is made the traditional way: fresh sugarcane from our Mandya farms is crushed within hours of harvest and the juice is slow-simmered in open bhatti pans until it sets into rich golden blocks. No sulphur, no superphosphate, no bleaching agents, no added colour — the warm brown-gold shade comes purely from the cane itself. Use it in coffee, payasa, obbattu, or anywhere you would use sugar, for a deeper, mineral-rich sweetness.",
    regionOfOrigin: "Mandya, Karnataka",
    occasions: ["Daily Use", "Cooking", "Festive Sweets"],
    sareeLengthCm: 10, weightGm: 500, isFeatured: true,
    careInstructions: "Store in an airtight container in a cool, dry place away from direct sunlight. Keep away from moisture; use a dry spoon. Best consumed within 9 months of packing.",
    tags: ["jaggery", "block", "chemical-free", "mandya", "organic"],
    categorySlug: "jaggery-blocks",
    variants: [
      { colorName: "500 g", colorHex: "#A0692F", colorHex2: "#C68E4E", sareeCode: "VKC-BLK-001-500G", costPrice: 55,  salePrice: 95,  originalPrice: 120, stockQty: 40 },
      { colorName: "1 kg",  colorHex: "#8B5A2B", colorHex2: "#B8860B", sareeCode: "VKC-BLK-001-1KG",  costPrice: 100, salePrice: 180, originalPrice: 220, stockQty: 30 },
    ],
  },
  {
    name: "Premium Dark Bhatti Jaggery Block",
    slug: "premium-dark-bhatti-jaggery-block",
    shortDesc: "Deep caramel-dark jaggery from a longer bhatti simmer — intense flavour, ideal for traditional sweets and decoctions.",
    description: "Simmered longer over the wood-fired bhatti, this dark jaggery develops a deep caramel note and a firmer set that seasoned cooks prize for holige, ellu bella, kashaya, and filter-coffee decoctions. Made from single-origin Mandya sugarcane with zero chemicals at every step — no sulphur fumigation, no soda, no colour. Each block is hand-cut and sun-checked before packing.",
    regionOfOrigin: "Mandya, Karnataka",
    occasions: ["Cooking", "Festive Sweets", "Traditional Remedies"],
    sareeLengthCm: 10, weightGm: 500, isFeatured: true,
    careInstructions: "Store airtight in a cool, dry place. Dark jaggery may soften slightly in humid weather — this is natural and does not affect quality.",
    tags: ["jaggery", "block", "dark-jaggery", "bhatti", "chemical-free", "mandya"],
    categorySlug: "jaggery-blocks",
    variants: [
      { colorName: "500 g", colorHex: "#6B4423", colorHex2: "#8B5A2B", sareeCode: "VKC-BLK-002-500G", costPrice: 65,  salePrice: 110, originalPrice: 140, stockQty: 25 },
      { colorName: "1 kg",  colorHex: "#5C3A1E", colorHex2: "#7A4A1D", sareeCode: "VKC-BLK-002-1KG",  costPrice: 120, salePrice: 210, originalPrice: 260, stockQty: 18 },
    ],
  },

  // ── JAGGERY POWDER ──────────────────────────────────────────────────────────
  {
    name: "Organic Jaggery Powder",
    slug: "organic-jaggery-powder",
    shortDesc: "Free-flowing, naturally granulated jaggery powder — a spoon-for-spoon replacement for refined sugar.",
    description: "Our jaggery powder is made by granulating freshly set jaggery while it is still warm, then sieving it to a fine, free-flowing texture — nothing added, nothing bleached. It dissolves quickly in tea, coffee, milk, and batters, making it the easiest way to switch your kitchen from refined sugar to whole cane sweetness. Retains the iron, calcium, and minerals that refining strips away.",
    regionOfOrigin: "Mandya, Karnataka",
    occasions: ["Daily Use", "Tea & Coffee", "Baking"],
    sareeLengthCm: 8, weightGm: 500, isFeatured: true,
    careInstructions: "Keep tightly sealed after opening; jaggery powder absorbs moisture quickly. Use a dry spoon and store away from steam and sunlight.",
    tags: ["jaggery", "powder", "sugar-substitute", "organic", "chemical-free", "mandya"],
    categorySlug: "jaggery-powder",
    variants: [
      { colorName: "250 g", colorHex: "#C68E4E", colorHex2: "#D2A24C", sareeCode: "VKC-PWD-001-250G", costPrice: 40,  salePrice: 80,  originalPrice: 100, stockQty: 50 },
      { colorName: "500 g", colorHex: "#B8860B", colorHex2: "#C68E4E", sareeCode: "VKC-PWD-001-500G", costPrice: 70,  salePrice: 130, originalPrice: 160, stockQty: 35 },
      { colorName: "1 kg",  colorHex: "#A0692F", colorHex2: "#B8860B", sareeCode: "VKC-PWD-001-1KG",  costPrice: 130, salePrice: 240, originalPrice: 300, stockQty: 20 },
    ],
  },
  {
    name: "Dry Ginger Jaggery Powder (Sukku Bella)",
    slug: "dry-ginger-jaggery-powder",
    shortDesc: "Jaggery powder blended with stone-ground dry ginger — the traditional base for kashaya and winter drinks.",
    description: "A time-honoured Karnataka pantry staple: our chemical-free jaggery powder blended with stone-ground dry ginger (sukku). Stir a spoon into hot water or milk for an instant soothing kashaya, or use it in chukku kaapi during the monsoon. Made in small batches with nothing but our own bhatti jaggery and sun-dried ginger.",
    regionOfOrigin: "Mandya, Karnataka",
    occasions: ["Traditional Remedies", "Tea & Coffee", "Daily Use"],
    sareeLengthCm: 8, weightGm: 250, isFeatured: false,
    careInstructions: "Store airtight in a cool, dry place. The ginger aroma is strongest in the first three months — consume fresh for best flavour.",
    tags: ["jaggery", "powder", "dry-ginger", "kashaya", "chemical-free", "mandya"],
    categorySlug: "jaggery-powder",
    variants: [
      { colorName: "250 g", colorHex: "#9C6B30", colorHex2: "#C68E4E", sareeCode: "VKC-PWD-002-250G", costPrice: 55, salePrice: 110, originalPrice: 140, stockQty: 25 },
      { colorName: "500 g", colorHex: "#8B5A2B", colorHex2: "#A0692F", sareeCode: "VKC-PWD-002-500G", costPrice: 95, salePrice: 190, originalPrice: 240, stockQty: 15 },
    ],
  },

  // ── JAGGERY CUBES ───────────────────────────────────────────────────────────
  {
    name: "Jaggery Cubes — Bite Size",
    slug: "jaggery-cubes-bite-size",
    shortDesc: "Neat bite-size cubes of pure cane jaggery — portioned sweetness for the table and the tiffin box.",
    description: "The same slow-simmered Mandya jaggery, set in small moulds into uniform bite-size cubes. No breaking, no grating, no mess — drop one into your coffee, pack a few with the kids' tiffin, or serve them after meals the traditional way. Each cube is roughly 10 g of pure, chemical-free cane sweetness with no sulphur and no added colour.",
    regionOfOrigin: "Mandya, Karnataka",
    occasions: ["Daily Use", "Tea & Coffee", "Gifting"],
    sareeLengthCm: 3, weightGm: 250, isFeatured: true,
    careInstructions: "Store in an airtight jar in a cool, dry place. Cubes may develop a light natural bloom in humid weather; this is harmless.",
    tags: ["jaggery", "cubes", "portion-control", "chemical-free", "mandya", "organic"],
    categorySlug: "jaggery-cubes",
    variants: [
      { colorName: "250 g", colorHex: "#A0692F", colorHex2: "#D2A24C", sareeCode: "VKC-CUB-001-250G", costPrice: 45, salePrice: 90,  originalPrice: 110, stockQty: 40 },
      { colorName: "500 g", colorHex: "#8B5A2B", colorHex2: "#C68E4E", sareeCode: "VKC-CUB-001-500G", costPrice: 80, salePrice: 160, originalPrice: 200, stockQty: 25 },
    ],
  },
  {
    name: "Tea-Time Mini Jaggery Cubes",
    slug: "tea-time-mini-jaggery-cubes",
    shortDesc: "Extra-small 5 g cubes that dissolve fast in a single cup of tea or coffee — the honest swap for sugar cubes.",
    description: "Made for the daily chai ritual: extra-small 5 g cubes sized for a single cup, so one cube sweetens without guesswork. They dissolve noticeably faster than block jaggery and bring a warm caramel depth that refined sugar cubes cannot match. Slow-simmered from fresh Mandya cane juice with zero chemical processing.",
    regionOfOrigin: "Mandya, Karnataka",
    occasions: ["Tea & Coffee", "Daily Use"],
    sareeLengthCm: 2, weightGm: 250, isFeatured: false,
    careInstructions: "Keep the pack sealed between uses and store away from moisture. Transfer to a dry glass jar after opening for best shelf life.",
    tags: ["jaggery", "cubes", "tea", "coffee", "chemical-free", "mandya"],
    categorySlug: "jaggery-cubes",
    variants: [
      { colorName: "250 g", colorHex: "#B8860B", colorHex2: "#D2A24C", sareeCode: "VKC-CUB-002-250G", costPrice: 50, salePrice: 100, originalPrice: 125, stockQty: 30 },
      { colorName: "500 g", colorHex: "#A0692F", colorHex2: "#C68E4E", sareeCode: "VKC-CUB-002-500G", costPrice: 90, salePrice: 175, originalPrice: 220, stockQty: 20 },
    ],
  },

  // ── SPECIALTY JAGGERY ───────────────────────────────────────────────────────
  {
    name: "Palm Jaggery (Karupatti)",
    slug: "palm-jaggery-karupatti",
    shortDesc: "Traditional karupatti made from palmyra palm sap — dark, smoky, and naturally low on the glycemic index.",
    description: "Karupatti is tapped at dawn from palmyra palms and simmered the same day into dense, dark discs with a distinctive smoky-caramel flavour. Long treasured in South Indian households for paniyaram, karupatti coffee, and postpartum nutrition, palm jaggery is richer in iron and has a lower glycemic index than cane sugar. Ours is sourced from traditional tappers and processed with no chemicals whatsoever.",
    regionOfOrigin: "Karnataka & Tamil Nadu",
    occasions: ["Traditional Remedies", "Cooking", "Gifting"],
    sareeLengthCm: 6, weightGm: 250, isFeatured: true,
    careInstructions: "Store airtight; palm jaggery is more hygroscopic than cane jaggery and softens quickly if exposed to humid air. Refrigeration is fine in coastal climates.",
    tags: ["palm-jaggery", "karupatti", "jaggery", "low-gi", "chemical-free"],
    categorySlug: "specialty-jaggery",
    variants: [
      { colorName: "250 g", colorHex: "#5C3A1E", colorHex2: "#7A4A1D", sareeCode: "VKC-PLM-001-250G", costPrice: 140, salePrice: 280, originalPrice: 340, stockQty: 12 },
      { colorName: "500 g", colorHex: "#4E2F14", colorHex2: "#6B4423", sareeCode: "VKC-PLM-001-500G", costPrice: 250, salePrice: 495, originalPrice: 600, stockQty: 8  },
    ],
  },
  {
    name: "Coconut Jaggery",
    slug: "coconut-jaggery",
    shortDesc: "Golden coconut-blossom jaggery with a gentle butterscotch note — a chef's favourite for desserts.",
    description: "Made from the sweet sap of coconut blossoms, coconut jaggery has a lighter, butterscotch-like flavour that pastry chefs love in caramel, payasam, and baked desserts. It melts smoothly, never tastes harsh, and carries the same clean, chemical-free promise as everything we make — no sulphur, no bleaching, no additives, just fresh sap reduced slowly over a wood fire.",
    regionOfOrigin: "Coastal Karnataka",
    occasions: ["Baking", "Festive Sweets", "Gifting"],
    sareeLengthCm: 6, weightGm: 250, isFeatured: false,
    careInstructions: "Store in an airtight container away from heat and sunlight. Use a dry spoon; reseal promptly after each use.",
    tags: ["coconut-jaggery", "jaggery", "baking", "chemical-free", "organic"],
    categorySlug: "specialty-jaggery",
    variants: [
      { colorName: "250 g", colorHex: "#C68E4E", colorHex2: "#D2A24C", sareeCode: "VKC-CCO-001-250G", costPrice: 120, salePrice: 240, originalPrice: 290, stockQty: 12 },
      { colorName: "500 g", colorHex: "#B8860B", colorHex2: "#C68E4E", sareeCode: "VKC-CCO-001-500G", costPrice: 220, salePrice: 440, originalPrice: 520, stockQty: 10 },
    ],
  },
];

async function main() {
  console.log("🌱 Seeding database...\n");

  // ── Site settings ────────────────────────────────────────────────────────
  console.log("→ Seeding site_settings...");
  for (const [key, value] of Object.entries(DEFAULT_THEME)) {
    const meta = SETTING_META[key] ?? { label: key, group: "general", type: "text", sortOrder: 99 };
    await db.siteSetting.upsert({
      where: { key },
      update: { value, label: meta.label, group: meta.group, type: meta.type, sortOrder: meta.sortOrder },
      create: { key, value, label: meta.label, group: meta.group, type: meta.type, sortOrder: meta.sortOrder },
    });
  }
  console.log(`  ✓ ${Object.keys(DEFAULT_THEME).length} settings\n`);

  // ── Categories ───────────────────────────────────────────────────────────
  console.log("→ Seeding categories...");
  const categoryDefs = [
    { name: "Jaggery Blocks",    slug: "jaggery-blocks",    description: "Traditional slow-simmered jaggery blocks from fresh Mandya sugarcane — chemical-free, no sulphur", sortOrder: 1 },
    { name: "Jaggery Powder",    slug: "jaggery-powder",    description: "Free-flowing granulated jaggery powder — the everyday replacement for refined sugar", sortOrder: 2 },
    { name: "Jaggery Cubes",     slug: "jaggery-cubes",     description: "Portioned bite-size and tea-time cubes of pure cane jaggery", sortOrder: 3 },
    { name: "Specialty Jaggery", slug: "specialty-jaggery", description: "Palm (karupatti) and coconut-blossom jaggery from traditional tappers", sortOrder: 4 },
  ];

  const categoryMap: Record<string, string> = {};
  for (const cat of categoryDefs) {
    const c = await db.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, sortOrder: cat.sortOrder },
      create: { name: cat.name, slug: cat.slug, description: cat.description, sortOrder: cat.sortOrder, isActive: true },
    });
    categoryMap[cat.slug] = c.id;
  }
  console.log(`  ✓ ${categoryDefs.length} categories\n`);

  // ── Products ─────────────────────────────────────────────────────────────
  console.log("→ Seeding products and variants...");
  let productCount = 0;
  let variantCount = 0;

  for (const p of JAGGERY_PRODUCTS) {
    const { variants, categorySlug, ...productData } = p;
    const categoryId = categoryMap[categorySlug];

    const product = await db.product.upsert({
      where: { slug: productData.slug },
      update: { ...productData, categoryId },
      create: { ...productData, categoryId, isActive: true },
    });
    productCount++;

    // Delete existing variants to re-seed cleanly
    await db.productVariant.deleteMany({ where: { productId: product.id } });

    for (let i = 0; i < variants.length; i++) {
      const { colorName, colorHex, colorHex2, sareeCode, costPrice, salePrice, originalPrice, stockQty } = variants[i];
      await db.productVariant.create({
        data: {
          productId: product.id,
          colorName,
          colorHex,
          colorHex2: colorHex2 ?? null,
          sareeCode: sareeCode ?? null,
          costPrice,
          salePrice,
          originalPrice,
          stockQty,
          reservedQty: 0,
          sortOrder: i,
          isActive: true,
        },
      });
      variantCount++;
    }
  }
  console.log(`  ✓ ${productCount} products, ${variantCount} pack-size variants\n`);

  // ── Admin user ────────────────────────────────────────────────────────────
  console.log("→ Seeding admin user...");
  const bcryptMod = await import("bcryptjs");
  const bcrypt = bcryptMod.default ?? bcryptMod;
  await db.user.upsert({
    where: { email: "admin@vkcgoldikshu.com" },
    update: {},
    create: {
      email: "admin@vkcgoldikshu.com",
      firstName: "Admin",
      lastName: "User",
      passwordHash: await bcrypt.hash("admin@123", 12),
      role: "ADMIN",
      emailVerified: true,
    },
  });
  console.log("  ✓ admin@vkcgoldikshu.com / admin@123\n");

  // ── Demo customer ─────────────────────────────────────────────────────────
  console.log("→ Seeding demo customer...");
  await db.user.upsert({
    where: { email: "demo@vkcgoldikshu.com" },
    update: {},
    create: {
      email: "demo@vkcgoldikshu.com",
      firstName: "Priya",
      lastName: "Sharma",
      passwordHash: await bcrypt.hash("demo@123", 12),
      role: "CUSTOMER",
      emailVerified: true,
      phoneVerified: false,
    },
  });
  console.log("  ✓ demo@vkcgoldikshu.com / demo@123\n");

  // ── Sample coupons ────────────────────────────────────────────────────────
  console.log("→ Seeding coupons...");
  const coupons = [
    { code: "WELCOME10", type: "PERCENTAGE" as const, value: 10, minOrderAmount: 299, maxDiscount: 100 },
    { code: "VKC15",     type: "PERCENTAGE" as const, value: 15, minOrderAmount: 499, maxDiscount: 150 },
    { code: "SWEET20",   type: "PERCENTAGE" as const, value: 20, minOrderAmount: 999, maxDiscount: 250 },
    { code: "FREESHIP",  type: "FREE_SHIPPING" as const, value: 0, minOrderAmount: 499 },
    { code: "FLAT50",    type: "FIXED" as const, value: 50, minOrderAmount: 599 },
  ];
  for (const coupon of coupons) {
    await db.coupon.upsert({
      where: { code: coupon.code },
      update: {},
      create: { ...coupon, isActive: true },
    });
  }
  console.log(`  ✓ ${coupons.length} coupons (WELCOME10, VKC15, SWEET20, FREESHIP, FLAT50)\n`);

  console.log("✅ Database seeded successfully!");
  console.log("\n📊 Summary:");
  console.log(`   Products : ${productCount}`);
  console.log(`   Variants : ${variantCount}`);
  console.log(`   Coupons  : ${coupons.length}`);
  console.log(`   Settings : ${Object.keys(DEFAULT_THEME).length}`);
  console.log("\n🔑 Login credentials:");
  console.log("   Admin    : admin@vkcgoldikshu.com / admin@123");
  console.log("   Customer : demo@vkcgoldikshu.com  / demo@123");
}

main()
  .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(() => db.$disconnect());
