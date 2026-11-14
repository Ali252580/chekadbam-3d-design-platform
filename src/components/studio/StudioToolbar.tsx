"use client";

import React, { useEffect, useState } from "react";
import {
  Sun,
  Sunset,
  Moon,
  Eye,
  RotateCcw,
  Undo2,
  Redo2,
  Grid,
  Plus,
  LayoutTemplate,
  ClipboardList,
  Send,
  Trash2,
  HelpCircle,
  SlidersHorizontal,
  X,
} from "lucide-react";

interface StudioToolbarProps {
  onOpenPlanSpace: () => void;
  onOpenProductDrawer: () => void;
  onOpenBOM: () => void;
  onOpenSave: () => void;
  onOpenGuide: () => void;
  onResetCamera: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onClearCanvas: () => void;
  lightingMode: "day" | "sunset" | "night";
  setLightingMode: (mode: "day" | "sunset" | "night") => void;
  viewMode: "3d" | "top_2d";
  setViewMode: (mode: "3d" | "top_2d") => void;
  smartSnapping: boolean;
  setSmartSnapping: (val: boolean) => void;
  itemsCount: number;
}

// Shared keyboard-focus affordance (ring replaces the removed default outline)
const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60";

// 44px on touch screens; compact again on pointer/desktop sizes.
const iconButton = `h-11 w-11 sm:h-9 sm:w-9 flex items-center justify-center rounded-xl transition-colors shrink-0 ${focusRing}`;

export function StudioToolbar({
  onOpenPlanSpace,
  onOpenProductDrawer,
  onOpenBOM,
  onOpenSave,
  onOpenGuide,
  onResetCamera,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onClearCanvas,
  lightingMode,
  setLightingMode,
  viewMode,
  setViewMode,
  smartSnapping,
  setSmartSnapping,
  itemsCount,
}: StudioToolbarProps) {
  // Secondary tools live in an expandable sheet below xl, so the primary
  // actions always fit at 320–1279px without being clipped off-screen.
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMoreOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [moreOpen]);

  const secondaryTools = (
    <>
      {/* Viewport Lighting Toggle */}
      <div className="flex items-center bg-slate-950/70 rounded-xl p-0.5 border border-slate-800 shrink-0">
        <button
          type="button"
          title="حالت روز"
          aria-label="حالت روز"
          aria-pressed={lightingMode === "day"}
          onClick={() => setLightingMode("day")}
          className={`h-10 sm:h-8 px-2 rounded-lg flex items-center gap-1 transition-all ${focusRing} ${
            lightingMode === "day"
              ? "bg-amber-500/25 text-amber-400 font-bold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Sun className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
          <span className="text-[10px]">روز</span>
        </button>

        <button
          type="button"
          title="حالت غروب"
          aria-label="حالت غروب"
          aria-pressed={lightingMode === "sunset"}
          onClick={() => setLightingMode("sunset")}
          className={`h-10 sm:h-8 px-2 rounded-lg flex items-center gap-1 transition-all ${focusRing} ${
            lightingMode === "sunset"
              ? "bg-orange-500/25 text-orange-400 font-bold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Sunset className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
          <span className="text-[10px]">غروب</span>
        </button>

        <button
          type="button"
          title="حالت شب با نورپردازی"
          aria-label="حالت شب با نورپردازی"
          aria-pressed={lightingMode === "night"}
          onClick={() => setLightingMode("night")}
          className={`h-10 sm:h-8 px-2 rounded-lg flex items-center gap-1 transition-all ${focusRing} ${
            lightingMode === "night"
              ? "bg-indigo-500/35 text-indigo-300 font-bold ring-1 ring-indigo-500/50"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Moon className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-cyan-400" />
          <span className="text-[10px]">شب</span>
        </button>
      </div>

      {/* Camera Reset & Grid Snap */}
      <button
        type="button"
        title="تنظیم مجدد دوربین"
        aria-label="تنظیم مجدد دوربین"
        onClick={onResetCamera}
        className={`${iconButton} bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60`}
      >
        <RotateCcw className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
      </button>

      <button
        type="button"
        title={smartSnapping ? "شبکه مدولار فعال (۱ متر)" : "شبکه مدولار غیرفعال"}
        aria-label={smartSnapping ? "شبکه مدولار فعال (۱ متر)" : "شبکه مدولار غیرفعال"}
        aria-pressed={smartSnapping}
        onClick={() => setSmartSnapping(!smartSnapping)}
        className={`${iconButton} border transition-all ${
          smartSnapping
            ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-400"
            : "bg-slate-800/80 border-slate-700/60 text-slate-400"
        }`}
      >
        <Grid className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
      </button>

      {/* Studio Guide */}
      <button
        type="button"
        title="راهنمای کار با استودیو"
        aria-label="راهنمای کار با استودیو"
        onClick={onOpenGuide}
        className={`${iconButton} bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-emerald-300 border border-slate-700/60`}
      >
        <HelpCircle className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
      </button>

      {/* Undo / Redo */}
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          type="button"
          disabled={!canUndo}
          onClick={onUndo}
          title="بازگشت (Undo)"
          aria-label="بازگشت (Undo)"
          className={`${iconButton} bg-slate-800/70 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800/70 text-slate-300 border border-slate-700/50`}
        >
          <Undo2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
        </button>
        <button
          type="button"
          disabled={!canRedo}
          onClick={onRedo}
          title="تکرار (Redo)"
          aria-label="تکرار (Redo)"
          className={`${iconButton} bg-slate-800/70 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800/70 text-slate-300 border border-slate-700/50`}
        >
          <Redo2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
        </button>
      </div>

      {/* Clear if items exist */}
      {itemsCount > 0 && (
        <button
          type="button"
          title="پاک کردن تمام آبجکت‌ها"
          aria-label="پاک کردن تمام آبجکت‌ها"
          onClick={onClearCanvas}
          className={`${iconButton} bg-slate-800/60 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 border border-slate-700/50`}
        >
          <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
        </button>
      )}
    </>
  );

  return (
    <div
      className="absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-30 w-[calc(100vw-1rem)] sm:w-max max-w-[calc(100vw-1rem)] flex flex-col items-stretch sm:items-center gap-2 text-right"
      dir="rtl"
    >
      {/* Expandable secondary tools — below xl the full row cannot fit */}
      {moreOpen && (
        <div
          id="studio-toolbar-more"
          className="xl:hidden bg-slate-900/95 border border-slate-700/80 rounded-2xl p-2 shadow-2xl backdrop-blur-xl animate-fadeIn"
        >
          {/* Plan & view live in the sheet on phones, in the dock from sm up */}
          <div className="flex sm:hidden items-center justify-center gap-1.5 pb-2 mb-2 border-b border-slate-800">
            <button
              type="button"
              onClick={onOpenPlanSpace}
              className="h-10 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center gap-1.5 border border-slate-700/70"
            >
              <LayoutTemplate className="w-4 h-4 text-emerald-400" />
              <span>نقشه و ابعاد بام</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode(viewMode === "3d" ? "top_2d" : "3d")}
              aria-pressed={viewMode === "top_2d"}
              className={`h-10 px-3 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 border transition-all ${
                viewMode === "top_2d"
                  ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-300"
                  : "bg-slate-800/80 border-slate-700/60 text-slate-300"
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>{viewMode === "3d" ? "پلان ۲D" : "دید ۳D"}</span>
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
            {secondaryTools}
          </div>
        </div>
      )}

      <div className="bg-slate-900/90 hover:bg-slate-900/95 border border-slate-700/80 rounded-2xl p-1 sm:p-2 shadow-2xl backdrop-blur-xl flex flex-wrap items-center justify-center gap-1 sm:gap-2 transition-all animate-fadeIn">
        {/* Primary Module Library CTA */}
        <button
          type="button"
          onClick={onOpenProductDrawer}
          className={`h-11 min-w-0 flex-1 sm:flex-none sm:h-auto px-2 sm:px-3.5 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/60 transition-transform active:scale-95 cursor-pointer shrink-0 ${focusRing}`}
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span className="hidden min-[360px]:inline whitespace-nowrap">افزودن ماژول</span>
        </button>

        {/* Merged Plan & Dimensions + view toggle (in the sheet on phones) */}
        <div className="hidden sm:flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenPlanSpace}
            aria-label="نقشه و ابعاد بام"
            title="نقشه و ابعاد بام"
            className={`${iconButton} sm:w-auto sm:px-3 sm:py-2 bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700/70`}
          >
            <LayoutTemplate className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="hidden md:inline whitespace-nowrap">نقشه و ابعاد بام</span>
          </button>

          {/* View Mode 2D/3D */}
          <button
            type="button"
            title={viewMode === "3d" ? "مشاهده پلان از بالا (۲D)" : "مشاهده پرسپکتیو سه‌بعدی"}
            aria-label={viewMode === "3d" ? "مشاهده پلان از بالا (۲D)" : "مشاهده پرسپکتیو سه‌بعدی"}
            aria-pressed={viewMode === "top_2d"}
            onClick={() => setViewMode(viewMode === "3d" ? "top_2d" : "3d")}
            className={`${iconButton} sm:w-auto sm:px-2.5 sm:py-1.5 text-xs flex items-center justify-center gap-1 border transition-all ${
              viewMode === "top_2d"
                ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-bold"
                : "bg-slate-800/80 border-slate-700/60 text-slate-300 hover:text-white"
            }`}
          >
            <Eye className="w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0" />
            <span className="text-[11px] hidden min-[480px]:inline whitespace-nowrap">
              {viewMode === "3d" ? "پلان ۲D" : "دید ۳D"}
            </span>
          </button>
        </div>

        {/* Items List */}
        <button
          type="button"
          onClick={onOpenBOM}
          aria-label="فهرست اقلام"
          title="فهرست اقلام"
          className={`${iconButton} sm:w-auto sm:px-3 sm:py-2 bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700/70`}
        >
          <ClipboardList className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="hidden sm:inline whitespace-nowrap">فهرست اقلام</span>
          {itemsCount > 0 && (
            <span className="min-w-4 h-4 px-1 rounded-full bg-emerald-500/25 text-emerald-300 text-[10px] font-mono flex items-center justify-center font-bold">
              {itemsCount}
            </span>
          )}
        </button>

        {/* Save / Send — the primary conversion action stays visible at every width */}
        <button
          type="button"
          onClick={onOpenSave}
          aria-label="ذخیره طرح"
          title="ذخیره طرح"
          className={`h-11 min-w-0 flex-1 sm:flex-none sm:h-auto px-2 sm:px-3.5 sm:py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/60 transition-all cursor-pointer shrink-0 ${focusRing}`}
        >
          <Send className="w-3.5 h-3.5 shrink-0" />
          <span className="whitespace-nowrap">ذخیره طرح</span>
        </button>

        {/* Secondary tools trigger (below xl) */}
        <button
          type="button"
          onClick={() => setMoreOpen((v) => !v)}
          aria-label={moreOpen ? "بستن ابزارهای بیشتر" : "ابزارهای بیشتر"}
          aria-expanded={moreOpen}
          aria-controls="studio-toolbar-more"
          title="ابزارهای بیشتر"
          className={`${iconButton} xl:hidden border ${
            moreOpen
              ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-300"
              : "bg-slate-800/80 border-slate-700/60 text-slate-300 hover:text-white"
          }`}
        >
          {moreOpen ? <X className="w-4 h-4" /> : <SlidersHorizontal className="w-4 h-4" />}
        </button>

        {/* Full inline secondary row on wide screens */}
        <div className="hidden xl:flex items-center gap-2">
          <div className="h-6 w-px bg-slate-700/60 mx-0.5 shrink-0" />
          {secondaryTools}
        </div>
      </div>
    </div>
  );
}
