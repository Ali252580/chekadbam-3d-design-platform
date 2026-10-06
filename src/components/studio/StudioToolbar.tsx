"use client";

import React from "react";
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
  return (
    <div
      className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 max-w-[96vw] w-auto bg-slate-900/90 hover:bg-slate-900/95 border border-slate-700/80 rounded-2xl p-2 shadow-2xl backdrop-blur-xl flex items-center justify-center gap-2 text-right transition-all animate-fadeIn"
      dir="rtl"
    >
      {/* Primary Module Library CTA */}
      <button
        type="button"
        onClick={onOpenProductDrawer}
        className={`px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-950/60 transition-transform active:scale-95 cursor-pointer shrink-0 ${focusRing}`}
      >
        <Plus className="w-4 h-4" />
        <span>افزودن ماژول</span>
      </button>

      {/* Merged Plan & Dimensions */}
      <button
        type="button"
        onClick={onOpenPlanSpace}
        aria-label="نقشه و ابعاد بام"
        className={`px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-slate-700/70 transition-colors shrink-0 ${focusRing}`}
      >
        <LayoutTemplate className="w-4 h-4 text-emerald-400" />
        <span className="hidden md:inline">نقشه و ابعاد بام</span>
      </button>

      {/* Vertical Subtle Divider */}
      <div className="h-6 w-[1px] bg-slate-700/60 mx-0.5 shrink-0" />

      {/* Viewport Lighting Toggle */}
      <div className="flex items-center bg-slate-950/70 rounded-xl p-0.5 border border-slate-800 shrink-0">
        <button
          type="button"
          title="حالت روز"
          aria-label="حالت روز"
          onClick={() => setLightingMode("day")}
          className={`p-1.5 rounded-lg flex items-center gap-1 transition-all ${focusRing} ${
            lightingMode === "day"
              ? "bg-amber-500/25 text-amber-400 font-bold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Sun className="w-3.5 h-3.5" />
          <span className="text-[10px] hidden lg:inline">روز</span>
        </button>

        <button
          type="button"
          title="حالت غروب"
          aria-label="حالت غروب"
          onClick={() => setLightingMode("sunset")}
          className={`p-1.5 rounded-lg flex items-center gap-1 transition-all ${focusRing} ${
            lightingMode === "sunset"
              ? "bg-orange-500/25 text-orange-400 font-bold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Sunset className="w-3.5 h-3.5" />
          <span className="text-[10px] hidden lg:inline">غروب</span>
        </button>

        <button
          type="button"
          title="حالت شب با نورپردازی"
          aria-label="حالت شب با نورپردازی"
          onClick={() => setLightingMode("night")}
          className={`p-1.5 rounded-lg flex items-center gap-1 transition-all ${focusRing} ${
            lightingMode === "night"
              ? "bg-indigo-500/35 text-indigo-300 font-bold ring-1 ring-indigo-500/50"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Moon className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[10px] hidden lg:inline">شب</span>
        </button>
      </div>

      {/* View Mode 2D/3D */}
      <button
        type="button"
        title={viewMode === "3d" ? "مشاهده پلان از بالا (۲D)" : "مشاهده پرسپکتیو سه‌بعدی"}
        aria-label={viewMode === "3d" ? "مشاهده پلان از بالا (۲D)" : "مشاهده پرسپکتیو سه‌بعدی"}
        onClick={() => setViewMode(viewMode === "3d" ? "top_2d" : "3d")}
        className={`px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-1 border transition-all shrink-0 ${focusRing} ${
          viewMode === "top_2d"
            ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-bold"
            : "bg-slate-800/80 border-slate-700/60 text-slate-300 hover:text-white"
        }`}
      >
        <Eye className="w-3.5 h-3.5" />
        <span className="text-[11px] hidden sm:inline">{viewMode === "3d" ? "پلان ۲D" : "دید ۳D"}</span>
      </button>

      {/* Camera Reset & Grid Snap */}
      <button
        type="button"
        title="تنظیم مجدد دوربین"
        aria-label="تنظیم مجدد دوربین"
        onClick={onResetCamera}
        className={`p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/60 transition-colors shrink-0 ${focusRing}`}
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        title={smartSnapping ? "شبکه مدولار فعال (۱ متر)" : "شبکه مدولار غیرفعال"}
        aria-label={smartSnapping ? "شبکه مدولار فعال (۱ متر)" : "شبکه مدولار غیرفعال"}
        onClick={() => setSmartSnapping(!smartSnapping)}
        className={`p-2 rounded-xl border transition-all shrink-0 ${focusRing} ${
          smartSnapping
            ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-400"
            : "bg-slate-800/80 border-slate-700/60 text-slate-500"
        }`}
      >
        <Grid className="w-3.5 h-3.5" />
      </button>

      {/* Studio Guide */}
      <button
        type="button"
        title="راهنمای کار با استودیو"
        aria-label="راهنمای کار با استودیو"
        onClick={onOpenGuide}
        className={`p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-emerald-300 border border-slate-700/60 transition-colors shrink-0 ${focusRing}`}
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {/* Undo / Redo */}
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          type="button"
          disabled={!canUndo}
          onClick={onUndo}
          title="بازگشت (Undo)"
          aria-label="بازگشت (Undo)"
          className={`p-1.5 rounded-lg bg-slate-800/70 hover:bg-slate-700 disabled:opacity-30 text-slate-300 border border-slate-700/50 transition-colors ${focusRing}`}
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          disabled={!canRedo}
          onClick={onRedo}
          title="تکرار (Redo)"
          aria-label="تکرار (Redo)"
          className={`p-1.5 rounded-lg bg-slate-800/70 hover:bg-slate-700 disabled:opacity-30 text-slate-300 border border-slate-700/50 transition-colors ${focusRing}`}
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Vertical Subtle Divider */}
      <div className="h-6 w-[1px] bg-slate-700/60 mx-0.5 shrink-0" />

      {/* Items List */}
      <button
        type="button"
        onClick={onOpenBOM}
        className={`px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-slate-700/70 transition-colors shrink-0 ${focusRing}`}
      >
        <ClipboardList className="w-4 h-4 text-emerald-400" />
        <span>فهرست اقلام</span>
        {itemsCount > 0 && (
          <span className="w-4 h-4 rounded-full bg-emerald-500/25 text-emerald-300 text-[10px] font-mono flex items-center justify-center font-bold">
            {itemsCount}
          </span>
        )}
      </button>

      {/* Save / Send */}
      <button
        type="button"
        onClick={onOpenSave}
        aria-label="ذخیره طرح"
        className={`px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-950/60 transition-all cursor-pointer shrink-0 ${focusRing}`}
      >
        <Send className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">ذخیره طرح</span>
      </button>

      {/* Clear if items exist */}
      {itemsCount > 0 && (
        <button
          type="button"
          title="پاک کردن تمام آبجکت‌ها"
          aria-label="پاک کردن تمام آبجکت‌ها"
          onClick={onClearCanvas}
          className={`p-2 rounded-xl bg-slate-800/60 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700/50 transition-colors shrink-0 ${focusRing}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
