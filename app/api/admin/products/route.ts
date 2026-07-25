import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base;
  let n = 0;
  while (await db.product.findUnique({ where: { slug } })) {
    n++;
    slug = `${base}-${n}`;
  }
  return slug;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name, description, shortDesc, fabric, weaveType, regionOfOrigin,
      occasions, isFeatured, isActive, videoUrl, variants, productAttributes,
      categoryId, careInstructions, gstPercent, sareeLengthCm,
      preBookingMode, preBookingEtaMinDays, preBookingEtaMaxDays,
      preBookingMaxQtyPerOrder, preBookingMaxTotalQty, preBookingDisclaimer,
      preBookingReturnsAllowed,
    } = body;

    if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (!variants?.length) return NextResponse.json({ error: "At least one variant required" }, { status: 400 });
    if (preBookingMode && !["OFF", "AUTO_ON_OUT_OF_STOCK", "ALWAYS_ON"].includes(preBookingMode)) {
      return NextResponse.json({ error: "Invalid pre-booking mode" }, { status: 400 });
    }
    if (preBookingEtaMinDays != null && preBookingEtaMaxDays != null && Number(preBookingEtaMinDays) > Number(preBookingEtaMaxDays)) {
      return NextResponse.json({ error: "Pre-booking maximum ETA days must be greater than or equal to minimum" }, { status: 400 });
    }

    const slug = await uniqueSlug(slugify(name));

    // Create product + variants (no images yet)
    const product = await db.product.create({
      data: {
        name: name.trim(),
        slug,
        description: description || null,
        shortDesc: shortDesc || null,
        fabric: fabric || null,
        weaveType: weaveType || null,
        regionOfOrigin: regionOfOrigin || null,
        occasions: occasions ?? [],
        categoryId: categoryId || null,
        careInstructions: careInstructions || null,
        gstPercent: gstPercent !== undefined && gstPercent !== null && gstPercent !== "" ? parseFloat(gstPercent) : 5,
        sareeLengthCm: sareeLengthCm !== undefined && sareeLengthCm !== null && sareeLengthCm !== "" ? parseInt(sareeLengthCm) : 560,
        isFeatured: isFeatured ?? false,
        isActive: isActive ?? true,
        videoUrl: videoUrl || null,
        preBookingMode: preBookingMode || "OFF",
        preBookingEtaMinDays: preBookingEtaMinDays ?? null,
        preBookingEtaMaxDays: preBookingEtaMaxDays ?? null,
        preBookingMaxQtyPerOrder: preBookingMaxQtyPerOrder ?? null,
        preBookingMaxTotalQty: preBookingMaxTotalQty ?? null,
        preBookingDisclaimer: preBookingDisclaimer || null,
        preBookingReturnsAllowed: preBookingReturnsAllowed ?? true,
        variants: {
          create: variants.map((v: any, i: number) => ({
            colorName: v.colorName.trim(),
            colorHex: v.colorHex || "#888888",
            sareeCode: v.sareeCode?.trim() || null,
            costPrice: parseFloat(v.costPrice) || 0,
            salePrice: parseFloat(v.salePrice) || 0,
            originalPrice: parseFloat(v.originalPrice) || parseFloat(v.salePrice) || 0,
            stockQty: parseInt(v.stockQty) || 0,
            sortOrder: i,
          })),
        },
      },
      include: { variants: { select: { id: true, sortOrder: true } } },
    });

    // Create images for each variant
    const imageRows: any[] = [];
    for (const variantData of variants) {
      const urls: string[] = variantData.imageUrls ?? [];
      if (!urls.length) continue;
      const dbVariant = product.variants[variants.indexOf(variantData)];
      if (!dbVariant) continue;
      urls.forEach((url: string, j: number) => {
        imageRows.push({
          productId: product.id,
          variantId: dbVariant.id,
          url,
          isPrimary: j === 0,
          sortOrder: j,
        });
      });
    }
    if (imageRows.length) {
      await db.productImage.createMany({ data: imageRows });
    }

    // Save product attributes
    if (Array.isArray(productAttributes) && productAttributes.length > 0) {
      for (const pa of productAttributes) {
        if (!pa.attributeId || !Array.isArray(pa.values)) continue;
        await db.productAttribute.upsert({
          where: { productId_attributeId: { productId: product.id, attributeId: pa.attributeId } },
          create: { productId: product.id, attributeId: pa.attributeId, values: pa.values },
          update: { values: pa.values },
        });
      }
    }

    return NextResponse.json({ id: product.id, slug: product.slug });
  } catch (err: any) {
    console.error("Product create error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
