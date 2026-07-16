"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";

// --- Testimonial Carousel ---

const TESTIMONIALS = [
  {
    quote: "The quality is exceptional. It feels like wearing a piece of history, so incredibly lightweight and elegant.",
    author: "Priya M.",
    location: "Bangalore"
  },
  {
    quote: "Exactly like my grandmother's sarees. The traditional borders and the pure cotton feel bring back so many memories.",
    author: "Lakshmi R.",
    location: "Hyderabad"
  },
  {
    quote: "Beautiful weaving. You can instantly tell it is authentic handloom. Perfect for daily wear.",
    author: "Suma K.",
    location: "Chennai"
  }
];

export function TestimonialCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = () => setCurrentIndex((prev) => (prev + 1) % TESTIMONIALS.length);
  const prev = () => setCurrentIndex((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);

  return (
    <div className="bg-[#FAF8F4] py-24 border-y border-[#EAE4DA]">
      <div className="max-w-[800px] mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
        <Quote className="h-12 w-12 text-[#B8860B]/20 mx-auto mb-8" />
        
        <div className="min-h-[160px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="px-8"
            >
              <p className="text-xl md:text-3xl text-[#2B2118] leading-relaxed mb-8" style={{ fontFamily: "'Playfair Display', var(--font-heading), serif" }}>
                "{TESTIMONIALS[currentIndex].quote}"
              </p>
              <div className="flex flex-col items-center">
                <div className="flex text-[#B8860B] mb-3">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                  ))}
                </div>
                <p className="text-sm font-semibold font-body text-[#2B2118] uppercase tracking-widest">
                  {TESTIMONIALS[currentIndex].author}
                </p>
                <p className="text-xs text-[#444444] font-body mt-1">
                  {TESTIMONIALS[currentIndex].location}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between px-2 sm:-mx-12 pointer-events-none">
          <button onClick={prev} className="pointer-events-auto h-10 w-10 rounded-full bg-white border border-[#EAE4DA] flex items-center justify-center text-[#444444] hover:text-[#B8860B] hover:border-[#B8860B] transition-colors shadow-sm">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={next} className="pointer-events-auto h-10 w-10 rounded-full bg-white border border-[#EAE4DA] flex items-center justify-center text-[#444444] hover:text-[#B8860B] hover:border-[#B8860B] transition-colors shadow-sm">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Luxury Newsletter ---

export function LuxuryNewsletter() {
  return (
    <div className="relative py-24 overflow-hidden bg-[#2B2118]">
      {/* Woven Texture Overlay (simulated with CSS pattern) */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none" 
        style={{ 
          backgroundImage: "linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)",
          backgroundSize: "20px 20px",
          backgroundPosition: "0 0, 10px 10px" 
        }} 
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl text-white mb-6" style={{ fontFamily: "'Playfair Display', var(--font-heading), serif" }}>
          Stories from the Loom
        </h2>
        <p className="text-[#EAE4DA] font-body text-sm md:text-base leading-relaxed mb-10">
          Receive heritage stories, exclusive launches, and artisan interviews directly to your inbox.
        </p>

        <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
          <input 
            type="email" 
            placeholder="Your email address" 
            className="flex-1 bg-transparent border-b border-[#EAE4DA]/30 px-4 py-3 text-white placeholder:text-[#EAE4DA]/50 focus:outline-none focus:border-[#B8860B] transition-colors font-body text-sm rounded-none"
            required
          />
          <button 
            type="submit"
            className="bg-[#B8860B] text-white px-8 py-3 text-xs font-semibold font-body uppercase tracking-widest hover:bg-[#926A08] transition-colors sm:w-auto w-full"
          >
            Subscribe
          </button>
        </form>
      </div>
    </div>
  );
}
