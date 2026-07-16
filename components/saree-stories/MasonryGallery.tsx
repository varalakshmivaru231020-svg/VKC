"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SmartImage } from "@/components/ui/SmartImage";
import { X, ZoomIn } from "lucide-react";

interface MediaItem {
  id: string;
  url: string;
  type: string;
  altText?: string | null;
}

export function MasonryGallery({ media }: { media: MediaItem[] }) {
  const [selectedImage, setSelectedImage] = useState<MediaItem | null>(null);

  if (!media || media.length === 0) return null;

  // Simple grouping for a masonry look: a large featured image, followed by a grid of smaller ones
  const featured = media[0];
  const rest = media.slice(1);

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl text-[#2B2118] mb-4" style={{ fontFamily: "'Playfair Display', var(--font-heading), serif" }}>
          Visual Journey
        </h2>
        <div className="w-16 h-px bg-[#B8860B] mx-auto" />
      </div>

      <div className="flex flex-col gap-4 md:gap-6">
        {/* Featured Large Image */}
        {featured && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative w-full aspect-video md:aspect-[21/9] rounded-2xl overflow-hidden cursor-pointer group"
            onClick={() => setSelectedImage(featured)}
          >
            <SmartImage src={featured.url} alt={featured.altText || "Gallery Image"} fill objectFit="cover" className="group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
              <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 h-8 w-8 drop-shadow-md" />
            </div>
          </motion.div>
        )}

        {/* Grid for the rest */}
        {rest.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {rest.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className={`relative w-full rounded-2xl overflow-hidden cursor-pointer group ${idx === 0 && rest.length === 3 ? "md:col-span-2 aspect-video" : "aspect-square"}`}
                onClick={() => setSelectedImage(item)}
              >
                <SmartImage src={item.url} alt={item.altText || "Gallery Image"} fill objectFit="cover" className="group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                  <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 h-6 w-6 drop-shadow-md" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-12"
            onClick={() => setSelectedImage(null)}
          >
            <button 
              className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors"
              onClick={() => setSelectedImage(null)}
            >
              <X className="h-8 w-8" />
            </button>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full h-full max-w-6xl max-h-screen rounded-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <SmartImage src={selectedImage.url} alt={selectedImage.altText || "Gallery Image"} fill objectFit="contain" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
