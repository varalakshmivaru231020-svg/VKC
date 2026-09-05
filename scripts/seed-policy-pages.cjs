/**
 * Seed the Shipping Policy and Return & Exchange CMS pages (slugs /shipping and
 * /returns, matching the footer links) and refresh the footer Help links.
 * Idempotent; pages already edited in Admin → CMS Pages are left alone.
 *
 *   node scripts/seed-policy-pages.cjs
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
const SEED_MARK = "seeded-by-script";

const PAGES = [
  {
    slug: "shipping",
    title: "Shipping Policy",
    metaDesc: "How VKC Gold Ikshu ships jaggery and cane products across India: free delivery, dispatch times, tracking and damaged-parcel handling.",
    content: `
<p>We ship our jaggery and cane products to every serviceable pincode in India. Every order is packed in food-grade, tamper-evident packaging and dispatched from Mandya, Karnataka.</p>
<h2>Shipping charges</h2>
<ul>
  <li><strong>Free shipping all over India</strong> on every order — no minimum order value.</li>
</ul>
<h2>Dispatch and delivery times</h2>
<ul>
  <li>Orders are dispatched within <strong>1–2 business days</strong> of payment confirmation.</li>
  <li>Metro cities: typically <strong>3–5 business days</strong> after dispatch.</li>
  <li>Other cities and towns: typically <strong>5–8 business days</strong> after dispatch.</li>
  <li>Remote or rural pincodes may take a few days longer depending on the courier network.</li>
</ul>
<p>Business days exclude Sundays and public holidays. Festival seasons and weather disruptions can extend these estimates.</p>
<h2>Order tracking</h2>
<p>As soon as your order is dispatched you receive the courier name and tracking number by email and SMS. You can also track every order from <a href="/account/orders">My Orders</a>.</p>
<h2>Packaging</h2>
<p>Jaggery is a natural product and is sensitive to heat and moisture. We seal every product, cushion it, and box it to arrive intact. Please store it in a cool, dry place after opening.</p>
<h2>Damaged, leaking or missing items</h2>
<p>If a parcel arrives damaged, leaking, or with an item missing, please contact us within <strong>48 hours of delivery</strong> with your order number and photographs of the package and contents. We will arrange a replacement or refund as set out in our <a href="/returns">Return &amp; Exchange</a> policy.</p>
<h2>Incorrect address or failed delivery</h2>
<p>Please make sure your address and phone number are complete and correct at checkout. If a courier cannot deliver after repeated attempts because of an incorrect address or an unreachable phone number, the parcel is returned to us and we will contact you to arrange re-delivery.</p>
<h2>Questions</h2>
<p>Write to us through the <a href="/contact">Contact</a> page or on WhatsApp — we are happy to help.</p>
`.trim(),
  },
  {
    slug: "returns",
    title: "Return & Exchange Policy",
    metaDesc: "VKC Gold Ikshu return and exchange policy for jaggery and cane products: 7-day window, eligibility, replacements and refunds.",
    content: `
<p>We want every order to arrive exactly as it should. Because jaggery and cane products are food items, returns follow a few simple rules that keep our products safe for everyone.</p>
<h2>Return window</h2>
<p>You may raise a return or exchange request within <strong>7 days of delivery</strong>.</p>
<h2>What is eligible</h2>
<ul>
  <li>Items that arrived <strong>damaged, leaking or broken</strong> in transit.</li>
  <li><strong>Wrong item</strong> or wrong variant delivered.</li>
  <li>Items past their <strong>best-before date</strong> on delivery.</li>
  <li>Items that are <strong>unopened and sealed</strong>, in their original packaging.</li>
</ul>
<h2>What is not eligible</h2>
<ul>
  <li>Opened, partly used or consumed food products (for food-safety reasons).</li>
  <li>Products damaged after delivery by heat, moisture or improper storage.</li>
  <li>Gift boxes and combos where any inner item has been opened.</li>
  <li>Requests raised after the 7-day window.</li>
</ul>
<h2>How to raise a request</h2>
<ol>
  <li>Go to <a href="/account/orders">My Orders</a> and open the order, or message us through the <a href="/contact">Contact</a> page.</li>
  <li>Share the order number, the item concerned, and clear photographs of the product and packaging.</li>
  <li>We confirm eligibility within 2 business days and arrange a pickup or ask you to ship the item back, depending on your location.</li>
</ol>
<h2>Exchanges</h2>
<p>Damaged or incorrect items are replaced with the same product at no cost to you. If the product is out of stock, we will offer an alternative of the same value or a full refund.</p>
<h2>Refunds</h2>
<p>Approved refunds are credited to the original payment method within <strong>5–7 business days</strong> after the returned item reaches us or the claim is verified from photographs. Bank processing times may add a few days.</p>
<h2>Cancellations</h2>
<p>Orders can be cancelled from <a href="/account/orders">My Orders</a> until they are dispatched. Once dispatched, the return policy above applies.</p>
<p>Questions? Reach us through the <a href="/contact">Contact</a> page — we respond within one business day.</p>
`.trim(),
  },
];

const HELP_LINKS = [
  { label: "About Us",          href: "/about" },
  { label: "Leadership",        href: "/leadership" },
  { label: "Credentials",       href: "/credentials" },
  { label: "Contact Us",        href: "/contact" },
  { label: "Shipping Policy",   href: "/shipping" },
  { label: "Return & Exchange", href: "/returns" },
  { label: "Track Order",       href: "/account/orders" },
];

(async () => {
  for (const p of PAGES) {
    const existing = await db.page.findUnique({ where: { slug: p.slug } });
    const metaTitle = p.title; // the page template appends the site name itself
    if (existing) {
      // Never overwrite admin edits. Only repair the old marker that leaked into the <title>.
      if (existing.metaTitle === SEED_MARK || existing.metaTitle === `${p.title} — vkcgoldikshu`) { await db.page.update({ where: { slug: p.slug }, data: { metaTitle } }); console.log(`${p.slug.padEnd(20)} title repaired`); }
      else console.log(`${p.slug.padEnd(20)} kept (edited in admin)`);
      continue;
    }
    await db.page.upsert({
      where: { slug: p.slug },
      update: { title: p.title, content: p.content, metaDesc: p.metaDesc, isActive: true },
      create: { slug: p.slug, title: p.title, content: p.content, metaDesc: p.metaDesc, metaTitle, isActive: true, sortOrder: 60 },
    });
    console.log(`${p.slug.padEnd(10)} ${existing ? "refreshed" : "created"}`);
  }
  await db.siteSetting.upsert({
    where: { key: "footer_help_links" },
    update: { value: JSON.stringify(HELP_LINKS) },
    create: { key: "footer_help_links", value: JSON.stringify(HELP_LINKS), label: "Footer Help Links", group: "general", type: "text" },
  });
  console.log("footer_help_links updated");
  await db.$disconnect();
})().catch(async (e) => { console.error(e); await db.$disconnect(); process.exit(1); });
