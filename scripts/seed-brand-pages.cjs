/**
 * Create (or refresh) the two brand CMS pages so they can be edited later in
 * Admin → Content → CMS Pages. Idempotent; run on the server after deploying:
 *
 *   node scripts/seed-brand-pages.cjs
 *
 * Pages: /quality-compliance and /registrations. Existing content is replaced
 * only if the page has never been edited by hand (tracked by metaTitle marker),
 * so admin edits survive re-runs.
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
    slug: "quality-compliance",
    title: "Quality, Learning & Compliance",
    metaDesc: "How VKC Gold Ikshu treats quality as a continuous responsibility — ongoing learning in food safety, compliance and industry best practice.",
    content: `
<p><em>Committed to continuous learning in food safety, compliance, and industry best practices.</em></p>
<p>At VKC Gold Ikshu, quality is not treated as a one-time checklist. It is seen as a continuous responsibility. To support this mindset, the leadership remains actively engaged in learning related to food safety, food business compliance, product systems, and industry-specific development.</p>
<h2>Training and course completions</h2>
<p>Course and training completion records in the name of Naveenchandra B R cover:</p>
<ul>
  <li>FSSAI regulations</li>
  <li>Food labelling</li>
  <li>Food business licensing and registration</li>
  <li>Food acts</li>
  <li>FSSC awareness</li>
  <li>Jaggery business development</li>
</ul>
<h2>What these records mean</h2>
<p>These course completions reflect the business's commitment to awareness and capability building. They support knowledge, training and preparedness. They are not statutory licences in themselves, and we do not present them as such. Keeping that distinction clear is part of respecting both learning and legal accuracy.</p>
<p>For our incorporation and enterprise registrations, see <a href="/registrations">Registrations &amp; Compliance</a>.</p>
`.trim(),
  },
  {
    slug: "registrations",
    title: "Registrations & Compliance",
    metaDesc: "The business framework behind VKC Gold Ikshu: company incorporation, enterprise registration and operating records.",
    content: `
<p>We believe trust grows stronger when business values are supported by proper structure and compliance. Our present business framework includes company incorporation and enterprise registration, along with the operating records and licences relevant to our business journey.</p>
<h2>Business entities</h2>
<ul>
  <li><strong>M/s Vairamudi Krupa Crusher</strong> — the long-standing proprietorship (est. 1988) that remains the original base of our operations and identity.</li>
  <li><strong>VKC JAGGERY &amp; BEVERAGES PRIVATE LIMITED</strong> — incorporated on 12 December 2025, CIN U10722KA2025PTC212254, carrying forward the next phase of growth.</li>
</ul>
<h2>Registrations</h2>
<ul>
  <li>Company incorporation (Ministry of Corporate Affairs) — CIN U10722KA2025PTC212254</li>
  <li>MSME / Udyam enterprise registration — Udyam No. KR-21-0019065</li>
  <li>GST registration</li>
  <li>Import–Export Code (IEC)</li>
  <li>Trademark registration</li>
</ul>
<h2>In progress</h2>
<ul>
  <li>FSSAI licence</li>
  <li>Lean MSME certification</li>
  <li>Enterprise membership — IID</li>
</ul>
<p>Training and course completions held by our leadership are described separately on <a href="/quality-compliance">Quality, Learning &amp; Compliance</a>; they support capability and preparedness and are not statutory licences.</p>
`.trim(),
  },
];

(async () => {
  for (const p of PAGES) {
    const existing = await db.page.findUnique({ where: { slug: p.slug } });
    if (existing && existing.metaTitle !== SEED_MARK) {
      console.log(`${p.slug.padEnd(20)} kept (edited in admin)`);
      continue;
    }
    await db.page.upsert({
      where: { slug: p.slug },
      update: { title: p.title, content: p.content, metaDesc: p.metaDesc, isActive: true },
      create: { slug: p.slug, title: p.title, content: p.content, metaDesc: p.metaDesc, metaTitle: SEED_MARK, isActive: true, sortOrder: 50 },
    });
    console.log(`${p.slug.padEnd(20)} ${existing ? "refreshed" : "created"}`);
  }
  await db.$disconnect();
})().catch(async (e) => { console.error(e); await db.$disconnect(); process.exit(1); });
