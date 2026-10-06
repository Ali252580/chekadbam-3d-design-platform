"use client";

import React, { useState } from "react";
import confetti from "canvas-confetti";
import { SpaceConfig, StudioItem, BillOfMaterials } from "@/lib/studio-types";
import { Send, Download, Phone, User, MessageSquare, CheckCircle, Sparkles, X, Share2 } from "lucide-react";

interface SaveConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  spaceConfig: SpaceConfig;
  items: StudioItem[];
  bom: BillOfMaterials;
  screenshotDataUrl: string;
}

export function SaveConsultationModal({
  isOpen,
  onClose,
  spaceConfig,
  items,
  bom,
  screenshotDataUrl,
}: SaveConsultationModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [savedDesignId, setSavedDesignId] = useState<number | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      alert("لطفاً نام و شماره همراه خود را وارد کنید.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Save Design in DB
      const res = await fetch("/api/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `طرح روف‌گاردن ${name} (${spaceConfig.city})`,
          userName: name,
          userPhone: phone,
          userEmail: email,
          city: spaceConfig.city,
          spaceType: spaceConfig.spaceType,
          width: spaceConfig.width,
          length: spaceConfig.length,
          parapetHeight: spaceConfig.parapetHeight,
          flooringType: spaceConfig.flooringType,
          wpcColor: spaceConfig.wpcColor,
          metalColor: spaceConfig.metalColor,
          layoutData: items,
          totalArea: bom.totalAreaM2,
          greenArea: bom.greenAreaM2,
          flooringArea: bom.flooringAreaM2,
          itemsCount: items.length,
          estimatedWeightKg: bom.totalWeightKg,
          estimatedPriceMin: bom.estimatedPriceMin,
          estimatedPriceMax: bom.estimatedPriceMax,
          notes,
          snapshotUrl: screenshotDataUrl || null,
        }),
      });

      const data = await res.json();

      if (data.success && data.design) {
        setSavedDesignId(data.design.id);

        // 2. Also register consultation lead
        await fetch("/api/consultations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            phone,
            city: spaceConfig.city,
            spaceType: spaceConfig.spaceTypeName || "پشت‌بام مسکونی",
            estimatedArea: bom.totalAreaM2,
            servicesNeeded: ["طراحی سه‌بعدی بام من", "اجرای سیستم پرتابل و مدولار"],
            message: notes,
            designId: data.design.id,
          }),
        });

        setIsSubmitted(true);
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } catch (err) {
      console.error(err);
      alert("خطا در ارسال اطلاعات. لطفاً مجدداً تلاش نمایید.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadImage = () => {
    if (!screenshotDataUrl) return;
    const link = document.createElement("a");
    link.href = screenshotDataUrl;
    link.download = `chekadbam-design-${Date.now()}.jpg`;
    link.click();
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `سلام و وقت بخیر، طرح سه‌بعدی بام من در وب‌سایت چکادبام:\n` +
        `• نام کارفرما: ${name || "کاربر چکادبام"}\n` +
        `• شهر: ${spaceConfig.city}\n` +
        `• ابعاد: ${spaceConfig.width} × ${spaceConfig.length} متر (${bom.totalAreaM2} مترمربع)\n` +
        `• تعداد ماژول‌ها: ${items.length} عدد\n` +
        `• مساحت سبز: ${bom.greenAreaM2} مترمربع\n` +
        `لطفاً جهت هماهنگی بازدید و پیش‌فاکتور با من تماس بگیرید.`
    );
    window.open(`https://wa.me/982144484801?text=${text}`, "_blank");
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn text-right" dir="rtl">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">ذخیره طرح و ارسال به کارشناسان چکادبام</h3>
              <p className="text-xs text-slate-400">مشاوره تخصصی و برآورد رایگان پروژه</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200 text-xs">
          {/* Screenshot Preview */}
          {screenshotDataUrl && (
            <div className="relative rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 aspect-video group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={screenshotDataUrl} alt="طرح سه‌بعدی بام من" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={handleDownloadImage}
                className="absolute bottom-3 left-3 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 backdrop-blur shadow"
              >
                <Download className="w-3.5 h-3.5" />
                <span>دانلود تصویر طرح</span>
              </button>
            </div>
          )}

          {isSubmitted ? (
            <div className="p-6 text-center space-y-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-white">طرح شما با موفقیت ثبت گردید!</h4>
              <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
                کد رهگیری پروژه شما: <span className="font-mono font-bold text-emerald-400">CK-{savedDesignId || "842"}</span>
                <br />
                کارشناسان طراحی و فروش چکادبام حداکثر ظرف ۴ ساعت کاری جهت ارائه مشاوره و تنظیم قرار بازدید با شما تماس خواهند گرفت.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>پیام در واتساپ به کارشناس</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5 border border-slate-700"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{copiedLink ? "لینک کپی شد!" : "اشتراک‌گذاری لینک طرح"}</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 text-[11px] font-medium">نام و نام خانوادگی *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder="مثال: مهندس راد"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 text-[11px] font-medium">شماره تماس همراه *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                    <input
                      type="tel"
                      required
                      placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-400 font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 text-[11px] font-medium">ایمیل (اختیاری)</label>
                <input
                  type="email"
                  placeholder="example@mail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 text-[11px] font-medium">
                  توضیحات یا اولویت‌های خاص شما
                </label>
                <textarea
                  rows={3}
                  placeholder="مثلاً: تمایل به افزودن سایبان برقی، نیاز به بازدید حضوری در روزهای پنج‌شنبه..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/50 text-[11px] text-slate-400 flex items-center justify-between">
                <span>شهر: {spaceConfig.city}</span>
                <span>متراژ: {bom.totalAreaM2} مترمربع</span>
                <span>تعداد قطعات: {items.length} عدد</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? "در حال ثبت اطلاعات..." : "ثبت طرح و دریافت تماس کارشناس"}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
