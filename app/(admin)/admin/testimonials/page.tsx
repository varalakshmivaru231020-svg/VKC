import { db } from "@/lib/db";
import TestimonialsClient from "./TestimonialsClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Testimonials — Admin" };

export default async function TestimonialsPage() {
  const items = await db.testimonial
    .findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] })
    .catch(() => []);
  return <TestimonialsClient items={JSON.parse(JSON.stringify(items))} />;
}
