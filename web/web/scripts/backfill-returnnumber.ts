import { db } from "../lib/db";
import { generateReturnNumber } from "../lib/returnNumber";

async function main() {
  const rows = await db.orderReturn.findMany({
    where: { returnNumber: null },
    select: { id: true },
  });
  console.log(`Backfilling ${rows.length} returns…`);
  for (const r of rows) {
    let attempt = 0;
    while (attempt < 5) {
      try {
        await db.orderReturn.update({
          where: { id: r.id },
          data: { returnNumber: generateReturnNumber() },
        });
        break;
      } catch {
        attempt++;
      }
    }
  }
  console.log("Done.");
  await db.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
