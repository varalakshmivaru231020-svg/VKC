import Link from "next/link";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { InstagramIcon, FacebookIcon, YouTubeIcon } from "@/components/ui/SocialIcons";
import { NewsletterForm } from "./NewsletterForm";

type FooterLink = { label: string; href: string };

const DEFAULT_SHOP_LINKS: FooterLink[] = [
  { label: "New Arrivals",       href: "/new-arrivals" },
  { label: "Jaggery & Powder",   href: "/category/jaggery" },
  { label: "Bars & Snacks",      href: "/category/bars-snacks" },
  { label: "Syrups",             href: "/category/syrups" },
  { label: "Gift & Combo Boxes", href: "/category/gift-boxes" },
  { label: "Sale",               href: "/shop?sale=true" },
];

const DEFAULT_HELP_LINKS: FooterLink[] = [
  { label: "About Us",          href: "/about" },
  { label: "Leadership",        href: "/leadership" },
  { label: "Our Founder",       href: "/founder" },
  { label: "Credentials",       href: "/credentials" },
  { label: "Contact Us",        href: "/contact" },
  { label: "Shipping Policy",   href: "/shipping" },
  { label: "Return & Exchange", href: "/returns" },
  { label: "Track Order",       href: "/account/orders" },
];

const DEFAULT_ACCOUNT_LINKS: FooterLink[] = [
  { label: "My Account",      href: "/account" },
  { label: "My Orders",       href: "/account/orders" },
  { label: "Wishlist",        href: "/account/wishlist" },
  { label: "Saved Addresses", href: "/account/addresses" },
];

// Hardcoded badges — keep this list honest about what checkout actually
// accepts. COD was removed because cod_enabled is off in Settings, so the
// footer was advertising a method customers could not choose.
/* As recorded on the Udyam Registration Certificate (UDYAM-KR-21-0019065). */
export const DEFAULT_LEGAL_ENTITY = "VKC CANEGOLD IKSHU ZUCKER PURE";

const paymentMethods = ["Visa", "Mastercard", "UPI", "NetBanking", "EMI"];

interface FooterProps {
  siteName?: string;
  tagline?: string;
  logoUrl?: string | null;
  address?: string;
  phone?: string;
  email?: string;
  whatsappNumber?: string;
  instagram?: string;
  facebook?: string;
  youtube?: string;
  /** Registered business name (Admin → Settings). Printed as the site's operator. */
  legalEntityName?: string;
  /** Optional paragraph under the logo (Admin → Settings). */
  footerAbout?: string;
  shopLinks?: FooterLink[];
  helpLinks?: FooterLink[];
  accountLinks?: FooterLink[];
}

/**
 * Deep royal-blue footer — the one place on the site the logo's blue half
 * gets a real moment, with cream text and gold details. Four columns: Brand ·
 * Shop · Help & Account · Contact, with the newsletter folded into the same
 * navy field (no separate bright colour block) instead of its own strip.
 * Every contact value comes from Admin → Settings; anything unset simply
 * does not render.
 */
export function Footer({
  siteName = "vkcgoldikshu",
  tagline = "Rooted in Legacy. Led with Purpose.",
  logoUrl,
  address = "",
  phone = "",
  email = "",
  whatsappNumber,
  instagram,
  facebook,
  youtube,
  legalEntityName,
  footerAbout,
  shopLinks    = DEFAULT_SHOP_LINKS,
  helpLinks    = DEFAULT_HELP_LINKS,
  accountLinks = DEFAULT_ACCOUNT_LINKS,
}: FooterProps) {
  const [firstName, ...rest] = siteName.split(" ");
  const cleanPhone = phone.trim();
  const cleanEmail = email.trim();
  const waDigits = (whatsappNumber ?? "").replace(/\D/g, "");
  const socials = [
    { Icon: InstagramIcon, href: instagram, label: "Instagram" },
    { Icon: FacebookIcon,  href: facebook,  label: "Facebook" },
    { Icon: YouTubeIcon,   href: youtube,   label: "YouTube" },
  ].filter((s) => s.href && s.href.trim());

  const CREAM = "#FCFAF5";
  const CREAM_SOFT = "rgba(252,250,245,0.68)";
  const CREAM_FAINT = "rgba(252,250,245,0.45)";
  const HAIRLINE = "rgba(252,250,245,0.16)";

  const heading = (text: string) => (
    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] font-body" style={{ color: CREAM }}>{text}</p>
  );

  return (
    <footer className="mt-auto" style={{ background: "var(--color-royal)" }}>

      {/* ── Newsletter — deep brown, distinct from the navy footer below it so
          the two dark sections don't read as one undifferentiated blue mass ── */}
      <div className="relative overflow-hidden py-14 px-4" style={{ background: "var(--color-text-primary)" }}>
        <div className="relative max-w-xl mx-auto text-center space-y-3">
          <span className="text-xs font-semibold tracking-[0.18em] uppercase font-body" style={{ color: "var(--color-gold-light)" }}>Stay in the Loop</span>
          <p className="text-3xl" style={{ fontFamily: "var(--font-heading)", fontWeight: "var(--weight-heading)", color: CREAM }}>Sweetness in Your Inbox</p>
          <p className="text-sm font-body" style={{ color: CREAM_SOFT }}>New arrivals, exclusive offers, and jaggery recipes — straight to your inbox.</p>
          <NewsletterForm />
        </div>
      </div>

      {/* ── Main columns ── */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">

          {/* 1 · Brand */}
          <div className="lg:col-span-4 space-y-5">
            <div>
              {logoUrl ? (
                <Link href="/" className="inline-block rounded-md p-2 -m-2" style={{ background: CREAM }}>
                  <img src={logoUrl} alt={siteName} className="object-contain" style={{ maxHeight: 72, maxWidth: 220 }} />
                </Link>
              ) : (
                <p style={{ fontFamily: "var(--font-heading)", fontWeight: "var(--weight-heading)", fontSize: "1.6rem", color: "var(--color-gold-light)", lineHeight: 1.1 }}>
                  {firstName}
                  {rest.length > 0 && (<><br /><span style={{ fontSize: "1.1rem", color: CREAM_SOFT }}>{rest.join(" ")}</span></>)}
                </p>
              )}
              <div className="mt-2 h-0.5 w-12" style={{ background: "linear-gradient(90deg, var(--color-gold-light), transparent)" }} />
            </div>
            <p className="text-[15px] leading-relaxed max-w-[340px]" style={{ fontFamily: "var(--font-heading)", fontStyle: "italic", color: CREAM, textAlign: "left", hyphens: "none" }}>
              {tagline}
            </p>
            {/* Optional, from Admin → Settings ("footer_about"). Nothing is shown when it is blank. */}
            {footerAbout?.trim() && (
              <p className="text-[13px] leading-relaxed max-w-[340px] font-body" style={{ color: CREAM_SOFT, textAlign: "left", hyphens: "none" }}>
                {footerAbout.trim()}
              </p>
            )}
          </div>

          {/* 2 · Shop */}
          <div className="lg:col-span-2 space-y-4">
            {heading("Shop")}
            <ul className="space-y-2.5">
              {shopLinks.map(({ label, href }) => (
                <li key={`${label}-${href}`}><Link href={href} className="footer-link text-sm font-body">{label}</Link></li>
              ))}
            </ul>
          </div>

          {/* 3 · Help & Account */}
          <div className="lg:col-span-3 space-y-4">
            {heading("Help")}
            <ul className="space-y-2.5">
              {helpLinks.map(({ label, href }) => (
                <li key={`${label}-${href}`}><Link href={href} className="footer-link text-sm font-body">{label}</Link></li>
              ))}
            </ul>
            {accountLinks.length > 0 && (
              <>
                <div className="pt-2">{heading("Account")}</div>
                <ul className="space-y-2.5">
                  {accountLinks.map(({ label, href }) => (
                    <li key={`${label}-${href}`}><Link href={href} className="footer-link text-sm font-body">{label}</Link></li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {/* 4 · Contact */}
          <div className="lg:col-span-3 space-y-4">
            {heading("Contact")}
            <ul className="space-y-3.5">
              {address.trim() && (
                <li className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "var(--color-gold-light)" }} />
                  <span className="text-sm font-body leading-relaxed" style={{ color: CREAM_SOFT, textAlign: "left", hyphens: "none" }}>{address.trim()}</span>
                </li>
              )}
              {cleanPhone && (
                <li className="flex items-start gap-3">
                  <Phone className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "var(--color-gold-light)" }} />
                  <a href={`tel:${cleanPhone.replace(/[^\d+]/g, "")}`} className="footer-link text-sm font-body">{cleanPhone}</a>
                </li>
              )}
              {waDigits && (
                <li className="flex items-start gap-3">
                  <MessageCircle className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "var(--color-gold-light)" }} />
                  <a href={`https://wa.me/${waDigits}`} target="_blank" rel="noopener noreferrer" className="footer-link text-sm font-body">WhatsApp {whatsappNumber?.trim()}</a>
                </li>
              )}
              {cleanEmail && (
                <li className="flex items-start gap-3">
                  <Mail className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "var(--color-gold-light)" }} />
                  <a href={`mailto:${cleanEmail}`} className="footer-link text-sm font-body break-all">{cleanEmail}</a>
                </li>
              )}
            </ul>
            {socials.length > 0 && (
              <div className="flex gap-2.5 pt-1">
                {socials.map(({ Icon, href, label }) => (
                  <a key={label} href={href!.trim()} target="_blank" rel="noopener noreferrer" aria-label={label}
                    className="social-icon h-10 w-10 flex items-center justify-center rounded-full border transition-all duration-200 hover:scale-110 hover:-translate-y-0.5"
                    style={{ borderColor: HAIRLINE, background: CREAM }}>
                    <Icon className="h-4.5 w-4.5" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Gold divider ── */}
      <div className="mx-6 lg:mx-12 h-px" style={{ background: "linear-gradient(90deg, transparent, var(--color-gold-light), transparent)", opacity: 0.5 }} />

      {/* ── Bottom bar ── */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] font-body" style={{ color: CREAM_FAINT }}>
            © {new Date().getFullYear()} {siteName}. All rights reserved. Handcrafted with ♥ in India.
            {/* The registered entity behind the site — the name SMS (DLT) and
                payment reviewers look for when they open a link to it. */}
            <span className="block mt-1">
              {siteName} is owned and operated by <strong style={{ fontWeight: 600, color: CREAM_SOFT }}>{legalEntityName?.trim() || DEFAULT_LEGAL_ENTITY}</strong>
            </span>
          </p>
          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {paymentMethods.map((m) => (
              <span key={m} className="text-[10px] font-body font-semibold px-2 py-0.5 rounded border" style={{ color: "var(--color-text-secondary)", borderColor: "var(--color-parchment)", background: CREAM }}>{m}</span>
            ))}
          </div>
          <div className="flex items-center gap-4">
            {[{ label: "Privacy", href: "/privacy" }, { label: "Terms", href: "/terms" }].map((item) => (
              <Link key={item.label} href={item.href} className="footer-link text-[11px] font-body">{item.label}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
