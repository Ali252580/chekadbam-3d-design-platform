"use client";

/**
 * ─────────────────────────────────────────────────────────────
 * ChekadbamStudioLoader — پوشش لودینگ برند برای استودیو سه‌بعدی
 * ─────────────────────────────────────────────────────────────
 *
 * نقش:
 *   تا وقتی صحنه Three.js اولین فریمش را رندر نکرده، این پوشش
 *   تمام‌صفحه به‌جای صحنهٔ خالی دیده می‌شود: حلقهٔ چرخان SVG سبز،
 *   هستهٔ برند پالس‌دار و یک خط وضعیت با سه نقطهٔ پرش‌دار.
 *
 * معماری:
 *   کامپوننتی «کنترل‌شده» است — والد (Chekadbam3DCanvas) فقط
 *   آرگومان ready را از state خودش می‌فرستد؛ منطق تایمر و تشخیص
 *   آماده‌شدن صحنه اینجا نیست، پس کامپوننت کاملاً Pure و
 *   قابل‌استفاده‌مجدد در هر صحنهٔ دیگری (مثلاً viewer محصول) است.
 *
 * رفتار بصری:
 *   - وقتی ready=false → opacity-1 (نمایش)
 *   - وقتی ready=true  → opacity-0 با ترنزیشن ۷۰۰ms (محو نرم)
 *   - pointer-events-none همیشه: حتی وسط لودینگ هم هیچ کلیکی
 *     را ندزدی Ky نمی‌کند.
 */
export function ChekadbamStudioLoader({ ready }: { ready: boolean }) {
  return (
    // aria-hidden: لودر صرفاً تزئینی است و روی اسکرین‌ریدر نباید
    // به‌صورت محتوای مستقل پخش شود.
    <div
      aria-hidden="true"
      className={`absolute inset-0 z-30 flex flex-col items-center justify-center gap-6 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 transition-opacity duration-700 pointer-events-none ${
        ready ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* ── حلقهٔ لودر (رهار تصویری: حلقهٔ کمان متحرک + هستهٔ برند) ── */}
      <div className="relative w-24 h-24">
        {/* حلقهٔ بیرونی دَهِشِ dashed — خیلی آرام (۹ ثانیه) دوره می‌زند */}
        <div
          className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-500/20 animate-spin"
          style={{ animationDuration: "9s" }}
        />
        {/* حلقهٔ اصلی: کمان سبز روی تراکِ خاکستری — سرعت ۱.۴ ثانیه */}
        <svg
          className="absolute inset-0 w-full h-full animate-spin"
          style={{ animationDuration: "1.4s" }}
          viewBox="0 0 64 64"
          fill="none"
        >
          <circle
            className="stroke-slate-700/70"
            strokeWidth="3"
            stroke="currentColor"
            fill="none"
            cx="32"
            cy="32"
            r="27"
          />
          <circle
            className="stroke-emerald-400"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            cx="32"
            cy="32"
            r="27"
            strokeDasharray="42 128"
          />
        </svg>
        {/* هسته برند: چیپ سبز با تنفس نرم (pise animate-pulse) */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-900/40 animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          </div>
        </div>
      </div>

      {/* ── نام برند + خط وضعیت ── */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm font-bold text-white tracking-wide">چکادبام استودیو</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <span className="animate-pulse">در حال آماده‌سازی صحنه سه‌بعدی</span>
          {/* سه نقطهٔ پرش‌دار — تاخیر ۱۵۰ms پلکانی برای حس زنده بودن */}
          <span className="flex gap-1">
            {["۰", "۱", "۲"].map((d, i) => (
              <span
                key={i}
                className="w-1 h-1 rounded-full bg-emerald-400/70 inline-block animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}
