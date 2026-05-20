import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import EditProductClient from "./EditProductClient";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const product = await db.product.findUnique({
    where: { id: params.id },
    include: {
      variants: {
        include: { images: { orderBy: { sortOrder: "asc" } } },
        orderBy: { sortOrder: "asc" },
      },
      productAttributes: {
        select: { attributeId: true, values: true },
        orderBy: { attribute: { sortOrder: "asc" } },
      },
    },
  });

  if (!product) notFound();
  return <EditProductClient product={product as any} />;
}
