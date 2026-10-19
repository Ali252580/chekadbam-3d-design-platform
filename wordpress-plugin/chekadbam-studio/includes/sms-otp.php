<?php
/**
 * Chekadbam Studio — کد تایید پیامکی (OTP) برای فرم ثبت طرح.
 *
 * ارسال پیامک از طریق افزونه آماده «WP SMS / WSMS» انجام می‌شود
 * (wordpress.org/plugins/wp-sms) که ۲۰۰+ درگاه از جمله کاوه‌نگار،
 * ملی‌پیامک، فراپیامک، هاست‌ایران و پنل پیامک ایران را پشتیبانی می‌کند.
 * تنها وابستگی ما تابع سراسری wp_sms_send() همان افزونه است.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'CKB_OTP_TTL', 5 * MINUTE_IN_SECONDS );   /* اعتبار کد: ۵ دقیقه */
define( 'CKB_OTP_COOLDOWN', 120 );                  /* فاصله ارسال مجدد: ۲ دقیقه */
define( 'CKB_OTP_MAX_SENDS', 3 );                   /* حداکثر کد در هر بازه */
define( 'CKB_OTP_MAX_TRIES', 5 );                   /* حداکثر تلاش ورود کد */
define( 'CKB_OTP_WINDOW', 10 * MINUTE_IN_SECONDS ); /* بازه شمارش ارسال‌ها */

/* آیا سرویس OTP فعال است؟ (افزونه پیامک نصب باشد و مدیر خاموش نکرده باشد) */
function ckb_smsotp_available() {
	if ( '1' === get_option( 'ckb_otp_disabled', '0' ) ) {
		return false;
	}
	return function_exists( 'wp_sms_send' );
}

/* تبدیل ارقام فارسی/عربی به لاتین */
function ckb_smsotp_digits( $raw ) {
	$fa = array( '۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹', '٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩' );
	$en = array( '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9' );
	return str_replace( $fa, $en, (string) $raw );
}

/* تبدیل ارقام فارسی/عربی و نرمال‌سازی شماره موبایل ایرانی به 09xxxxxxxxx — یا رشته خالی */
function ckb_smsotp_normalize_phone( $raw ) {
	$p = str_ireplace( array( ' ', '-', '(', ')' ), '', trim( ckb_smsotp_digits( $raw ) ) );

	if ( preg_match( '/^(?:\+98|0098|98)(9\d{9})$/', $p, $m ) ) {
		$p = '0' . $m[1];
	} elseif ( preg_match( '/^9\d{9}$/', $p ) ) {
		$p = '0' . $p;
	}
	return preg_match( '/^09\d{9}$/', $p ) ? $p : '';
}

/* شماره‌ای که به درگاه پیامک داده می‌شود (قابل بازنویسی با فیلتر) */
function ckb_smsotp_recipient( $phone ) {
	return apply_filters( 'ckb_smsotp_recipient', $phone );
}

/* متن پیامک کد تایید */
function ckb_smsotp_message( $code ) {
	$msg = 'چکادبام' . "\n" . 'کد تایید ثبت طرح: ' . $code . "\n" . '(اعتبار ۵ دقیقه)';
	return apply_filters( 'ckb_smsotp_message', $msg, $code );
}

/** ارسال پیامک از طریق افزونه WP SMS — true یا پیام خطا */
function ckb_smsotp_send_sms( $phone, $message ) {
	if ( ! function_exists( 'wp_sms_send' ) ) {
		return 'افزونه پیامک (WP SMS / WSMS) نصب یا فعال نیست.';
	}
	$res = wp_sms_send( ckb_smsotp_recipient( $phone ), $message );
	if ( is_wp_error( $res ) ) {
		return $res->get_error_message();
	}
	return true;
}

/* کلید ترنزینت OTP برای هر شماره */
function ckb_smsotp_key( $phone ) {
	return 'ckb_otp_' . md5( 'ckb' . $phone );
}

/** تولید و ارسال کد برای شماره — true یا پیام خطا */
function ckb_smsotp_issue( $phone ) {
	$phone = ckb_smsotp_normalize_phone( $phone );
	if ( ! $phone ) {
		return 'شماره موبایل معتبر نیست. نمونه درست: 09121234567';
	}

	/* محدودیت بر اساس IP — دفعات ارسال در بازه ۱۰ دقیقه‌ای */
	$ip_key = 'ckb_otp_ip_' . md5( 'ckb' . ckb_smsotp_client_ip() );
	$ip_n   = (int) get_transient( $ip_key );
	if ( $ip_n >= CKB_OTP_MAX_SENDS + 3 ) {
		return 'تعداد درخواست کد زیاد است؛ چند دقیقه بعد تلاش کنید.';
	}
	set_transient( $ip_key, $ip_n + 1, CKB_OTP_WINDOW );

	/* محدودیت برای خود شماره: بازه ارسال مجدد و سقف تعداد کد */
	$data = get_transient( ckb_smsotp_key( $phone ) );
	if ( is_array( $data ) ) {
		if ( ! empty( $data['cool'] ) && time() < (int) $data['cool'] ) {
			$wait = (int) $data['cool'] - time();
			/* مونث/مذکر: دقیقه یا ثانیه */
			return $wait >= 60
				? sprintf( 'برای دریافت کد جدید %d دقیقه صبر کنید.', (int) ceil( $wait / 60 ) )
				: sprintf( 'برای دریافت کد جدید %d ثانیه صبر کنید.', $wait );
		}
		if ( ( isset( $data['sent'] ) ? (int) $data['sent'] : 0 ) >= CKB_OTP_MAX_SENDS ) {
			return 'برای این شماره بیش از حد کد درخواست شده؛ ۱۰ دقیقه بعد تلاش کنید.';
		}
	}

	/* کد ۵ رقمی */
	$code = (string) wp_rand( 10000, 99999 );

	$sent = ckb_smsotp_send_sms( $phone, ckb_smsotp_message( $code ) );
	if ( true !== $sent ) {
		return 'ارسال پیامک ناموفق بود: ' . $sent;
	}

	$new = array(
		'hash'  => wp_hash( $phone . '|' . $code ),
		'exp'   => time() + CKB_OTP_TTL,
		'cool'  => time() + CKB_OTP_COOLDOWN,
		'sent'  => ( is_array( $data ) && isset( $data['sent'] ) ? (int) $data['sent'] : 0 ) + 1,
		'tries' => 0,
	);
	set_transient( ckb_smsotp_key( $phone ), $new, CKB_OTP_WINDOW );
	return true;
}

/** بررسی کد واردشده — true یا پیام خطا */
function ckb_smsotp_verify( $phone, $code ) {
	$phone = ckb_smsotp_normalize_phone( $phone );
	$code  = preg_replace( '/\D+/', '', ckb_smsotp_digits( $code ) );
	if ( ! $phone ) {
		return 'شماره موبایل معتبر نیست.';
	}

	$key  = ckb_smsotp_key( $phone );
	$data = get_transient( $key );
	if ( ! is_array( $data ) ) {
		return 'کدی برای این شماره ارسال نشده است. ابتدا «ارسال کد تایید» را بزنید.';
	}
	if ( time() > (int) $data['exp'] ) {
		delete_transient( $key );
		return 'کد تایید منقضی شده است؛ دوباره «ارسال کد تایید» را بزنید.';
	}
	if ( (int) $data['tries'] >= CKB_OTP_MAX_TRIES ) {
		delete_transient( $key );
		return 'تلاش بیش از حد مجاز؛ کد جدید دریافت کنید.';
	}

	if ( '' !== $code && hash_equals( $data['hash'], wp_hash( $phone . '|' . $code ) ) ) {
		delete_transient( $key ); /* تک‌بارمصرف */
		return true;
	}

	$data['tries'] = (int) $data['tries'] + 1;
	set_transient( $key, $data, max( 60, (int) $data['exp'] - time() ) );
	$left = max( 0, CKB_OTP_MAX_TRIES - (int) $data['tries'] );
	return $left > 0
		? sprintf( 'کد تایید نادرست است (%d تلاش باقی‌مانده).', $left )
		: 'کد تایید نادرست است؛ کد جدید دریافت کنید.';
}

/* IP کاربر (پشت Cloudflare هم درست) */
function ckb_smsotp_client_ip() {
	if ( ! empty( $_SERVER['HTTP_CF_CONNECTING_IP'] ) ) {
		return sanitize_text_field( wp_unslash( $_SERVER['HTTP_CF_CONNECTING_IP'] ) );
	}
	if ( ! empty( $_SERVER['HTTP_X_FORWARDED_FOR'] ) ) {
		$parts = explode( ',', sanitize_text_field( wp_unslash( $_SERVER['HTTP_X_FORWARDED_FOR'] ) ) );
		return trim( $parts[0] );
	}
	return ! empty( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : 'unknown';
}

/* ============================ AJAX: ارسال کد تایید ============================ */

add_action( 'wp_ajax_ckb_send_otp', 'ckb_smsotp_send_endpoint' );
add_action( 'wp_ajax_nopriv_ckb_send_otp', 'ckb_smsotp_send_endpoint' );
function ckb_smsotp_send_endpoint() {
	if ( ! isset( $_POST['nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['nonce'] ) ), 'ckb_wpstudio' ) ) {
		wp_send_json_error( array(
			'message'    => 'اعتبار فرم منقضی شده. صفحه را تازه‌سازی (F5) کنید.',
			'code'       => 'stale_nonce',
			'freshNonce' => wp_create_nonce( 'ckb_wpstudio' ),
		) );
	}
	if ( ! ckb_smsotp_available() ) {
		wp_send_json_error( 'سرویس کد تایید پیامکی فعال نیست (افزونه WP SMS نصب نیست یا توسط مدیر خاموش شده است).' );
	}

	$phone = isset( $_POST['phone'] ) ? sanitize_text_field( wp_unslash( $_POST['phone'] ) ) : '';
	$res   = ckb_smsotp_issue( $phone );
	if ( true !== $res ) {
		wp_send_json_error( array( 'message' => $res, 'code' => 'otp_send_failed' ) );
	}
	wp_send_json_success( array(
		'phone'    => ckb_smsotp_normalize_phone( $phone ),
		'ttl'      => CKB_OTP_TTL,
		'cooldown' => CKB_OTP_COOLDOWN,
	) );
}

/* ============================ AJAX: تست ارسال پیامک (فقط مدیر) ============================ */

add_action( 'wp_ajax_ckb_test_sms', 'ckb_smsotp_test_endpoint' );
function ckb_smsotp_test_endpoint() {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_send_json_error( 'دسترسی ندارید.' );
	}
	if ( ! isset( $_POST['nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['nonce'] ) ), 'ckb_test_sms' ) ) {
		wp_send_json_error( 'اعتبار درخواست منقضی شده؛ صفحه را تازه‌سازی کنید.' );
	}
	if ( ! function_exists( 'wp_sms_send' ) ) {
		wp_send_json_error( 'افزونه WP SMS / WSMS نصب یا فعال نیست. ابتدا آن را از «افزونه‌ها → افزودن» (جستجوی wp-sms) نصب و یک درگاه ایرانی (کاوه‌نگار و…) پیکربندی کنید.' );
	}
	$phone = isset( $_POST['phone'] ) ? sanitize_text_field( wp_unslash( $_POST['phone'] ) ) : '';
	$phone = ckb_smsotp_normalize_phone( $phone );
	if ( ! $phone ) {
		wp_send_json_error( 'شماره موبایل معتبر نیست. نمونه: 09121234567' );
	}
	$res = ckb_smsotp_send_sms( $phone, 'پیامک آزمایشی چکادبام — تنظیمات درگاه پیامک درست است.' );
	if ( true !== $res ) {
		wp_send_json_error( 'ارسال ناموفق: ' . $res );
	}
	wp_send_json_success( 'پیامک آزمایشی به ' . $phone . ' ارسال شد.' );
}
