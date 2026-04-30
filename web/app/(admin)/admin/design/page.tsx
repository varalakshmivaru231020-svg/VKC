import { getThemeSettings } from "@/lib/theme/server";
import DesignClient from "./DesignClient";

export const metadata = { title: "Design & Branding" };

export default async function DesignPage() {
  const settings = await getThemeSettings();
  return <DesignClient initialSettings={settings} />;
}
