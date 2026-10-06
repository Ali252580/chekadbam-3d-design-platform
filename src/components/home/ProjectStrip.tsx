"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { CHEKADBAM_PROJECTS } from "@/lib/projects-data";
import { Reveal } from "@/components/layout/Reveal";

export function ProjectStrip() {
  const featured = CHEKADBAM_PROJECTS.slice(0, 6);

  return (
    <section className="border-t border-white/[0.06] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium tracking-[0.28em] text-[#c4956a]">پروژه‌های اجراشده</p>
              <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">بام‌هایی که سبز شدند</h2>
            </div>
            <Link
              href="/projects"
              className="inline-flex items-center gap-1.5 text-[13px] font-bold text-emerald-400 hover:text-emerald-300"
            >
              همه پروژه‌ها
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p, i) => (
            <Reveal key={p.id} delay={i * 70}>
              <Link
                href={`/projects/${p.id}`}
                className="group block overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] transition-colors hover:border-[#c4956a]/35"
              >
                <div className="aspect-[16/10] overflow-hidden bg-[#0d120f]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.heroImage}
                    alt={p.title}
                    loading="lazy"
                    className="h-full w-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                </div>
                <div className="space-y-1.5 p-4">
                  <h3 className="text-[14px] font-bold text-white group-hover:text-emerald-300">{p.title}</h3>
                  <p className="flex items-center gap-1 text-[11px] text-slate-400">
                    <MapPin className="h-3 w-3 text-[#c4956a]" />
                    {p.location}
                    <span className="text-slate-600">·</span>
                    {p.areaM2.toLocaleString("fa-IR")} مترمربع
                  </p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
