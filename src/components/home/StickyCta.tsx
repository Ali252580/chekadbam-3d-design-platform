"use client";

import React from "react";
import { MessageCircle, Phone } from "lucide-react";
import { SITE } from "@/lib/site";

export function StickyCta() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0a0d0b]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
      <div className="grid grid-cols-3 gap-1.5 px-3 py-2.5">
        <a
          href={`tel:${SITE.phoneOffice}`}
          className="inline-flex flex-col items-center justify-center gap-0.5 rounded-xl border border-white/10 py-2 text-[11px] font-bold text-slate-200"
        >
          <Phone className="h-4 w-4 text-emerald-400" />
          تماس
        </a>
        <a
          href={`https://wa.me/${SITE.whatsapp}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex flex-col items-center justify-center gap-0.5 rounded-xl border border-white/10 py-2 text-[11px] font-bold text-slate-200"
        >
          <MessageCircle className="h-4 w-4 text-emerald-400" />
          واتساپ
        </a>
        <a
          href="#lead-form"
          className="btn-primary inline-flex flex-col items-center justify-center rounded-xl py-2 text-[11px] font-bold text-white"
        >
          مشاوره
        </a>
      </div>
    </div>
  );
}
