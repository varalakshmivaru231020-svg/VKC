/**
 * Seed three launch blog posts (published). Editable afterwards in Admin →
 * Content → Blogs; existing slugs are never overwritten. Cover images are taken
 * from the live catalogue so every picture is the brand's own.
 *
 *   node scripts/seed-blog-posts.cjs
 */
const fs = require("fs");
const path = require("path");

if (!process.env.DATABASE_URL) {
  const envPath = path.join(__dirname, "..", ".env");
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

const POSTS = [
  {
    slug: "from-cane-to-cube-how-mandya-jaggery-is-made",
    title: "From Cane to Cube: How Mandya Jaggery Is Made",
    excerpt: "Fresh cane, slow heat and nothing else. A walk through the four steps that turn Mandya sugarcane into golden, chemical-free jaggery.",
    tags: ["Process", "Mandya"],
    coverFrom: ["jaggery-combo-gift-box", "premium-jaggery-gift-box"],
    metaDesc: "How VKC Gold Ikshu makes chemical-free jaggery in Mandya: crushing, natural clarification, slow boiling and hygienic packing.",
    content: `
<p>Every block of our jaggery begins in a sugarcane field in Mandya, the heart of Karnataka's cane country. The soil, the water and the long sunny season here give cane a natural sweetness that needs very little help from us. Our job is simply not to spoil it.</p>
<h2>1. Crushing within hours of harvest</h2>
<p>Cane starts losing sugar and gaining bitterness the moment it is cut, so timing matters. We buy directly from farmers we know, and the cane is crushed within hours of harvest. The juice that flows out is cloudy, grassy and already sweet.</p>
<h2>2. Clarifying without chemicals</h2>
<p>Most commercial jaggery is brightened with bleaching agents and chemical clarifiers. Ours is not. We let the juice settle, skim the natural froth, and use only time and heat to clear it. This is why our jaggery has a deep amber colour rather than a pale yellow one — that colour is the cane, not a dye.</p>
<h2>3. Boiling slow, in small batches</h2>
<p>The clarified juice is boiled down slowly in open pans. Small batches let us watch the colour and aroma change and take the pan off at exactly the right moment. Rushing this step gives a harsh, burnt note; done patiently, it gives caramel, a hint of smoke and a clean finish.</p>
<h2>4. Setting, cutting and packing</h2>
<p>The thick syrup is poured into moulds, cooled and cut into blocks or powdered, then sealed in food-grade packaging the same day. No preservatives are added at any stage — jaggery keeps naturally when it is kept dry.</p>
<h2>Why this matters</h2>
<p>Jaggery made this way keeps the minerals that refining strips out, tastes of the cane it came from, and carries nothing you would not want in your kitchen. It also pays the farmer fairly, because we buy directly and process locally.</p>
<p><em>Store your jaggery in an airtight jar in a cool, dry place. If it softens in humid weather, that is the natural sugar drawing in moisture — it is still perfectly good.</em></p>
`.trim(),
  },
  {
    slug: "jaggery-vs-refined-sugar-what-actually-changes",
    title: "Jaggery vs Refined Sugar: What Actually Changes",
    excerpt: "Both come from cane. One keeps the minerals, the colour and the flavour; the other keeps only the sweetness. Here is the honest comparison.",
    tags: ["Health", "Guide"],
    coverFrom: ["dry-fruits-essence-jaggery-syrup", "jaggery-chocolate-pack"],
    metaDesc: "An honest comparison of jaggery and refined sugar: processing, minerals, taste, glycaemic response and how to use jaggery in everyday cooking.",
    content: `
<p>Jaggery and white sugar start life as the same sugarcane juice. The difference is what happens next — and what is left in the pack when it reaches you.</p>
<h2>How each is made</h2>
<p>Refined sugar is produced by crystallising cane juice and then stripping away everything that is not sucrose: the molasses, the minerals, the colour and the flavour. Jaggery skips that stripping. The whole juice is simply boiled down and set, so what remains is closer to the plant.</p>
<h2>What stays in jaggery</h2>
<ul>
  <li><strong>Minerals</strong> — iron, potassium, magnesium and calcium survive in small but real amounts. Refined sugar has none.</li>
  <li><strong>Molasses</strong> — the dark, fragrant part of the cane that gives jaggery its colour and caramel depth.</li>
  <li><strong>Flavour</strong> — notes of caramel, toffee and a little smoke, instead of plain sweetness.</li>
</ul>
<h2>What jaggery is not</h2>
<p>Jaggery is still a sugar, and it is still calorie-dense. It is a better-tasting, less processed sweetener — not a health food to be eaten freely. People managing blood sugar should treat it with the same care as any other sweetener and follow their doctor's advice.</p>
<h2>Using jaggery in everyday cooking</h2>
<ul>
  <li>Swap it one-for-one into tea, coffee and milk; grate a block or use powder.</li>
  <li>In baking, it adds moisture and a deeper colour — reduce liquid slightly.</li>
  <li>Melt it with a spoon of water for sauces, glazes and traditional sweets like payasam and holige.</li>
</ul>
<p>Our advice is simple: use less sweetener overall, and when you do, choose one that brings something to the table besides sweetness.</p>
`.trim(),
  },
  {
    slug: "festive-gifting-with-jaggery-a-thoughtful-alternative",
    title: "Festive Gifting with Jaggery: A Thoughtful Alternative to Sweets Boxes",
    excerpt: "Why a box of pure jaggery, laddus and nut bars says more than another tin of refined sweets — and how to choose the right hamper.",
    tags: ["Gifting", "Festivals"],
    coverFrom: ["premium-jaggery-gift-box", "festival-offer-combo", "children-combo-box"],
    metaDesc: "Choosing jaggery gift boxes and combos for Diwali, Sankranti and weddings: what to look for, how to store them, and why they travel well.",
    content: `
<p>Festivals in Karnataka have always been sweet, and for most of history that sweetness came from jaggery. A gift box built around it is a return to that tradition — and a kinder gift for the people who receive it.</p>
<h2>What goes into a good jaggery hamper</h2>
<ul>
  <li><strong>Pure jaggery cubes or powder</strong> — the base of every kitchen.</li>
  <li><strong>Laddus and bites</strong> — made with jaggery, nuts and seeds, no refined sugar.</li>
  <li><strong>Nut and puffed-rice bars</strong> — energy for busy festive days.</li>
  <li><strong>Jaggery syrup</strong> — for pancakes, dosas and desserts.</li>
</ul>
<h2>Why it travels well</h2>
<p>Jaggery keeps without refrigeration and without preservatives, as long as it stays dry. Our boxes are sealed item by item and cushioned, so a hamper sent across India arrives as it left Mandya.</p>
<h2>Choosing the right box</h2>
<p>For families, pick a combo with a mix of everyday jaggery and treats. For corporate gifting, choose uniform boxes with a card. For children, our combo boxes lean towards bars and bites. Every box can be ordered with a personal message.</p>
<h2>A gift with a story</h2>
<p>Each hamper carries a little of Mandya with it — cane from farmers we know, boiled slowly, packed by hand. That is a story worth giving.</p>
<p>Browse our <a href="/shop">gift boxes and combos</a>, or <a href="/contact">talk to us</a> about bulk and corporate orders.</p>
`.trim(),
  },
];

async function coverFor(slugs) {
  for (const slug of slugs) {
    const p = await db.product.findUnique({ where: { slug }, select: { variants: { select: { images: { select: { url: true, isPrimary: true } } } } } });
    const imgs = p?.variants?.flatMap((v) => v.images) ?? [];
    const hit = imgs.find((i) => i.isPrimary) ?? imgs[0];
    if (hit?.url) return hit.url;
  }
  return null;
}

(async () => {
  const base = new Date();
  for (const [i, post] of POSTS.entries()) {
    const existing = await db.blog.findUnique({ where: { slug: post.slug } });
    if (existing) { console.log(`${post.slug.slice(0, 40).padEnd(40)} kept`); continue; }
    const imageUrl = await coverFor(post.coverFrom);
    const publishedAt = new Date(base.getTime() - i * 3 * 24 * 60 * 60 * 1000); // staggered, newest first
    await db.blog.create({
      data: { slug: post.slug, title: post.title, excerpt: post.excerpt, content: post.content, imageUrl, tags: post.tags, isPublished: true, publishedAt, metaTitle: post.title, metaDesc: post.metaDesc },
    });
    console.log(`${post.slug.slice(0, 40).padEnd(40)} created${imageUrl ? "" : " (no cover image found)"}`);
  }
  await db.$disconnect();
})().catch(async (e) => { console.error(e); await db.$disconnect(); process.exit(1); });
