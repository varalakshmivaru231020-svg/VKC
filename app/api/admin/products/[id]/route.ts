import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const product = await db.product.findUnique({
      where: { id: params.id },
      include: {
        variants: {
          include: { images: { orderBy: { sortOrder: "asc" } } },
          orderBy: { sortOrder: "asc" },
        },
      },
    });
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(product);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const {
      name, description, shortDesc, fabric, weaveType, regionOfOrigin,
      occasions, isFeatured, isActive, videoUrl, variants, productAttributes,
      categoryId, careInstructions, gstPercent, sareeLengthCm,
    } = body;

    if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    // Update base product fields
    const product = await db.product.update({
      where: { id: params.id },
      data: {
        name: name.trim(),
        description: description || null,
        shortDesc: shortDesc || null,
        fabric: fabric || null,
        weaveType: weaveType || null,
        regionOfOrigin: regionOfOrigin || null,
        occasions: occasions ?? [],
        categoryId: categoryId !== undefined ? (categoryId || null) : undefined,
        careInstructions: careInstructions !== undefined ? (careInstructions || null) : undefined,
        gstPercent: gstPercent !== undefined && gstPercent !== null && gstPercent !== "" ? parseFloat(gstPercent) : undefined,
        sareeLengthCm: sareeLengthCm !== undefined && sareeLengthCm !== null && sareeLengthCm !== "" ? parseInt(sareeLengthCm) : undefined,
        isFeatured: isFeatured ?? false,
        isActive: isActive ?? true,
        videoUrl: videoUrl !== undefined ? (videoUrl || null) : undefined,
      },
    });

    // Handle variants: upsert existing, create new, delete removed
    if (variants?.length) {
      const existingVariants = await db.productVariant.findMany({ where: { productId: params.id } });
      const incomingIds = variants.filter((v: any) => v.id).map((v: any) => v.id);

      // Delete variants not in incoming list
      const toDelete = existingVariants.filter((v) => !incomingIds.includes(v.id));
      if (toDelete.length) {
        await db.productVariant.deleteMany({ where: { id: { in: toDelete.map((v) => v.id) } } });
      }

      for (let i = 0; i < variants.length; i++) {
        const v = variants[i];
        const imageUrls: string[] = v.imageUrls ?? [];

        if (v.id) {
          // Update existing variant
          await db.productVariant.update({
            where: { id: v.id },
            data: {
              colorName: v.colorName.trim(),
              colorHex: v.colorHex || "#888888",
              sareeCode: v.sareeCode?.trim() || null,
              costPrice: parseFloat(v.costPrice) || 0,
              salePrice: parseFloat(v.salePrice) || 0,
              originalPrice: parseFloat(v.originalPrice) || parseFloat(v.salePrice) || 0,
              stockQty: parseInt(v.stockQty) || 0,
              sortOrder: i,
            },
          });
          // Replace images
          await db.productImage.deleteMany({ where: { variantId: v.id } });
          if (imageUrls.length) {
            await db.productImage.createMany({
              data: imageUrls.map((url: string, j: number) => ({
                productId: params.id,
                variantId: v.id,
                url,
                isPrimary: j === 0,
                sortOrder: j,
              })),
            });
          }
        } else {
          // Create new variant
          const newVariant = await db.productVariant.create({
            data: {
              productId: params.id,
              colorName: v.colorName.trim(),
              colorHex: v.colorHex || "#888888",
              sareeCode: v.sareeCode?.trim() || null,
              costPrice: parseFloat(v.costPrice) || 0,
              salePrice: parseFloat(v.salePrice) || 0,
              originalPrice: parseFloat(v.originalPrice) || parseFloat(v.salePrice) || 0,
              stockQty: parseInt(v.stockQty) || 0,
              sortOrder: i,
            },
          });
          if (imageUrls.length) {
            await db.productImage.createMany({
              data: imageUrls.map((url: string, j: number) => ({
                productId: params.id,
                variantId: newVariant.id,
                url,
                isPrimary: j === 0,
                sortOrder: j,
              })),
            });
          }
        }
      }
    }

    // Upsert product attributes
    if (Array.isArray(productAttributes)) {
      // Delete attributes not in the incoming list
      const incomingAttrIds = productAttributes.map((pa: any) => pa.attributeId).filter(Boolean);
      await db.productAttribute.deleteMany({
        where: { productId: params.id, attributeId: { notIn: incomingAttrIds } },
      });
      for (const pa of productAttributes) {
        if (!pa.attributeId || !Array.isArray(pa.values)) continue;
        await db.productAttribute.upsert({
          where: { productId_attributeId: { productId: params.id, attributeId: pa.attributeId } },
          create: { productId: params.id, attributeId: pa.attributeId, values: pa.values },
          update: { values: pa.values },
        });
      }
    }

    return NextResponse.json({ id: product.id });
  } catch (err: any) {
    console.error("Product update error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await db.$transaction(async (tx) => {
      // Collect variant IDs for this product
      const variants = await tx.productVariant.findMany({
        where: { productId: params.id },
        select: { id: true },
      });
      const variantIds = variants.map((v) => v.id);

      // Delete records that reference variants (no cascade in schema)
      if (variantIds.length) {
        await tx.orderItem.deleteMany({ where: { variantId: { in: variantIds } } });
        await tx.cartItem.deleteMany({ where: { variantId: { in: variantIds } } });
        await tx.wishlistItem.deleteMany({ where: { variantId: { in: variantIds } } });
      }

      // Delete reviews referencing the product
      await tx.review.deleteMany({ where: { productId: params.id } });

      // Delete the product — schema cascades handle variants, images, attributes
      await tx.product.delete({ where: { id: params.id } });
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
