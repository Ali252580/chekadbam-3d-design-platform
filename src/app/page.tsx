"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Factory,
  Layers,
  MessageCircle,
  Phone,
  Sparkles,
  Users,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Reveal } from "@/components/layout/Reveal";
import { Hero } from "@/components/home/Hero";
import { LeadForm } from "@/components/home/LeadForm";
import { ProjectStrip } from "@/components/home/ProjectStrip";
import { Faq } from "@/components/home/Faq";
import { StickyCta } from "@/components/home/StickyCta";
import { SITE, GARDEN_TYPES, PROCESS_STEPS } from "@/lib/site";

function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const t0 = performance.now();
          const tick = (now: number) => {
            const p = Math.min((now - t0) / 1500, 1);
            setValue(Math.round(target * (1 - Math.pow(1 - p, 4))));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [target]);

  return (
    <span ref={ref} className="tabular-nums">
      {value.toLocaleString("fa-IR")}
      {suffix}
    </span>
  );
}

const WHY = [
  {
    icon: Layers,
    title: "پرتابل و قابل‌چیدمان دوباره",
    body: "ماژول‌های ۱٫۲ متری حتی بعد از نصب جابه‌جا می‌شوند. الگوی بام را بدون تخریب عوض می‌کنید.",
  },
  {
    icon: Factory,
    title: "تولید کارخانه ملارد",
    body: "استراکچر فلزی و کاور چوب‌پلاست در خط صنعتی ساخته می‌شود؛ نصب سر بام، مونتاژ کارگاهی نیست.",
  },
  {
    icon: Users,
    title: "تیم EPC از برداشت تا تحویل",
    body: "معمار منظر، سازه و تاسیسات با هم کار می‌کنند: بازدید، دو طرح سه‌بعدی، تولید، اجرا و آبیاری.",
  },
];

const PRODUCTS = [
  {
    name: "فلاورباکس مدولار",
    href: "/products/fb-120",
    img: "https://images.pexels.com/photos/36721032/pexels-photo-36721032.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=800",
  },
  {
    name: "پرگولا و دک",
    href: "/products/pg-deck-320",
    img: "https://images.pexels.com/photos/19075386/pexels-photo-19075386.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=800",
  },
  {
    name: "نیمکت و مبلمان بام",
    href: "/products/bn-backrest",
    img: "https://images.pexels.com/photos/7587879/pexels-photo-7587879.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=800",
  },
  {
    name: "آبنما و آتشدان",
    href: "/products/wf-line",
    img: "https://images.pexels.com/photos/19923727/pexels-photo-19923727.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=800",
  },
];

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#0a0d0b] font-sans text-slate-200 pb-20 md:pb-0" dir="rtl">
      <Header />
      <main>
        <Hero />

        <section className="border-b border-white/[0.06] px-4 py-12 sm:px-6">
          <div className="mx-auto flex max-w-4xl items-center justify-center gap-8 text-center sm:gap-16">
            {[
              { v: 2500, s: "+", l: "پروژه" },
              { v: 14, s: "+", l: "سال تجربه" },
              { v: 7, s: "", l: "روز اجرا" },
            ].map((x) => (
              <div key={x.l}>
                <div className="font-mono text-2xl font-black text-white sm:text-3xl">
                  <Counter target={x.v} suffix={x.s} />
                </div>
                <div className="mt-1 text-[11px] font-light text-slate-500">{x.l}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="relative px-4 py-20 sm:px-6 lg:px-8">
          <div className="bg-modular-grid pointer-events-none absolute inset-0 opacity-40" />
          <div className="relative mx-auto max-w-7xl">
            <Reveal>
              <p className="text-[11px] font-medium tracking-[0.28em] text-[#c4956a]">چرا مدولار</p>
              <h2 className="mt-2 max-w-xl text-2xl font-black text-white sm:text-3xl">
                بام سبز بدون باز کردن سقف
              </h2>
            </Reveal>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {WHY.map((item, i) => (
                <Reveal key={item.title} delay={i * 80}>
                  <div className="h-full rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                    <item.icon className="h-5 w-5 text-[#c4956a]" />
                    <h3 className="mt-3 text-[15px] font-bold text-white">{item.title}</h3>
                    <p className="mt-2 text-[13px] font-light leading-7 text-slate-400">{item.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-white/[0.06] px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Reveal>
              <p className="mb-2 text-center text-[11px] font-medium tracking-[0.28em] text-[#c4956a]">
                پنج تیپ اجرای روف‌گاردن
              </p>
              <h2 className="mb-10 text-center text-2xl font-black text-white">از بام کوچک تا پنت‌هاوس</h2>
            </Reveal>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {GARDEN_TYPES.map((t, i) => (
                <Reveal key={t.id} delay={i * 60}>
                  <Link
                    href="/services"
                    className="block h-full rounded-2xl border border-white/[0.08] p-4 transition-colors hover:border-[#c4956a]/40"
                  >
                    <span className={`inline-block h-1.5 w-1.5 rounded-full ${t.dot}`} />
                    <h3 className="mt-3 text-[14px] font-bold text-white">{t.name}</h3>
                    <p className="mt-1.5 text-[12px] font-light leading-6 text-slate-400">{t.desc}</p>
                    <p className="mt-3 font-mono text-[10px] text-[#c4956a]">{t.area}</p>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-white/[0.06] px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <Reveal>
              <p className="mb-10 text-center text-[11px] font-medium tracking-[0.28em] text-[#c4956a]">
                مسیر واقعی کار
              </p>
            </Reveal>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              {PROCESS_STEPS.map((s, i) => (
                <Reveal key={s.num} delay={i * 80}>
                  <div className="text-center">
                    <div className="font-mono text-[11px] font-bold tracking-widest text-[#c4956a]">{s.num}</div>
                    <div className="mt-2 text-[14px] font-bold text-white">{s.title}</div>
                    <p className="mt-2 text-[12px] font-light leading-6 text-slate-400">{s.desc}</p>
                    <div className="mt-2 text-[10px] text-slate-500">{s.duration}</div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <ProjectStrip />

        <section className="border-t border-white/[0.06] px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <Reveal>
              <div className="relative">
                <div className="absolute -inset-6 rounded-[2.5rem] bg-emerald-500/[0.06] blur-3xl" />
                <div className="relative overflow-hidden rounded-[2rem] border border-white/10 shadow-2xl shadow-black/60">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.pexels.com/photos/7722163/pexels-photo-7722163.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1280"
                    alt="نمایی از روف‌گاردن مدولار چکادبام"
                    className="aspect-[16/10] w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0d0b]/90 via-transparent to-transparent" />
                  <div className="absolute inset-x-5 bottom-5 flex items-center justify-between rounded-xl border border-white/10 bg-black/40 px-5 py-3.5 backdrop-blur-md">
                    <span className="text-[12px] font-bold text-white">اول طرح را خودتان بچینید</span>
                    <span className="font-mono text-[10px] text-[#c4956a]">استودیو سه‌بعدی</span>
                  </div>
                </div>
              </div>
            </Reveal>
            <Reveal delay={150}>
              <div className="mt-10 text-center">
                <p className="mx-auto max-w-md text-[14px] font-light leading-8 text-slate-400">
                  ابعاد بام را وارد کنید، محصولات واقعی کارخانه را روی آن بچینید و در نور روز و شب ببینید — رایگان، در مرورگر.
                </p>
                <Link
                  href="/studio"
                  className="group mt-7 inline-flex items-center gap-2 text-sm font-bold text-emerald-400 hover:text-emerald-300"
                >
                  <Sparkles className="h-4 w-4" />
                  ورود به استودیو
                  <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="border-t border-white/[0.06] px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <Reveal>
              <div className="mb-10 flex items-end justify-between gap-4">
                <div>
                  <p className="text-[11px] font-medium tracking-[0.28em] text-[#c4956a]">محصولات مدولار</p>
                  <h2 className="mt-2 text-2xl font-black text-white">از کارخانه تا بام</h2>
                </div>
                <Link href="/products" className="text-[13px] font-bold text-emerald-400 hover:text-emerald-300">
                  کاتالوگ
                </Link>
              </div>
            </Reveal>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {PRODUCTS.map((p, i) => (
                <Reveal key={p.href} delay={i * 70}>
                  <Link
                    href={p.href}
                    className="group block overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:border-[#c4956a]/30"
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-[#0d120f]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.img}
                        alt={p.name}
                        loading="lazy"
                        className="h-full w-full object-cover opacity-85 transition-all duration-700 group-hover:scale-[1.05] group-hover:opacity-100"
                      />
                    </div>
                    <div className="p-3.5">
                      <h3 className="text-[12px] font-bold leading-5 text-white group-hover:text-emerald-300">
                        {p.name}
                      </h3>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <Faq />

        <section className="relative overflow-hidden border-t border-white/[0.06] px-4 py-24 sm:px-6 lg:px-8">
          <div className="pointer-events-none absolute left-1/2 top-0 h-[360px] w-[640px] max-w-[90vw] -translate-x-1/2 rounded-full bg-emerald-500/[0.07] blur-[110px]" />
          <div className="relative mx-auto grid max-w-5xl items-start gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-black leading-snug text-white sm:text-4xl">
                بام شما آماده <span className="text-[#c4956a]">سبز شدن</span> است.
              </h2>
              <p className="mt-4 max-w-md text-[14px] font-light leading-8 text-slate-400">
                شماره بگذارید تا بازدید هماهنگ شود، یا مستقیم در استودیو طرح بزنید.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={`tel:${SITE.phoneOffice}`}
                  dir="ltr"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-5 py-3 font-mono text-sm text-slate-200 hover:border-[#c4956a]/40"
                >
                  <Phone className="h-4 w-4 text-emerald-400" />
                  {SITE.phoneOffice}
                </a>
                <a
                  href={`https://wa.me/${SITE.whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm text-slate-200 hover:border-emerald-500/40"
                >
                  <MessageCircle className="h-4 w-4 text-emerald-400" />
                  واتساپ
                </a>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
              <LeadForm compact idPrefix="close-lead" />
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <StickyCta />
    </div>
  );
}
