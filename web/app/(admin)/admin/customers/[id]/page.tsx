import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import CustomerDetailClient from "./CustomerDetailClient";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const customer = await db.user.findUnique({
    where: { id: params.id },
    include: {
      addresses: { orderBy: { isDefault: "desc" } },
      orders: {
        orderBy: { createdAt: "desc" },
        include: {
          items: {
            select: { id: true, productName: true, variantColor: true, quantity: true, unitPrice: true, totalPrice: true, imageUrl: true },
          },
        },
      },
      wallet: {
        include: {
          transactions: { orderBy: { createdAt: "desc" }, take: 50 },
        },
      },
      _count: { select: { orders: true, wishlist: true } },
    },
  });

  if (!customer) notFound();

  // Serialise to plain object (Decimal → string)
  const data = JSON.parse(JSON.stringify(customer));

  return <CustomerDetailClient customer={data} />;
}
