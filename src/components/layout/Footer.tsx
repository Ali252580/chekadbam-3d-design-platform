"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, Phone, MapPin, Globe, ShieldCheck, Award, ArrowUpLeft } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative bg-slate-950 border-t border-white/5 text-slate-400 text-xs text-right overflow-hidden" dir="rtl">
      {/* Top Banner CTA */}
      <div className="relative border-b border-white/5 py-14 overflow-hidden noise">
        <div className="bg-dots absolute inset-0 opacity-30" />
        <div className="orb animate-drift-a w-[26vw] h-[26vw] max-w-[380px] max-h-[380px] top-[-40%] right-[10%] bg-emerald-600/20" />
        <div className="orb animate-drift-b w-[20vw] h-[20vw] max-w-[300px] max-h-[300px] bottom-[-50%] left-[8%] bg-teal-500/15" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-right">
            <h3 className="text-xl sm:text-2xl font-black text-white">
              بام خودت را طراحی کن؛ <span className="text-gradient-emerald">چکادبام</span> آن را می‌سازد.
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              بدون نیاز به نرم‌افزارهای پیچیده معماری، ابعاد بام خود را وارد کرده و با محصولات مدولار چکادبام طرح سه‌بعدی بسازید.
            </p>
          </div>

          <Link
            href="/studio"
            className="btn-primary px-6 py-3.5 rounded-2xl text-white font-bold text-sm flex items-center gap-2.5 shrink-0"
          >
            <Sparkles className="w-5 h-5" />
            <span>شروع طراحی سه‌بعدی رایگان</span>
          </Link>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Col 1: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 via-emerald-600 to-teal-700 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-950/50">
                چ
                <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20" />
              </div>
              <span className="text-lg font-black text-white">چکادبام | Chekadbam</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              چکادبام پیشگام در طراحی و ساخت سیستم‌های پرتابل و مدولار روف‌گاردن، تراس سبز و دیوار سبز در ایران و خاورمیانه با بیش از ۲۱,۰۰۰ مترمربع فضای سبز اجرا شده و شعب فعال در تهران، مسقط (عمان) و ایروان (ارمنستان).
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <div className="flex items-center gap-1.5 glass px-3 py-1.5 rounded-lg text-[11px] text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>۵ تا ۱۰ سال ضمانت کتبی</span>
              </div>
              <div className="flex items-center gap-1.5 glass px-3 py-1.5 rounded-lg text-[11px] text-slate-300">
                <Award className="w-4 h-4 text-emerald-400" />
                <span>گواهینامه ISO 9001 & ISO 14001</span>
              </div>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm">بخش‌های سایت</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/studio" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
                  <ArrowUpLeft className="w-3 h-3 text-emerald-500" />
                  <span>طراحی سه‌بعدی بام من</span>
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-emerald-400 transition-colors">
                  کاتالوگ محصولات مدولار
                </Link>
              </li>
              <li>
                <Link href="/projects" className="hover:text-emerald-400 transition-colors">
                  پروژه‌های منتخب
                </Link>
              </li>
              <li>
                <Link href="/modular-system" className="hover:text-emerald-400 transition-colors">
                  سیستم پرتابل چیست؟
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-emerald-400 transition-colors">
                  فرآیند طراحی و اجرا
                </Link>
              </li>
              <li>
                <Link href="/magazine" className="hover:text-emerald-400 transition-colors">
                  مرکز دانش و مقالات فنی
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Products */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm">دسته‌بندی محصولات</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/products?category=planting" className="hover:text-emerald-400 transition-colors">
                  فلاورباکس‌های مدولار WPC
                </Link>
              </li>
              <li>
                <Link href="/products?category=furniture" className="hover:text-emerald-400 transition-colors">
                  نیمکت و ست‌های نشیمن روف
                </Link>
              </li>
              <li>
                <Link href="/products?category=structures" className="hover:text-emerald-400 transition-colors">
                  پرگولا و دیواره سبز گرین‌وال
                </Link>
              </li>
              <li>
                <Link href="/products?category=water_fire" className="hover:text-emerald-400 transition-colors">
                  آبنمای پرتابل و آتشدان گازی
                </Link>
              </li>
              <li>
                <Link href="/products?category=flooring" className="hover:text-emerald-400 transition-colors">
                  تایل کف‌پوش چوب‌پلاست پازلی
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: International Offices */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm">دفاتر و کارخانه</h4>
            <div className="space-y-2.5 text-xs text-slate-400">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-200">دفتر مرکزی ایران:</strong> تهران، سعادت‌آباد، سرو غربی، پلاک ۵۸
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Globe className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-200">دفتر عمان (Muscat):</strong> Al Mouj St, Muscat, Sultanate of Oman
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Globe className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-200">دفتر ارمنستان (Yerevan):</strong> Tumanyan St, Yerevan, Armenia
                </span>
              </div>
              <div className="flex items-center gap-2 pt-2 text-white font-mono">
                <Phone className="w-4 h-4 text-emerald-400" />
                <span dir="ltr">021 - 4448 4801</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-12 mt-12 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <p>© {new Date().getFullYear()} تمامی حقوق مادی و معنوی متعلق به شرکت چکادبام می‌باشد.</p>
          <div className="flex items-center gap-6">
            <Link href="/magazine/structural-load-calculation-roof-garden" className="hover:text-emerald-400">
              ضوابط بارگذاری سازه
            </Link>
            <Link href="/modular-system" className="hover:text-emerald-400">
              استانداردهای مهندسی
            </Link>
            <Link href="/admin" className="hover:text-emerald-400">
              پورتال CRM
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
