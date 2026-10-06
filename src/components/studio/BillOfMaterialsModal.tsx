"use client";

import React from "react";
import { BillOfMaterials } from "@/lib/studio-types";
import { ClipboardList, FileText, Printer, X } from "lucide-react";

interface BillOfMaterialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bom: BillOfMaterials;
}

export function BillOfMaterialsModal({
  isOpen,
  onClose,
  bom,
}: BillOfMaterialsModalProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn text-right" dir="rtl">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">فهرست اقلام</h3>
              <p className="text-xs text-slate-400">اقلام و قطعات انتخاب‌شده در طرح</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>چاپ فهرست</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1 text-slate-200 text-xs">
          <div className="mb-3 flex items-center gap-2 text-slate-300">
            <FileText className="w-4 h-4 text-emerald-400" />
            <span className="font-bold">ریز اقلام سیستم مدولار</span>
          </div>

          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 text-[11px] border-b border-slate-800">
                  <th className="p-3">شرح اقلام و قطعات</th>
                  <th className="p-3">کد</th>
                  <th className="p-3 text-center">تعداد / متراژ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {bom.itemizedSummary.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="p-3 font-medium text-slate-200">{item.name}</td>
                    <td className="p-3 font-mono text-slate-400 text-[10px]">{item.code}</td>
                    <td className="p-3 text-center font-mono font-bold text-emerald-400">{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <p className="text-[11px] text-slate-400">این فهرست بر اساس چیدمان فعلی طرح به‌روزرسانی می‌شود.</p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors"
          >
            تأیید و بازگشت به طرح
          </button>
        </div>
      </div>
    </div>
  );
}
