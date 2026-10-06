"use client";

import React from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  Sparkles,
  ArrowLeft,
  Compass,
  Wrench,
  ShieldCheck,
  Droplets,
  CalendarCheck,
  CheckCircle2,
  FileCheck2,
} from "lucide-react";

export default function ServicesPage() {
  const steps = [
    {
      num: "۰۱",
      title: "تحلیل سایت و اندازه‌گیری دقیق مهندسی",
      desc: "بازدید کارشناس معماری و سازه در محل پروژه، بررسی شیب‌بندی بام، دسترسی تأسیسات، شدت باد و جهت تابش خورشید.",
      icon: Compass,
    },
    {
      num: "۰۲",
      title: "طراحی پلان دوبعدی و مدل‌سازی سه‌بعدی رئال",
      desc: "تهیه آلترناتیوهای معماری منظر با نرم‌افزارهای تخصصی و استودیوی سه‌بعدی چکادبام به همراه لیست دقیق قطعات و قیمت.",
      icon: FileCheck2,
    },
    {
      num: "۰۳",
      title: "تولید صنعتی ماژول‌ها در کارخانه چکادبام",
      desc: "ساخت استراکچرهای فلزی با جوش صنعتی، رنگ کوره‌ای الکترواستاتیک و مونتاژ پنل‌های چوب‌پلاست WPC استاندارد.",
      icon: Wrench,
    },
    {
      num: "۰۴",
      title: "نصب سریع و بدون تخریب در مدت ۷ روز کاری",
      desc: "انتقال قطعات به پشت‌بام، تراز پایه‌های رگلاژ، چیدمان مدولار فلاورباکس‌ها و پرگولا بدون هیچ‌گونه سوراخکاری سقف.",
      icon: CalendarCheck,
    },
    {
      num: "۰۵",
      title: "اتوماسیون آبیاری قطره‌ای و نورپردازی هوشمند",
      desc: "کابل‌کشی ایمن ۲۴ ولت چراغ‌های خطی LED، نصب کنترلر هوشمند تایمردار آبیاری و سنسورهای رطوبت سنج خاک.",
      icon: Droplets,
    },
    {
      num: "۰۶",
      title: "تحویل نهایی، صدور گارانتی کتبی و خدمات نگهداری",
      desc: "ارائه دفترچه راهنمای نگهداری، صدور کارت گارانتی کتبی ۱۰ ساله و پایش دوره‌ای سلامت گیاهان توسط تیم باغبانی.",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans text-right" dir="rtl">
      <Header />

      {/* Hero Header */}
      <section className="pt-16 pb-16 border-b border-slate-800 bg-gradient-to-b from-slate-900/60 to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Wrench className="w-4 h-4" />
            <span>فرآیند مهندسی صفر تا صد</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white">
            مراحل طراحی تا اجرای روف‌گاردن
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
            فرآیند مهندسی شده و شفاف چکادبام از ایده اولیه در استودیوی سه‌بعدی تا تولید در کارخانه و تحویل نهایی کلید در دست.
          </p>
        </div>
      </section>

      {/* Steps Grid */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="group bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-3xl p-6 space-y-4 transition-all shadow-xl flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-2xl font-black text-slate-700 font-mono group-hover:text-emerald-500/40 transition-colors">
                      {step.num}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-white group-hover:text-emerald-300 transition-colors leading-snug">
                    {step.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{step.desc}</p>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>استاندارد چکادبام</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4 max-w-2xl mx-auto">
          <h3 className="text-xl font-bold text-white">طراحی فضای خود را همین حالا آغاز کنید</h3>
          <p className="text-xs text-slate-300">
            قبل از هرگونه هزینه یا اقدام اجرایی، ابعاد بام خود را در Chekadbam 3D Studio وارد کرده و پیش‌نمایش آن را ببینید.
          </p>
          <Link
            href="/studio"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xl transition-transform hover:scale-105"
          >
            <Sparkles className="w-4 h-4" />
            <span>ورود به استودیوی طراحی سه‌بعدی بام من</span>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
