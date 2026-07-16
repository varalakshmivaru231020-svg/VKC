"use client";

import { motion } from "framer-motion";

// --- Vertical Heritage Timeline ---

interface TimelineItem {
  year: string;
  title: string;
  description: string;
}

export function VerticalTimeline({ items }: { items?: TimelineItem[] }) {
  const displayItems = items?.length ? items : [
    { year: "1600s", title: "Local Weavers", description: "The tradition began with local artisans crafting everyday wear." },
    { year: "1630s", title: "Royal Patronage", description: "Chatrapati Shivaji Maharaj's camp settled in the region, bringing Maharashtrian influence." },
    { year: "1800s", title: "Traditional Borders", description: "The distinct interlocked weft technique for borders became prominent." },
    { year: "Today", title: "Modern Elegance", description: "Preserving heritage while adapting to contemporary tastes." }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl text-[#2B2118] mb-4" style={{ fontFamily: "'Playfair Display', var(--font-heading), serif" }}>
          Journey Through Time
        </h2>
        <div className="w-16 h-px bg-[#B8860B] mx-auto" />
      </div>

      <div className="relative">
        {/* Center Line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#EAE4DA] to-transparent -translate-x-1/2 hidden md:block" />

        <div className="space-y-12 md:space-y-24">
          {displayItems.map((item, idx) => {
            const isEven = idx % 2 === 0;
            return (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
                className={`flex flex-col md:flex-row items-center justify-between w-full ${isEven ? "md:flex-row-reverse" : ""}`}
              >
                {/* Desktop Empty Space */}
                <div className="hidden md:block md:w-5/12" />

                {/* Content Card */}
                <div className={`w-full md:w-5/12 flex justify-center ${isEven ? "md:justify-end" : "md:justify-start"}`}>
                  <div className="bg-white w-40 h-40 md:w-48 md:h-48 rounded-full shadow-sm border border-[#EAE4DA] hover:shadow-md transition-shadow flex flex-col items-center justify-center text-center p-6 overflow-hidden">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-[#B8860B] mb-1 block">
                      {item.year}
                    </span>
                    <h3 className="text-base md:text-lg text-[#2B2118] mb-1 leading-tight" style={{ fontFamily: "'Playfair Display', var(--font-heading), serif" }}>
                      {item.title}
                    </h3>
                    <p className="text-[10px] font-body text-[#444444] leading-snug line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// --- Horizontal Weaving Process ---

export function HorizontalProcess() {
  const steps = [
    { title: "Cotton", subtitle: "Sourcing" },
    { title: "Spinning", subtitle: "Yarn Prep" },
    { title: "Dyeing", subtitle: "Natural Colors" },
    { title: "Handloom", subtitle: "Weaving" },
    { title: "Finishing", subtitle: "Polishing" },
  ];

  return (
    <div className="bg-[#FAF8F4] py-24">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl text-[#2B2118] mb-4" style={{ fontFamily: "'Playfair Display', var(--font-heading), serif" }}>
            The Weaving Process
          </h2>
          <p className="text-sm uppercase tracking-widest text-[#B8860B] font-body">From Thread to Masterpiece</p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* Connecting Line */}
          <div className="absolute top-[30px] left-8 right-8 h-px bg-[#EAE4DA] hidden md:block" />
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className="relative flex flex-col items-center text-center group"
              >
                <div className="w-16 h-16 rounded-full bg-white border border-[#EAE4DA] flex items-center justify-center shadow-sm relative z-10 mb-6 group-hover:border-[#B8860B] transition-colors duration-300">
                  <span className="text-lg font-bold text-[#B8860B]" style={{ fontFamily: "'Playfair Display', var(--font-heading), serif" }}>
                    {idx + 1}
                  </span>
                </div>
                <h4 className="text-[#2B2118] font-semibold font-body text-base mb-1">
                  {step.title}
                </h4>
                <p className="text-[#444444] text-xs font-body tracking-wider uppercase">
                  {step.subtitle}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
