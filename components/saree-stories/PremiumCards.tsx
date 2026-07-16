"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Award, Leaf, Palette, Heart } from "lucide-react";

// --- Feature Cards ---

interface Feature {
  icon: string | React.ElementType;
  title: string;
  description: string;
}

interface FeatureCardsProps {
  features?: Feature[];
}

export function FeatureCards({ features }: FeatureCardsProps) {
  const displayFeatures: Feature[] = features?.length ? features : [
    { icon: Award, title: "Handwoven", description: "Made by skilled artisans" },
    { icon: Leaf, title: "Natural Cotton", description: "Breathable fabric" },
    { icon: Palette, title: "Traditional Borders", description: "Classic Temple Designs" },
    { icon: Heart, title: "Comfort", description: "Perfect for daily wear" },
  ];

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {displayFeatures.map((feat, idx) => {
          const Icon = typeof feat.icon === "string" ? Award : feat.icon; // fallback
          
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="group relative bg-white rounded-2xl p-8 border border-[#EAE4DA] shadow-sm hover:shadow-xl transition-all duration-300"
            >
              {/* Subtle top accent line that grows on hover */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#B8860B] rounded-t-2xl opacity-0 group-hover:opacity-100 scale-x-0 group-hover:scale-x-100 origin-left transition-all duration-300" />
              
              <div className="h-12 w-12 rounded-xl bg-[#FAF8F4] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Icon className="h-6 w-6 text-[#B8860B]" />
              </div>
              
              <h3 className="text-xl text-[#2B2118] mb-2 font-semibold font-body">
                {feat.title}
              </h3>
              
              <p className="text-sm text-[#444444] font-body leading-relaxed">
                {feat.description}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// --- Fact Counters ---

interface Fact {
  value: string | number;
  label: string;
}

export function FactCounters({ facts }: { facts?: Fact[] }) {
  const displayFacts = facts?.length ? facts : [
    { value: "200+", label: "Years of Heritage" },
    { value: "100%", label: "Handwoven" },
    { value: "Lightweight", label: "Daily Wear" },
    { value: "Telangana", label: "Made in" },
  ];

  return (
    <div className="bg-[#111] py-20 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none" style={{ backgroundImage: "radial-gradient(#B8860B 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
      
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 md:gap-12 lg:divide-x divide-white/10">
          {displayFacts.map((fact, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.15 }}
              className="flex flex-col items-center text-center px-2 sm:px-4"
            >
              <div
                className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl text-[#B8860B] mb-2 sm:mb-4 break-words"
                style={{ fontFamily: "'Playfair Display', var(--font-heading), serif" }}
              >
                {fact.value}
              </div>
              <div className="text-[10px] sm:text-xs md:text-sm uppercase tracking-[0.15em] sm:tracking-[0.2em] font-body text-[#EAE4DA]">
                {fact.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
