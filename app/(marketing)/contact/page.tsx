import type { Metadata } from "next";
import { db } from "@/lib/db";
import ContactClient from "./ContactClient";

export const metadata: Metadata = {
  title: "Contact Us — vkcgoldikshu",
  description: "Get in touch with vkcgoldikshu — we're happy to help with orders, bulk enquiries and wholesale queries.",
};

export const dynamic = "force-dynamic";

// Google Maps place for the registered office. Admin → Settings can override with
// store_maps_url (link) and store_map_embed (iframe src) if the pin ever moves.
const DEFAULT_MAP_LINK = "https://www.google.com/maps?cid=5977066381174680787";
const DEFAULT_MAP_EMBED = "https://www.google.com/maps?cid=5977066381174680787&output=embed";

export default async function ContactPage() {
  const rows = await db.siteSetting.findMany({
    where: {
      key: {
        in: [
          "store_phone", "store_email", "store_address", "store_city",
          "store_hours_weekday", "store_hours_weekend",
          "whatsapp_number", "store_maps_url", "store_map_embed",
        ],
      },
    },
  });
  const s: Record<string, string> = {};
  rows.forEach((r) => { s[r.key] = r.value; });

  return (
    // No placeholder fallbacks here on purpose. These previously defaulted to a
    // sample phone number and a Chennai address that belong to no one — real
    // visitors were shown contact details that would never reach the store.
    // Anything not set in Admin → Settings is simply not displayed.
    <ContactClient
      phone={s.store_phone ?? ""}
      email={s.store_email ?? ""}
      address={s.store_address ?? ""}
      city={s.store_city ?? ""}
      hoursWeekday={s.store_hours_weekday ?? ""}
      hoursWeekend={s.store_hours_weekend ?? ""}
      whatsappNumber={s.whatsapp_number ?? ""}
      mapsUrl={s.store_maps_url || DEFAULT_MAP_LINK}
      mapEmbedUrl={s.store_map_embed || DEFAULT_MAP_EMBED}
    />
  );
}
