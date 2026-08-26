const { PrismaClient } = require("@prisma/client");
(async () => {
  const db = new PrismaClient();
  try {
    const n = await db.sareeStory.count();
    const s = await db.sareeStory.findMany({ take: 8,
      select: { name: true, region: true, fabric: true, heroImage: true, shortIntro: true } });
    console.log("=== saree stories: " + n + " total, first 8 ===");
    s.forEach(x => console.log("  " + (x.name||"?").padEnd(26) +
      " | " + (x.region||"-").padEnd(12) +
      " | img=" + (x.heroImage ? "YES" : "no") +
      " | intro=" + (x.shortIntro ? "YES" : "no")));
    const withImg = await db.sareeStory.count({ where: { NOT: { heroImage: null } } });
    console.log("stories with hero image: " + withImg + " / " + n);
  } catch (e) { console.log("ERR:", e.message.split("\n").filter(l=>l.includes("Unknown")||l.includes("Argument")).slice(0,3).join(" | ")); }
  await db.$disconnect();
})();
