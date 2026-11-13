"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

const INTERVAL_MS = 6500;

const SLIDES = [
  {
    id: "construction",
    label: "Construction",
    title: "Digital safety board on the gate",
    text: "Induction, first aiders and F10 — without names on a public screen.",
    hook: "CDM 2015",
    src: "/images/hero-site-board.jpg",
    alt: "Two construction workers looking at a digital safety board at a UK site entrance",
  },
  {
    id: "salon",
    label: "Hair and beauty",
    title: "Colour, bleach and skin",
    text: "A salon still needs COSHH assessments for the chemicals stylists use every day.",
    hook: "COSHH 2002",
    src: "/images/hero-salon-board.jpg",
    alt: "Two hairdressers in a salon looking at a safety screen beside colour and bleach",
  },
  {
    id: "kitchen",
    label: "Kitchens",
    title: "Heat, knives and cleaning chemicals",
    text: "Chefs need written arrangements for burns, blades and the sprays on the shelf.",
    hook: "COSHH 2002 · Fire Safety Order",
    src: "/images/hero-kitchen-board.jpg",
    alt: "Two chefs in a commercial kitchen looking at a safety screen by the range",
  },
  {
    id: "restaurant",
    label: "Restaurants",
    title: "Slips, fire and the accident book",
    text: "Injuries and near misses belong in the accident book, not a notebook by the pass.",
    hook: "RIDDOR 2013",
    src: "/images/hero-restaurant-board.jpg",
    alt: "Restaurant staff beside a fire exit looking at a wall-mounted safety screen",
  },
  {
    id: "hotel",
    label: "Hotels",
    title: "Fire safety for guests and staff",
    text: "A responsible person, a fire risk assessment and drills — plus COSHH for housekeeping.",
    hook: "Fire Safety Order 2005",
    src: "/images/hero-hotel-board.jpg",
    alt: "Hotel housekeeping staff in a guest corridor beside a safety screen and linen trolley",
  },
  {
    id: "warehouse",
    label: "Warehouses",
    title: "Handling and vehicle routes",
    text: "Picking, racking and pallet trucks need a suitable and sufficient risk assessment.",
    hook: "MHSWR 1999",
    src: "/images/hero-warehouse-board.jpg",
    alt: "Two warehouse operatives looking at a safety screen at the end of a racking aisle",
  },
] as const;

export function IndustryCarousel() {
  const [index, setIndex] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [held, setHeld] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const paused = userPaused || held || reduceMotion;
  const slide = SLIDES[index];

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (paused) return;
    const id = window.setTimeout(() => {
      setIndex((current) => (current + 1) % SLIDES.length);
    }, INTERVAL_MS);
    return () => window.clearTimeout(id);
  }, [paused, index]);

  function go(next: number) {
    setIndex((next + SLIDES.length) % SLIDES.length);
  }

  return (
    <div
      className="relative overflow-hidden rounded-sm border border-white/10 shadow-2xl"
      role="region"
      aria-roledescription="carousel"
      aria-label="Industries covered by HSEQ Nova"
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocusCapture={() => setHeld(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setHeld(false);
        }
      }}
    >
      <div className="relative aspect-[16/10] bg-black">
        {SLIDES.map((item, itemIndex) => (
          <Image
            key={item.id}
            src={item.src}
            alt={itemIndex === index ? item.alt : ""}
            fill
            sizes="(min-width: 1024px) 42vw, 100vw"
            priority={itemIndex === 0}
            className={cn(
              "object-cover",
              reduceMotion ? "" : "transition-opacity duration-700",
              itemIndex === index ? "opacity-100" : "pointer-events-none opacity-0",
            )}
            aria-hidden={itemIndex === index ? undefined : true}
          />
        ))}
        <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/80 via-black/50 to-transparent p-3 pb-12">
          <div className="flex flex-wrap gap-1" role="tablist" aria-label="Industry">
            {SLIDES.map((item, itemIndex) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={itemIndex === index}
                className={cn(
                  "rounded-sm px-2.5 py-1.5 text-xs font-medium transition-colors",
                  itemIndex === index
                    ? "bg-emerald-400 text-emerald-950"
                    : "bg-black/45 text-white/90 hover:bg-black/65 hover:text-white",
                )}
                onClick={() => go(itemIndex)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/80 via-black/45 to-transparent p-4 pt-16">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
              {slide.hook}
            </p>
            <p className="mt-1 text-sm font-medium">{slide.title}</p>
            <p className="mt-1 max-w-xs text-xs leading-relaxed text-white/75">{slide.text}</p>
          </div>
          <div className="mb-1 flex shrink-0">
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-sm bg-black/40 text-white hover:bg-black/60"
              aria-label="Previous industry"
              onClick={() => go(index - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-sm bg-black/40 text-white hover:bg-black/60 disabled:opacity-60"
              aria-pressed={userPaused || reduceMotion}
              aria-label={userPaused || reduceMotion ? "Play industry carousel" : "Pause industry carousel"}
              onClick={() => setUserPaused((current) => !current)}
              disabled={reduceMotion}
            >
              {userPaused || reduceMotion ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
            </button>
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-sm bg-black/40 text-white hover:bg-black/60"
              aria-label="Next industry"
              onClick={() => go(index + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
