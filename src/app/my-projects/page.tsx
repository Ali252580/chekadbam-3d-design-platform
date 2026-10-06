"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Sparkles, ArrowLeft, Layers, Calendar, User, Phone, MapPin, Eye, ExternalLink } from "lucide-react";

export default function MyProjectsPage() {
  const [designs, setDesigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDesigns() {
      try {
        const res = await fetch("/api/designs");
        const data = await res.json();
        if (data.success) {
          setDesigns(data.designs);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadDesigns();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans text-right" dir="rtl">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">پروژه‌ها و طرح‌های من</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              طرح‌های سه‌بعدی ساخته‌شده توسط شما در Chekadbam 3D Studio
            </p>
          </div>

          <Link
            href="/studio"
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/60 transition-all shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>ساخت طرح جدید</span>
          </Link>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400 text-xs">در حال بارگذاری طرح‌های ذخیره‌شده...</div>
        ) : designs.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <Layers className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white">هنوز طرحی ثبت نکرده‌اید</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              همین حالا وارد استودیوی طراحی سه‌بعدی شده و اولین چیدمان روف‌گاردن خود را ایجاد و ذخیره کنید.
            </p>
            <Link
              href="/studio"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs"
            >
              <span>ورود به استودیوی طراحی</span>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {designs.map((design) => (
              <div
                key={design.id}
                className="group bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl overflow-hidden flex flex-col justify-between transition-all shadow-lg"
              >
                {design.snapshotUrl ? (
                  <div className="relative aspect-video overflow-hidden bg-slate-950">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={design.snapshotUrl}
                      alt={design.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <span className="absolute bottom-2 right-2 bg-slate-950/80 text-emerald-400 font-mono text-[10px] px-2 py-0.5 rounded backdrop-blur border border-slate-700">
                      {design.width} × {design.length} م
                    </span>
                  </div>
                ) : (
                  <div className="aspect-video bg-slate-950 flex items-center justify-center text-slate-600 text-xs">
                    تصویر پیش‌نمایش ندارد
                  </div>
                )}

                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-1">
                      <span>کد: CK-{design.id}</span>
                      <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded">
                        {design.status}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-white">{design.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
                      <span>شهر: {design.city}</span>
                      <span>•</span>
                      <span>متراژ: {design.totalArea} م²</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono">
                      {new Date(design.createdAt).toLocaleDateString("fa-IR")}
                    </span>

                    <Link
                      href="/studio"
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white font-semibold transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>باز کردن در استودیو</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
