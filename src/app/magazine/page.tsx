"use client";

import React from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CHEKADBAM_ARTICLES } from "@/lib/articles-data";
import { BookOpen, Sparkles, Clock, Calendar, ArrowLeft, Tag } from "lucide-react";

export default function MagazinePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans text-right" dir="rtl">
      <Header />

      {/* Hero Header */}
      <section className="pt-16 pb-16 border-b border-slate-800 bg-gradient-to-b from-slate-900/60 to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <BookOpen className="w-4 h-4" />
            <span>مرکز دانش و مقالات فنی روف‌گاردن</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white">
            راهنماهای تخصصی معماری بام سبز
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
            مجموعه مقالات آموزشی در زمینه محاسبه بارهای سازه‌ای، زهکشی، انتخاب گیاهان و نگهداری اصولی روف‌گاردن.
          </p>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {CHEKADBAM_ARTICLES.map((article) => (
            <article
              key={article.slug}
              className="group bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-3xl overflow-hidden flex flex-col justify-between transition-all shadow-xl"
            >
              <div className="relative aspect-video overflow-hidden bg-slate-950">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <span className="absolute top-3 right-3 bg-slate-950/80 text-emerald-400 font-bold text-xs px-2.5 py-1 rounded-lg backdrop-blur">
                  {article.category}
                </span>
              </div>

              <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{article.readTime}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{article.date}</span>
                    </span>
                  </div>

                  <h3 className="font-bold text-base sm:text-lg text-white group-hover:text-emerald-300 transition-colors leading-snug">
                    {article.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-300 line-clamp-3 leading-relaxed">
                    {article.excerpt}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex flex-wrap gap-1.5">
                    {article.tags.slice(0, 2).map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>

                  <Link
                    href={`/magazine/${article.slug}`}
                    className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                  >
                    <span>مطالعه مقاله</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
