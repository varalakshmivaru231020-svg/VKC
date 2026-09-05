"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";

/* Palette shared with the About page. */
const C = {
  bark:        "#3A1F0A",
  jaggery:     "#E0961C",
  jaggeryDark: "#9A5B0B",
  jaggeryLite: "#FFD65C",
  cream:       "#FBF1DE",
  ivory:       "#FFFBF4",
  parchment:   "#F0DCB6",
  ink:         "#2B1708",
  ink2:        "#5C3A1E",
  muted:       "#8A6A4E",
};
const EASE = [0.22, 1, 0.36, 1] as const;

const LEADERS = [
  { name: "Late Shri B Ramachandra", role: "Founder · In Loving Memory", photo: "/images/team/ramachandra-b.webp", bio: "The visionary strength behind our family legacy, whose values of hard work, integrity and perseverance laid the foundation for our business journey." },
  { name: "Mr. Naveenchandra B R", role: "Managing Director", photo: "/images/team/naveenchandra-b-r.webp", bio: "Following the legacy of Late Shri B Ramachandra, he now leads both the proprietorship and the private limited company with a clear focus on continuity, growth and modernisation." },
  { name: "Mr. Abhishek B R", role: "Director", photo: "/images/team/abhishek-b-r.webp", bio: "Contributes to the growth of the business with dedication, energy and a progressive approach — supporting the family legacy with commitment and operational focus." },
  { name: "Mrs. Pushpalatha", role: "Promoter Director", photo: "/images/team/pushpalatha.webp", bio: "A pillar of strength in our family journey, standing with unwavering support through every challenge and preserving the unity, resilience and values behind our legacy." },
];

const MD_PROFILE = [
  "Naveenchandra B R now leads the VKC legacy forward with a clear commitment to purity, trust and long-term growth. Carrying the values established by Late Shri B Ramachandra, he represents the next chapter of the business with a practical, disciplined and forward-looking approach. His leadership is focused on preserving what matters most — credibility, quality and relationships — while building a stronger and more structured future for the brand.",
  "Under his direction, the business continues to strengthen its foundation through formal registrations, quality awareness, and ongoing learning in food safety, compliance and product-related knowledge. This leadership style reflects both continuity and progress: loyal to the roots, but unafraid to modernise where needed.",
];

function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const reduced = useReducedMotion();
  return (
    <motion.div className={className} initial={reduced ? false : { opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "0px 0px -10% 0px" }} transition={{ duration: 0.9, ease: EASE, delay }}>
      {children}
    </motion.div>
  );
}

function Eyebrow({ children, color = C.jaggeryDark }: { children: React.ReactNode; color?: string }) {
  return (
    <span className="inline-flex items-center gap-3 font-body font-semibold uppercase" style={{ fontSize: 11, letterSpacing: "0.24em", color }}>
      <span style={{ width: 28, height: 1, background: color, display: "inline-block" }} />
      {children}
    </span>
  );
}

/* ── Team card ─────────────────────────────────────────────────────────────
   The whole portrait is shown (object-fit: contain in a 3:4 frame) — nothing
   is cropped and nothing sits over the face. The card tilts gently with the
   cursor; the photo drifts a few pixels the other way for depth. */
function TeamCard({ name, role, photo, bio, index }: { name: string; role: string; photo: string; bio: string; index: number }) {
  const reduced = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const spring = { stiffness: 160, damping: 18, mass: 0.6 };
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [6, -6]), spring);
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-8, 8]), spring);
  const photoX = useSpring(useTransform(mx, [-0.5, 0.5], [-6, 6]), spring);
  const photoY = useSpring(useTransform(my, [-0.5, 0.5], [-6, 6]), spring);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduced) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => { mx.set(0); my.set(0); };

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.9, ease: EASE, delay: index * 0.1 }}
      style={{ perspective: 1200 }}
      className="h-full"
    >
      <motion.div onMouseMove={onMove} onMouseLeave={onLeave} style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="group relative h-full rounded-lg overflow-hidden flex flex-col" >
        <div className="absolute inset-0" style={{ background: "white", border: `1px solid ${C.parchment}`, borderRadius: 12 }} />

        {/* Portrait: full image, no crop, no overlay. */}
        <div className="relative m-3 rounded-lg overflow-hidden" style={{ aspectRatio: "3 / 4", background: `linear-gradient(180deg, ${C.cream}, ${C.ivory})`, transform: "translateZ(24px)" }}>
          <motion.div className="absolute inset-[6px]" style={{ x: photoX, y: photoY }}>
            <Image src={photo} alt={name} fill sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 22vw" className="object-contain object-center" priority={index < 2} />
          </motion.div>
          <span aria-hidden className="absolute top-3 right-3 h-8 w-8 rounded-full grid place-items-center font-heading transition-transform duration-500 group-hover:rotate-[360deg]" style={{ fontSize: 12, background: C.jaggery, color: C.bark }}>
            0{index + 1}
          </span>
        </div>

        {/* Name, role and bio sit below the photo so the face is never covered. */}
        <div className="relative px-6 pb-6 pt-2 flex-1 flex flex-col" style={{ transform: "translateZ(16px)" }}>
          <div className="font-heading" style={{ fontSize: 23, lineHeight: 1.1, color: C.ink }}>{name}</div>
          <div className="font-body mt-1.5 uppercase" style={{ fontSize: 10.5, letterSpacing: "0.16em", color: C.jaggeryDark }}>{role}</div>
          <p className="font-body mt-3" style={{ fontSize: 14.5, lineHeight: 1.65, color: C.ink2, textAlign: "left", hyphens: "none" }}>{bio}</p>
          <span className="block mt-4 h-[2px] w-8 origin-left transition-transform duration-500 group-hover:scale-x-[3]" style={{ background: C.jaggery }} />
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function LeadershipExperience({ bannerImage = null, bannerAlt = "" }: { bannerImage?: string | null; bannerAlt?: string }) {
  return (
    <div className="vkc-about" style={{ background: C.ivory }}>
      <style dangerouslySetInnerHTML={{ __html: ".marketing-layout .vkc-about p{text-align:left;hyphens:none;text-justify:auto}.marketing-layout .vkc-about .text-center p{text-align:center}" }} />

      {/* Header band — centred like the Contact page; an admin banner
          (Admin → Banners → "Leadership — Header Banner") sits behind it. */}
      <section className="relative overflow-hidden border-b" style={{ background: C.cream, borderColor: C.parchment }} aria-label={bannerAlt || undefined}>
        {bannerImage && (
          <>
            <img src={bannerImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(58,31,10,0.78) 0%, rgba(58,31,10,0.62) 60%, rgba(58,31,10,0.82) 100%)" }} />
          </>
        )}
        <div className="relative max-w-[1240px] mx-auto px-5 sm:px-8 py-16 sm:py-20 text-center">
          <Reveal>
            <span className="font-body font-semibold uppercase" style={{ fontSize: 12, letterSpacing: "0.18em", color: bannerImage ? C.jaggeryLite : C.jaggery }}>Our Core Team</span>
            <h1 className="font-heading mt-3 mx-auto lg:whitespace-nowrap" style={{ fontSize: "clamp(2rem,3.6vw,3.4rem)", lineHeight: 1.1, letterSpacing: "-0.015em", color: bannerImage ? C.ivory : C.ink }}>
              The family behind VKC Gold Ikshu
            </h1>
            <p className="font-body mt-3 mx-auto" style={{ fontSize: 16.5, lineHeight: 1.7, color: bannerImage ? "rgba(255,251,244,0.85)" : C.muted, maxWidth: 640, textAlign: "center" }}>
              Founded in legacy by Late Shri B Ramachandra. Now led by Naveenchandra B R.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Team */}
      <section className="max-w-[1240px] mx-auto px-5 sm:px-8 py-16 sm:py-24">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {LEADERS.map((l, i) => <TeamCard key={l.name} index={i} {...l} />)}
        </div>

        {/* Managing Director's profile */}
        <Reveal delay={0.1}>
          <div className="mt-12 rounded-lg p-8 sm:p-10 grid lg:grid-cols-12 gap-8" style={{ background: C.cream, border: `1px solid ${C.parchment}` }}>
            <div className="lg:col-span-4">
              <Eyebrow>Leadership profile</Eyebrow>
              <h2 className="font-heading mt-4" style={{ fontSize: "clamp(1.6rem,2.6vw,2.2rem)", lineHeight: 1.1, color: C.ink }}>Naveenchandra B R</h2>
              <div className="font-body mt-1.5 uppercase" style={{ fontSize: 11.5, letterSpacing: "0.16em", color: C.jaggeryDark }}>Managing Director</div>
            </div>
            <div className="lg:col-span-8 space-y-4 font-body" style={{ fontSize: 16, lineHeight: 1.8, color: C.ink2 }}>
              {MD_PROFILE.map((p) => <p key={p.slice(0, 24)}>{p}</p>)}
            </div>
          </div>
        </Reveal>

        {/* Compliance & learning */}
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {[
            { href: "/credentials#learning", eyebrow: "Quality, Learning & Compliance", title: "Continuous learning in food safety and compliance", desc: "Training records in FSSAI regulations, food labelling, licensing, FSSC awareness and jaggery business development — presented as learning, not as licences." },
            { href: "/credentials#registrations", eyebrow: "Registrations & Compliance", title: "A business framework built on proper structure", desc: "Company incorporation, enterprise registration and the operating records that support our journey." },
          ].map((c, i) => (
            <Reveal key={c.href} delay={i * 0.08}>
              <Link href={c.href} className="group block h-full rounded-lg p-7 sm:p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg" style={{ background: "white", border: `1px solid ${C.parchment}` }}>
                <Eyebrow>{c.eyebrow}</Eyebrow>
                <h3 className="font-heading mt-4" style={{ fontSize: 24, lineHeight: 1.12, color: C.ink }}>{c.title}</h3>
                <p className="font-body mt-3" style={{ fontSize: 14.5, lineHeight: 1.7, color: C.ink2 }}>{c.desc}</p>
                <span className="mt-5 inline-flex items-center gap-2 font-body font-semibold" style={{ fontSize: 13.5, color: C.jaggeryDark }}>
                  Read more <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/about" className="inline-flex items-center gap-2 font-body font-semibold text-sm rounded-full px-6" style={{ height: 46, border: `1px solid ${C.jaggery}66`, color: C.jaggeryDark }}>
            Read our story <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
