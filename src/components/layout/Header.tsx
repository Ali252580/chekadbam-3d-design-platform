"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  Menu,
  X,
  Phone,
} from "lucide-react";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: "/studio", label: "طراحی سه‌بعدی بام من", isStudio: true },
    { href: "/products", label: "محصولات مدولار" },
    { href: "/projects", label: "پروژه‌ها" },
    { href: "/modular-system", label: "سیستم پرتابل چکادبام" },
    { href: "/services", label: "خدمات و مراحل" },
    { href: "/magazine", label: "مرکز دانش و مقالات" },
    { href: "/about", label: "درباره چکادبام" },
  ];

  return (
    <header
      className="sticky top-0 z-40 w-full bg-slate-950/75 backdrop-blur-xl border-b border-white/5 text-right shadow-lg shadow-black/20"
      dir="rtl"
    >
      {/* animated gradient hairline */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-l from-transparent via-emerald-500/60 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo & Slogan */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-600 to-teal-700 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-950/60 group-hover:scale-105 transition-transform">
              چ
              <span className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/20" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black text-white tracking-tight">چکادبام</span>
                <span className="text-[11px] font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  CHEKADBAM
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium truncate">
                طراحی و اجرای روف‌گاردن پرتابل و مدولار
              </p>
            </div>
          </Link>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            if (link.isStudio) {
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="btn-primary px-3.5 py-2 rounded-xl text-white font-bold text-xs flex items-center gap-2 ml-2"
                >
                  <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
                  <span>{link.label}</span>
                </Link>
              );
            }

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-3 py-2 rounded-lg text-xs font-medium transition-colors group ${
                  isActive
                    ? "text-emerald-400 font-bold"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                <span className="relative z-10">{link.label}</span>
                <span
                  className={`absolute inset-0 rounded-lg transition-all ${
                    isActive
                      ? "bg-emerald-500/10 border border-emerald-500/20"
                      : "bg-slate-800/0 group-hover:bg-slate-800/60 border border-transparent"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        {/* Action Button & Phone */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="/admin"
            className="text-slate-400 hover:text-slate-200 text-xs px-2.5 py-1.5 rounded-lg border border-slate-800 hover:border-emerald-500/40 transition-colors"
          >
            پنل کارشناسان
          </Link>

          <a
            href="tel:02144484801"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl glass hover:border-emerald-500/40 text-slate-200 hover:text-emerald-300 text-xs font-mono transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-400" />
            <span dir="ltr">021 - 4448 4801</span>
          </a>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex lg:hidden items-center gap-2">
          <Link
            href="/studio"
            className="btn-primary px-3 py-1.5 rounded-lg text-white font-bold text-[11px] flex items-center gap-1.5"
          >
            <Sparkles className="w-3 h-3" />
            <span>طراح ۳D</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg glass text-slate-300 hover:text-white"
            aria-label="منو"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-950/95 backdrop-blur-xl border-b border-white/5 px-4 py-6 space-y-3 animate-fadeIn">
          <Link
            href="/studio"
            onClick={() => setMobileMenuOpen(false)}
            className="btn-primary w-full py-3 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>ورود به Chekadbam 3D Studio</span>
          </Link>

          <div className="divide-y divide-white/5 pt-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-3 text-sm text-slate-300 hover:text-emerald-400 font-medium"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-3 text-sm text-slate-400 hover:text-white"
            >
              پنل مدیریت کارشناسان CRM
            </Link>
          </div>

          <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
            <span>دفتر مرکزی تهران: ۴۴۸۴۸۰۱-۰۲۱</span>
            <a href="tel:02144484801" className="text-emerald-400 font-bold">
              تماس فوری
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
