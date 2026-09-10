import type { Metadata } from "next";
import FounderExperience from "./FounderExperience";

export const metadata: Metadata = {
  title: "In Revered Memory of Our Founder — vkcgoldikshu",
  description:
    "A tribute to Late Shri B Ramachandra, founder and guiding inspiration behind the VKC Gold Ikshu family legacy — the values of discipline, sincerity, purity and trust that continue to shape our work.",
};

export default function FounderPage() {
  return <FounderExperience />;
}
