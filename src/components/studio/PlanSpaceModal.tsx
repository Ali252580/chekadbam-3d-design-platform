"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { SpaceConfig, FloorPlanShape } from "@/lib/studio-types";
import { PRESET_DESIGNS, PresetDesign } from "@/lib/studio-presets";
import { PlanBlueprintThumbnail } from "./PlanBlueprintThumbnail";
import { calculatePlanArea } from "@/lib/plan-boundary";
import { LayoutTemplate, Ruler, Check, X, Sparkles, HelpCircle } from "lucide-react";

interface PlanSpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  spaceConfig: SpaceConfig;
  onApplySpace: (cfg: SpaceConfig) => void;
  onApplyPreset: (preset: PresetDesign) => void;
}

const PLAN_SHAPES: Array<{ id: FloorPlanShape; name: string; desc: string; iconSvg: string }> = [
  { id: "rectangular", name: "مستطیلی استاندارد", desc: "پشت‌بام یکپارچه مسکونی و اداری", iconSvg: "M3 3h18v18H3z" },
  { id: "l_shaped", name: "L شکل (دو زون)", desc: "تفکیک نشیمن خصوصی از زون پذیرایی", iconSvg: "M3 3h18v9h-9v9H3z" },
  { id: "u_shaped", name: "U شکل (حیاط میانی)", desc: "روف‌گاردن ویلایی، کافه و تراس پیرامونی", iconSvg: "M3 3h6v9h6V3h6v18H3z" },
  { id: "central_shaft", name: "با باکس پله مرکزی", desc: "پشت‌بام با هسته بتنی و دسترسی دورگرد", iconSvg: "M3 3h18v18H3zm6 6h6v6H9z" },
  { id: "narrow_balcony", name: "تراس طولی کشیده", desc: "چیدمان خطی بالکن‌های عریض آپارتمانی", iconSvg: "M2 6h20v12H2z" },
];

interface TourStepMeta {
  icon: React.ElementType;
  title: string;
  desc: string;
  tab: "presets" | "custom" | null;
}

// Pure caption data (refs live separately in the component)
const TOUR_META: TourStepMeta[] = [
  {
    icon: LayoutTemplate,
    title: "دو راه برای شروع",
    desc: "پلان آماده را یک‌جا بارگذاری کنید، یا فرم و ابعاد بام خودتان را دستی بسازید.",
    tab: null,
  },
  {
    icon: Sparkles,
    title: "پلان‌های آماده",
    desc: "هر کارت، نقشه و چیدمان کامل یک روف‌گاردن است — با یک کلیک روی بوم سه‌بعدی می‌آید.",
    tab: "presets",
  },
  {
    icon: Ruler,
    title: "فرم و ابعاد دلخواه",
    desc: "شکل هندسی بام را انتخاب و عرض و طول را به متر بدهید؛ نقشه دوبعدی همین‌جا زنده به‌روز می‌شود.",
    tab: "custom",
  },
  {
    icon: Check,
    title: "اعمال روی بوم",
    desc: "با «اعمال»، پلان روی بوم سه‌بعدی ساخته می‌شود و اقلام چیده‌شده خودکار داخل مرزها بازچینی می‌شوند.",
    tab: "custom",
  },
];

export function PlanSpaceModal({ isOpen, onClose, spaceConfig, onApplySpace, onApplyPreset }: PlanSpaceModalProps) {
  const [tab, setTab] = useState<"presets" | "custom">("presets");
  const [formData, setFormData] = useState<SpaceConfig>({
    ...spaceConfig,
    flooringType: "wpc_wood",
  });

  // ── Visual guided tour (spotlight + caption card) ──────────────────────────
  const [tourStep, setTourStep] = useState<number | null>(null);
  const [spot, setSpot] = useState<{ top: number; left: number; width: number; height: number; cardTop: number; cardLeft: number } | null>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const presetsRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const applyRef = useRef<HTMLButtonElement>(null);
  const tourTargets = useMemo<Array<React.RefObject<HTMLElement | null>>>(
    () => [tabsRef, presetsRef, formRef, applyRef],
    []
  );

  const measureSpot = useCallback(
    (step: number) => {
      const el = tourTargets[step]?.current;
      if (!el) {
        setSpot(null);
        return;
      }
      const r = el.getBoundingClientRect();
      const pad = 8;
      const cardH = 150;
      const cardW = 340;
      const below = r.bottom + pad + 12 + cardH < window.innerHeight - 12;
      const cardTop = below ? r.bottom + pad + 12 : Math.max(12, r.top - pad - 12 - cardH);
      const cardLeft = Math.min(Math.max(12, r.left + r.width / 2 - cardW / 2), window.innerWidth - cardW - 12);
      setSpot({
        top: r.top - pad,
        left: r.left - pad,
        width: r.width + pad * 2,
        height: r.height + pad * 2,
        cardTop,
        cardLeft,
      });
    },
    [tourTargets]
  );

  useEffect(() => {
    if (tourStep === null || !isOpen) return;
    // Let the (possibly switched) tab content mount, bring the target into view, then measure
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        tourTargets[tourStep]?.current?.scrollIntoView({ block: "center" });
        measureSpot(tourStep);
      });
    });
    const onResize = () => measureSpot(tourStep);
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [tourStep, tab, isOpen, measureSpot, tourTargets]);

  // Auto-start once, the first time the plan window opens
  useEffect(() => {
    if (!isOpen) return;
    if (window.localStorage.getItem("chekadbam-plan-guide-seen")) return;
    const id = window.setTimeout(() => {
      window.localStorage.setItem("chekadbam-plan-guide-seen", "1");
      setTourStep(0);
    }, 600);
    return () => window.clearTimeout(id);
  }, [isOpen]);

  // Escape skips the tour
  useEffect(() => {
    if (tourStep === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTourStep(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tourStep]);

  const goToStep = useCallback(
    (idx: number | null) => {
      setTourStep(idx);
      if (idx !== null) {
        const targetTab = TOUR_META[idx]?.tab;
        if (targetTab) setTab(targetTab);
      }
    },
    []
  );
  const endTour = useCallback(() => setTourStep(null), []);
  const nextTour = useCallback(() => {
    if (tourStep === null) return;
    if (tourStep >= TOUR_META.length - 1) {
      endTour();
      return;
    }
    goToStep(tourStep + 1);
  }, [tourStep, goToStep, endTour]);
  const prevTour = useCallback(() => {
    if (tourStep === null || tourStep <= 0) return;
    goToStep(tourStep - 1);
  }, [tourStep, goToStep]);
  const startTour = useCallback(() => goToStep(0), [goToStep]);

  if (!isOpen) return null;

  const liveArea = calculatePlanArea(formData);

  const handleApplyCustom = () => {
    onApplySpace({
      ...formData,
      flooringType: "wpc_wood",
    });
    onClose();
  };

  const activeTour = tourStep !== null ? TOUR_META[tourStep] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn text-right" dir="rtl">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <LayoutTemplate className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">نقشه و ابعاد بام</h3>
              <p className="text-xs text-slate-400">یک پلان آماده بارگذاری کنید یا فرم و ابعاد دلخواه بام خود را تنظیم کنید.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={startTour}
              title="راهنمای تصویری این پنجره"
              aria-label="راهنمای تصویری این پنجره"
              className="px-2.5 h-8 rounded-lg bg-slate-800 text-slate-300 hover:text-emerald-300 hover:bg-slate-700 flex items-center justify-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline text-[11px] font-medium">راهنمای تصویری</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="بستن"
              className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div ref={tabsRef} className="px-6 pt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTab("presets")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              tab === "presets"
                ? "bg-emerald-600 text-white shadow"
                : "bg-slate-800 text-slate-300 hover:text-white"
            }`}
          >
            <LayoutTemplate className="w-4 h-4" />
            <span>پلان‌های آماده</span>
          </button>
          <button
            type="button"
            onClick={() => setTab("custom")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              tab === "custom"
                ? "bg-emerald-600 text-white shadow"
                : "bg-slate-800 text-slate-300 hover:text-white"
            }`}
          >
            <Ruler className="w-4 h-4" />
            <span>تنظیم دستی فرم و ابعاد</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 text-slate-200 text-xs">
          {tab === "presets" ? (
            <div ref={presetsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PRESET_DESIGNS.map((preset) => (
                <div
                  key={preset.id}
                  className="group bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/50 rounded-2xl overflow-hidden flex flex-col justify-between transition-all"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-[#080d1a] border-b border-slate-700/60">
                    <PlanBlueprintThumbnail presetId={preset.id} spaceConfig={preset.spaceConfig} />
                    {preset.badge && (
                      <span className="absolute top-2.5 right-2.5 bg-emerald-500 text-slate-950 text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow">
                        {preset.badge}
                      </span>
                    )}
                  </div>
                  <div className="p-3.5 space-y-2.5">
                    <h4 className="font-bold text-xs text-white group-hover:text-emerald-300 transition-colors leading-snug">
                      {preset.name}
                    </h4>
                    <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">{preset.description}</p>
                    <button
                      type="button"
                      onClick={() => {
                        onApplyPreset(preset);
                        onClose();
                      }}
                      className="w-full px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>بارگذاری این نقشه و چیدمان</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Shape + dimensions */}
              <div ref={formRef} className="lg:col-span-7 space-y-5">
                {/* Shape cards */}
                <div>
                  <label className="block text-xs font-bold text-emerald-400 mb-2.5">۱. فرم هندسی پلان بام</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {PLAN_SHAPES.map((plan) => {
                      const isSelected = formData.shape === plan.id;
                      return (
                        <button
                          key={plan.id}
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              shape: plan.id,
                              shapeName: plan.name,
                              cutoutWidth: plan.id === "l_shaped" || plan.id === "u_shaped" ? 4.5 : undefined,
                              cutoutLength: plan.id === "l_shaped" || plan.id === "u_shaped" ? 4.0 : undefined,
                              shaftWidth: plan.id === "central_shaft" ? 3.2 : undefined,
                              shaftLength: plan.id === "central_shaft" ? 3.0 : undefined,
                            })
                          }
                          className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between h-28 ${
                            isSelected
                              ? "bg-emerald-500/15 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/40"
                              : "bg-slate-800/60 border-slate-700/60 text-slate-300 hover:border-slate-600"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <svg className={`w-6 h-6 ${isSelected ? "text-emerald-400" : "text-slate-400"}`} viewBox="0 0 24 24" fill="currentColor">
                              <path d={plan.iconSvg} />
                            </svg>
                            {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                          </div>
                          <div>
                            <p className="font-bold text-xs leading-snug">{plan.name}</p>
                            <p className="text-[10px] text-slate-400 line-clamp-2 mt-1">{plan.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Dimensions */}
                <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/60 space-y-4">
                  <label className="block text-xs font-semibold text-slate-300">۲. ابعاد کلی (متر)</label>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">طول</label>
                      <input
                        type="number"
                        min={3}
                        max={40}
                        step={0.5}
                        value={formData.width}
                        onChange={(e) => setFormData({ ...formData, width: Math.max(3, parseFloat(e.target.value) || 3) })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">عرض</label>
                      <input
                        type="number"
                        min={2}
                        max={40}
                        step={0.5}
                        value={formData.length}
                        onChange={(e) => setFormData({ ...formData, length: Math.max(2, parseFloat(e.target.value) || 2) })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">جان‌پناه</label>
                      <input
                        type="number"
                        min={0.5}
                        max={2.5}
                        step={0.1}
                        value={formData.parapetHeight}
                        onChange={(e) => setFormData({ ...formData, parapetHeight: parseFloat(e.target.value) || 1.1 })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {(formData.shape === "l_shaped" || formData.shape === "u_shaped") && (
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-700/50">
                      <div>
                        <label className="block text-[11px] text-emerald-400 mb-1">طول فرورفتگی</label>
                        <input
                          type="number"
                          min={1}
                          max={formData.width - 1}
                          step={0.5}
                          value={formData.cutoutWidth || 4}
                          onChange={(e) => setFormData({ ...formData, cutoutWidth: parseFloat(e.target.value) || 4 })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-emerald-400 mb-1">عرض فرورفتگی</label>
                        <input
                          type="number"
                          min={1}
                          max={formData.length - 1}
                          step={0.5}
                          value={formData.cutoutLength || 3.5}
                          onChange={(e) => setFormData({ ...formData, cutoutLength: parseFloat(e.target.value) || 3.5 })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {formData.shape === "central_shaft" && (
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-700/50">
                      <div>
                        <label className="block text-[11px] text-emerald-400 mb-1">طول باکس پله</label>
                        <input
                          type="number"
                          min={1}
                          max={formData.width - 2}
                          step={0.2}
                          value={formData.shaftWidth || 3.2}
                          onChange={(e) => setFormData({ ...formData, shaftWidth: parseFloat(e.target.value) || 3.2 })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-emerald-400 mb-1">عرض باکس پله</label>
                        <input
                          type="number"
                          min={1}
                          max={formData.length - 2}
                          step={0.2}
                          value={formData.shaftLength || 3.0}
                          onChange={(e) => setFormData({ ...formData, shaftLength: parseFloat(e.target.value) || 3.0 })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-700/40">
                    <span className="text-slate-400">ابعاد: {formData.width} × {formData.length} متر</span>
                    <span className="font-bold text-emerald-400 font-mono">متراژ خالص: {liveArea} m²</span>
                  </div>
                </div>
              </div>

              {/* Live blueprint + materials */}
              <div className="lg:col-span-5 space-y-4">
                <div className="rounded-2xl overflow-hidden border border-slate-700/70 aspect-[16/10] bg-[#080d1a]">
                  <PlanBlueprintThumbnail presetId={`custom-${formData.shape}`} spaceConfig={formData} />
                </div>

                {/* Fixed standard flooring info (always WPC Wood Deck) */}
                <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 block">پوشش کف‌پوش:</span>
                    <span className="text-xs font-bold text-emerald-400">دک چوب‌پلاست (WPC شیاردار)</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                    ضد لغزش و آب‌گریز
                  </span>
                </div>

                <button
                  ref={applyRef}
                  type="button"
                  onClick={handleApplyCustom}
                  className="w-full px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>اعمال فرم و ابعاد روی نقشه فعلی</span>
                </button>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  با اعمال ابعاد جدید، اقلام چیده‌شده به‌صورت خودکار داخل مرزهای نقشه بازچینی می‌شوند.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Guided tour overlay (spotlight + caption card) ── */}
      {activeTour && (
        <div className="fixed inset-0 z-[60]" dir="rtl">
          {spot && (
            <div
              className="fixed rounded-2xl pointer-events-none transition-all duration-300"
              style={{
                top: spot.top,
                left: spot.left,
                width: spot.width,
                height: spot.height,
                boxShadow: "0 0 0 9999px rgba(2, 6, 23, 0.78)",
                border: "2px solid rgba(52, 211, 153, 0.8)",
              }}
            />
          )}
          {spot && (
            <div
              className="fixed w-[340px] bg-slate-900 border border-emerald-500/40 rounded-2xl shadow-2xl p-4 space-y-3"
              style={{ top: spot.cardTop, left: spot.cardLeft }}
              role="dialog"
              aria-label="راهنمای تصویری نقشه و ابعاد بام"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 shrink-0 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <activeTour.icon className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-white">{activeTour.title}</h4>
                    <span className="text-[10px] text-slate-500 font-mono">{tourStep! + 1} از {TOUR_META.length}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-6 mt-1.5">{activeTour.desc}</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={endTour}
                  className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 rounded-md px-1"
                >
                  رد کردن
                </button>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 ml-1" aria-hidden="true">
                    {TOUR_META.map((_, i) => (
                      <span
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full ${i === tourStep ? "bg-emerald-400" : "bg-slate-700"}`}
                      />
                    ))}
                  </div>
                  {tourStep! > 0 && (
                    <button
                      type="button"
                      onClick={prevTour}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
                    >
                      قبلی
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={nextTour}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                  >
                    {tourStep! === TOUR_META.length - 1 ? "فهمیدم" : "بعدی"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
