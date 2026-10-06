<?php
/**
 * Front-facing shortcodes:
 *  - [chekadbam_studio_link] : CTA card linking to the full studio (the full
 *    embedded studio itself is [chekadbam_studio] from wp-studio.php)
 *  - [chekadbam_form]        : Persian lead form that saves as a ckb_design.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_shortcode( 'chekadbam_studio_link', 'ckb_render_studio_shortcode' );
function ckb_render_studio_shortcode( $atts ) {
	ob_start();
	$studio_url = admin_url( 'admin.php?page=wp-studio' );
?>
	<div class="ckb-studio-link" dir="rtl" style="text-align:center;padding:40px 20px;background:#0f172a;border-radius:20px;color:#f1f5f9;">
		<div style="font-size:18px;font-weight:800;margin-bottom:8px;color:#34d399;">Chekadbam 3D Studio</div>
		<p style="color:#94a3b8;font-size:13px;margin-bottom:22px;">طراحی سه‌بعدی آنلاین بام و روف‌گاردن شما؛ بدون نیاز به نرم‌افزار، بدون تخریب، در ۷ روز اجرا.</p>
		<a href="<?php echo esc_url( $studio_url ); ?>" target="_blank" style="background:#10b981;color:#04221a;text-decoration:none;font-weight:800;padding:14px 34px;border-radius:14px;display:inline-flex;align-items:center;gap:8px;font-size:15px;">
			✨ شروع طراحی سه‌بعدی رایگان
		</a>
	</div>
<?php
	return ob_get_clean();
}

add_shortcode( 'chekadbam_form', 'ckb_render_form_shortcode' );
function ckb_render_form_shortcode( $atts ) {
	$atts = shortcode_atts(
		array(
			'title' => __( 'درخواست طراحی سه‌بعدی روف‌گاردن', 'chekadbam' ),
		),
		$atts,
		'chekadbam_form'
	);

	$notice = '';
	if ( isset( $_POST['ckb_submit'] ) ) {
		if ( ! isset( $_POST['ckb_nonce'] ) || ! wp_verify_nonce( $_POST['ckb_nonce'], 'ckb_front_form' ) ) {
			$notice = '<div class="ckb-front-notice ckb-front-error">' . esc_html__( 'مشکل امنیتی در ارسال فرم؛ لطفاً دوباره تلاش کنید.', 'chekadbam' ) . '</div>';
		} else {
			$name  = sanitize_text_field( wp_unslash( $_POST['ckb_name'] ?? '' ) );
			$phone = sanitize_text_field( wp_unslash( $_POST['ckb_phone'] ?? '' ) );
			$city  = sanitize_text_field( wp_unslash( $_POST['ckb_city'] ?? '' ) );
			$w     = floatval( $_POST['ckb_width'] ?? 0 );
			$l     = floatval( $_POST['ckb_length'] ?? 0 );
			$msg   = sanitize_textarea_field( wp_unslash( $_POST['ckb_message'] ?? '' ) );

			if ( $name && $phone && $w > 0 && $l > 0 ) {
				$area = $w * $l;
				$pid  = wp_insert_post(
					array(
						'post_type'   => 'ckb_design',
						'post_status' => 'publish',
						'post_title'  => sprintf( __( 'طرح %1$s — %2$s', 'chekadbam' ), $name, wp_date( 'Y/m/d' ) ),
					)
				);
				if ( ! is_wp_error( $pid ) ) {
					update_post_meta( $pid, '_ckb_customer_name', $name );
					update_post_meta( $pid, '_ckb_customer_phone', $phone );
					update_post_meta( $pid, '_ckb_city', $city );
					update_post_meta( $pid, '_ckb_shape', 'rectangular' );
					update_post_meta( $pid, '_ckb_width', $w );
					update_post_meta( $pid, '_ckb_length', $l );
					update_post_meta( $pid, '_ckb_area', round( $area, 1 ) );
					update_post_meta( $pid, '_ckb_message', $msg );
					update_post_meta( $pid, '_ckb_status', __( 'درخواست ثبت‌شده', 'chekadbam' ) );
					update_post_meta( $pid, '_ckb_items_json', wp_json_encode( array() ) );

					do_action( 'ckb_design_created', $pid );
					$notice = '<div class="ckb-front-notice ckb-front-success">' . esc_html__( 'درخواست شما با موفقیت ثبت شد؛ کارشناسان چکادبام به‌زودی تماس می‌گیرند.', 'chekadbam' ) . '</div>';
				}
			} else {
				$notice = '<div class="ckb-front-notice ckb-front-error">' . esc_html__( 'لطفاً نام، تلفن و ابعاد بام را کامل وارد کنید.', 'chekadbam' ) . '</div>';
			}
		}
	}

	ob_start();
	?>
	<div class="ckb-front-form" dir="rtl">
		<style>
			.ckb-front-form{max-width:560px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:26px;box-shadow:0 10px 30px rgba(0,0,0,.06);font-family:inherit}
			.ckb-front-form h3{margin:0 0 18px;font-size:18px;color:#0f172a;text-align:center}
			.ckb-front-form label{display:block;font-size:13px;font-weight:700;color:#334155;margin:12px 0 6px}
			.ckb-front-form input,.ckb-front-form textarea{width:100%;padding:11px 13px;border:1px solid #cbd5e1;border-radius:10px;font-size:14px;box-sizing:border-box}
			.ckb-front-form textarea{min-height:80px;resize:vertical}
			.ckb-front-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
			.ckb-front-submit{margin-top:18px;width:100%;background:#10b981;color:#04221a;font-weight:800;border:0;border-radius:12px;padding:13px;font-size:15px;cursor:pointer}
			.ckb-front-submit:hover{background:#059669;color:#fff}
			.ckb-front-notice{border-radius:10px;padding:12px 14px;font-size:13px;margin-bottom:14px}
			.ckb-front-success{background:#ecfdf5;color:#065f46;border:1px solid #6ee7b7}
			.ckb-front-error{background:#fef2f2;color:#991b1b;border:1px solid #fca5a5}
		</style>

		<h3><?php echo esc_html( $atts['title'] ); ?></h3>
		<?php echo $notice; // already escaped/constructed with safe HTML ?>

		<form method="post">
			<?php wp_nonce_field( 'ckb_front_form', 'ckb_nonce' ); ?>

			<label for="ckb-name"><?php esc_html_e( 'نام و نام خانوادگی *', 'chekadbam' ); ?></label>
			<input type="text" id="ckb-name" name="ckb_name" required />

			<label for="ckb-phone"><?php esc_html_e( 'شماره تماس *', 'chekadbam' ); ?></label>
			<input type="tel" id="ckb-phone" name="ckb_phone" dir="ltr" required />

			<div class="ckb-front-row">
				<div>
					<label for="ckb-city"><?php esc_html_e( 'شهر', 'chekadbam' ); ?></label>
					<input type="text" id="ckb-city" name="ckb_city" />
				</div>
				<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
					<div>
						<label for="ckb-width"><?php esc_html_e( 'طول (متر) *', 'chekadbam' ); ?></label>
						<input type="number" id="ckb-width" name="ckb_width" min="1" step="0.5" required />
					</div>
					<div>
						<label for="ckb-length"><?php esc_html_e( 'عرض (متر) *', 'chekadbam' ); ?></label>
						<input type="number" id="ckb-length" name="ckb_length" min="1" step="0.5" required />
					</div>
				</div>
			</div>

			<label for="ckb-message"><?php esc_html_e( 'توضیحات پروژه', 'chekadbam' ); ?></label>
			<textarea id="ckb-message" name="ckb_message"></textarea>

			<button type="submit" name="ckb_submit" class="ckb-front-submit"><?php esc_html_e( 'ثبت درخواست طراحی', 'chekadbam' ); ?></button>
		</form>
	</div>
	<?php
	return ob_get_clean();
}
