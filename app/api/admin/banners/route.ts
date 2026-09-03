import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  normalizeBannerImageUrl,
  normalizeBannerLinkUrl,
  normalizeBannerPosition,
  normalizeBannerType,
} from "@/lib/banners";

export async function POST(req: NextRequest) {
  try {
    const { title, subtitle, imageUrl, mobileImageUrl, linkUrl, position, bannerType, sortOrder, isActive } = await req.json();
    const titleText = typeof title === "string" ? title.trim() : "";
    const subtitleText = typeof subtitle === "string" ? subtitle.trim() : "";
    const mobileImageText = typeof mobileImageUrl === "string" ? mobileImageUrl.trim() : "";
    const linkText = typeof linkUrl === "string" ? linkUrl.trim() : "";
    const safeImageUrl = normalizeBannerImageUrl(imageUrl);
    const safeMobileImageUrl = mobileImageText ? normalizeBannerImageUrl(mobileImageText) : null;
    const safeLinkUrl = linkText ? normalizeBannerLinkUrl(linkText) : null;
    const safePosition = normalizeBannerPosition(position);
    const parsedSortOrder = Number.parseInt(String(sortOrder ?? ""), 10);

    if (!titleText) return NextResponse.json({ error: "Title is required" }, { status: 400 });
    if (titleText.length > 200) return NextResponse.json({ error: "Title must be 200 characters or less" }, { status: 400 });
    if (subtitleText.length > 400) return NextResponse.json({ error: "Subtitle must be 400 characters or less" }, { status: 400 });
    if (!safeImageUrl) return NextResponse.json({ error: "Use an uploaded image or trusted HTTPS image URL" }, { status: 400 });
    if (mobileImageText && !safeMobileImageUrl) return NextResponse.json({ error: "Mobile image URL is not allowed" }, { status: 400 });
    if (linkText && !safeLinkUrl) return NextResponse.json({ error: "Link URL must be an internal path or HTTPS URL" }, { status: 400 });
    if (!safePosition) return NextResponse.json({ error: "Position is not allowed" }, { status: 400 });

    const banner = await db.banner.create({
      data: {
        title: titleText,
        subtitle: subtitleText || null,
        imageUrl: safeImageUrl,
        mobileImageUrl: safeMobileImageUrl,
        linkUrl: safeLinkUrl,
        position: safePosition,
        bannerType: normalizeBannerType(bannerType),
        sortOrder: Number.isFinite(parsedSortOrder) ? Math.max(0, Math.min(parsedSortOrder, 9999)) : 0,
        isActive: typeof isActive === "boolean" ? isActive : true,
      },
    });
    return NextResponse.json(banner);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
