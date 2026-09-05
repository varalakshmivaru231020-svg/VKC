import type { Metadata } from "next";
import CredentialsExperience from "./CredentialsExperience";

export const metadata: Metadata = {
  title: "Credentials — vkcgoldikshu",
  description:
    "VKC Gold Ikshu's business entities, registrations and compliance status, and the food-safety training behind them: M/s Vairamudi Krupa Crusher and VKC JAGGERY & BEVERAGES PRIVATE LIMITED (CIN U10722KA2025PTC212254), Udyam KR-21-0019065.",
};

export default function CredentialsPage() {
  return <CredentialsExperience />;
}
