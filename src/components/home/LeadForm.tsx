"use client";

import React, { useState } from "react";

const SPACE_TYPES = ["روف گاردن", "تراس سبز", "دیوار سبز"] as const;

type Status = "idle" | "submitting" | "success" | "error";

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

export function LeadForm({ compact = false, idPrefix = "lead" }: { compact?: boolean; idPrefix?: string }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [spaceType, setSpaceType] = useState<(typeof SPACE_TYPES)[number]>("روف گاردن");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; phone?: string }>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "submitting") return;

    setError("");
    setStatus("idle");

    const trimmedName = name.trim();
    const normalizedPhone = normalizePhone(phone);
    const nextErrors: { name?: string; phone?: string } = {};

    if (trimmedName.length < 2) nextErrors.name = "نام و نام خانوادگی را کامل وارد کنید.";
    if (!isValidIranMobile(normalizedPhone)) {
      nextErrors.phone = "شماره همراه معتبر نیست؛ مثال: ۰۹۱۲۳۴۵۶۷۸۹";
    }

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus("submitting");

    try {
      const res = await fetch("/api/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          phone: normalizedPhone,
          city: "تهران",
          spaceType,
          servicesNeeded: ["بازدید و مشاوره", "طراحی و اجرا"],
          message: message.trim(),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        // Only surface the API's own (user-facing) validation message.
        const serverMessage =
          res.status === 400 && typeof data?.error === "string" ? data.error : "";
        throw new Error(serverMessage || "SEND_FAILED");
      }
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error && err.message !== "SEND_FAILED" && err.message !== "Failed to fetch"
          ? err.message
          : "ارسال انجام نشد. شماره را دوباره بررسی کنید یا با تلفن ۰۲۱۴۴۴۸۴۸۰۱ تماس بگیرید."
      );
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-5 py-8 text-center" role="status">
        <p className="text-base font-bold text-white">درخواست ثبت شد.</p>
        <p className="mt-2 text-[13px] leading-7 text-slate-300">
          کارشناس چکادبام در ساعات اداری با شما تماس می‌گیرد.
        </p>
      </div>
    );
  }

  const field =
    "w-full rounded-xl border border-white/10 bg-[#0d120f] px-3.5 py-2.5 text-[13px] text-white placeholder:text-slate-500 focus:border-[#c4956a]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70";
  const invalidField = "border-rose-500/60 focus:border-rose-400";

  return (
    <form onSubmit={handleSubmit} className="space-y-3" noValidate>
      <div>
        <label htmlFor={`${idPrefix}-name`} className="mb-1.5 block text-[11px] font-medium text-slate-400">
          نام و نام خانوادگی
        </label>
        <input
          id={`${idPrefix}-name`}
          required
          name="name"
          autoComplete="name"
          value={name}
          aria-invalid={Boolean(fieldErrors.name)}
          aria-describedby={fieldErrors.name ? `${idPrefix}-name-error` : undefined}
          onChange={(e) => {
            setName(e.target.value);
            if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: undefined }));
            if (status === "error") setStatus("idle");
          }}
          placeholder="مثال: علی رضایی"
          className={`${field} ${fieldErrors.name ? invalidField : ""}`}
        />
        {fieldErrors.name && (
          <p id={`${idPrefix}-name-error`} role="alert" className="mt-1 text-[11px] leading-5 text-rose-300">
            {fieldErrors.name}
          </p>
        )}
      </div>
      <div>
        <label htmlFor={`${idPrefix}-phone`} className="mb-1.5 block text-[11px] font-medium text-slate-400">
          شماره تماس
        </label>
        <input
          id={`${idPrefix}-phone`}
          required
          name="phone"
          type="tel"
          inputMode="tel"
          dir="ltr"
          autoComplete="tel"
          value={phone}
          aria-invalid={Boolean(fieldErrors.phone)}
          aria-describedby={fieldErrors.phone ? `${idPrefix}-phone-error` : undefined}
          onChange={(e) => {
            setPhone(e.target.value);
            if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: undefined }));
            if (status === "error") setStatus("idle");
          }}
          placeholder="0912…"
          className={`${field} text-left ${fieldErrors.phone ? invalidField : ""}`}
        />
        {fieldErrors.phone && (
          <p id={`${idPrefix}-phone-error`} role="alert" className="mt-1 text-[11px] leading-5 text-rose-300">
            {fieldErrors.phone}
          </p>
        )}
      </div>
      <div>
        <label htmlFor={`${idPrefix}-space`} className="mb-1.5 block text-[11px] font-medium text-slate-400">
          نوع فضا
        </label>
        <select
          id={`${idPrefix}-space`}
          name="spaceType"
          value={spaceType}
          onChange={(e) => setSpaceType(e.target.value as (typeof SPACE_TYPES)[number])}
          className={field}
        >
          {SPACE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      {!compact && (
        <div>
          <label htmlFor={`${idPrefix}-message`} className="mb-1.5 block text-[11px] font-medium text-slate-400">
            توضیحات (اختیاری)
          </label>
          <textarea
            id={`${idPrefix}-message`}
            name="message"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="متراژ تقریبی بام، شهر، یا زمان مناسب تماس"
            className={`${field} resize-none`}
          />
        </div>
      )}
      {status === "error" && (
        <p className="text-[12px] leading-6 text-rose-300" role="alert" aria-live="assertive">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={status === "submitting"}
        aria-busy={status === "submitting"}
        className="btn-primary w-full rounded-xl px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
      >
        {status === "submitting" ? "در حال ارسال…" : "درخواست مشاوره رایگان"}
      </button>
      <p className="text-center text-[11px] leading-5 text-slate-500">
        بازدید رایگان از سایت پروژه — بدون تعهد به قرارداد
      </p>
    </form>
  );
}
