"use client";

import React, { useState } from "react";
import { CHEKADBAM_PRODUCTS, CATEGORIES, ChekadbamProduct } from "@/lib/products-data";
import { Plus, Search, Layers, ShieldCheck, Sparkles, X } from "lucide-react";

interface ProductDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (product: ChekadbamProduct) => void;
}

export function ProductDrawer({ isOpen, onClose, onAddProduct }: ProductDrawerProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen) return null;

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
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 bg-slate-900/95 border-l border-slate-800 shadow-2xl backdrop-blur-xl flex flex-col text-right animate-slideLeft" dir="rtl">
      {/* Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">کتابخانه ماژول‌های چکادبام</h3>
            <p className="text-[11px] text-slate-400">محصولات واقعی و استاندارد تولیدی</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-slate-800/80 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            placeholder="جستجوی محصول، ابعاد یا کد..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px]">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-all ${
                  isSelected
                    ? "bg-emerald-500 text-slate-950 font-bold shadow-sm"
                    : "bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Product List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="group bg-slate-850 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/50 rounded-xl p-3 transition-all flex flex-col justify-between gap-3 shadow-sm"
          >
            <div className="flex gap-3">
              <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 border border-slate-700/50 bg-slate-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                {product.isPopular && (
                  <span className="absolute top-1 right-1 bg-emerald-500 text-slate-950 text-[9px] font-bold px-1 rounded">
                    ویژه
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-1">
                  <h4 className="font-semibold text-xs text-white group-hover:text-emerald-300 transition-colors leading-snug truncate">
                    {product.name}
                  </h4>
                </div>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{product.code}</p>
                <p className="text-[11px] text-slate-300 line-clamp-2 mt-1 leading-relaxed">
                  {product.shortDesc}
                </p>

                <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400 font-mono">
                  <span className="bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-700/40">
                    {product.dimensions.unitString}
                  </span>
                  <span className="text-slate-500">|</span>
                  <span>{product.weightKg} kg</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-700/40">
              <div>
                <span className="text-[10px] text-slate-400 block leading-tight">قیمت تقریبی:</span>
                <span className="text-xs font-bold text-emerald-400 font-mono">
                  {(product.priceEstToman / 1000000).toLocaleString("fa-IR")} م ت
                </span>
              </div>

              <button
                type="button"
                onClick={() => onAddProduct(product)}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-950/40 transition-transform active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>افزودن به صحنه</span>
              </button>
            </div>
          </div>
        ))}

        {filteredProducts.length === 0 && (
          <div className="py-12 text-center text-slate-400 text-xs">
            محصولی با این مشخصات یافت نشد.
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3.5 border-t border-slate-800 bg-slate-950/60 text-[11px] text-slate-400 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>تمامی ماژول‌ها دارای ۵ الی ۱۰ سال ضمانت کتبی چکادبام می‌باشند.</span>
      </div>
    </div>
  );
}
