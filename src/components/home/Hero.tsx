"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Timer, Droplets, Sparkles } from "lucide-react";
import { LeadForm } from "@/components/home/LeadForm";
import { SITE } from "@/lib/site";

const CHIPS = [
  { icon: Droplets, label: "بدون سوراخکاری ایزوگام" },
  { icon: Timer, label: "اجرا حدود ۷ روز کاری" },
  { icon: ShieldCheck, label: "ضمانت کتبی ۵ تا ۱۰ سال" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-white/[0.06] pt-6 pb-16 sm:pt-10 sm:pb-20">
      <div className="pointer-events-none absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.pexels.com/photos/7587884/pexels-photo-7587884.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1600"
          alt=""
          className="h-full w-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-[#0a0d0b] via-[#0a0d0b]/85 to-[#0a0d0b]/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0d0b] via-transparent to-[#0a0d0b]/50" />
        <div className="bg-modular-grid bg-modular-grid-fade absolute inset-0 opacity-80" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
        <div>
          <p className="mb-4 text-[11px] font-medium tracking-[0.28em] text-[#c4956a]">
            سیستم مدولار ۱٫۲ متری · کارخانه ملارد
          </p>
          <h1 className="max-w-xl text-[1.85rem] font-black leading-[1.35] tracking-tight text-white sm:text-4xl lg:text-[2.65rem]">
            روف‌گاردن مدولار بدون سوراخکاری ایزوگام؛ طراحی، تولید کارخانه، اجرا در حدود ۷ روز
          </h1>
          <p className="mt-5 max-w-lg text-[14px] font-light leading-8 text-slate-300">
            چکادبام تجهیزات پرتابل بام سبز را در کارخانه می‌سازد و روی بام شما می‌چیند — بدون تخریب سقف، با طرح سه‌بعدی و بازدید رایگان.
          </p>

          <ul className="mt-6 flex flex-wrap gap-2">
            {CHIPS.map((c) => (
              <li
                key={c.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#c4956a]/25 bg-black/30 px-3 py-1.5 text-[11px] text-slate-200 backdrop-blur-sm"
              >
                <c.icon className="h-3.5 w-3.5 text-[#c4956a]" />
                {c.label}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#lead-form"
              className="btn-primary inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white"
            >
              مشاوره رایگان
            </a>
            <Link
              href="/studio"
              className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.03] px-5 py-3 text-sm font-bold text-slate-200 transition-colors hover:border-[#c4956a]/40 hover:text-white"
            >
              <Sparkles className="h-4 w-4 text-emerald-400" />
              طراحی در استودیو
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>

          <a
            href={`tel:${SITE.phoneOffice}`}
            dir="ltr"
            className="mt-5 inline-block font-mono text-[13px] text-slate-400 transition-colors hover:text-[#c4956a]"
          >
            {SITE.phoneOffice} · {SITE.phoneMobile}
          </a>
        </div>

        <div
          id="lead-form"
          className="scroll-mt-28 rounded-2xl border border-white/10 bg-[#0a0d0b]/80 p-5 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-6"
        >
          <p className="mb-1 text-[13px] font-bold text-white">فرم مشاوره رایگان</p>
          <p className="mb-5 text-[12px] leading-6 text-slate-400">
            نام و شماره را بگذارید؛ برای برداشت بام هماهنگ می‌شویم.
          </p>
          <LeadForm />
        </div>
      </div>
    </section>
  );
}
