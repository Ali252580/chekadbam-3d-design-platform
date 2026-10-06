"use client";

import React from "react";
import { StudioItem } from "@/lib/studio-types";
import { WPC_COLORS } from "@/lib/products-data";
import { RotateCw, Copy, Trash2, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, X } from "lucide-react";

// Half of the 1 m modular tile — keeps nudges aligned with grid snapping
const NUDGE_STEP = 0.5;

// Shared keyboard-focus affordance (ring replaces the removed default outline)
const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60";

interface ItemInspectorBarProps {
  selectedItem: StudioItem | null;
  onMoveItem?: (id: string, dx: number, dz: number) => void;
  onRotateItem: (id: string, deltaAngle: number) => void;
  onDuplicateItem: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onUpdateItemMaterial: (id: string, wpcColor?: string, metalColor?: string) => void;
  onDeselect: () => void;
}

export function ItemInspectorBar({
  selectedItem,
  onMoveItem,
  onRotateItem,
  onDuplicateItem,
  onDeleteItem,
  onUpdateItemMaterial,
  onDeselect,
}: ItemInspectorBarProps) {
  if (!selectedItem) return null;

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 max-w-3xl w-[94%] sm:w-auto bg-slate-900/95 border border-slate-700/80 rounded-2xl p-2.5 shadow-2xl backdrop-blur-xl flex flex-wrap items-center justify-between gap-3 text-right animate-slideUp text-xs" dir="rtl">
      {/* Item Info */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-mono font-bold text-xs shrink-0">
          ✓
        </div>
        <div>
          <h4 className="font-bold text-white text-xs leading-tight">{selectedItem.name}</h4>
          <span className="text-[10px] text-slate-400 font-mono">
            X={selectedItem.x} , Z={selectedItem.z} | {selectedItem.rotation}°
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Nudge Position Controls */}
        {onMoveItem && (
          <div className="flex items-center gap-0.5 bg-slate-950/70 p-0.5 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => onMoveItem(selectedItem.id, -NUDGE_STEP, 0)}
              className={`p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white ${focusRing}`}
              title="حرکت به چپ (۰.۵ متر)"
              aria-label="حرکت به چپ (۰.۵ متر)"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onMoveItem(selectedItem.id, NUDGE_STEP, 0)}
              className={`p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white ${focusRing}`}
              title="حرکت به راست (۰.۵ متر)"
              aria-label="حرکت به راست (۰.۵ متر)"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onMoveItem(selectedItem.id, 0, -NUDGE_STEP)}
              className={`p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white ${focusRing}`}
              title="حرکت به بالا (۰.۵ متر)"
              aria-label="حرکت به بالا (۰.۵ متر)"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onMoveItem(selectedItem.id, 0, NUDGE_STEP)}
              className={`p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white ${focusRing}`}
              title="حرکت به پایین (۰.۵ متر)"
              aria-label="حرکت به پایین (۰.۵ متر)"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Rotate 45 deg */}
        <button
          type="button"
          onClick={() => onRotateItem(selectedItem.id, 45)}
          className={`px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 flex items-center gap-1 text-[11px] font-medium transition-colors ${focusRing}`}
        >
          <RotateCw className="w-3.5 h-3.5 text-emerald-400" />
          <span>چرخش ۴۵°</span>
        </button>

        {/* Duplicate */}
        <button
          type="button"
          onClick={() => onDuplicateItem(selectedItem.id)}
          className={`p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-colors ${focusRing}`}
          title="تکثیر قطعه"
          aria-label="تکثیر قطعه"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>

        {/* Color Palette Switcher */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {WPC_COLORS.map((col) => (
            <button
              key={col.id}
              type="button"
              title={col.name}
              aria-label={`رنگ ${col.name}`}
              onClick={() => onUpdateItemMaterial(selectedItem.id, col.id, selectedItem.metalColor)}
              className={`w-4 h-4 rounded-full border transition-transform ${focusRing} ${
                selectedItem.wpcColor === col.id ? "scale-125 border-emerald-400 ring-1 ring-emerald-400" : "border-slate-600"
              }`}
              style={{ backgroundColor: col.colorHex }}
            />
          ))}
        </div>

        {/* Delete */}
        <button
          type="button"
          onClick={() => onDeleteItem(selectedItem.id)}
          className={`p-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-rose-100 border border-rose-800/60 transition-colors ${focusRing}`}
          title="حذف قطعه"
          aria-label="حذف قطعه"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        {/* Close / Deselect */}
        <button
          type="button"
          onClick={onDeselect}
          className={`p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors ${focusRing}`}
          title="بستن و عدم انتخاب"
          aria-label="بستن و عدم انتخاب"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
