"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CHEKADBAM_PROJECTS } from "@/lib/projects-data";
import { Sparkles, ArrowLeft, Building2, Globe, MapPin, Layers } from "lucide-react";

export default function ProjectsPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCountry, setSelectedCountry] = useState("all");

  const filteredProjects = CHEKADBAM_PROJECTS.filter((proj) => {
    const matchCat = selectedCategory === "all" || proj.category === selectedCategory;
    const matchCountry = selectedCountry === "all" || proj.country === selectedCountry;
    return matchCat && matchCountry;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans text-right" dir="rtl">
      <Header />

      {/* Hero Header */}
      <section className="pt-16 pb-12 border-b border-slate-800 bg-gradient-to-b from-slate-900/60 to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Building2 className="w-4 h-4" />
            <span>بیش از ۳,۰۰۰ پروژه روف‌گاردن، تراس و محوطه‌سازی</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white">
            پروژه‌های اجرایی چکادبام
          </h1>

          <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
            نمونه‌های اجرا شده با سیستم مدولار و پرتابل در تهران، شهرهای ایران، مسقط (عمان) و ایروان (ارمنستان).
          </p>
        </div>
      </section>

      {/* Filter Tabs */}
      <section className="py-6 border-b border-slate-800 bg-slate-900/40 sticky top-20 z-20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Category Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 w-full md:w-auto no-scrollbar text-xs">
            {[
              { id: "all", label: "همه کاربری‌ها" },
              { id: "residential", label: "مسکونی و پنت‌هاوس" },
              { id: "villa", label: "ویلایی" },
              { id: "cafe_restaurant", label: "کافه و رستوران" },
              { id: "office", label: "اداری و تجاری" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                  selectedCategory === tab.id
                    ? "bg-emerald-600 text-white font-bold shadow"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Country Filters */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            {[
              { id: "all", label: "همه کشورها" },
              { id: "iran", label: "ایران" },
              { id: "oman", label: "عمان" },
              { id: "armenia", label: "ارمنستان" },
            ].map((cnt) => (
              <button
                key={cnt.id}
                onClick={() => setSelectedCountry(cnt.id)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  selectedCountry === cnt.id
                    ? "bg-emerald-500/20 text-emerald-400 font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {cnt.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map((proj) => (
            <div
              key={proj.id}
              className="group bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-3xl overflow-hidden flex flex-col justify-between transition-all shadow-xl"
            >
              <div className="relative aspect-video overflow-hidden bg-slate-950">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={proj.heroImage}
                  alt={proj.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                <span className="absolute bottom-3 right-3 bg-slate-900/90 text-emerald-400 font-bold text-xs px-3 py-1 rounded-xl border border-slate-700 backdrop-blur">
                  {proj.location}
                </span>
              </div>

              <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>{proj.categoryName}</span>
                    <span className="font-mono">مساحت: {proj.areaM2} م²</span>
                  </div>

                  <h3 className="font-bold text-base text-white group-hover:text-emerald-300 transition-colors leading-snug">
                    {proj.title}
                  </h3>

                  <p className="text-xs text-slate-300 line-clamp-3 mt-2 leading-relaxed">
                    {proj.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-mono">سال اجرا: {proj.year}</span>

                  <Link
                    href={`/projects/${proj.id}`}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <span>مشاهده جزئیات</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </Link>
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
