"use client";

import React, { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { SpaceConfig, StudioItem, BillOfMaterials } from "@/lib/studio-types";
import {
  Send,
  Download,
  Phone,
  User,
  MessageSquare,
  CheckCircle,
  Sparkles,
  X,
  Share2,
  AlertCircle,
} from "lucide-react";

// ── Contact validation ───────────────────────────────────────────────────────
const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

function normalizePhone(raw: string): string {
  return raw
    .replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)))
    .replace(/[^\d+]/g, "");
}

function isValidIranMobile(phone: string): boolean {
  return /^(?:\+98|0098)?0?9\d{9}$/.test(phone);
}

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
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; phone?: string }>({});
  const [submitError, setSubmitError] = useState("");
  const [leadWarning, setLeadWarning] = useState(false);

  // Keep the latest open state for async callbacks started before a dismiss.
  const isOpenRef = useRef(isOpen);
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  // Reset transient feedback when the dialog is dismissed, so a previously
  // successful submission is not shown again on the next open.
  const handleClose = () => {
    isOpenRef.current = false;
    setIsSubmitted(false);
    setSavedDesignId(null);
    setSubmitError("");
    setFieldErrors({});
    setLeadWarning(false);
    setCopiedLink(false);
    onClose();
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setSubmitError("");
    setLeadWarning(false);

    const trimmedName = name.trim();
    const normalizedPhone = normalizePhone(phone);
    const nextErrors: { name?: string; phone?: string } = {};

    if (trimmedName.length < 2) nextErrors.name = "نام و نام خانوادگی را کامل وارد کنید.";
    if (!isValidIranMobile(normalizedPhone)) {
      nextErrors.phone = "شماره همراه معتبر نیست؛ مثال: ۰۹۱۲۳۴۵۶۷۸۹";
    }

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setSubmitError("لطفاً خطاهای مشخص‌شده را اصلاح کنید.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Save the design — this is the essential step.
      const res = await fetch("/api/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `طرح روف‌گاردن ${trimmedName} (${spaceConfig.city})`,
          userName: trimmedName,
          userPhone: normalizedPhone,
          userEmail: email.trim(),
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

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success || !data?.design?.id) {
        const serverMessage =
          res.status === 400 && typeof data?.error === "string" ? data.error : "";
        throw new Error(serverMessage || "SAVE_FAILED");
      }

      // The user may have dismissed the dialog while the request was in flight.
      if (!isOpenRef.current) return;
      setSavedDesignId(data.design.id);

      // 2. Register the consultation lead — best effort: the design is already saved.
      try {
        const leadRes = await fetch("/api/consultations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: trimmedName,
            phone: normalizedPhone,
            city: spaceConfig.city,
            spaceType: spaceConfig.spaceTypeName || "پشت‌بام مسکونی",
            estimatedArea: bom.totalAreaM2,
            servicesNeeded: ["طراحی سه‌بعدی بام من", "اجرای سیستم پرتابل و مدولار"],
            message: notes,
            designId: data.design.id,
          }),
        });
        const leadData = await leadRes.json().catch(() => null);
        if (!leadRes.ok || !leadData?.success) setLeadWarning(true);
      } catch {
        setLeadWarning(true);
      }

      if (!isOpenRef.current) return;
      setIsSubmitted(true);
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err) {
      if (!isOpenRef.current) return;
      const message =
        err instanceof Error && err.message !== "SAVE_FAILED" && err.message !== "Failed to fetch"
          ? err.message
          : "";
      setSubmitError(
        message ||
          "ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید و دوباره تلاش کنید، یا با شماره ۰۲۱۴۴۴۸۴۸۰۱ تماس بگیرید."
      );
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
            onClick={handleClose}
            aria-label="بستن پنجره ذخیره طرح"
            className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
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
                کد رهگیری پروژه شما:{" "}
                <span className="font-mono font-bold text-emerald-400">CK-{savedDesignId}</span>
                <br />
                کارشناسان طراحی و فروش چکادبام حداکثر ظرف ۴ ساعت کاری جهت ارائه مشاوره و تنظیم قرار بازدید با شما تماس خواهند گرفت.
              </p>

              {leadWarning && (
                <p
                  role="alert"
                  className="mx-auto flex max-w-md items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-right text-[11px] leading-6 text-amber-200"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    طرح شما ذخیره شد، اما ثبت درخواست مشاوره کامل نشد. برای پیگیری سریع از دکمه واتساپ
                    استفاده کنید یا با <a className="font-bold underline" href="tel:+982144484801" dir="ltr">۰۲۱۴۴۴۸۴۸۰۱</a> تماس بگیرید.
                  </span>
                </p>
              )}

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
                      autoComplete="name"
                      aria-invalid={Boolean(fieldErrors.name)}
                      aria-describedby={fieldErrors.name ? "save-name-error" : undefined}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: undefined }));
                        if (submitError) setSubmitError("");
                      }}
                      className={`w-full bg-slate-800/80 border rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none ${
                        fieldErrors.name ? "border-rose-500/70 focus:border-rose-400" : "border-slate-700 focus:border-emerald-500"
                      }`}
                    />
                  </div>
                  {fieldErrors.name && (
                    <p id="save-name-error" role="alert" className="mt-1 text-[10px] leading-5 text-rose-300">
                      {fieldErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 text-[11px] font-medium">شماره تماس همراه *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                    <input
                      type="tel"
                      required
                      inputMode="tel"
                      dir="ltr"
                      autoComplete="tel"
                      placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                      value={phone}
                      aria-invalid={Boolean(fieldErrors.phone)}
                      aria-describedby={fieldErrors.phone ? "save-phone-error" : undefined}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: undefined }));
                        if (submitError) setSubmitError("");
                      }}
                      className={`w-full bg-slate-800/80 border rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-400 font-mono text-left focus:outline-none ${
                        fieldErrors.phone ? "border-rose-500/70 focus:border-rose-400" : "border-slate-700 focus:border-emerald-500"
                      }`}
                    />
                  </div>
                  {fieldErrors.phone && (
                    <p id="save-phone-error" role="alert" className="mt-1 text-[10px] leading-5 text-rose-300">
                      {fieldErrors.phone}
                    </p>
                  )}
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

              {submitError && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="flex items-start gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2.5 text-[11px] leading-6 text-rose-200"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div className="flex-1">
                    <p>{submitError}</p>
                    <a
                      href="tel:+982144484801"
                      className="mt-1 inline-flex items-center gap-1 font-bold text-rose-100 underline"
                      dir="ltr"
                    >
                      <Phone className="h-3 w-3" />
                      ۰۲۱۴۴۴۸۴۸۰۱
                    </a>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? "در حال ثبت اطلاعات..." : submitError ? "تلاش دوباره برای ثبت طرح" : "ثبت طرح و دریافت تماس کارشناس"}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
