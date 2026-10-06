"use client";

import React, { useEffect, useRef } from "react";
import { Compass, X, LayoutTemplate, Plus, Move, Orbit, ClipboardList, Check } from "lucide-react";

interface StudioGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** «شروع طراحی»: close the guide and open plan selection first — order matters */
  onStartDesign?: () => void;
}

// The steps mirror the actual workflow order, so numbering is content, not decoration.
const GUIDE_STEPS = [
  {
    icon: LayoutTemplate,
    title: "بام خود را تعریف کنید",
    desc: "با «نقشه و ابعاد بام» شکل، ابعاد و کف‌سازی پشت‌بام را تنظیم کنید یا یک پلان آماده را بارگذاری کنید.",
  },
  {
    icon: Plus,
    title: "ماژول‌ها را اضافه کنید",
    desc: "«افزودن ماژول» هر قطعه را در امن‌ترین نقطه پلان قرار می‌دهد؛ هر وقت خواستید جابه‌جایش کنید.",
  },
  {
    icon: Move,
    title: "جابه‌جایی دقیق",
    desc: "قطعه انتخاب‌شده را با ماوس بکشید — روی شبکه ۱ متری می‌نشیند. دکمه‌های جهت‌دار نیم‌متر جابه‌جا می‌کنند و «چرخش ۴۵°» زاویه می‌دهد.",
  },
  {
    icon: Orbit,
    title: "دید و نورپردازی",
    desc: "درگ روی فضای خالی دوربین را می‌چرخاند و اسکرول زوم می‌کند. «پلان ۲D» ابعاد دقیق را نشان می‌دهد و سه حالت روز، غروب و شب حس فضای واقعی را می‌سازند.",
  },
  {
    icon: ClipboardList,
    title: "فهرست اقلام و ذخیره",
    desc: "«فهرست اقلام» متراژ اقلام هر قطعه را حساب می‌کند و «ذخیره طرح» مشخصات شما را برای مشاوره و اجرا ثبت می‌کند.",
  },
];

export function StudioGuideModal({ isOpen, onClose, onStartDesign }: StudioGuideModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    panelRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn text-right"
      dir="rtl"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="studio-guide-title"
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-slideUp outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 id="studio-guide-title" className="text-base font-bold text-white">
                راهنمای استودیوی طراحی بام
              </h3>
              <p className="text-xs text-slate-400">پنج قدم تا چیدمان کامل روف‌گاردن شما</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            title="بستن راهنما"
            aria-label="بستن راهنما"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Steps */}
        <div className="px-6 py-5 overflow-y-auto">
          <ol className="space-y-3">
            {GUIDE_STEPS.map((step, idx) => (
              <li
                key={step.title}
                className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/50"
              >
                <div className="w-9 h-9 shrink-0 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                  <step.icon className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="text-emerald-400/90 font-black text-[11px] bg-emerald-500/15 border border-emerald-500/30 rounded-md px-1.5 py-0.5 leading-none">
                      {idx + 1}
                    </span>
                    {step.title}
                  </h4>
                  <p className="text-xs text-slate-400 leading-6 mt-1">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>

          <p className="mt-4 text-[11px] text-slate-500 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-500" />
            هر وقت لازم شد، دکمه «راهنما» در نوار پایین همین صفحه راهنما را دوباره باز می‌کند.
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3">
          <span className="text-[11px] text-slate-500 hidden sm:block">استودیو چکادبام — طراحی روف‌گاردن مدولار</span>
          <button
            type="button"
            onClick={onStartDesign ?? onClose}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/60 transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
          >
            شروع طراحی
          </button>
        </div>
      </div>
    </div>
  );
}
