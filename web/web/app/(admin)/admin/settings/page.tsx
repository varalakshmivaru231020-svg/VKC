import { getProductOptions } from "@/lib/db/product-options";
import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings — Admin" };

export default async function SettingsPage() {
  const options = await getProductOptions();
  return <SettingsClient options={options} />;
}
