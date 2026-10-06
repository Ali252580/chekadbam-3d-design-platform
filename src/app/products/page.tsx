"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CHEKADBAM_PRODUCTS, CATEGORIES } from "@/lib/products-data";
import { Search, Sparkles, ArrowLeft, Layers, ShieldCheck, Plus, Check } from "lucide-react";

export default function ProductsPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = CHEKADBAM_PRODUCTS.filter((p) => {
    const matchCat = selectedCategory === "all" || p.category === selectedCategory;
    const matchSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.shortDesc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans text-right" dir="rtl">
      <Header />

      {/* Hero Banner */}
      <section className="pt-16 pb-12 border-b border-slate-800 bg-gradient-to-b from-slate-900/60 to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Layers className="w-4 h-4" />
            <span>کاتالوگ جامع محصولات پرتابل و مدولار</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white">
            محصولات استاندارد روف‌گاردن چکادبام
          </h1>

          <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
            تمامی محصولات چکادبام بر پایه شبکه مدولار استاندارد طراحی شده و بدون نیاز به تخریب، با قابلیت مونتاژ سریع، جابه‌جایی و ایزولاسیون کامل ریشه تولید می‌شوند.
          </p>
        </div>
      </section>

      {/* Filter & Search Bar */}
      <section className="py-6 border-b border-slate-800 bg-slate-900/40 sticky top-20 z-20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 w-full md:w-auto no-scrollbar text-xs">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                    isSelected
                      ? "bg-emerald-600 text-white font-bold shadow"
                      : "bg-slate-800/80 text-slate-400 hover:text-white"
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              placeholder="جستجوی کد محصول یا نام..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="group bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl overflow-hidden flex flex-col justify-between transition-all shadow-lg"
            >
              <div className="relative aspect-video overflow-hidden bg-slate-950">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {product.isPopular && (
                  <span className="absolute top-3 right-3 bg-emerald-500 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded shadow">
                    پرفروش
                  </span>
                )}
                <span className="absolute bottom-3 right-3 bg-slate-950/80 text-slate-300 font-mono text-[10px] px-2 py-0.5 rounded backdrop-blur border border-slate-700">
                  {product.dimensions.unitString}
                </span>
              </div>

              <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-1">
                    <span>{product.code}</span>
                    <span>وزن: {product.weightKg} kg</span>
                  </div>

                  <h3 className="font-bold text-sm text-white group-hover:text-emerald-300 transition-colors leading-snug">
                    {product.name}
                  </h3>

                  <p className="text-xs text-slate-300 line-clamp-2 mt-2 leading-relaxed">
                    {product.shortDesc}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">قیمت تخمینی:</span>
                    <span className="text-xs sm:text-sm font-bold text-emerald-400 font-mono">
                      {(product.priceEstToman / 1000000).toLocaleString("fa-IR")} میلیون ت
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/products/${product.id}`}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 transition-colors"
                    >
                      مشاهده و ۳D
                    </Link>

                    <Link
                      href="/studio"
                      className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                      title="افزودن به استودیوی طراحی سه‌بعدی"
                    >
                      <Sparkles className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
