<?php
/**
 * Panel Sync — ارسال خودکار طرح‌های ثبت‌شده به پنل (Next.js).
 *
 * هر طرح که در وردپرس ثبت می‌شود (استودیو، REST یا فرم مشاوره)، بلافاصله به
 * اندپوینت /api/designs/wordpress پنل ارسال می‌شود تا در CRM پنل نمایش داده شود.
 *
 * تنظیمات: پیشخوان → چکادبام استودیو → تنظیمات
 *  - آدرس پنل (Next.js)      ← ckb_panel_api_url
 *  - توکن همگام‌سازی طرح‌ها  ← ckb_panel_api_token
 *
 * توکن باید با متغیر محیطی DESIGN_SYNC_TOKEN پنل یکی باشد.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/* ------------------------------ Settings ------------------------------ */

/** آدرس پایه پنل (Next.js) — بدون / در انتها. */
function ckb_panel_api_url() {
	return untrailingslashit( (string) get_option( 'ckb_panel_api_url', '' ) );
}

/** توکن مشترک همگام‌سازی (باید با DESIGN_SYNC_TOKEN پنل یکی باشد). */
function ckb_panel_api_token() {
	return trim( (string) get_option( 'ckb_panel_api_token', '' ) );
}

/** فعال بودن ارسال خودکار (پیش‌فرض روشن). */
function ckb_panel_sync_enabled() {
	return '1' !== get_option( 'ckb_panel_sync_disabled', '0' );
}

add_action( 'admin_init', 'ckb_panel_sync_register_settings' );
function ckb_panel_sync_register_settings() {
	// در صفحه تنظیمات خود افزونه ذخیره می‌شود (فرم ckb_render_settings).
	if ( ! isset( $_POST['ckb_settings_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['ckb_settings_nonce'] ) ), 'ckb_save_settings' ) ) {
		return;
	}
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	update_option( 'ckb_panel_api_url', esc_url_raw( wp_unslash( $_POST['ckb_panel_api_url'] ?? '' ) ) );
	update_option( 'ckb_panel_api_token', sanitize_text_field( wp_unslash( $_POST['ckb_panel_api_token'] ?? '' ) ) );
	update_option( 'ckb_panel_sync_disabled', isset( $_POST['ckb_panel_sync_disabled'] ) ? '1' : '0' );
}

/* ------------------------------ Payload builder ------------------------------ */

/**
 * ساخت بدنه استاندارد ارسالی به پنل از متاهای طرح.
 * ساختار فیلدها دقیقاً مطابق جدول designs پنل (src/db/schema.ts) است.
 */
function ckb_panel_build_design_payload( $post_id ) {
	$bom = json_decode( (string) get_post_meta( $post_id, '_ckb_bom_json', true ), true );
	if ( ! is_array( $bom ) ) {
		$bom = array();
	}

	$space = json_decode( (string) get_post_meta( $post_id, '_ckb_plan_json', true ), true );
	if ( ! is_array( $space ) ) {
		$space = array();
	}

	return array(
		'wpDesignId'        => (int) $post_id,
		'source'            => 'wordpress',
		'title'             => get_the_title( $post_id ),
		'userName'          => (string) get_post_meta( $post_id, '_ckb_customer_name', true ),
		'userPhone'         => (string) get_post_meta( $post_id, '_ckb_customer_phone', true ),
		'userEmail'         => (string) get_post_meta( $post_id, '_ckb_customer_email', true ),
		'city'              => (string) get_post_meta( $post_id, '_ckb_city', true ),
		'spaceType'         => (string) get_post_meta( $post_id, '_ckb_space_type', true ),
		'shape'             => (string) get_post_meta( $post_id, '_ckb_shape', true ),
		'width'             => (float) get_post_meta( $post_id, '_ckb_width', true ),
		'length'            => (float) get_post_meta( $post_id, '_ckb_length', true ),
		'parapetHeight'     => (float) get_post_meta( $post_id, '_ckb_parapet', true ),
		'flooringType'      => (string) get_post_meta( $post_id, '_ckb_flooring', true ),
		'wpcColor'          => (string) get_post_meta( $post_id, '_ckb_wpc_color', true ),
		'metalColor'        => (string) get_post_meta( $post_id, '_ckb_metal_color', true ),
		'layoutData'        => json_decode( (string) get_post_meta( $post_id, '_ckb_items_json', true ), true ),
		'spaceConfig'       => $space,
		'totalArea'         => (float) get_post_meta( $post_id, '_ckb_area', true ),
		'greenArea'         => (float) get_post_meta( $post_id, '_ckb_green_area', true ),
		'flooringArea'      => (float) get_post_meta( $post_id, '_ckb_flooring_area', true ),
		'itemsCount'        => (int) get_post_meta( $post_id, '_ckb_items_count', true ),
		'estimatedWeightKg' => isset( $bom['totalWeightKg'] ) ? (float) $bom['totalWeightKg'] : 0,
		'estimatedPriceMin' => isset( $bom['estimatedPriceMin'] ) ? (int) $bom['estimatedPriceMin'] : 0,
		'estimatedPriceMax' => isset( $bom['estimatedPriceMax'] ) ? (int) $bom['estimatedPriceMax'] : 0,
		'notes'             => (string) get_post_meta( $post_id, '_ckb_message', true ),
		'snapshotUrl'       => (string) get_post_meta( $post_id, '_ckb_snapshot', true ),
		'status'            => (string) get_post_meta( $post_id, '_ckb_status', true ),
		'createdAt'         => get_the_date( 'c', $post_id ),
	);
}

/* ------------------------------ Sender ------------------------------ */

/**
 * ارسال یک طرح به پنل. خروجی: [bool $ok, string $message]
 */
function ckb_panel_send_design( $post_id ) {
	$base  = ckb_panel_api_url();
	$token = ckb_panel_api_token();

	if ( '' === $base || '' === $token ) {
		return array( false, 'آدرس پنل یا توکن همگام‌سازی در تنظیمات افزونه وارد نشده است.' );
	}

	$endpoint = $base . '/api/designs/wordpress';

	$response = wp_remote_post(
		$endpoint,
		array(
			'timeout'  => 15,
			'blocking' => true,
			'headers'  => array(
				'Content-Type'  => 'application/json; charset=utf-8',
				'X-CKB-Token'   => $token,
				'Authorization' => 'Bearer ' . $token,
			),
			'body'     => wp_json_encode( ckb_panel_build_design_payload( $post_id ) ),
		)
	);

	if ( is_wp_error( $response ) ) {
		return array( false, 'خطای اتصال به پنل: ' . $response->get_error_message() );
	}

	$code = (int) wp_remote_retrieve_response_code( $response );
	if ( $code >= 200 && $code < 300 ) {
		update_post_meta( $post_id, '_ckb_panel_synced_at', time() );
		delete_post_meta( $post_id, '_ckb_panel_sync_error' );
		return array( true, 'طرح با موفقیت به پنل ارسال شد.' );
	}

	$message = 'پنل پاسخ ' . $code . ' داد.';
	$body    = json_decode( wp_remote_retrieve_body( $response ), true );
	if ( is_array( $body ) && ! empty( $body['error'] ) ) {
		$message .= ' ' . sanitize_text_field( (string) $body['error'] );
	}

	update_post_meta( $post_id, '_ckb_panel_sync_error', $message );
	return array( false, $message );
}

/* ------------------------------ Auto-forward hook ------------------------------ */

/**
 * بلافاصله پس از ثبت هر طرح (استودیو، REST یا فرم)، به پنل ارسال می‌شود.
 * خطا حسابی است تا ایمیل اطلاع‌رسانی داخلی مختل نشود.
 */
add_action( 'ckb_design_created', 'ckb_panel_sync_forward_design', 20, 1 );
function ckb_panel_sync_forward_design( $post_id ) {
	if ( ! ckb_panel_sync_enabled() ) {
		return;
	}

	list( $ok, $message ) = ckb_panel_send_design( $post_id );

	if ( ! $ok ) {
		error_log( '[Chekadbam Panel Sync] design #' . $post_id . ': ' . $message ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions
	}
}

/* ------------------------------ Admin tools ------------------------------ */

/** ستون وضعیت همگام‌سازی در فهرست طرح‌ها. */
add_filter( 'manage_ckb_design_posts_columns', 'ckb_panel_sync_column_header', 30 );
function ckb_panel_sync_column_header( $columns ) {
	$columns['ckb_panel_sync'] = __( 'ارسال به پنل', 'chekadbam' );
	return $columns;
}

add_action( 'manage_ckb_design_posts_custom_column', 'ckb_panel_sync_column_content', 10, 2 );
function ckb_panel_sync_column_content( $column, $post_id ) {
	if ( 'ckb_panel_sync' !== $column ) {
		return;
	}

	$synced_at = (int) get_post_meta( $post_id, '_ckb_panel_synced_at', true );
	$error     = get_post_meta( $post_id, '_ckb_panel_sync_error', true );

	if ( $synced_at ) {
		echo '<span style="color:#059669;font-weight:600">✓ ' . esc_html( wp_date( 'Y/m/d H:i', $synced_at ) ) . '</span>';
	} elseif ( $error ) {
		echo '<span style="color:#dc2626;font-weight:600" title="' . esc_attr( $error ) . '">✕ خطا</span>';
	} else {
		echo '<span style="color:#64748b">—</span>';
	}
}

/** دکمه «ارسال دستی به پنل» در باکس وضعیت صفحه ویرایش طرح. */
add_action( 'post_submitbox_misc_actions', 'ckb_panel_sync_resend_button' );
function ckb_panel_sync_resend_button( $post ) {
	if ( ! $post || 'ckb_design' !== $post->post_type || ! current_user_can( 'manage_options' ) ) {
		return;
	}

	$url = wp_nonce_url(
		add_query_arg(
			array(
				'ckb_panel_resend' => $post->ID,
			),
			admin_url( 'admin.php' )
		),
		'ckb_panel_resend_' . $post->ID
	);

	echo '<div class="misc-pub-section" style="color:#0f172a">';
	echo '<a href="' . esc_url( $url ) . '" onclick="return confirm(\'' . esc_js( __( 'طرح به پنل ارسال مجدد شود؟', 'chekadbam' ) ) . '\')">';
	echo esc_html__( '↻ ارسال مجدد این طرح به پنل', 'chekadbam' );
	echo '</a></div>';
}

add_action( 'admin_init', 'ckb_panel_sync_handle_resend' );
function ckb_panel_sync_handle_resend() {
	if ( empty( $_GET['ckb_panel_resend'] ) || ! current_user_can( 'manage_options' ) ) {
		return;
	}

	$post_id = absint( $_GET['ckb_panel_resend'] );
	if ( ! $post_id || 'ckb_design' !== get_post_type( $post_id ) ) {
		return;
	}
	if ( ! isset( $_GET['_wpnonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_GET['_wpnonce'] ) ), 'ckb_panel_resend_' . $post_id ) ) {
		wp_die( esc_html__( 'خطای امنیتی.', 'chekadbam' ) );
	}

	list( $ok, $message ) = ckb_panel_send_design( $post_id );

	$redirect = add_query_arg(
		array(
			'ckb_panel_synced' => $ok ? '1' : '0',
			'ckb_panel_msg'    => rawurlencode( $message ),
		),
		get_edit_post_link( $post_id, 'raw' )
	);
	wp_safe_redirect( $redirect );
	exit;
}

add_action( 'admin_notices', 'ckb_panel_sync_resend_notice' );
function ckb_panel_sync_resend_notice() {
	if ( empty( $_GET['ckb_panel_synced'] ) ) {
		return;
	}
	$ok      = '1' === $_GET['ckb_panel_synced'];
	$message = isset( $_GET['ckb_panel_msg'] ) ? sanitize_text_field( wp_unslash( $_GET['ckb_panel_msg'] ) ) : '';

	$class = $ok ? 'notice-success' : 'notice-error';
	echo '<div class="notice ' . esc_attr( $class ) . ' is-dismissible"><p>' . esc_html( $message ) . '</p></div>';
}

/** تست اتصال پنل در صفحه تنظیمات. */
add_action( 'wp_ajax_ckb_panel_sync_test', 'ckb_panel_sync_test' );
function ckb_panel_sync_test() {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_send_json_error( 'دسترسی غیرمجاز.' );
	}
	check_ajax_referer( 'ckb_panel_sync_test', 'nonce' );

	$base  = untrailingslashit( esc_url_raw( wp_unslash( $_POST['apiUrl'] ?? '' ) ) );
	$token = sanitize_text_field( wp_unslash( $_POST['apiToken'] ?? '' ) );

	if ( '' === $base || '' === $token ) {
		wp_send_json_error( 'آدرس پنل و توکن هر دو الزامی‌اند.' );
	}

	$response = wp_remote_post(
		$base . '/api/designs/wordpress',
		array(
			'timeout' => 15,
			'headers' => array(
				'Content-Type'  => 'application/json; charset=utf-8',
				'X-CKB-Token'   => $token,
				'Authorization' => 'Bearer ' . $token,
			),
			'body'    => wp_json_encode( array( 'test' => true ) ),
		)
	);

	if ( is_wp_error( $response ) ) {
		wp_send_json_error( 'خطای اتصال: ' . $response->get_error_message() );
	}

	$code = (int) wp_remote_retrieve_response_code( $response );
	$body = json_decode( wp_remote_retrieve_body( $response ), true );

	if ( 200 === $code ) {
		wp_send_json_success( 'اتصال به پنل برقرار است ✓' );
	}
	if ( 401 === $code ) {
		wp_send_json_error( 'توکن همگام‌سازی با پنل هم‌خوان نیست (401).' );
	}

	wp_send_json_error( 'پاسخ غیرمنتظره پنل (' . $code . '): ' . sanitize_text_field( (string) ( $body['error'] ?? '' ) ) );
}
