"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useInView, useReducedMotion } from "framer-motion";

/**
 * Shared kit for the heritage pages (About, Leadership, Founder).
 *
 * One flat palette — ivory, white, cream, ink — with gold used once per
 * section at most. One type scale. A handful of editorial blocks: label,
 * section head, photograph, timeline, numbered grid, definition list, call to
 * action. No gradients, no grain, no glows: the photographs and the words do
 * the work, and the three pages read as one family.
 */

export const C = {
  ivory: "#FFFBF4",
  white: "#FFFFFF",
  cream: "#FBF1DE",
  line: "#EADFCB",
  ink: "#2B1708",
  ink2: "#5C3A1E",
  muted: "#8A6A4E",
  gold: "#B8860B",
  jaggery: "#E0961C",
  dark: "#2B1708",
  onDark: "#FFFBF4",
  onDarkMuted: "rgba(255,251,244,0.72)",
  onDarkLine: "rgba(255,251,244,0.16)",
};

export const EASE = [0.22, 1, 0.36, 1] as const;

/* One type scale for all three pages. */
export const T = {
  display: { fontFamily: "var(--font-heading)", fontSize: "clamp(2.6rem,5.4vw,4.6rem)", lineHeight: 1.02, letterSpacing: "-0.025em", fontWeight: 500 } as React.CSSProperties,
  h2: { fontFamily: "var(--font-heading)", fontSize: "clamp(1.9rem,3.4vw,2.9rem)", lineHeight: 1.08, letterSpacing: "-0.02em", fontWeight: 500 } as React.CSSProperties,
  h3: { fontFamily: "var(--font-heading)", fontSize: "clamp(1.35rem,2vw,1.7rem)", lineHeight: 1.15, fontWeight: 500 } as React.CSSProperties,
  quote: { fontFamily: "var(--font-heading)", fontSize: "clamp(1.4rem,2.2vw,1.9rem)", lineHeight: 1.35, fontWeight: 500 } as React.CSSProperties,
  lede: { fontSize: 18, lineHeight: 1.7 } as React.CSSProperties,
  body: { fontSize: 16.5, lineHeight: 1.75 } as React.CSSProperties,
  small: { fontSize: 14.5, lineHeight: 1.65 } as React.CSSProperties,
  label: { fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 600 } as React.CSSProperties,
};

/* The milestones every page draws on — the facts, once. */
export const MILESTONES = [
  { year: "1988", t: "M/s Vairamudi Krupa Crusher", d: "Late Shri B Ramachandra sets up a sugarcane crusher in Mandya — the proprietorship that remains the base of the business." },
  { year: "Since", t: "A trusted local name", d: "Decades of purity, hard work and fair dealing with the farmers who grow the cane." },
  { year: "2025", t: "VKC Jaggery & Beverages Pvt. Ltd.", d: "Incorporated on 12 December 2025 for the next phase of structured growth; the proprietorship stays central." },
  { year: "Ahead", t: "Technology upgradation", d: "A proposed 50 TCD fully automatic, thermic-fluid-based jaggery and cane-juice processing unit." },
];

/* Fade-and-rise on scroll; honours reduced motion. */
export function Reveal({ children, className = "", delay = 0, style }: { children: React.ReactNode; className?: string; delay?: number; style?: React.CSSProperties }) {
  const reduced = useReducedMotion();
  return (
    <motion.div className={className} style={style} initial={reduced ? false : { opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "0px 0px -8% 0px" }} transition={{ duration: 0.8, ease: EASE, delay }}>
      {children}
    </motion.div>
  );
}

/* Word-by-word headline reveal. The container is observed, never the moving
   words, so a heading cannot get stuck invisible. */
export function Words({ text, className = "", style }: { text: string; className?: string; style?: React.CSSProperties }) {
  const reduced = useReducedMotion();
  const words = text.split(" ");
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  const shown = reduced || inView;
  return (
    <span ref={ref} className={className} style={style} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom" style={{ paddingBottom: "0.12em", marginBottom: "-0.12em" }}>
          <motion.span aria-hidden className="inline-block" initial={reduced ? false : { y: "110%", opacity: 0 }} animate={shown ? { y: 0, opacity: 1 } : { y: "110%", opacity: 0 }} transition={{ duration: 0.8, ease: EASE, delay: 0.05 + i * 0.05 }}>
            {w}
          </motion.span>
        </span>
      )).reduce<React.ReactNode[]>((acc, el, i) => (i ? [...acc, " ", el] : [el]), [])}
    </span>
  );
}

/* Small-caps label with a short gold rule — the one gold moment per section. */
export function Label({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-3 font-body" style={{ ...T.label, color: light ? C.jaggery : C.gold }}>
      <span aria-hidden style={{ width: 24, height: 1, background: light ? C.jaggery : C.gold }} />
      {children}
    </span>
  );
}

/* A section: flat background, one container, consistent vertical rhythm. */
export function Section({ children, bg = "ivory", id, ariaLabelledby, tight = false, className = "" }: {
  children: React.ReactNode; bg?: "ivory" | "white" | "cream" | "dark"; id?: string; ariaLabelledby?: string; tight?: boolean; className?: string;
}) {
  const background = bg === "white" ? C.white : bg === "cream" ? C.cream : bg === "dark" ? C.dark : C.ivory;
  return (
    <section id={id} aria-labelledby={ariaLabelledby} className={className} style={{ background, borderTop: bg === "white" ? `1px solid ${C.line}` : undefined }}>
      <div className={`max-w-[1200px] mx-auto px-5 sm:px-8 ${tight ? "py-16 sm:py-20" : "py-20 sm:py-28"}`}>{children}</div>
    </section>
  );
}

export function SectionHead({ label, title, lede, light = false, center = false, id, size = "h2" }: {
  label?: string; title: string; lede?: string; light?: boolean; center?: boolean; id?: string; size?: "h2" | "display";
}) {
  return (
    <div className={center ? "text-center max-w-3xl mx-auto" : "max-w-3xl"}>
      {label && <Label light={light}>{label}</Label>}
      <h2 id={id} className={label ? "mt-5" : ""} style={{ ...(size === "display" ? T.display : T.h2), color: light ? C.onDark : C.ink }}>
        <Words text={title} />
      </h2>
      {lede && (
        <p className="font-body mt-5" style={{ ...T.lede, color: light ? C.onDarkMuted : C.ink2, maxWidth: 640, margin: center ? "1.25rem auto 0" : undefined, textAlign: center ? "center" : undefined }}>
          {lede}
        </p>
      )}
    </div>
  );
}

/* A photograph, full-bleed in its frame, no mount and no border. Portraits
   anchor to the top so faces stay in frame. An optional name and role sit at
   the foot on a soft scrim. */
export function Photo({ src, alt, ratio = "4 / 5", priority = false, sizes = "(max-width: 1024px) 92vw, 46vw", name, role, className = "" }: {
  src: string; alt: string; ratio?: string; priority?: boolean; sizes?: string; name?: string; role?: string; className?: string;
}) {
  return (
    <figure className={`relative m-0 overflow-hidden ${className}`} style={{ aspectRatio: ratio, background: C.cream, borderRadius: 4 }}>
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover object-top" />
      {name && (
        <figcaption className="absolute inset-x-0 bottom-0 p-5 sm:p-6" style={{ background: "linear-gradient(180deg, rgba(43,23,8,0) 0%, rgba(43,23,8,0.62) 100%)" }}>
          <div style={{ ...T.h3, color: C.onDark }}>{name}</div>
          {role && <div className="font-body mt-1" style={{ ...T.label, color: C.jaggery }}>{role}</div>}
        </figcaption>
      )}
    </figure>
  );
}

/* Milestones on one rule: four columns on desktop, a left rule on phones. */
export function Timeline({ items, light = false }: { items: { year: string; t: string; d: string; href?: string; cta?: string }[]; light?: boolean }) {
  const line = light ? C.onDarkLine : C.line;
  return (
    <ol className="list-none m-0 p-0 grid md:grid-cols-4 gap-x-8 gap-y-10 relative" style={{ borderTop: `1px solid ${line}` }}>
      {items.map((m, i) => (
        <Reveal key={m.t} delay={i * 0.08}>
          <li className="relative pt-7">
            <span aria-hidden className="absolute left-0 -top-[4px] h-[7px] w-[7px] rounded-full" style={{ background: C.gold }} />
            <div style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.9rem,3vw,2.6rem)", lineHeight: 1, color: light ? C.onDark : C.ink, letterSpacing: "-0.02em" }}>{m.year}</div>
            <div className="font-body mt-4 font-semibold" style={{ fontSize: 15.5, lineHeight: 1.35, color: light ? C.onDark : C.ink }}>{m.t}</div>
            <p className="font-body mt-2" style={{ ...T.small, color: light ? C.onDarkMuted : C.ink2 }}>{m.d}</p>
            {m.href && m.cta && (
              <Link href={m.href} className="mt-3 inline-flex items-center gap-2 font-body font-semibold" style={{ fontSize: 13.5, color: C.gold }}>
                {m.cta} <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </li>
        </Reveal>
      ))}
    </ol>
  );
}

/* Numbered items in a grid: a small gold number, a serif title, one line. */
export function NumberGrid({ items, cols = 3, light = false }: { items: { t: string; d: string }[]; cols?: 2 | 3 | 4; light?: boolean }) {
  const colsClass = cols === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : cols === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3";
  return (
    <ol className={`list-none m-0 p-0 grid ${colsClass} gap-x-10 gap-y-12`}>
      {items.map((it, i) => (
        <Reveal key={it.t} delay={i * 0.06}>
          <li className="pt-6" style={{ borderTop: `1px solid ${light ? C.onDarkLine : C.line}` }}>
            <div className="font-body tabular-nums" style={{ ...T.label, color: C.gold }}>0{i + 1}</div>
            <h3 className="mt-4" style={{ ...T.h3, color: light ? C.onDark : C.ink }}>{it.t}</h3>
            <p className="font-body mt-3" style={{ ...T.small, color: light ? C.onDarkMuted : C.ink2 }}>{it.d}</p>
          </li>
        </Reveal>
      ))}
    </ol>
  );
}

/* Rows of term and value, ruled. */
export function Facts({ rows, light = false }: { rows: [string, string][]; light?: boolean }) {
  return (
    <dl className="m-0">
      {rows.map(([k, v]) => (
        <div key={k} className="grid grid-cols-[120px_1fr] sm:grid-cols-[160px_1fr] gap-4 py-4" style={{ borderTop: `1px solid ${light ? C.onDarkLine : C.line}` }}>
          <dt className="font-body" style={{ ...T.label, color: light ? C.onDarkMuted : C.muted, paddingTop: 3 }}>{k}</dt>
          <dd className="m-0 font-body" style={{ ...T.body, color: light ? C.onDark : C.ink }}>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/* Pill buttons. */
export function Button({ href, children, variant = "primary" }: { href: string; children: React.ReactNode; variant?: "primary" | "outline" | "outlineLight" }) {
  const styles: React.CSSProperties =
    variant === "primary"
      ? { background: C.jaggery, color: C.ink }
      : variant === "outline"
        ? { border: `1px solid ${C.ink}`, color: C.ink }
        : { border: "1px solid rgba(255,251,244,0.4)", color: C.onDark };
  return (
    <Link href={href} className="group inline-flex items-center gap-2 px-6 rounded-full font-body font-semibold text-sm transition-transform duration-300 hover:-translate-y-0.5" style={{ height: 50, ...styles }}>
      {children}
      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
    </Link>
  );
}

/* Closing call to action: flat dark, centred. */
export function Cta({ label, title, lede, primary, secondary, children }: {
  label?: string; title: string; lede?: string; primary: { href: string; label: string }; secondary?: { href: string; label: string }; children?: React.ReactNode;
}) {
  return (
    <Section bg="dark">
      <div className="text-center max-w-3xl mx-auto">
        {label && <Label light>{label}</Label>}
        <h2 className={label ? "mt-5" : ""} style={{ ...T.h2, color: C.onDark }}>
          <Words text={title} />
        </h2>
        {lede && <p className="font-body mt-5 mx-auto" style={{ ...T.lede, color: C.onDarkMuted, maxWidth: 560, textAlign: "center" }}>{lede}</p>}
        <Reveal delay={0.2}>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Button href={primary.href}>{primary.label}</Button>
            {secondary && <Button href={secondary.href} variant="outlineLight">{secondary.label}</Button>}
          </div>
          {children}
        </Reveal>
      </div>
    </Section>
  );
}
