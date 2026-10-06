"use client";

import React from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Sparkles, Layers, ShieldCheck, Check, X, ArrowLeft, RefreshCw, Wrench, Clock, Weight } from "lucide-react";

export default function ModularSystemPage() {
  const comparisonItems = [
    {
      feature: "نیاز به سوراخکاری یا تخریب ایزوگام اولیه سقف",
      chekadbam: "کاملاً صفر (اتصالات خشک‌چین و پایه‌های رگلاژ مستقل)",
      traditional: "دارای ریسک سوراخ شدن عایق در حین آجرچینی و کاشت",
      chekadbamGood: true,
    },
    {
      feature: "وزن مرده تحمیلی به سازه (Dead Load)",
      chekadbam: "بسیار سبک (۶۵ تا ۱۲۰ کیلوگرم بر مترمربع)",
      traditional: "بسیار سنگین (۵۰۰ تا ۸۵۰ کیلوگرم بر مترمربع با خاک باغچه‌ای)",
      chekadbamGood: true,
    },
    {
      feature: "مدت زمان اجرای یک بام ۲۰۰ متری",
      chekadbam: "۵ الی ۷ روز کاری (ماژول‌های پیش‌ساخته آماده نصب)",
      traditional: "۴۵ الی ۹۰ روز کاری (بنایی، بتن‌ریزی و خشک شدن ملات)",
      chekadbamGood: true,
    },
    {
      feature: "امکان جابه‌جایی، تغییر دکوراسیون و انتقال به ساختمان دیگر",
      chekadbam: "۱۰۰٪ پرتابل و قابل جابه‌جایی در هر زمان",
      traditional: "غیرممکن (تخریب کامل و غیرقابل استفاده مجدد)",
      chekadbamGood: true,
    },
    {
      feature: "دسترسی به کف اصلی ساختمان در صورت نیاز به بازرسی لوله‌ها",
      chekadbam: "برداشتن سریع تایل پازلی در کمتر از ۲ دقیقه",
      traditional: "مستلزم کندن بتن، خاک و ایزوگام با هزینه گزاف",
      chekadbamGood: true,
    },
    {
      feature: "هدایت آب باران و عدم ایجاد حوضچه آب (Ponding)",
      chekadbam: "دریناژ شانه تخم‌مرغی ۳ بعدی با خروج آنی آب",
      traditional: "احتمال آب‌ماندگی و ایجاد بوی نامطبوع در زیر خاک",
      chekadbamGood: true,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans text-right" dir="rtl">
      <Header />

      {/* Hero Banner */}
      <section className="pt-16 pb-16 border-b border-slate-800 bg-gradient-to-b from-slate-900/60 to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Layers className="w-4 h-4" />
            <span>مهندسی نوآورانه روف‌گاردن</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">
            سیستم پرتابل و مدولار چکادبام چیست؟
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
            نسل نوین فضاسازی بام بدون نیاز به بنایی سنتی، خاک‌ریزی سنگین یا سوراخ کردن ایزوگام ساختمان؛ با قطعات مدولار صنعتی و ضمانت‌نامه کتبی ۱۰ ساله.
          </p>
        </div>
      </section>

      {/* Exploded Visual & Core Pillars */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 rounded-3xl overflow-hidden border border-slate-700 bg-slate-900 shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/modular-exploded-diagram.svg"
              alt="Exploded Modular Diagram"
              className="w-full h-auto object-cover"
            />
          </div>

          <div className="lg:col-span-6 space-y-6">
            <h2 className="text-2xl font-black text-white">
              چرا روش پرتابل و مدولار، آینده معماری بام سبز است؟
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              روش‌های سنتی روف‌گاردن به دلیل وزن سنگین، کثیف‌کاری ساختمانی و عدم دسترسی به لایه‌های زیرین در صورت نشت آب، ریسک بسیار بالایی برای ساختمان ایجاد می‌کنند. سیستم مدولار چکادبام تمام تجهیزات اعم از فلاورباکس، نیمکت، پرگولا، آبنما و کف‌سازی را در کارخانه تولید و به صورت قطعات از پیش ساخته شده در محل مونتاژ می‌کند.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <Clock className="w-5 h-5 text-emerald-400" />
                <h4 className="font-bold text-xs text-white">نصب فوق سریع ۷ روزه</h4>
                <p className="text-[11px] text-slate-400">بدون خواباندن فعالیت ساختمان یا ایجاد گردوغبار بنایی</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <RefreshCw className="w-5 h-5 text-emerald-400" />
                <h4 className="font-bold text-xs text-white">قابلیت انتقال و تعمیر</h4>
                <p className="text-[11px] text-slate-400">امکان بازکردن و جابه‌جایی به مکان دیگر در صورت نقل مکان</p>
              </div>
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 space-y-8 shadow-2xl">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h3 className="text-xl sm:text-2xl font-black text-white">
              مقایسه سیستم پرتابل چکادبام با روش سنتی (بنایی درجا)
            </h3>
            <p className="text-xs text-slate-400">
              بررسی تفاوت‌های بنیادین فنی، ایمنی و هزینه‌های نگهداری
            </p>
          </div>

          <div className="border border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-300 text-[11px] border-b border-slate-800">
                  <th className="p-4 w-1/3">شاخص مقایسه</th>
                  <th className="p-4 w-1/3 bg-emerald-950/30 text-emerald-300 font-bold">
                    سیستم پرتابل و مدولار چکادبام
                  </th>
                  <th className="p-4 w-1/3 text-slate-400">روش سنتی و بنایی در محل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {comparisonItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-850">
                    <td className="p-4 font-bold text-white bg-slate-950/40">{item.feature}</td>
                    <td className="p-4 text-emerald-300 font-medium bg-emerald-950/15 flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{item.chekadbam}</span>
                    </td>
                    <td className="p-4 text-slate-400">{item.traditional}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-emerald-950/50 via-slate-900 to-teal-950/50 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-white">
              طرح اولیه بام خود را با این سیستم مدولار بسازید
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              در استودیوی سه‌بعدی آنلاین چکادبام ابعاد را وارد کنید و چیدمان قطعات را آزمایش کنید.
            </p>
          </div>
          <Link
            href="/studio"
            className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-xl shrink-0 transition-transform hover:scale-105"
          >
            <Sparkles className="w-4 h-4" />
            <span>ورود به Chekadbam 3D Studio</span>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
