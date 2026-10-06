"use client";

import React, { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CHEKADBAM_ARTICLES } from "@/lib/articles-data";
import { Sparkles, ArrowRight, Clock, Calendar, BookOpen, Share2 } from "lucide-react";

export default function ArticleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const article = CHEKADBAM_ARTICLES.find((a) => a.slug === slug);

  if (!article) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans text-right" dir="rtl">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Link href="/magazine" className="hover:text-white transition-colors">
            مرکز دانش و مقالات
          </Link>
          <span>/</span>
          <span className="text-emerald-400 font-medium truncate">{article.title}</span>
        </div>

        {/* Title & Metadata */}
        <div className="space-y-4">
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
            {article.category}
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight">
            {article.title}
          </h1>

          <div className="flex items-center gap-4 text-xs text-slate-400 font-mono pt-2 border-t border-slate-800">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>تاریخ انتشار: {article.date}</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>زمان مطالعه: {article.readTime}</span>
            </span>
          </div>
        </div>

        {/* Hero Image */}
        <div className="rounded-3xl overflow-hidden border border-slate-700 bg-slate-900 aspect-[16/9] shadow-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
        </div>

        {/* Article Body */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 space-y-6 text-sm text-slate-300 leading-loose">
          {article.content.map((paragraph, idx) => (
            <p key={idx}>{paragraph}</p>
          ))}

          {/* Embedded 3D Studio Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-slate-850 border border-emerald-500/30 space-y-3 my-8">
            <h4 className="font-bold text-white text-base">قبل از اجرا، بام خود را سه‌بعدی طراحی کنید</h4>
            <p className="text-xs text-slate-300">
              با استفاده از استودیوی سه‌بعدی چکادبام، بدون نیاز به اتوکد یا اسکچ‌آپ، ابعاد بام خود را وارد کرده و چیدمان قطعات را تست کنید.
            </p>
            <Link
              href="/studio"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-transform hover:scale-105"
            >
              <Sparkles className="w-4 h-4" />
              <span>ورود به Chekadbam 3D Studio</span>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
