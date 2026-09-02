import type { Metadata } from "next";
import { db } from "@/lib/db";
import AboutExperience from "./AboutExperience";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About Us — VKC Cane Gold",
  description:
    "VKC Cane Gold Foods makes pure, chemical-free jaggery and cane products in Mandya, Karnataka — farmer-first and 100% natural since 1988.",
};

export default async function AboutPage() {
  // Contact details are pulled from Admin → Settings when present, with the
  // real business details as fallbacks so the page is never blank.
  const rows = await db.siteSetting
    .findMany({ where: { key: { in: ["store_phone", "whatsapp_number", "store_email"] } } })
    .catch(() => [] as { key: string; value: string }[]);
  const get = (k: string) => rows.find((r) => r.key === k)?.value || undefined;

  return (
    <AboutExperience
      phone={get("store_phone") ?? "+91 95916 08382"}
      whatsapp={get("whatsapp_number") ?? "919591608382"}
      email={get("store_email") ?? "info@vkccanegold.co.in"}
    />
  );
}
