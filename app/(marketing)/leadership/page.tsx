import type { Metadata } from "next";
import LeadershipExperience from "./LeadershipExperience";

export const metadata: Metadata = {
  title: "Leadership — vkcgoldikshu",
  description:
    "The family behind VKC Gold Ikshu: founded in legacy by Late Shri B Ramachandra and led today by Managing Director Naveenchandra B R, with Director Abhishek B R and Promoter Director Mrs. Pushpalatha.",
};

export default function LeadershipPage() {
  return <LeadershipExperience />;
}
