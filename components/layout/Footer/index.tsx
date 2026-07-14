import Link from "next/link";
import { Instagram, Facebook, Youtube, Mail, Phone } from "lucide-react";
import { NewsletterForm } from "./NewsletterForm";

type FooterLink = { label: string; href: string };

const DEFAULT_SHOP_LINKS: FooterLink[] = [
  { label: "New Arrivals",       href: "/new-arrivals" },
  { label: "Kanjivaram Sarees",  href: "/category/kanjivaram" },
  { label: "Banarasi Sarees",    href: "/category/banarasi" },
  { label: "Cotton Sarees",      href: "/category/cotton" },
  { label: "Wedding Collection", href: "/shop?occasion=wedding" },
  { label: "Sale",               href: "/shop?sale=true" },
];

const DEFAULT_HELP_LINKS: FooterLink[] = [
  { label: "About Us",          href: "/about" },
  { label: "Contact Us",        href: "/contact" },
  { label: "Blog",              href: "/blog" },
  { label: "Shipping Policy",   href: "/shipping" },
  { label: "Return & Exchange", href: "/returns" },
  { label: "Size Guide",        href: "/size-guide" },
  { label: "Care Instructions", href: "/care" },
  { label: "Track Order",       href: "/account/orders" },
];

const DEFAULT_ACCOUNT_LINKS: FooterLink[] = [
  { label: "My Account",      href: "/account" },
  { label: "My Orders",       href: "/account/orders" },
  { label: "Wishlist",        href: "/account/wishlist" },
  { label: "Saved Addresses", href: "/account/addresses" },
];

const paymentMethods = ["Visa", "Mastercard", "UPI", "NetBanking", "EMI", "COD"];

interface FooterProps {
  siteName?: string;
  tagline?: string;
  logoUrl?: string | null;
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

export function Footer({
  siteName = "Vijaylakshmi Sarees",
  tagline = "Timeless Weaves. Modern Souls.",
  logoUrl,
  phone = "+91 98765 43210",
  email = "care@vijaylakshmi.in",
  whatsappNumber,
  instagram,
  facebook,
  youtube,
  shopLinks    = DEFAULT_SHOP_LINKS,
  helpLinks    = DEFAULT_HELP_LINKS,
  accountLinks = DEFAULT_ACCOUNT_LINKS,
}: FooterProps) {
  const [firstName, ...rest] = siteName.split(" ");

  return (
    <footer className="mt-auto" style={{ background: "var(--color-cream)" }}>

      {/* ── Newsletter strip ── */}
      <div
        className="relative overflow-hidden py-16 px-4"
        style={{ background: "var(--color-primary)" }}
      >
        {/* Subtle decorative rings */}
        <div className="absolute -left-20 -top-20 w-80 h-80 rounded-full pointer-events-none opacity-[0.04]"
          style={{ border: "60px solid var(--color-gold)" }} />
        <div className="absolute -right-20 -bottom-20 w-96 h-96 rounded-full pointer-events-none opacity-[0.04]"
          style={{ border: "60px solid var(--color-gold)" }} />

        <div className="relative max-w-xl mx-auto text-center space-y-3">
          <span className="text-xs font-semibold tracking-[0.18em] uppercase font-body" style={{ color: "#FFFFFF" }}>
            Stay in the Loop
          </span>
          <p
            className="text-3xl"
            style={{ fontFamily: "var(--font-heading)", fontWeight: "var(--weight-heading)", color: "#FFFFFF" }}
          >
            Stories from the Loom
          </p>
          <p className="text-sm font-body" style={{ color: "#FFFFFF" }}>
            New arrivals, exclusive offers, and weaving stories — straight to your inbox.
          </p>
          <NewsletterForm />
        </div>
      </div>

      {/* ── Main columns ── */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-10">

          {/* Brand */}
          <div className="col-span-2 md:col-span-4 space-y-5">
            <div>
              {logoUrl ? (
                <Link href="/">
                  <img
                    src={logoUrl}
                    alt={siteName}
                    className="object-contain"
                    style={{ maxHeight: 96, maxWidth: 280 }}
                  />
                </Link>
              ) : (
                <p
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontWeight: "var(--weight-heading)",
                    fontSize: "1.6rem",
                    color: "var(--color-primary)",
                    lineHeight: 1.1,
                  }}
                >
                  {firstName}
                  {rest.length > 0 && (
                    <><br /><span style={{ fontSize: "1.1rem", color: "var(--color-text-secondary)" }}>{rest.join(" ")}</span></>
                  )}
                </p>
              )}
              {/* Gold accent */}
              <div className="mt-2 h-0.5 w-12" style={{ background: "linear-gradient(90deg, var(--color-gold), transparent)" }} />
            </div>
            <p className="text-sm leading-relaxed max-w-[240px] font-body" style={{ color: "var(--color-text-muted)" }}>
              {tagline} Celebrating India's master weavers since 1968.
            </p>
            {/* Social */}
            <div className="flex gap-2.5">
              {[
                { Icon: Instagram, href: instagram, label: "Instagram" },
                { Icon: Facebook,  href: facebook,  label: "Facebook" },
                { Icon: Youtube,   href: youtube,   label: "YouTube" },
              ].filter(s => s.href).map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href!}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="social-icon h-9 w-9 flex items-center justify-center rounded-full border transition-all duration-200"
                  style={{ borderColor: "var(--color-parchment)", color: "var(--color-text-muted)" }}
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
            {/* Contact snippets */}
            <div className="space-y-2 pt-1">
              {[
                { Icon: Phone,  text: phone, href: phone ? `tel:${phone.replace(/\s/g, "")}` : null },
                { Icon: Mail,   text: email, href: email ? `mailto:${email}` : null },
                ...(whatsappNumber ? [{ Icon: Phone, text: `WhatsApp: ${whatsappNumber}`, href: `https://wa.me/${whatsappNumber.replace(/\D/g, "")}` }] : []),
              ].filter(c => c.text && c.href).map(({ Icon, text, href }) => (
                <a
                  key={href}
                  href={href!}
                  className="footer-contact-item flex items-center gap-2.5 group w-fit"
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 transition-colors duration-150" style={{ color: "var(--color-gold)" }} />
                  <span className="text-xs font-body transition-colors duration-150" style={{ color: "var(--color-text-muted)" }}>
                    {text}
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Shop */}
          <div className="col-span-1 md:col-span-2 space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] font-body" style={{ color: "var(--color-text-primary)" }}>Shop</p>
            <ul className="space-y-2.5">
              {shopLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="footer-link text-sm font-body">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div className="col-span-1 md:col-span-3 space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] font-body" style={{ color: "var(--color-text-primary)" }}>Help</p>
            <ul className="space-y-2.5">
              {helpLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="footer-link text-sm font-body">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div className="col-span-1 md:col-span-3 space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] font-body" style={{ color: "var(--color-text-primary)" }}>Account</p>
            <ul className="space-y-2.5">
              {accountLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="footer-link text-sm font-body">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
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

          {/* Payment methods */}
          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {paymentMethods.map((m) => (
              <span
                key={m}
                className="text-[10px] font-body font-semibold px-2 py-0.5 rounded border"
                style={{
                  color: "var(--color-text-muted)",
                  borderColor: "var(--color-parchment)",
                  background: "white",
                }}
              >
                {m}
              </span>
            ))}
          </div>

          {/* Policy links */}
          <div className="flex items-center gap-4">
            {[{ label: "Privacy", href: "/privacy" }, { label: "Terms", href: "/terms" }].map((item) => (
              <Link key={item.label} href={item.href} className="footer-link text-[11px] font-body">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
