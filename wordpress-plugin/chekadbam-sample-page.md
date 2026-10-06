# صفحه نمونه وردپرس — چکادبام استودیو و نمایشگر سه‌بعدی

دو راه تحویل:

1. **راه سریع:** محتوای بخش «کد صفحه» را کپی کنید در: پیشخوان → برگه‌ها → افزودن برگه → در گوتنبرگ از دکمه ⋮ گزینه **ویرایشگر کد (Code Editor)** را انتخاب کرده و کد را Paste کنید. (یا در ادیتور کلاسیک، تب «متن»)
2. **راه کامل:** فایل `page-chekadbam-full.php` را در پوشه تم خود (`wp-content/themes/YOUR-THEME/`) قرار دهید و هنگام ساخت برگه، در تنظیمات برگه «قالب» را روی **«چکادبام — استودیو کامل»** بگذارید.

شورت‌کدهای استفاده‌شده:

| شورت‌کد | کارکرد |
|---|---|
| `[chekadbam_studio height="88vh"]` | استودیوی کامل سه‌بعدی داخل صفحه |
| `[chekadbam_3d code="CK-PG-DK320"]` | نمایشگر مدل سه‌بعدی یک محصول |
| `[chekadbam_3d_gallery category="planting"]` | گالری سه‌بعدی محصولات یک دسته |
| `[chekadbam_form]` | فرم ساده ثبت درخواست مشاوره |

کدهای محصول نمونه (از منوی «اقلام مدولار» افزونه قابل مشاهده‌اند):
`CK-PG-DK320` پرگولا · `CK-TR-POT` درختچه · `CK-WF-FRM130` آبنما · `CK-FB-160` فلاورباکس · `CK-LN-SET04` ست مبل · `CK-FP-SQ110` آتشدان

---

## کد صفحه (کپی در ادیتور کد گوتنبرگ)

```
<!-- wp:heading {"level":1,"textAlign":"center"} -->
<h1 class="has-text-align-center">چکادبام — استودیوی طراحی سه‌بعدی روف‌گاردن</h1>
<!-- /wp:heading -->

<!-- wp:paragraph {"align":"center"} -->
<p class="has-text-align-center">بام خودتان را همان لحظه طراحی کنید، مدل‌های واقعی محصولات چکادبام را روی بام خودتان ببینید و فهرست اقلام و برآورد قیمت را دریافت کنید.</p>
<!-- /wp:paragraph -->

<!-- wp:html -->
<div style="max-width:1200px;margin:0 auto;">
[chekadbam_studio height="88vh"]
</div>
<!-- /wp:html -->

<!-- wp:heading {"textAlign":"center","level":2} -->
<h2 class="has-text-align-center">محصولات ما به‌صورت سه‌بعدی</h2>
<!-- /wp:heading -->

<!-- wp:html -->
<div style="max-width:1200px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:24px;">

  <div>
    <h3 style="margin:0 0 8px;font-size:15px;">پرگولا مدولار با دک کف</h3>
    [chekadbam_3d code="CK-PG-DK320" height="300px" title="0"]
  </div>

  <div>
    <h3 style="margin:0 0 8px;font-size:15px;">درختچه تزیینی در گلدان</h3>
    [chekadbam_3d code="CK-TR-POT" height="300px" title="0"]
  </div>

  <div>
    <h3 style="margin:0 0 8px;font-size:15px;">آبنمای قاب دوبل</h3>
    [chekadbam_3d code="CK-WF-FRM130" height="300px" title="0"]
  </div>

  <div>
    <h3 style="margin:0 0 8px;font-size:15px;">فلاورباکس مدولار ۱۶۰</h3>
    [chekadbam_3d code="CK-FB-160" height="300px" title="0"]
  </div>

  <div>
    <h3 style="margin:0 0 8px;font-size:15px;">ست مبل راحتی ۴ نفره</h3>
    [chekadbam_3d code="CK-LN-SET04" height="300px" title="0"]
  </div>

  <div>
    <h3 style="margin:0 0 8px;font-size:15px;">میز آتشدان مربعی</h3>
    [chekadbam_3d code="CK-FP-SQ110" height="300px" title="0"]
  </div>

</div>
<!-- /wp:html -->

<!-- wp:heading {"textAlign":"center","level":2} -->
<h2 class="has-text-align-center">گالری سیستم کاشت مدولار</h2>
<!-- /wp:heading -->

<!-- wp:html -->
<div style="max-width:1200px;margin:0 auto;">
[chekadbam_3d_gallery category="planting" height="260px"]
</div>
<!-- /wp:html -->

<!-- wp:heading {"textAlign":"center","level":2} -->
<h2 class="has-text-align-center">درخواست مشاوره رایگان</h2>
<!-- /wp:heading -->

<!-- wp:html -->
<div style="max-width:640px;margin:0 auto;">
[chekadbam_form]
</div>
<!-- /wp:html -->
```

نکته: اگر محصولات با کد بالا پیدا نشدند (چون هنوز محصول نساخته‌اید)، افزونه داده نمونه دارد؛ کافیست یک بار پیشخوان → چکادبام استودیو → «نصب داده‌های نمونه» را بزنید. شورت‌کد `[chekadbam_3d]` بدون `code` هم خطا نمی‌دهد ولی پیام «محصول یافت نشد» نشان می‌دهد.
