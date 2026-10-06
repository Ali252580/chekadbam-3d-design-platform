<?php
/**
 * Template Name: چکادبام — استودیو کامل (Chekadbam Full Studio)
 *
 * صفحه آماده: استودیوی تمام‌عرض + گالری سه‌بعدی محصولات + فرم مشاوره.
 * نصب: این فایل را در پوشه تم فعال خود کپی کنید:
 *   wp-content/themes/YOUR-THEME/page-chekadbam-full.php
 * سپس: برگه‌ها → افزودن برگه → در ستون «نشان برگه» → قالب → «چکادبام — استودیو کامل»
 *
 * نیازمند افزونه «چکادبام استودیو منیجر» نسخه ۲+ است.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header();
?>

<div dir="rtl" style="background:#020617;color:#f1f5f9;">

	<!-- ═══════════ Hero + استودیوی تمام‌عرض ═══════════ -->
	<section style="padding:40px 16px 0;">
		<h1 style="text-align:center;font-size:clamp(22px,4vw,38px);font-weight:900;margin:0 0 10px;">
			چکادبام — استودیوی طراحی سه‌بعدی روف‌گاردن
		</h1>
		<p style="text-align:center;color:#94a3b8;font-size:14px;max-width:640px;margin:0 auto 24px;">
			بام خودتان را همان لحظه طراحی کنید؛ مدل‌های واقعی محصولات چکادبام را روی بام خودتان ببینید و فهرست اقلام و برآورد قیمت بگیرید.
		</p>
		<div style="max-width:1400px;margin:0 auto;">
			<?php echo do_shortcode( '[chekadbam_studio height="88vh"]' ); ?>
		</div>
	</section>

	<!-- ═══════════ محصولات منتخب — نمایشگر سه‌بعدی تکی ═══════════ -->
	<section style="max-width:1400px;margin:0 auto;padding:64px 16px 0;">
		<h2 style="text-align:center;font-size:clamp(20px,3vw,30px);font-weight:900;margin:0 0 28px;">
			محصولات ما به‌صورت سه‌بعدی
		</h2>
		<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:24px;">
			<?php
			$featured = array(
				array( 'CK-PG-DK320', 'پرگولا مدولار با دک کف' ),
				array( 'CK-TR-POT', 'درختچه تزیینی در گلدان' ),
				array( 'CK-WF-FRM130', 'آبنمای قاب دوبل' ),
				array( 'CK-FB-160', 'فلاورباکس مدولار ۱۶۰' ),
				array( 'CK-LN-SET04', 'ست مبل راحتی ۴ نفره' ),
				array( 'CK-FP-SQ110', 'میز آتشدان مربعی' ),
			);
			foreach ( $featured as $pair ) :
				?>
				<div>
					<h3 style="margin:0 0 8px;font-size:15px;font-weight:800;"><?php echo esc_html( $pair[1] ); ?></h3>
					<?php echo do_shortcode( '[chekadbam_3d code="' . esc_attr( $pair[0] ) . '" height="300px" title="0"]' ); ?>
				</div>
				<?php
			endforeach;
			?>
		</div>
	</section>

	<!-- ═══════════ گالری سه‌بعدی دسته کاشت ═══════════ -->
	<section style="max-width:1400px;margin:0 auto;padding:64px 16px 0;">
		<h2 style="text-align:center;font-size:clamp(20px,3vw,30px);font-weight:900;margin:0 0 28px;">
			گالری سیستم کاشت مدولار
		</h2>
		<?php echo do_shortcode( '[chekadbam_3d_gallery category="planting" height="260px"]' ); ?>
	</section>

	<!-- ═══════════ فرم مشاوره ═══════════ -->
	<section style="max-width:760px;margin:0 auto;padding:64px 16px 80px;">
		<h2 style="text-align:center;font-size:clamp(20px,3vw,30px);font-weight:900;margin:0 0 28px;">
			درخواست مشاوره رایگان
		</h2>
		<?php echo do_shortcode( '[chekadbam_form]' ); ?>
	</section>

</div>

<?php
get_footer();
