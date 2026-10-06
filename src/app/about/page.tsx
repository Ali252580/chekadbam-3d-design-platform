"use client";

import React from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  Sparkles,
  Building2,
  Globe2,
  Award,
  ShieldCheck,
  Users,
  Factory,
  Phone,
  CheckCircle2,
} from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans text-right" dir="rtl">
      <Header />

      {/* Hero Header */}
      <section className="pt-16 pb-16 border-b border-slate-800 bg-gradient-to-b from-slate-900/60 to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Building2 className="w-4 h-4" />
            <span>پیشگام سیستم‌های پرتابل و مدولار بام سبز در ایران و خاورمیانه</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">
            درباره شرکت مهندسی چکادبام
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
            از سال ۱۳۸۹ با هدف ارتقای سرانه فضای سبز شهری و جایگزینی روش‌های سنتی تخریبی با سیستم‌های مدولار پیش‌ساخته، در خدمت جامعه معماری و کارفرمایان محترم هستیم.
          </p>
        </div>
      </section>

      {/* Content & History */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-6">
            <h2 className="text-2xl font-black text-white">داستان شکل‌گیری و فلسفه برند</h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              چکادبام با پشتوانه تیمی از معماران منظر، مهندسان محاسب سازه و متخصصان باغبانی تأسیس شد. مشکل اصلی در روف‌گاردن‌های سنتی، خطر نشت آب، وزن سنگین و مدت زمان طولانی اجرا بود. مهندسان چکادبام با ثبت اختراع سیستم‌های پرتابل و مدولار، استانداردی نوین تعریف کردند که در آن کلیه قطعات به صورت صنعتی و کنترل‌شده در کارخانه تولید و بدون هیچ‌گونه سوراخکاری سقف در محل نصب می‌شوند.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <Factory className="w-5 h-5 text-emerald-400" />
                <h4 className="font-bold text-xs text-white">کارخانه اختصاصی</h4>
                <p className="text-[11px] text-slate-400">خط تولید صنعتی چوب‌پلاست WPC و سازه‌های فلزی</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <Globe2 className="w-5 h-5 text-emerald-400" />
                <h4 className="font-bold text-xs text-white">دفاتر بین‌المللی</h4>
                <p className="text-[11px] text-slate-400">شعب فعال در مسقط (عمان) و ایروان (ارمنستان)</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 rounded-3xl overflow-hidden border border-slate-700 bg-slate-900 shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.pexels.com/photos/7587884/pexels-photo-7587884.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200"
              alt="Chekadbam Team & Architecture"
              className="w-full h-auto object-cover"
            />
          </div>
        </div>

        {/* International Presence */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 space-y-8 shadow-2xl">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h3 className="text-xl sm:text-2xl font-black text-white">دفاتر و شعب منطقه‌ای چکادبام</h3>
            <p className="text-xs text-slate-400">حضور فعال و اجرای پروژه‌های شاخص در خاورمیانه</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Globe2 className="w-5 h-5" />
                <span>دفتر مرکزی تهران (ایران)</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                سعادت‌آباد، خیابان سرو غربی، پلاک ۵۸، ساختمان چکادبام
              </p>
              <span className="text-xs text-slate-400 font-mono block" dir="ltr">
                Tel: +98 (21) 4448 4801
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Globe2 className="w-5 h-5" />
                <span>شعبه مسقط (سلطنت عمان)</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Al Mouj Street, Wave Muscat Commercial Complex
              </p>
              <span className="text-xs text-slate-400 font-mono block" dir="ltr">
                Tel: +968 9123 4567
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Globe2 className="w-5 h-5" />
                <span>شعبه ایروان (ارمنستان)</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Tumanyan Street, Kentron District, Yerevan
              </p>
              <span className="text-xs text-slate-400 font-mono block" dir="ltr">
                Tel: +374 10 987 654
              </span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
