import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { fabrics, weaves, regions, occasions } = await req.json();

    const upserts = [
      { key: "options.fabrics",   value: fabrics,   label: "Fabric Options",            group: "options", type: "text", sortOrder: 10 },
      { key: "options.weaves",    value: weaves,    label: "Weave Type Options",         group: "options", type: "text", sortOrder: 20 },
      { key: "options.regions",   value: regions,   label: "Region of Origin Options",   group: "options", type: "text", sortOrder: 30 },
      { key: "options.occasions", value: occasions, label: "Occasion Options",           group: "options", type: "text", sortOrder: 40 },
    ];

    await Promise.all(
      upserts.map(({ key, value, label, group, type, sortOrder }) =>
        db.siteSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value, label, group, type, sortOrder },
        })
      )
    );

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
