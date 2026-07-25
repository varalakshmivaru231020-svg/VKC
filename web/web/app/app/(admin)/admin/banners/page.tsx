import { db } from "@/lib/db";
import BannersClient from "./BannersClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Banners — Admin" };

export default async function BannersPage() {
  const banners = await db.banner.findMany({ orderBy: [{ position: "asc" }, { sortOrder: "asc" }] });
  return <BannersClient banners={banners} />;
}
