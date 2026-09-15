import { NextResponse } from "next/server";
import { getAboutContent } from "@/lib/settings/about";
import { getReturnsDays } from "@/lib/settings/returns";

export const dynamic = "force-dynamic";

/**
 * Brand story copy for the mobile app — the "Our Heritage" block the home
 * page shows plus the About page headline fields, all edited in
 * Admin → Settings → About Page. The full About / Leadership pages are opened
 * as website pages inside the app; this endpoint only feeds the compact
 * home-screen preview so the two never drift apart.
 */
export async function GET() {
  try {
    const [about, returnsDays] = await Promise.all([getAboutContent(), getReturnsDays()]);

    return NextResponse.json({
      about: {
        heroEyebrow: about.heroEyebrow,
        heroTitle: about.heroTitle,
        heroSubtitle: about.heroSubtitle,
        storyImage: about.storyImage,
        storyCaptionTop: about.storyCaptionTop,
        storyCaptionBottom: about.storyCaptionBottom,
        homeEyebrow: about.homeEyebrow,
        homeHeading: about.homeHeading,
        homeBody: about.homeBody,
        homeQuote: about.homeQuote,
        homeCtaLabel: about.homeCtaLabel,
        values: about.values,
      },
      returnsDays,
    });
  } catch (err) {
    console.error("[v1/about]", err);
    return NextResponse.json({ error: "Failed to load about content" }, { status: 500 });
  }
}
