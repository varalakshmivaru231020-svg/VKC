import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * The frame around /login and /register.
 *
 * These are real pages, reached directly — from the SMS link, from the
 * account redirect, from a bookmark — so they stand on their own: the store's
 * ivory ground, its logo and name at the head, the form centred beneath. (This
 * used to be a dark modal overlay with no page behind it, which left the
 * heading and hint as dark text on a dark wash.)
 */
export function AuthModalShell({ children, siteName = "vkcgoldikshu", logoUrl = null }: {
  children: React.ReactNode;
  siteName?: string;
  logoUrl?: string | null;
}) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--color-ivory)" }}>
      <header className="border-b" style={{ borderColor: "var(--color-parchment)" }}>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-[68px] sm:h-[84px] flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 min-w-0" aria-label={`${siteName} — home`}>
            {logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="h-12 sm:h-16 w-auto object-contain mix-blend-multiply shrink-0" />
            )}
            <span className="truncate" style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: "clamp(1.25rem, 2.4vw, 1.7rem)", letterSpacing: "-0.01em", color: "var(--color-text-primary)" }}>
              {siteName}
            </span>
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-body font-medium shrink-0 transition-opacity hover:opacity-70" style={{ color: "var(--color-text-secondary)" }}>
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to store</span>
            <span className="sm:hidden">Store</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10 sm:py-16">
        {children}
      </main>

      <footer className="px-4 py-6 text-center text-xs font-body" style={{ color: "var(--color-text-muted)", borderTop: "1px solid var(--color-parchment)" }}>
        <span>© {new Date().getFullYear()} {siteName}</span>
        <span aria-hidden className="mx-2">·</span>
        <Link href="/privacy" className="hover:underline">Privacy</Link>
        <span aria-hidden className="mx-2">·</span>
        <Link href="/terms" className="hover:underline">Terms</Link>
      </footer>
    </div>
  );
}
