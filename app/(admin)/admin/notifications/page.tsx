import type { Metadata } from "next";
import NotificationsClient from "./NotificationsClient";

export const metadata: Metadata = { title: "Push Notifications — Admin" };
export const dynamic = "force-dynamic";

export default function NotificationsPage() {
  return <NotificationsClient />;
}
