"use client";

import React, { useState } from "react";
import { Reveal } from "@/components/layout/Reveal";

const ITEMS = [
  {
    q: "وزن روف‌گاردن به سازه فشار می‌آورد؟",
    a: "ماژول‌های پرتابل چکادبام روی پایه‌های ترازکننده می‌نشینند و بار مرده را پخش می‌کنند. پس از بازدید، مهندس سازه بار مجاز بام را با وزن طرح مطابقت می‌دهد؛ اگر ظرفیت کم باشد طرح سبک‌تر پیشنهاد می‌شود.",
  },
  {
    q: "نشتی و تخریب ایزوگام چه می‌شود؟",
    a: "اجرای مدولار بدون سوراخکاری سقف است. فلاورباکس و دک روی ایزوگام موجود قرار می‌گیرند. زهکش داخلی ماژول‌ها آب را به مسیر درین بام هدایت می‌کند.",
  },
  {
    q: "نگهداری بعد از تحویل چقدر است؟",
    a: "آبیاری قطره‌ای و انتخاب گیاه متناسب با اقلیم، نگهداری را کم می‌کند. برنامه آبیاری و تعویض فصلی گیاه در تحویل پروژه توضیح داده می‌شود. خدمات دوره‌ای جداگانه قابل سفارش است.",
  },
  {
    q: "قیمت حدودی چقدر است؟",
    a: "قیمت به متراژ، تیپ اجرا (ساحلی تا لاکچری) و اقلام (پرگولا، آبنما، مبلمان) بستگی دارد. پس از برداشت بام، دو طرح با بازه قیمت ارائه می‌شود. استودیوی سه‌بعدی هم برآورد اولیه می‌دهد.",
  },
  {
    q: "از درخواست تا تحویل چقدر طول می‌کشد؟",
    a: "بازدید همان هفته، طراحی سه‌بعدی ۳ تا ۵ روز، تولید کارخانه معمولاً یک تا دو هفته، نصب پروژه‌های معمولی حدود ۵ تا ۷ روز کاری.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="border-t border-white/[0.06] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <p className="text-center text-[11px] font-medium tracking-[0.28em] text-[#c4956a]">پرسش‌های کارفرما</p>
          <h2 className="mt-2 text-center text-2xl font-black text-white sm:text-3xl">قبل از قرارداد، این‌ها را بپرسید</h2>
        </Reveal>

        <div className="mt-10 divide-y divide-white/[0.06] rounded-2xl border border-white/[0.06]">
          {ITEMS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-right text-[14px] font-bold text-white hover:bg-white/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
                >
                  {item.q}
                  <span className="font-mono text-sm text-[#c4956a]">{isOpen ? "−" : "+"}</span>
                </button>
                {isOpen && (
                  <p className="px-5 pb-5 text-[13px] font-light leading-8 text-slate-400">{item.a}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
