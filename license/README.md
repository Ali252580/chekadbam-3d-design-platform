# لایسنس دامنه‌محور چکادبام — راهنمای کامل

این سیستم به تو اجازه می‌دهد افزونهٔ چکادبام استودیو را **برای هر دامنه‌ای جدا فعال یا غیرفعال کنی**، و کنترل کامل **از خود گیت‌هاب** باشد: فهرست دامنه‌ها را در گیت‌هاب می‌بینی، همان‌جا ویرایش می‌کنی و سایت‌ها خودشان به‌روز می‌شوند.

## جریان کار (خلاصه)

```
domains.json  ──ویرایش در گیت‌هاب──▶  GitHub Action امضا می‌کند  ──▶  license.json (امضاشده)
                                                                              │
سایت‌های وردپرسی ◀── wp_remote_get (هر ۱۲ ساعت) + تأیید امضای Ed25519 ────────┘
```

- فایل `license.json` با کلید **خصوصی** Ed25519 امضا می‌شود؛ کلید **عمومی** داخل افزونه تعبیه شده است.
- هر دستکاری در فایل (مثلاً اضافه‌کردن دامنهٔ جدید بدون کلید خصوصی) امضا را نامعتبر می‌کند و افزونه قفل می‌شود.
- وقتی گیت‌هاب در دسترس نباشد، سایت‌ها تا **۷۲ ساعت** (قابل تغییر با فیلتر `ckb_license_grace_hours`) با آخرین نسخهٔ امضاشده کار می‌کنند و بعد بسته می‌شوند.

## گام ۱ — مخزن لایسنس (ساخته شده ✅)

مخزن `Ali252580/chekadbam-licenses` ساخته و با همین فایل‌ها پر شده است:

```
chekadbam-licenses/
  domains.json        ← دستی ویرایش می‌کنی
  tools/sign.mjs
  tools/keys/chekadbam-license-public.txt   (برای verify در CI)
  license.json        ← خروجی خودکار (اکشن امضا می‌کند)
  .github/workflows/license.yml
```

افزونه به‌صورت پیش‌فرض `https://raw.githubusercontent.com/Ali252580/chekadbam-licenses/main/license.json` را می‌خواند (`CKB_LICENSE_URL_DEFAULT` در `includes/license.php`).

## گام ۲ — Secret کلید خصوصی

۱. محتوای `license/keys/chekadbam-license.key` را کپی کن (⚠ همین پوشه در `.gitignore` است — کلید هیچ‌وقت کامیت نشود).
۲. در مخزن لایسنس: **Settings → Secrets and variables → Actions → New repository secret**
۳. Name = `LICENSE_SIGNING_KEY` و مقدار = کل محتوای فایل کلید.

## گام ۳ — ورک‌فلو (قرار داده شده ✅)

فایل `github-workflow-license.yml` همین پوشه در مخزن لایسنس به مسیر
`.github/workflows/license.yml` گذاشته شده است (امضا با `-k keys/...` و تأیید با کلید عمومی `tools/keys/`).

## گام ۴ — فعال/غیرفعال‌کردن دامنه‌ها

در گیت‌هاب `domains.json` را ویرایش کن:

```json
{
  "issuer": "chekadbam",
  "domains": {
    "chekadbam.com":   { "status": "active",   "note": "سایت خودمان" },
    "client1.ir":      { "status": "active",   "until": "2027-03-20", "note": "قرارداد سالانه" },
    "old-client.ir":   { "status": "disabled", "note": "قرارداد لغو شد" },
    "*.company.ir":    { "status": "active",   "note": "همهٔ زیردامنه‌های شرکت" }
  }
}
```

- `status`: `active` (باز) یا `disabled` (قفل).
- `until`: تاریخ اختیاری `YYYY-MM-DD` — بعدش خودکار قفل می‌شود.
- `*.example.ir`: همهٔ زیردامنه‌ها (www را افزونه خودش نرمال می‌کند).
- بعد از Push، اکشن `license.json` را امضا و کامیت می‌کند.

## گام ۵ — تنظیمات در سایت‌ها

پیشخوان وردپرس هر سایت: **چکادبام استودیو ← لایسنس و دامنه‌ها**
- آدرس فایل لایسنس (پیش‌فرض: `raw.githubusercontent.com/Ali252580/chekadbam-licenses/main/license.json`)
- برای مخزن خصوصی: همان آدرس raw + توکن Fine-grained با فقط مجوز «Contents: Read».
- دکمهٔ «بررسی دوباره» برای اعمال فوری.

**قفل می‌شود:** شورت‌کدهای استودیو/فرم/نمایشگر سه‌بعدی، صفحهٔ استودیو در پیشخوان، ذخیرهٔ طرح (AJAX) و REST API (`/products`, `/plans`, `/designs`).
**باز می‌ماند:** پیشخوان وردپرس و صفحهٔ لایسنس، تا بتوانی مدیریت کنی.

## پشتیبانی پیشرفته

| مورد | روش |
|---|---|
| فاصلهٔ به‌روزرسانی (پیش‌فرض ۱۲ ساعت) | `add_filter( 'ckb_license_refresh_hours', fn() => 6 );` |
| سقف مرحمت قطعی منبع (پیش‌فرض ۷۲ ساعت) | `add_filter( 'ckb_license_grace_hours', fn() => 24 );` |
| آدرس منبع سایته | постоянная `CKB_LICENSE_URL` در wp-config یا فیلد پیشخوان |

## چرخش کلید (اگر کلید خصوصی لو رفت)

```bash
cd license
node sign.mjs genkey --force          # جفت‌کلید جدید
# کلید عمومی جدید را در includes/license.php (CKB_LICENSE_PUBLIC_KEY) به‌روز کن،
# نسخهٔ افزونه را بالا ببر و Secret گیت‌هاب را هم عوض کن، بعد لایسنس را re-sign کن.
```

## دستورات ابزار

```bash
node sign.mjs genkey                         # ساخت جفت‌کلید (یک بار)
node sign.mjs sign domains.json -o license.json
node sign.mjs verify license.json            # بررسی امضا به‌صورت محلی
```

## یادداشت امنیتی (صادقانه)

- فورج‌کردن فایل لایسنس بدون کلید خصوصی ممنوع/غیرممکن است (امضای Ed25519). ✔
- کد افزونهٔ وردپرسی روی سرور مشتری است و یک مهاجم امکان‌خدام با دسترسی کامل SSH/FTP می‌تواند فایل PHP دستکاری کند — این نقطهٔ ضعف هر نظام لایسنس PHP است و با افزونهٔ اثری که شورت‌کدها و REST را در چند نقطهٔ مجزا بسته، دورزدنش بدون دانش فنی تقریباً غیرممکن است.
