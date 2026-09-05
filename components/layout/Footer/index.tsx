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
  shopLinks?: FooterLink[];
  helpLinks?: FooterLink[];
  accountLinks?: FooterLink[];
}

/**
 * Four columns: Brand · Shop · Help & Account · Contact.
 * Contact (address, phone, email, WhatsApp, social icons) has its own column
 * at the end so the brand column stays a short introduction. Every contact
 * value comes from Admin → Settings; anything unset simply does not render.
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

  const heading = (text: string) => (
    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] font-body" style={{ color: "var(--color-text-primary)" }}>{text}</p>
  );

  return (
    <footer className="mt-auto" style={{ background: "var(--color-cream)" }}>

      {/* ── Newsletter strip ── */}
      <div className="relative overflow-hidden py-16 px-4" style={{ background: "var(--color-primary)" }}>
        <div className="absolute -left-20 -top-20 w-80 h-80 rounded-full pointer-events-none opacity-[0.04]" style={{ border: "60px solid var(--color-gold)" }} />
        <div className="absolute -right-20 -bottom-20 w-96 h-96 rounded-full pointer-events-none opacity-[0.04]" style={{ border: "60px solid var(--color-gold)" }} />
        <div className="relative max-w-xl mx-auto text-center space-y-3">
          <span className="text-xs font-semibold tracking-[0.18em] uppercase font-body" style={{ color: "#FFFFFF" }}>Stay in the Loop</span>
          <p className="text-3xl" style={{ fontFamily: "var(--font-heading)", fontWeight: "var(--weight-heading)", color: "#FFFFFF" }}>Sweetness in Your Inbox</p>
          <p className="text-sm font-body" style={{ color: "#FFFFFF" }}>New arrivals, exclusive offers, and jaggery recipes — straight to your inbox.</p>
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
                <Link href="/" className="inline-block">
                  <img src={logoUrl} alt={siteName} className="object-contain mix-blend-multiply" style={{ maxHeight: 88, maxWidth: 240 }} />
                </Link>
              ) : (
                <p style={{ fontFamily: "var(--font-heading)", fontWeight: "var(--weight-heading)", fontSize: "1.6rem", color: "var(--color-primary)", lineHeight: 1.1 }}>
                  {firstName}
                  {rest.length > 0 && (<><br /><span style={{ fontSize: "1.1rem", color: "var(--color-text-secondary)" }}>{rest.join(" ")}</span></>)}
                </p>
              )}
              <div className="mt-2 h-0.5 w-12" style={{ background: "linear-gradient(90deg, var(--color-gold), transparent)" }} />
            </div>
            <p className="text-[15px] leading-relaxed max-w-[340px]" style={{ fontFamily: "var(--font-heading)", fontStyle: "italic", color: "var(--color-text-primary)", textAlign: "left", hyphens: "none" }}>
              {tagline}
            </p>
            <p className="text-[13px] leading-relaxed max-w-[340px] font-body" style={{ color: "var(--color-text-muted)", textAlign: "left", hyphens: "none" }}>
              VKC Gold Ikshu is a legacy-inspired brand shaped by the values of Late Shri B Ramachandra and led today by Naveenchandra B R. We stand for purity, trust and responsible growth. Our present business growth is carried forward through VKC JAGGERY &amp; BEVERAGES PRIVATE LIMITED.
            </p>
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
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "var(--color-gold-dark)" }} />
                  <span className="text-sm font-body leading-relaxed" style={{ color: "var(--color-text-secondary)", textAlign: "left", hyphens: "none" }}>{address.trim()}</span>
                </li>
              )}
              {cleanPhone && (
                <li className="flex items-start gap-3">
                  <Phone className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "var(--color-gold-dark)" }} />
                  <a href={`tel:${cleanPhone.replace(/[^\d+]/g, "")}`} className="footer-link text-sm font-body">{cleanPhone}</a>
                </li>
              )}
              {waDigits && (
                <li className="flex items-start gap-3">
                  <MessageCircle className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "var(--color-gold-dark)" }} />
                  <a href={`https://wa.me/${waDigits}`} target="_blank" rel="noopener noreferrer" className="footer-link text-sm font-body">WhatsApp {whatsappNumber?.trim()}</a>
                </li>
              )}
              {cleanEmail && (
                <li className="flex items-start gap-3">
                  <Mail className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "var(--color-gold-dark)" }} />
                  <a href={`mailto:${cleanEmail}`} className="footer-link text-sm font-body break-all">{cleanEmail}</a>
                </li>
              )}
            </ul>
            {socials.length > 0 && (
              <div className="flex gap-2.5 pt-1">
                {socials.map(({ Icon, href, label }) => (
                  <a key={label} href={href!.trim()} target="_blank" rel="noopener noreferrer" aria-label={label}
                    className="social-icon h-10 w-10 flex items-center justify-center rounded-full border transition-all duration-200 hover:scale-110 hover:-translate-y-0.5"
                    style={{ borderColor: "var(--color-parchment)", background: "white" }}>
                    <Icon className="h-4.5 w-4.5" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Gold divider ── */}
      <div className="gold-divider mx-6 lg:mx-12 opacity-50" />

      {/* ── Bottom bar ── */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] font-body" style={{ color: "var(--color-text-muted)" }}>
            © {new Date().getFullYear()} {siteName}. All rights reserved. Handcrafted with ♥ in India.
          </p>
          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {paymentMethods.map((m) => (
              <span key={m} className="text-[10px] font-body font-semibold px-2 py-0.5 rounded border" style={{ color: "var(--color-text-muted)", borderColor: "var(--color-parchment)", background: "white" }}>{m}</span>
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
