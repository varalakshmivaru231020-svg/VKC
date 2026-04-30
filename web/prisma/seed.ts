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

// ─── Saree product data with realistic INR pricing ─────────────────────────

const SAREE_PRODUCTS = [
  // ── KANJIVARAM ──────────────────────────────────────────────────────────────
  {
    name: "Royal Kanjivaram Pure Silk Saree",
    slug: "royal-kanjivaram-pure-silk-saree",
    shortDesc: "Handwoven pure silk from the heritage looms of Kanchipuram. Features traditional zari border with peacock motifs.",
    description: "This exquisite Kanjivaram silk saree is a timeless masterpiece from the looms of Kanchipuram, Tamil Nadu. Woven with pure mulberry silk and real zari (gold thread), every inch of this saree reflects the skill of master craftsmen. The rich contrast border with temple motifs and traditional peacock design make it a perfect choice for weddings and grand celebrations.",
    fabric: "Pure Silk", weaveType: "Kanjivaram", regionOfOrigin: "Tamil Nadu",
    occasions: ["Wedding", "Festival"], blousePiece: true, blouseLengthCm: 80,
    sareeLengthCm: 600, weightGm: 820, isFeatured: true,
    careInstructions: "Dry clean only. Store in a muslin cloth. Avoid contact with perfume and deodorant. Air dry in shade if wet.",
    tags: ["kanjivaram", "silk", "wedding", "zari", "handwoven"],
    categorySlug: "kanjivaram",
    variants: [
      { colorName: "Deep Crimson", colorHex: "#8B1A2E", sareeCode: "VL-KNJ-001-DC", costPrice: 9500, salePrice: 22500, originalPrice: 26000, stockQty: 4 },
      { colorName: "Royal Blue",  colorHex: "#1B3A6B", sareeCode: "VL-KNJ-001-RB", costPrice: 9800, salePrice: 24000, originalPrice: 28000, stockQty: 3 },
      { colorName: "Forest Green", colorHex: "#1B5E20", sareeCode: "VL-KNJ-001-FG", costPrice: 9500, salePrice: 22500, originalPrice: 26000, stockQty: 2 },
      { colorName: "Kanchi Gold",  colorHex: "#B8860B", sareeCode: "VL-KNJ-001-KG", costPrice: 10200, salePrice: 26000, originalPrice: 30000, stockQty: 5 },
    ],
  },
  {
    name: "Kanjivaram Soft Silk Saree with Temple Border",
    slug: "kanjivaram-soft-silk-temple-border",
    shortDesc: "Lightweight Kanjivaram silk with classic temple border, ideal for daily festive wear.",
    description: "A softer, lighter variant of the classic Kanjivaram, this saree is perfect for those who love the look but prefer easier draping. The intricate temple border and contrast pallu make this an elegant choice for festivals and family occasions.",
    fabric: "Soft Silk", weaveType: "Kanjivaram", regionOfOrigin: "Tamil Nadu",
    occasions: ["Festival", "Party"], blousePiece: true, blouseLengthCm: 75,
    sareeLengthCm: 560, weightGm: 620, isFeatured: true,
    tags: ["kanjivaram", "soft-silk", "festival", "temple-border"],
    categorySlug: "kanjivaram",
    variants: [
      { colorName: "Peacock Teal",  colorHex: "#008B8B", sareeCode: "VL-KNJ-002-PT", costPrice: 6200, salePrice: 14500, originalPrice: 17000, stockQty: 6 },
      { colorName: "Lotus Pink",    colorHex: "#C2185B", sareeCode: "VL-KNJ-002-LP", costPrice: 6000, salePrice: 14000, originalPrice: 17000, stockQty: 4 },
      { colorName: "Mango Yellow",  colorHex: "#F9A825", sareeCode: "VL-KNJ-002-MY", costPrice: 6200, salePrice: 14500, originalPrice: 17000, stockQty: 3 },
    ],
  },
  {
    name: "Bridal Kanjivaram with Korvai Border",
    slug: "bridal-kanjivaram-korvai-border",
    shortDesc: "A bridal masterpiece with authentic korvai (joined weave) border. Each saree takes 8–10 days to weave.",
    description: "The korvai technique is the pinnacle of Kanjivaram weaving, where the border and body are woven separately then joined on the loom — creating an indestructible, perfectly integrated border. This bridal saree features heavy zari work, traditional peacock and lotus motifs, and a dramatic contrast pallu.",
    fabric: "Pure Silk", weaveType: "Kanjivaram Korvai", regionOfOrigin: "Tamil Nadu",
    occasions: ["Wedding"], blousePiece: true, blouseLengthCm: 90,
    sareeLengthCm: 620, weightGm: 980, isFeatured: false,
    tags: ["kanjivaram", "bridal", "korvai", "wedding", "heavy-zari"],
    categorySlug: "kanjivaram",
    variants: [
      { colorName: "Bridal Red",    colorHex: "#B71C1C", sareeCode: "VL-KNJ-003-BR", costPrice: 18000, salePrice: 42000, originalPrice: 48000, stockQty: 2 },
      { colorName: "Maroon Gold",   colorHex: "#7B1FA2", colorHex2: "#B8860B", sareeCode: "VL-KNJ-003-MG", costPrice: 19000, salePrice: 45000, originalPrice: 52000, stockQty: 1 },
    ],
  },

  // ── BANARASI ────────────────────────────────────────────────────────────────
  {
    name: "Banarasi Pure Silk Brocade Saree",
    slug: "banarasi-pure-silk-brocade-saree",
    shortDesc: "Opulent Banarasi silk with intricate Meenakari brocade work. A celebration in every thread.",
    description: "Woven on the banks of the holy Ganga, this Banarasi silk saree is a testament to centuries of weaving tradition. The Meenakari brocade work uses coloured silk threads alongside gold and silver zari to create jewel-like patterns. The heavy pallu with floral jaal makes this the perfect wedding or festive saree.",
    fabric: "Pure Silk", weaveType: "Banarasi", regionOfOrigin: "Uttar Pradesh",
    occasions: ["Wedding", "Festival"], blousePiece: true, blouseLengthCm: 80,
    sareeLengthCm: 560, weightGm: 720, isFeatured: true,
    tags: ["banarasi", "silk", "brocade", "meenakari", "wedding"],
    categorySlug: "banarasi",
    variants: [
      { colorName: "Midnight Blue",  colorHex: "#1A237E", sareeCode: "VL-BNR-001-MB", costPrice: 8500, salePrice: 19500, originalPrice: 23000, stockQty: 5 },
      { colorName: "Ruby Red",       colorHex: "#C62828", sareeCode: "VL-BNR-001-RR", costPrice: 8500, salePrice: 19500, originalPrice: 23000, stockQty: 4 },
      { colorName: "Emerald Green",  colorHex: "#1B5E20", sareeCode: "VL-BNR-001-EG", costPrice: 8800, salePrice: 20500, originalPrice: 24000, stockQty: 3 },
      { colorName: "Antique Gold",   colorHex: "#B8860B", sareeCode: "VL-BNR-001-AG", costPrice: 9200, salePrice: 21500, originalPrice: 25000, stockQty: 6 },
    ],
  },
  {
    name: "Banarasi Georgette Saree with Zari Work",
    slug: "banarasi-georgette-zari-work",
    shortDesc: "Lightweight Banarasi georgette with delicate zari jaal — the modern bride's choice.",
    description: "This Banarasi georgette saree combines the grandeur of traditional zari work with the comfort and drapeability of georgette fabric. The all-over jaal pattern with a heavy zari border and pallu makes it a favourite for cocktail parties, sangeet ceremonies, and receptions.",
    fabric: "Georgette", weaveType: "Banarasi", regionOfOrigin: "Uttar Pradesh",
    occasions: ["Party", "Festival", "Wedding"], blousePiece: false,
    sareeLengthCm: 560, weightGm: 420, isFeatured: true,
    tags: ["banarasi", "georgette", "zari", "party", "lightweight"],
    categorySlug: "banarasi",
    variants: [
      { colorName: "Rose Gold",     colorHex: "#C9867A", sareeCode: "VL-BNR-002-RG", costPrice: 4200, salePrice: 9800, originalPrice: 12000, stockQty: 8 },
      { colorName: "Dusty Lavender", colorHex: "#9575CD", sareeCode: "VL-BNR-002-DL", costPrice: 4000, salePrice: 9500, originalPrice: 12000, stockQty: 6 },
      { colorName: "Teal Green",    colorHex: "#00695C", sareeCode: "VL-BNR-002-TG", costPrice: 4200, salePrice: 9800, originalPrice: 12000, stockQty: 5 },
      { colorName: "Ivory White",   colorHex: "#F5F0E8", sareeCode: "VL-BNR-002-IW", costPrice: 4500, salePrice: 10500, originalPrice: 13000, stockQty: 4 },
    ],
  },

  // ── PATOLA ──────────────────────────────────────────────────────────────────
  {
    name: "Patan Patola Double Ikat Silk Saree",
    slug: "patan-patola-double-ikat-silk-saree",
    shortDesc: "Authentic double ikat handwoven Patola from Patan, Gujarat. One of India's most precious textile traditions.",
    description: "The Patan Patola is a UNESCO-recognised intangible cultural heritage. Created using the double ikat technique, both warp and weft threads are tie-dyed before weaving — requiring extraordinary precision. A single saree can take 4–6 months to weave. Each piece is an heirloom that appreciates in value.",
    fabric: "Pure Silk", weaveType: "Patola Double Ikat", regionOfOrigin: "Gujarat",
    occasions: ["Wedding", "Festival"], blousePiece: true, blouseLengthCm: 80,
    sareeLengthCm: 560, weightGm: 680, isFeatured: true,
    tags: ["patola", "ikat", "gujarat", "heritage", "heirloom"],
    categorySlug: "patola",
    variants: [
      { colorName: "Traditional Red-Black", colorHex: "#8B1A2E", colorHex2: "#1C1410", sareeCode: "VL-PTL-001-RB", costPrice: 28000, salePrice: 65000, originalPrice: 75000, stockQty: 2 },
      { colorName: "Green-Gold",            colorHex: "#2E7D32", colorHex2: "#B8860B", sareeCode: "VL-PTL-001-GG", costPrice: 30000, salePrice: 68000, originalPrice: 78000, stockQty: 1 },
    ],
  },
  {
    name: "Single Ikat Rajkot Patola Saree",
    slug: "single-ikat-rajkot-patola-saree",
    shortDesc: "Single ikat Patola from Rajkot — vibrant geometric patterns at an accessible price point.",
    description: "The Rajkot Patola uses the single ikat technique (only warp threads dyed) making it more accessible than Patan Patola while retaining the distinctive geometric patterns and vibrant colours that make Patola instantly recognisable.",
    fabric: "Art Silk", weaveType: "Patola Single Ikat", regionOfOrigin: "Gujarat",
    occasions: ["Festival", "Party"], blousePiece: false,
    sareeLengthCm: 560, weightGm: 480, isFeatured: false,
    tags: ["patola", "rajkot", "ikat", "geometric"],
    categorySlug: "patola",
    variants: [
      { colorName: "Turquoise & Red",  colorHex: "#00ACC1", colorHex2: "#C62828", sareeCode: "VL-PTL-002-TR", costPrice: 2800, salePrice: 6500, originalPrice: 8000, stockQty: 10 },
      { colorName: "Purple & Gold",    colorHex: "#7B1FA2", colorHex2: "#F9A825", sareeCode: "VL-PTL-002-PG", costPrice: 2800, salePrice: 6500, originalPrice: 8000, stockQty: 8 },
      { colorName: "Navy & Orange",    colorHex: "#1A237E", colorHex2: "#E65100", sareeCode: "VL-PTL-002-NO", costPrice: 2800, salePrice: 6500, originalPrice: 8000, stockQty: 7 },
    ],
  },

  // ── CHANDERI ────────────────────────────────────────────────────────────────
  {
    name: "Chanderi Katan Silk Saree",
    slug: "chanderi-katan-silk-saree",
    shortDesc: "Sheer, lightweight Chanderi Katan silk with silver zari bootis — the quintessential summer silk.",
    description: "Chanderi Katan silk is known for its sheer texture, lightweight feel, and natural sheen. Woven in the town of Chanderi, Madhya Pradesh, these sarees feature delicate zari bootis (small motifs) and a classic border. The translucent quality gives it an ethereal look, perfect for daytime occasions.",
    fabric: "Katan Silk", weaveType: "Chanderi", regionOfOrigin: "Madhya Pradesh",
    occasions: ["Festival", "Party", "Office"], blousePiece: false,
    sareeLengthCm: 560, weightGm: 280, isFeatured: true,
    tags: ["chanderi", "katan-silk", "lightweight", "sheer"],
    categorySlug: "chanderi",
    variants: [
      { colorName: "Mint Green",   colorHex: "#A5D6A7", sareeCode: "VL-CND-001-MG", costPrice: 2200, salePrice: 5200, originalPrice: 6500, stockQty: 12 },
      { colorName: "Pale Peach",   colorHex: "#FFCCBC", sareeCode: "VL-CND-001-PP", costPrice: 2200, salePrice: 5200, originalPrice: 6500, stockQty: 10 },
      { colorName: "Sky Blue",     colorHex: "#90CAF9", sareeCode: "VL-CND-001-SB", costPrice: 2200, salePrice: 5200, originalPrice: 6500, stockQty: 8 },
      { colorName: "Ivory White",  colorHex: "#FFF8F0", sareeCode: "VL-CND-001-IW", costPrice: 2400, salePrice: 5800, originalPrice: 7200, stockQty: 6 },
    ],
  },
  {
    name: "Chanderi Cotton Silk Saree with Zari Border",
    slug: "chanderi-cotton-silk-zari-border",
    shortDesc: "Comfortable cotton-silk blend Chanderi with gold zari border. Perfect for daily festive wear.",
    description: "This Chanderi cotton-silk blend offers the best of both worlds — the breathability of cotton and the lustre of silk. The fine zari border adds elegance without the heaviness. Ideal for office wear, casual outings, and everyday festivities.",
    fabric: "Cotton Silk", weaveType: "Chanderi", regionOfOrigin: "Madhya Pradesh",
    occasions: ["Office", "Daily", "Festival"], blousePiece: false,
    sareeLengthCm: 560, weightGm: 320, isFeatured: false,
    tags: ["chanderi", "cotton-silk", "daily", "office"],
    categorySlug: "chanderi",
    variants: [
      { colorName: "Coral Orange",  colorHex: "#FF7043", sareeCode: "VL-CND-002-CO", costPrice: 1500, salePrice: 3500, originalPrice: 4500, stockQty: 15 },
      { colorName: "Slate Blue",    colorHex: "#5C6BC0", sareeCode: "VL-CND-002-SB", costPrice: 1500, salePrice: 3500, originalPrice: 4500, stockQty: 12 },
      { colorName: "Sage Green",    colorHex: "#7CB342", sareeCode: "VL-CND-002-SG", costPrice: 1500, salePrice: 3500, originalPrice: 4500, stockQty: 10 },
      { colorName: "Dusty Rose",    colorHex: "#E07B7B", sareeCode: "VL-CND-002-DR", costPrice: 1500, salePrice: 3500, originalPrice: 4500, stockQty: 8 },
    ],
  },

  // ── TUSSAR SILK ─────────────────────────────────────────────────────────────
  {
    name: "Pure Tussar Silk Saree with Hand Block Print",
    slug: "pure-tussar-silk-hand-block-print",
    shortDesc: "Natural golden tussar silk with traditional hand block prints in vegetable dyes.",
    description: "Tussar silk (also called Kosa or Wild Silk) is produced from silkworms found in the forests of Jharkhand and Bihar. Its characteristic golden hue and slightly textured surface give it a unique, earthy elegance. This saree features traditional hand block prints using natural vegetable dyes.",
    fabric: "Tussar Silk", weaveType: "Hand Block Printed", regionOfOrigin: "Jharkhand",
    occasions: ["Festival", "Party", "Daily"], blousePiece: false,
    sareeLengthCm: 560, weightGm: 460, isFeatured: true,
    tags: ["tussar", "silk", "block-print", "natural-dye", "eco-friendly"],
    categorySlug: "tussar-silk",
    variants: [
      { colorName: "Natural Beige",   colorHex: "#D4B896", sareeCode: "VL-TSR-001-NB", costPrice: 2800, salePrice: 6800, originalPrice: 8500, stockQty: 10 },
      { colorName: "Indigo Blue",     colorHex: "#283593", sareeCode: "VL-TSR-001-IB", costPrice: 3000, salePrice: 7200, originalPrice: 9000, stockQty: 8 },
      { colorName: "Brick Red",       colorHex: "#BF360C", sareeCode: "VL-TSR-001-BR", costPrice: 2900, salePrice: 7000, originalPrice: 8800, stockQty: 6 },
    ],
  },
  {
    name: "Bhagalpuri Tussar Silk Saree",
    slug: "bhagalpuri-tussar-silk-saree",
    shortDesc: "Famous Bhagalpuri silk with characteristic nub texture and natural lustre.",
    description: "Bhagalpuri silk from Bihar is renowned for its distinctive nub texture created by the natural slubs in wild silk yarn. This saree showcases the natural beauty of the fibre with minimal adornment — the texture itself is the design. Available in rich, saturated colours that are unique to this weaving tradition.",
    fabric: "Bhagalpuri Silk", weaveType: "Bhagalpuri", regionOfOrigin: "Bihar",
    occasions: ["Festival", "Party", "Office"], blousePiece: false,
    sareeLengthCm: 560, weightGm: 520, isFeatured: false,
    tags: ["bhagalpuri", "tussar", "silk", "bihar"],
    categorySlug: "tussar-silk",
    variants: [
      { colorName: "Wine Red",      colorHex: "#880E4F", costPrice: 2000, salePrice: 4800, originalPrice: 6000, stockQty: 14 },
      { colorName: "Bottle Green",  colorHex: "#1B5E20", costPrice: 2000, salePrice: 4800, originalPrice: 6000, stockQty: 12 },
      { colorName: "Steel Blue",    colorHex: "#1565C0", costPrice: 2000, salePrice: 4800, originalPrice: 6000, stockQty: 10 },
    ],
  },

  // ── COTTON ──────────────────────────────────────────────────────────────────
  {
    name: "Handloom Cotton Saree — Bengal Tant",
    slug: "handloom-cotton-bengal-tant-saree",
    shortDesc: "Authentic Bengal Tant handloom cotton — light, breathable, and quintessentially Bengali.",
    description: "The Bengal Tant saree is a GI-tagged handloom textile from West Bengal. Known for its fine count cotton, crisp texture, and distinctive colour combinations with bold borders and intricate patterns. Lightweight and breathable, it is the staple saree for everyday elegance in Bengali culture.",
    fabric: "Cotton", weaveType: "Bengal Tant Handloom", regionOfOrigin: "West Bengal",
    occasions: ["Daily", "Festival", "Office"], blousePiece: false,
    sareeLengthCm: 560, weightGm: 260, isFeatured: false,
    tags: ["cotton", "tant", "bengal", "handloom", "daily-wear"],
    categorySlug: "cotton",
    variants: [
      { colorName: "Classic White-Red", colorHex: "#FAFAFA", colorHex2: "#C62828", costPrice: 550, salePrice: 1400, originalPrice: 1800, stockQty: 25 },
      { colorName: "Mustard-Green",     colorHex: "#F9A825", colorHex2: "#2E7D32", costPrice: 550, salePrice: 1400, originalPrice: 1800, stockQty: 20 },
      { colorName: "Blue-White",        colorHex: "#1565C0", colorHex2: "#FAFAFA", costPrice: 550, salePrice: 1400, originalPrice: 1800, stockQty: 18 },
      { colorName: "Magenta-Black",     colorHex: "#AD1457", colorHex2: "#1C1410", costPrice: 580, salePrice: 1500, originalPrice: 1900, stockQty: 15 },
    ],
  },
  {
    name: "Sambalpuri Ikat Cotton Saree",
    slug: "sambalpuri-ikat-cotton-saree",
    shortDesc: "GI-tagged Sambalpuri saree with traditional pasapalli and shankha-chakra ikat motifs.",
    description: "The Sambalpuri saree from Odisha is a GI-tagged handloom textile known for its distinctive tie-dye (ikat) technique. The traditional motifs include the pasapalli (chessboard), shankha (conch), chakra (wheel), and phula (flower) — each carrying cultural significance. Woven on pit looms by artisans who have inherited the craft.",
    fabric: "Cotton", weaveType: "Sambalpuri Ikat", regionOfOrigin: "Odisha",
    occasions: ["Festival", "Daily", "Office"], blousePiece: false,
    sareeLengthCm: 560, weightGm: 380, isFeatured: true,
    tags: ["sambalpuri", "ikat", "odisha", "handloom", "cotton"],
    categorySlug: "cotton",
    variants: [
      { colorName: "Red-Black Pasapalli", colorHex: "#B71C1C", colorHex2: "#212121", sareeCode: "VL-COT-002-RB", costPrice: 1800, salePrice: 4200, originalPrice: 5500, stockQty: 10 },
      { colorName: "Blue-White Chakra",   colorHex: "#283593", colorHex2: "#FAFAFA", sareeCode: "VL-COT-002-BW", costPrice: 1800, salePrice: 4200, originalPrice: 5500, stockQty: 8  },
      { colorName: "Green-Gold Phula",    colorHex: "#2E7D32", colorHex2: "#F9A825", sareeCode: "VL-COT-002-GG", costPrice: 1900, salePrice: 4500, originalPrice: 5800, stockQty: 7  },
    ],
  },

  // ── MYSORE SILK ─────────────────────────────────────────────────────────────
  {
    name: "Mysore Pure Silk Saree — Karnataka Silk Industries",
    slug: "mysore-pure-silk-saree",
    shortDesc: "Buttery soft Mysore silk with characteristic plain body and rich pallu. GI-certified.",
    description: "Mysore Silk is produced exclusively by the Karnataka Silk Industries Corporation (KSIC) under strict quality control. Made from two-ply pure mulberry silk, it is known for its softness, lustre, and the characteristic plain (kaddi) body with a contrast pallu. The GI tag guarantees authenticity.",
    fabric: "Pure Silk", weaveType: "Mysore Silk", regionOfOrigin: "Karnataka",
    occasions: ["Wedding", "Festival", "Party"], blousePiece: true, blouseLengthCm: 75,
    sareeLengthCm: 560, weightGm: 540, isFeatured: true,
    tags: ["mysore", "silk", "karnataka", "gi-tagged", "pure-silk"],
    categorySlug: "mysore-silk",
    variants: [
      { colorName: "Royal Purple",   colorHex: "#6A1B9A", sareeCode: "VL-MYS-001-RP", costPrice: 5200, salePrice: 12500, originalPrice: 15000, stockQty: 6 },
      { colorName: "Peacock Blue",   colorHex: "#006064", sareeCode: "VL-MYS-001-PB", costPrice: 5200, salePrice: 12500, originalPrice: 15000, stockQty: 5 },
      { colorName: "Sandalwood",     colorHex: "#D4A96A", sareeCode: "VL-MYS-001-SW", costPrice: 5500, salePrice: 13000, originalPrice: 15500, stockQty: 4 },
      { colorName: "Deep Magenta",   colorHex: "#880E4F", sareeCode: "VL-MYS-001-DM", costPrice: 5200, salePrice: 12500, originalPrice: 15000, stockQty: 7 },
    ],
  },
  {
    name: "Mysore Crepe Silk Saree",
    slug: "mysore-crepe-silk-saree",
    shortDesc: "Lightweight Mysore crepe silk with a matte finish — ideal for corporate and formal wear.",
    description: "Mysore crepe silk has a distinctive crinkled texture and matte finish that sets it apart from regular Mysore silk. The crepe weave makes it more fluid and drape-friendly. Available in solid colours with a subtle sheen, it is the preferred choice for professional settings and formal gatherings.",
    fabric: "Crepe Silk", weaveType: "Mysore Crepe", regionOfOrigin: "Karnataka",
    occasions: ["Office", "Party", "Festival"], blousePiece: false,
    sareeLengthCm: 560, weightGm: 380, isFeatured: false,
    tags: ["mysore", "crepe-silk", "office", "formal"],
    categorySlug: "mysore-silk",
    variants: [
      { colorName: "Charcoal Grey",  colorHex: "#455A64", costPrice: 2800, salePrice: 6800, originalPrice: 6800, stockQty: 12 },
      { colorName: "Burgundy",       colorHex: "#6D1B1B", costPrice: 2800, salePrice: 6800, originalPrice: 6800, stockQty: 10 },
      { colorName: "Olive Green",    colorHex: "#558B2F", costPrice: 2800, salePrice: 6800, originalPrice: 6800, stockQty: 8  },
    ],
  },

  // ── SAMBALPURI ──────────────────────────────────────────────────────────────
  {
    name: "Sambalpuri Silk Saree with Bomkai Work",
    slug: "sambalpuri-silk-bomkai-work",
    shortDesc: "Premium Sambalpuri silk with traditional Bomkai embroidery on pallu and border.",
    description: "This Sambalpuri silk saree combines the ikat dyeing technique with the intricate Bomkai embroidery on the pallu. The Bomkai work features geometric and tribal motifs traditionally worn by the women of Odisha for auspicious occasions. A true collector's piece.",
    fabric: "Silk", weaveType: "Sambalpuri Bomkai", regionOfOrigin: "Odisha",
    occasions: ["Wedding", "Festival"], blousePiece: true, blouseLengthCm: 75,
    sareeLengthCm: 560, weightGm: 620, isFeatured: false,
    tags: ["sambalpuri", "silk", "bomkai", "odisha", "ikat"],
    categorySlug: "sambalpuri",
    variants: [
      { colorName: "Vermillion-Black",  colorHex: "#D84315", colorHex2: "#212121", sareeCode: "VL-SMB-001-VB", costPrice: 4500, salePrice: 10500, originalPrice: 13000, stockQty: 5 },
      { colorName: "Indigo-Beige",      colorHex: "#283593", colorHex2: "#D4B896", sareeCode: "VL-SMB-001-IB", costPrice: 4500, salePrice: 10500, originalPrice: 13000, stockQty: 4 },
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
    { name: "Kanjivaram Sarees",  slug: "kanjivaram",   description: "Pure silk sarees from the heritage looms of Kanchipuram, Tamil Nadu", sortOrder: 1 },
    { name: "Banarasi Sarees",    slug: "banarasi",     description: "Opulent silk and brocade weaves from Varanasi, Uttar Pradesh", sortOrder: 2 },
    { name: "Patola Sarees",      slug: "patola",       description: "Double and single ikat silk masterpieces from Gujarat", sortOrder: 3 },
    { name: "Chanderi Sarees",    slug: "chanderi",     description: "Sheer, lightweight silk and cotton blends from Madhya Pradesh", sortOrder: 4 },
    { name: "Tussar Silk Sarees", slug: "tussar-silk",  description: "Natural wild silk with earthy texture from Jharkhand & Bihar", sortOrder: 5 },
    { name: "Cotton Sarees",      slug: "cotton",       description: "Handloom cotton sarees from Bengal, Odisha, and across India", sortOrder: 6 },
    { name: "Mysore Silk",        slug: "mysore-silk",  description: "GI-certified buttery soft silk from Karnataka Silk Industries", sortOrder: 7 },
    { name: "Sambalpuri Sarees",  slug: "sambalpuri",   description: "GI-tagged ikat weave sarees from Odisha", sortOrder: 8 },
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

  for (const p of SAREE_PRODUCTS) {
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
  console.log(`  ✓ ${productCount} products, ${variantCount} colour variants\n`);

  // ── Admin user ────────────────────────────────────────────────────────────
  console.log("→ Seeding admin user...");
  const bcryptMod = await import("bcryptjs");
  const bcrypt = bcryptMod.default ?? bcryptMod;
  await db.user.upsert({
    where: { email: "admin@vijaylakshmi.in" },
    update: {},
    create: {
      email: "admin@vijaylakshmi.in",
      firstName: "Admin",
      lastName: "User",
      passwordHash: await bcrypt.hash("admin@123", 12),
      role: "ADMIN",
      emailVerified: true,
    },
  });
  console.log("  ✓ admin@vijaylakshmi.in / admin@123\n");

  // ── Demo customer ─────────────────────────────────────────────────────────
  console.log("→ Seeding demo customer...");
  await db.user.upsert({
    where: { email: "demo@vijaylakshmi.in" },
    update: {},
    create: {
      email: "demo@vijaylakshmi.in",
      firstName: "Priya",
      lastName: "Sharma",
      passwordHash: await bcrypt.hash("demo@123", 12),
      role: "CUSTOMER",
      emailVerified: true,
      phoneVerified: false,
    },
  });
  console.log("  ✓ demo@vijaylakshmi.in / demo@123\n");

  // ── Sample coupons ────────────────────────────────────────────────────────
  console.log("→ Seeding coupons...");
  const coupons = [
    { code: "WELCOME10", type: "PERCENTAGE" as const, value: 10, minOrderAmount: 1999, maxDiscount: 2000 },
    { code: "VL20",      type: "PERCENTAGE" as const, value: 20, minOrderAmount: 9999, maxDiscount: 5000 },
    { code: "SILK15",    type: "PERCENTAGE" as const, value: 15, minOrderAmount: 4999, maxDiscount: 3000 },
    { code: "FREESHIP",  type: "FREE_SHIPPING" as const, value: 0, minOrderAmount: 999 },
    { code: "FLAT500",   type: "FIXED" as const, value: 500, minOrderAmount: 4999 },
  ];
  for (const coupon of coupons) {
    await db.coupon.upsert({
      where: { code: coupon.code },
      update: {},
      create: { ...coupon, isActive: true },
    });
  }
  console.log(`  ✓ ${coupons.length} coupons (WELCOME10, VL20, SILK15, FREESHIP, FLAT500)\n`);

  console.log("✅ Database seeded successfully!");
  console.log("\n📊 Summary:");
  console.log(`   Products : ${productCount}`);
  console.log(`   Variants : ${variantCount}`);
  console.log(`   Coupons  : ${coupons.length}`);
  console.log(`   Settings : ${Object.keys(DEFAULT_THEME).length}`);
  console.log("\n🔑 Login credentials:");
  console.log("   Admin    : admin@vijaylakshmi.in / admin@123");
  console.log("   Customer : demo@vijaylakshmi.in  / demo@123");
}

main()
  .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(() => db.$disconnect());
