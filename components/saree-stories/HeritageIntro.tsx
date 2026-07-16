"use client";

import { motion } from "framer-motion";
import { SmartImage } from "@/components/ui/SmartImage";
import { Check } from "lucide-react";

interface HeritageIntroProps {
  title: string;
  subtitle: string;
  content: string;
  imageUrl?: string | null;
  features?: string[];
}

export function HeritageIntro({ title, subtitle, content, imageUrl, features = [] }: HeritageIntroProps) {
  // If no specific features are passed, try to generate some from content or use defaults for the visual demo
  const displayFeatures = features.length > 0 ? features : [
    "Lightweight",
    "Pure Cotton",
    "Traditional Borders",
    "Everyday Luxury"
  ];

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
        
        {/* Left: Large Image */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative aspect-[4/5] rounded-[24px] overflow-hidden shadow-2xl"
          style={{ background: "var(--color-cream)" }}
        >
          {imageUrl ? (
            <SmartImage src={imageUrl} alt={title} fill objectFit="cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#EAE4DA] to-[#D5C9B3]" />
          )}
        </motion.div>

        {/* Right: Content */}
        <div className="flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 
              className="text-4xl md:text-5xl lg:text-6xl text-[#2B2118] mb-4"
              style={{ fontFamily: "'Playfair Display', var(--font-heading), serif" }}
            >
              {title}
            </h2>
            <p className="text-sm md:text-base font-body uppercase tracking-[0.2em] mb-8 text-[#B8860B]">
              {subtitle}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <p className="text-base md:text-lg text-[#444444] leading-relaxed mb-10 font-body">
              {content || "Discover the rich history, exceptional craftsmanship, and timeless elegance woven into every thread."}
            </p>
          </motion.div>

          <motion.ul 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.1 }
              }
            }}
            className="space-y-4"
          >
            {displayFeatures.map((feature, idx) => (
              <motion.li 
                key={idx}
                variants={{
                  hidden: { opacity: 0, x: -10 },
                  visible: { opacity: 1, x: 0 }
                }}
                className="flex items-center gap-4 text-sm md:text-base font-body text-[#444444]"
              >
                <div className="h-6 w-6 rounded-full bg-[#FAF8F4] border border-[#EAE4DA] flex items-center justify-center shadow-sm shrink-0">
                  <Check className="h-3.5 w-3.5 text-[#B8860B]" />
                </div>
                {feature}
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </div>
    </div>
  );
}
