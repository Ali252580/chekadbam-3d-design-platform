"use client";

import React, { useState } from "react";

const SPACE_TYPES = ["روف گاردن", "تراس سبز", "دیوار سبز"] as const;

type Status = "idle" | "submitting" | "success" | "error";

export function LeadForm({ compact = false, idPrefix = "lead" }: { compact?: boolean; idPrefix?: string }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [spaceType, setSpaceType] = useState<(typeof SPACE_TYPES)[number]>("روف گاردن");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("submitting");

    try {
      const res = await fetch("/api/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          city: "تهران",
          spaceType,
          servicesNeeded: ["بازدید و مشاوره", "طراحی و اجرا"],
          message: message.trim(),
        }),
      });
      const data = await res.json().catch(() => ({ success: false }));
      if (!res.ok || !data.success) {
        throw new Error(data.error || "ارسال انجام نشد.");
      }
      setStatus("success");
    } catch {
      setStatus("error");
      setError("ارسال انجام نشد. شماره را دوباره بررسی کنید یا با تلفن تماس بگیرید.");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-5 py-8 text-center">
        <p className="text-base font-bold text-white">درخواست ثبت شد.</p>
        <p className="mt-2 text-[13px] leading-7 text-slate-300">
          کارشناس چکادبام در ساعات اداری با شما تماس می‌گیرد.
        </p>
      </div>
    );
  }

  const field =
    "w-full rounded-xl border border-white/10 bg-[#0d120f] px-3.5 py-2.5 text-[13px] text-white placeholder:text-slate-500 focus:border-[#c4956a]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70";

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
          onChange={(e) => setName(e.target.value)}
          placeholder="مثال: علی رضایی"
          className={field}
        />
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
          onChange={(e) => setPhone(e.target.value)}
          placeholder="0912…"
          className={`${field} text-left`}
        />
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
        <p className="text-[12px] leading-6 text-rose-300" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={status === "submitting"}
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
