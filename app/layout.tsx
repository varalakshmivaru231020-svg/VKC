import type { Metadata } from "next";
import "./globals.css";
import { getThemeInjection } from "@/lib/theme/server";
import { Providers } from "@/components/Providers";

export async function generateMetadata(): Promise<Metadata> {
  const { siteName, tagline } = await getThemeInjection();
  return {
    title: { default: siteName, template: `%s | ${siteName}` },
    description: tagline,
    metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"),
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { styleContent, fontsUrl, announcement, announcementActive } =
    await getThemeInjection();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent browsers from auto-linkifying phone numbers / addresses in plain text (e.g. office address blocks) */}
        <meta name="format-detection" content="telephone=no, date=no, address=no, email=no" />
        {/* Google Fonts — loaded dynamically based on admin font selection */}
        {fontsUrl && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link href={fontsUrl} rel="stylesheet" />
          </>
        )}
        {/* Admin-managed design tokens injected as CSS custom properties */}
        <style
          id="vl-theme"
          dangerouslySetInnerHTML={{ __html: styleContent }}
        />
      </head>
      <body>
        {announcementActive && announcement && (
          <div
            className="announcement-bar"
            style={{
              background: "var(--color-primary)",
              color: "var(--color-gold-light)",
              textAlign: "center",
              padding: "10px 16px",
              fontSize: "var(--text-sm)",
              fontFamily: "var(--font-body)",
              fontWeight: 500,
              letterSpacing: "0.02em",
            }}
          >
            {announcement}
          </div>
        )}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
