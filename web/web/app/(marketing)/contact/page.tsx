import type { Metadata } from "next";
import { db } from "@/lib/db";
import ContactClient from "./ContactClient";

export const metadata: Metadata = {
  title: "Contact Us — Vijaylakshmi Sarees",
  description: "Get in touch with Vijaylakshmi Sarees — we're happy to help with orders, styling advice, and wholesale queries.",
};

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const rows = await db.siteSetting.findMany({
    where: {
      key: {
        in: [
          "store_phone", "store_email", "store_address", "store_city",
          "store_hours_weekday", "store_hours_weekend",
          "whatsapp_number", "store_maps_url",
        ],
      },
    },
  });
  const s: Record<string, string> = {};
  rows.forEach((r) => { s[r.key] = r.value; });

  return (
    <ContactClient
      phone={s.store_phone || "+91 98765 43210"}
      email={s.store_email || "care@vijaylakshmi.in"}
      address={s.store_address || "45, Usman Road, T. Nagar"}
      city={s.store_city || "Chennai, Tamil Nadu 600017"}
      hoursWeekday={s.store_hours_weekday || "Mon – Sat: 9 AM – 8 PM"}
      hoursWeekend={s.store_hours_weekend || "Sunday: 10 AM – 6 PM"}
      whatsappNumber={s.whatsapp_number || "919876543210"}
      mapsUrl={s.store_maps_url || "https://maps.google.com"}
    />
  );
}
