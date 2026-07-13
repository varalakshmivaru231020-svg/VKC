import { db } from "@/lib/db";
import StoryForm from "../StoryForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Add Saree Story" };

export default async function NewSareeStoryPage() {
  const categories = await db.category.findMany({
    where: { isActive: true },
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });
  return <StoryForm mode="create" categories={categories} />;
}
