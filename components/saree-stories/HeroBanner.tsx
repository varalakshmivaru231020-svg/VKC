"use client";

import { motion } from "framer-motion";
import { SmartImage } from "@/components/ui/SmartImage";
import Link from "next/link";

interface HeroBannerProps {
  title: string;
  subtitle?: string;
  imageUrl?: string | null;
  exploreRef?: React.RefObject<HTMLDivElement>;
}

export function HeroBanner({ title, subtitle, imageUrl, exploreRef }: HeroBannerProps) {
  return (
    <div className="relative w-full h-[70vh] min-h-[480px] max-h-[680px] flex flex-col items-center justify-center overflow-hidden bg-[#2B2118]">
      {/* Background Image or Premium Fallback */}
      {imageUrl ? (
        <div className="absolute inset-0 z-0">
          <SmartImage src={imageUrl} alt={title} fill objectFit="cover" />
        </div>
      ) : (
        <div
          className="absolute inset-0 z-0"
          style={{
            background: "radial-gradient(circle at 50% 30%, #4A3A28 0%, #2B2118 65%, #1A140D 100%)",
          }}
        >
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                "linear-gradient(45deg, #EAE4DA 25%, transparent 25%, transparent 75%, #EAE4DA 75%, #EAE4DA), linear-gradient(45deg, #EAE4DA 25%, transparent 25%, transparent 75%, #EAE4DA 75%, #EAE4DA)",
              backgroundSize: "24px 24px",
              backgroundPosition: "0 0, 12px 12px",
            }}
          />
        </div>
      )}

      {/* Dark Overlay */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/50 via-black/30 to-black/70" />

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="absolute top-6 left-0 right-0 z-20 max-w-[1200px] mx-auto px-4 sm:px-8">
        <ol className="flex items-center justify-center flex-wrap gap-2 text-[11px] uppercase tracking-widest font-body text-white/70">
          <li>
            <Link href="/" className="hover:text-white transition-colors duration-300">Home</Link>
          </li>
          <li className="text-white/40">/</li>
          <li>
            <Link href="/saree-stories" className="hover:text-white transition-colors duration-300">Saree Stories</Link>
          </li>
          <li className="text-white/40">/</li>
          <li aria-current="page" className="text-white">{title}</li>
        </ol>
      </nav>

      {/* Content */}
      <div className="relative z-20 text-center px-4 max-w-4xl mx-auto flex flex-col items-center">
        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-sm md:text-base font-body uppercase tracking-[0.3em] mb-4 text-[#EAE4DA]"
          >
            {subtitle}
          </motion.p>
        )}
        
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="text-4xl md:text-6xl lg:text-7xl text-white leading-tight mb-12"
          style={{ fontFamily: "'Playfair Display', var(--font-heading), serif" }}
        >
          {title}
        </motion.h1>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          onClick={() => exploreRef?.current?.scrollIntoView({ behavior: "smooth" })}
          className="group flex flex-col items-center gap-3 hover:opacity-80 transition-opacity duration-300"
        >
          <span className="text-[11px] font-body uppercase tracking-widest text-white/80">
            Explore Collection
          </span>
          <div className="w-px h-12 bg-gradient-to-b from-white/80 to-transparent group-hover:h-16 transition-all duration-500" />
        </motion.button>
      </div>
    </div>
  );
}
