"use client";

import React from "react";
import Link from "next/link";

export interface HeroBannerProps {
  href?: string;
  altText?: string;
}

export default function HeroBanner({
  href = "/products",
  altText = "BhansaMart Fresh Groceries Delivered Fast",
}: HeroBannerProps) {
  return (
    <section className="w-full my-6 sm:my-8" aria-label="Hero Promotional Banner">
      <div className="relative w-full overflow-hidden rounded-2xl sm:rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-slate-200/70 bg-white">
        <Link
          href={href}
          className="block relative w-full group cursor-pointer focus:outline-none"
          title={altText}
        >
          <img
            src="/images/banners/bhansamart-fresh-groceries-fast.png"
            alt={altText}
            className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.008]"
            loading="eager"
          />
        </Link>
      </div>
    </section>
  );
}
