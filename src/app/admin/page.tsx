"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  Sparkles,
  Users,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  FileEdit,
  Save,
  MessageSquare,
  Search,
  Filter,
  Eye,
} from "lucide-react";

const PIPELINE_STATUSES = [
  "طرح اولیه",
  "درخواست ثبت‌شده",
  "در انتظار تماس",
  "نیازمند بازدید",
  "در حال طراحی",
  "ارسال پیش‌فاکتور",
  "قرارداد شده",
  "بایگانی",
];

export default function AdminCRMPage() {
  const [designs, setDesigns] = useState<any[]>([]);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"designs" | "consultations">("designs");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Edit notes state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resD, resC] = await Promise.all([
        fetch("/api/designs"),
        fetch("/api/consultations"),
      ]);
      const dataD = await resD.json();
      const dataC = await resC.json();
      if (dataD.success) setDesigns(dataD.designs);
      if (dataC.success) setConsultations(dataC.consultations);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      await fetch(`/api/designs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveExpertNotes = async (id: number) => {
    try {
      setSavingStatus(true);
      await fetch(`/api/designs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expertNotes: editNotes }),
      });
      setEditingId(null);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingStatus(false);
    }
  };

  const filteredDesigns = designs.filter((d) => {
    const matchStatus = selectedStatus === "all" || d.status === selectedStatus;
    const matchSearch =
      !searchQuery ||
      (d.userName && d.userName.includes(searchQuery)) ||
      (d.userPhone && d.userPhone.includes(searchQuery)) ||
      (d.city && d.city.includes(searchQuery)) ||
      (d.title && d.title.includes(searchQuery));
    return matchStatus && matchSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans text-right" dir="rtl">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                پنل مدیریت کارشناسان چکادبام (CRM)
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              بررسی و پیگیری طرح‌های سه‌بعدی ثبت‌شده توسط کاربران و درخواست‌های مشاوره
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab("designs")}
              className={`px-4 py-2 rounded-xl transition-all font-bold ${
                activeTab === "designs"
                  ? "bg-emerald-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              طرح‌های سه‌بعدی ({designs.length})
            </button>
            <button
              onClick={() => setActiveTab("consultations")}
              className={`px-4 py-2 rounded-xl transition-all font-bold ${
                activeTab === "consultations"
                  ? "bg-emerald-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              درخواست‌های مشاوره ({consultations.length})
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              placeholder="جستجوی نام، تلفن یا شهر..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 w-full sm:w-auto no-scrollbar text-xs">
            <span className="text-slate-400 text-[11px] shrink-0">فیلتر وضعیت:</span>
            {["all", ...PIPELINE_STATUSES].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                  selectedStatus === st
                    ? "bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {st === "all" ? "همه" : st}
              </button>
            ))}
          </div>
        </div>

        {/* Data Content */}
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-xs">در حال بارگذاری اطلاعات...</div>
        ) : activeTab === "designs" ? (
          <div className="space-y-4">
            {filteredDesigns.map((design) => (
              <div
                key={design.id}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold text-sm shrink-0">
                      #{design.id}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-white">{design.title}</h3>
                        {design.source === "wordpress" ? (
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-sky-500/15 text-sky-300 border border-sky-500/30"
                            title={design.sourceRef ? `شناسه طرح در وردپرس: ${design.sourceRef}` : ""}
                          >
                            ثبت‌شده در وردپرس
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
                            استودیو پنل
                          </span>
                        )}
                        <span className="text-xs font-mono text-slate-400">
                          {new Date(design.createdAt).toLocaleDateString("fa-IR")}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-1">
                        <span className="font-semibold text-emerald-400">{design.userName || "بدون نام"}</span>
                        <span>•</span>
                        <a href={`tel:${design.userPhone}`} className="font-mono text-slate-200 hover:text-emerald-400 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{design.userPhone || "شماره ثبت نشده"}</span>
                        </a>
                        <span>•</span>
                        <span>شهر: {design.city}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Dropdown */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">وضعیت پیگیری:</span>
                    <select
                      value={design.status}
                      onChange={(e) => handleUpdateStatus(design.id, e.target.value)}
                      className="bg-slate-800 border border-slate-700 text-emerald-300 font-bold rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500"
                    >
                      {PIPELINE_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Specs & Preview */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-xs">
                  {design.snapshotUrl ? (
                    <div className="lg:col-span-4 rounded-2xl overflow-hidden border border-slate-800 aspect-video bg-slate-950">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={design.snapshotUrl} alt={design.title} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="lg:col-span-4 aspect-video bg-slate-950 rounded-2xl flex items-center justify-center text-slate-600">
                      پیش‌نمایش ندارد
                    </div>
                  )}

                  <div className="lg:col-span-8 space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-700/50">
                        <span className="text-slate-400 block text-[10px]">ابعاد پروژه</span>
                        <span className="font-mono font-bold text-white text-xs">{design.width} × {design.length} م</span>
                      </div>
                      <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-700/50">
                        <span className="text-slate-400 block text-[10px]">مساحت کل</span>
                        <span className="font-mono font-bold text-emerald-400 text-xs">{design.totalArea} م²</span>
                      </div>
                      <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-700/50">
                        <span className="text-slate-400 block text-[10px]">تعداد قطعات</span>
                        <span className="font-mono font-bold text-white text-xs">{design.itemsCount || 0} عدد</span>
                      </div>
                      <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-700/50">
                        <span className="text-slate-400 block text-[10px]">وزن مرده</span>
                        <span className="font-mono font-bold text-white text-xs">{design.estimatedWeightKg || 0} kg</span>
                      </div>
                    </div>

                    {/* Customer Notes */}
                    {design.notes && (
                      <div className="p-3 bg-slate-800/30 rounded-xl border border-slate-700/40 text-slate-300">
                        <strong className="text-slate-400 block text-[10px] mb-0.5">یادداشت مشتری:</strong>
                        <p className="leading-relaxed">{design.notes}</p>
                      </div>
                    )}

                    {/* Expert Notes Editor */}
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-bold text-[11px] flex items-center gap-1.5">
                          <FileEdit className="w-3.5 h-3.5 text-emerald-400" />
                          <span>یادداشت کارشناس فروش و طراحی:</span>
                        </span>
                        {editingId !== design.id && (
                          <button
                            onClick={() => {
                              setEditingId(design.id);
                              setEditNotes(design.expertNotes || "");
                            }}
                            className="text-emerald-400 hover:text-emerald-300 text-[11px]"
                          >
                            ویرایش یادداشت
                          </button>
                        )}
                      </div>

                      {editingId === design.id ? (
                        <div className="space-y-2">
                          <textarea
                            rows={2}
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            placeholder="نتیجه تماس تلفنی، تاریخ بازدید هماهنگ شده، تخفیف توافقی..."
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSaveExpertNotes(design.id)}
                              disabled={savingStatus}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>ذخیره یادداشت</span>
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
                            >
                              انصراف
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-slate-300 italic bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                          {design.expertNotes || "هنوز یادداشتی ثبت نشده است."}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {filteredDesigns.length === 0 && (
              <div className="py-12 text-center text-slate-400 text-xs">طرحی مطابق جستجوی شما یافت نشد.</div>
            )}
          </div>
        ) : (
          /* Tab: Consultations */
          <div className="space-y-4">
            {consultations.map((c) => (
              <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-sm text-white">{c.name}</h3>
                    <a href={`tel:${c.phone}`} className="font-mono text-emerald-400 text-xs">
                      {c.phone}
                    </a>
                    <span className="text-slate-400 text-xs">شهر: {c.city}</span>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">
                    {new Date(c.createdAt).toLocaleDateString("fa-IR")}
                  </span>
                </div>
                {c.message && <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl">{c.message}</p>}
              </div>
            ))}

            {consultations.length === 0 && (
              <div className="py-12 text-center text-slate-400 text-xs">درخواست مشاوره‌ای ثبت نشده است.</div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
