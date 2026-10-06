"use client";

import React, { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CHEKADBAM_PROJECTS } from "@/lib/projects-data";
import { Sparkles, ArrowRight, MapPin, Calendar, User, Layers, CheckCircle2, Phone } from "lucide-react";

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const project = CHEKADBAM_PROJECTS.find((p) => p.id === id);

  if (!project) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans text-right" dir="rtl">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Link href="/projects" className="hover:text-white transition-colors">
            پروژه‌ها
          </Link>
          <span>/</span>
          <span className="text-emerald-400 font-medium">{project.title}</span>
        </div>

        {/* Hero Section */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
              {project.categoryName}
            </span>
            <span className="text-xs text-slate-400 font-mono">مساحت: {project.areaM2} مترمربع</span>
            <span className="text-xs text-slate-400 font-mono">سال: {project.year}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white">{project.title}</h1>
          <p className="text-base text-slate-300 max-w-3xl leading-relaxed">{project.subtitle}</p>
        </div>

        {/* Hero Image */}
        <div className="relative rounded-3xl overflow-hidden border border-slate-700 bg-slate-900 aspect-video shadow-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={project.heroImage} alt={project.title} className="w-full h-full object-cover" />
          <div className="absolute bottom-4 right-4 bg-slate-950/90 backdrop-blur px-4 py-2 rounded-2xl border border-slate-700 text-xs text-white font-bold flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span>{project.location}</span>
          </div>
        </div>

        {/* Project Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Main Description & Gallery */}
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
              <h3 className="text-lg font-bold text-white">شرح فرآیند طراحی و اجرای پروژه</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{project.description}</p>
            </div>

            {/* Highlights */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
              <h3 className="text-lg font-bold text-white">ویژگی‌های شاخص این پروژه</h3>
              <ul className="space-y-3">
                {project.highlights.map((h, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Gallery Images */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">تصاویر تکمیلی پروژه</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {project.gallery.map((img, idx) => (
                  <div key={idx} className="rounded-2xl overflow-hidden border border-slate-800 aspect-video bg-slate-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={`${project.title} - ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar & Modules Used */}
          <div className="lg:col-span-4 space-y-6">
            {/* Direct 3D Studio Link */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-teal-950/40 border border-emerald-500/30 space-y-4">
              <h4 className="font-bold text-white text-sm">شبیه‌سازی و شخصی‌سازی این بام</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                می‌توانید ابعاد بام خود را وارد کرده و ماژول‌های مشابه این پروژه را در استودیوی سه‌بعدی بچینید.
              </p>
              <Link
                href="/studio"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>طراحی سه‌بعدی بام من</span>
              </Link>
            </div>

            {/* Modules Used List */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>ماژول‌های چکادبام در این پروژه</span>
              </h4>
              <div className="space-y-2">
                {project.modulesUsed.map((m, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-200">
                    {m}
                  </div>
                ))}
              </div>
            </div>

            {/* Project Specs Table */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <h4 className="font-bold text-white text-sm">شناسنامه پروژه</h4>
              <div className="divide-y divide-slate-800 text-xs">
                {Object.entries(project.features).map(([k, v], idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between">
                    <span className="text-slate-400">{k}:</span>
                    <span className="font-mono font-bold text-slate-200">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
