import { db } from "@/lib/db";
import CategoriesClient from "./CategoriesClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Categories — Admin" };

export default async function CategoriesPage() {
  const categories = await db.category.findMany({
    include: {
      _count: { select: { products: true } },
      parent: { select: { id: true, name: true } },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return <CategoriesClient categories={categories} />;
}
