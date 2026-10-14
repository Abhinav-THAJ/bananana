"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export interface CuratedCollectionItem {
  id: string | number;
  name: string;
  description: string;
  imageSrc: string;
  slug: string;
  linkUrl: string;
}

interface CuratedCollectionsProps {
  collections: CuratedCollectionItem[];
}

export default function CuratedCollectionsSection({ collections }: CuratedCollectionsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const mouseStartX = useRef<number | null>(null);
  const isMouseDownRef = useRef(false);

  const total = collections?.length || 0;

  const goToNext = useCallback(() => {
    if (total === 0) return;
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const goToPrev = useCallback(() => {
    if (total === 0) return;
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Auto-scroll: advances to next collection continuously at normal smooth speed (3s)
  useEffect(() => {
    if (total <= 1) return;

    const timer = setInterval(() => {
      goToNext();
    }, 3000);

    return () => clearInterval(timer);
  }, [total, goToNext]);

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 35) {
      if (deltaX < 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Mouse drag support for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    isMouseDownRef.current = true;
    mouseStartX.current = e.clientX;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDownRef.current || mouseStartX.current === null) return;
    const deltaX = e.clientX - mouseStartX.current;
    if (Math.abs(deltaX) > 50) {
      if (deltaX < 0) {
        goToNext();
      } else {
        goToPrev();
      }
      mouseStartX.current = null;
      isMouseDownRef.current = false;
    }
  };

  const handleMouseUp = () => {
    isMouseDownRef.current = false;
    mouseStartX.current = null;
  };

  if (!collections || collections.length === 0) return null;

  const currentCol = collections[currentIndex];

  return (
    <section className="pt-0 md:pt-2 pb-10 md:pb-14 px-4 w-full overflow-hidden bg-brand-cream">
      <div className="max-w-6xl mx-auto">
        {/* Section Header: Exact Classical Roman Luxury Serif Matching Reference */}
        <div className="mb-4 sm:mb-5 md:mb-6 text-center">
          <h2
            className="text-2xl sm:text-3xl md:text-4xl text-brand-forest uppercase font-normal"
            style={{
              fontFamily: 'var(--font-cormorant-garamond), "Cormorant Garamond", Garamond, Georgia, serif',
              fontWeight: 400,
              letterSpacing: "0.14em",
              lineHeight: 1.2,
            }}
          >
            CURATED COLLECTIONS
          </h2>
          <div className="w-8 h-0.5 bg-brand-gold mt-1.5 mx-auto" />
        </div>

        {/* Showcase Card: Side-by-Side on Laptop (Image on Left, Text & CTA on Right), Stacked on Mobile */}
        <div className="max-w-md sm:max-w-lg md:max-w-3xl lg:max-w-4xl mx-auto">
          <div
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className="relative bg-white rounded-2xl border border-brand-charcoal/10 overflow-hidden shadow-sm p-3.5 sm:p-4 md:p-5 select-none cursor-grab active:cursor-grabbing"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3.5 md:gap-5 lg:gap-6 items-center">
              {/* Left Column on Laptop: Collection Image */}
              <div className="relative h-[280px] sm:h-[320px] md:h-[360px] lg:h-[390px] w-full rounded-xl overflow-hidden bg-brand-offwhite group">
                <Image
                  key={currentCol.imageSrc}
                  src={currentCol.imageSrc}
                  alt={currentCol.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 520px"
                  quality={100}
                  unoptimized
                  priority
                />
                <div className="absolute top-3 left-3 bg-brand-darkgreen/80 text-brand-cream text-[10px] sm:text-xs uppercase font-bold tracking-widest px-2.5 py-1 rounded-sm backdrop-blur-xs">
                  {String(currentIndex + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
                </div>
              </div>

              {/* Right Column on Laptop: Collection Details & Full-Width / Inline CTA */}
              <div className="flex flex-col justify-center py-0.5 sm:py-1 md:py-2 px-0.5 sm:px-1">
                <span
                  className="text-brand-gold-muted text-[9px] sm:text-[10px] md:text-[11px] uppercase font-bold tracking-[0.18em] block mb-0.5 sm:mb-1"
                  style={{ fontFamily: 'var(--font-inter), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                >
                  {currentCol.name.toLowerCase().includes("mund") ? "PREMIUM MUNDU" : "FEATURED COLLECTION"}
                </span>
                <h3
                  className="text-xl sm:text-2xl text-brand-forest font-semibold leading-snug mb-1"
                  style={{
                    fontFamily: 'var(--font-cormorant-garamond), "Cormorant Garamond", Garamond, Georgia, serif',
                    fontWeight: 600,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {currentCol.name}
                </h3>
                <p
                  className="text-xs sm:text-sm text-brand-charcoal/70 leading-relaxed mb-2.5 sm:mb-3 font-normal"
                  style={{
                    fontFamily: 'var(--font-inter), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontWeight: 400,
                    letterSpacing: "0.01em",
                  }}
                >
                  {currentCol.description}
                </p>
                <div className="pt-1">
                  <Link
                    href={currentCol.linkUrl}
                    className="flex md:inline-flex w-full md:w-auto items-center justify-center gap-2 bg-[#D99B26] hover:bg-brand-gold text-brand-forest font-bold py-2.5 sm:py-3 px-6 sm:px-7 rounded-md uppercase tracking-wider text-xs sm:text-[13px] shadow-xs hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 cursor-pointer group"
                    style={{
                      fontFamily: 'var(--font-plus-jakarta), "Outfit", sans-serif',
                      fontWeight: 700,
                      letterSpacing: "0.08em"
                    }}
                  >
                    <span>Shop Now</span>
                    <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Minimalist Progress Indicators */}
            <div className="flex justify-center items-center gap-2 mt-4 md:mt-6 pt-3 md:pt-4 border-t border-brand-charcoal/10">
              {collections.map((col, idx) => (
                <button
                  key={col.id}
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`Go to ${col.name}`}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${idx === currentIndex
                      ? "w-8 bg-brand-gold"
                      : "w-2 bg-brand-forest/20 hover:bg-brand-forest/40"
                    }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
