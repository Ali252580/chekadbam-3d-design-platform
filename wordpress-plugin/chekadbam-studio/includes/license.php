<?php
/**
 * Chekadbam Studio — licensing (دامنه‌محور).
 *
 * فهرست دامنه‌های مجاز در گیت‌هاب نگهداری می‌شود؛ فایل لایسنس با کلید خصوصی
 * (Ed25519) امضا شده و افزونه با کلید عمومیِ تعبیه‌شده امضا را بررسی می‌کند.
 *
 *  - منبع: فایل license.json در مخزن گیت‌هاب (raw.githubusercontent.com و یا
 *    برای مخزن خصوصی، API گیت‌هاب با توکن).
 *  - ماهی یک‌بار (کرون وردپرس) و در بارگذاری صفحات پیشخوان فایل تازه
 *    می‌شود؛ تا سقف ۸۱۶ ساعت (۳۴ روز) قطعیِ منبع، نسخهٔ کش‌شده معتبر می‌ماند («مرحمت»).
 *  - وضعیت دامنه: status = active | disabled و تاریخ اختیاری until + مهلت
 *    کلی notAfter.
 *  - وقتی دامنه فعال نیست: شورت‌کدها (استودیو/فرم/نمایشگر)، صفحه استودیو در
 *    پیشخوان، ذخیره‌سازی AJAX و REST API همه بسته می‌شوند؛ پیشخوان وردپرس و
 *    همین صفحهٔ لایسنس برای مدیریت در دسترس می‌ماند.
 *
 * تأمین‌کننده: license/domains.json → license/sign.mjs (یا GitHub Action) →
 * امضا؛ جزئیات در license/README.md همین مخزن.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'CKB_LICENSE_URL_DEFAULT', 'https://raw.githubusercontent.com/Ali252580/chekadbam-licenses/main/license.json' );
/* کلید عمومی Ed25519 (خروجی node sign.mjs genkey). کلید خصوصی هرگز در افزونه نیست. */
define( 'CKB_LICENSE_PUBLIC_KEY', 'c9yxe0tZ5janVvOPuoDZhRlaoeJu6Pr1fBpdpSge2Yc=' );

/**
 * فیلتر ckb_license_refresh_hours → فاصلهٔ به‌روزرسانی کش (ساعت؛ پیش‌فرض ۷۲۰ = یک ماه).
 * فیلتر ckb_license_grace_hours → سقف مجاز کار بدون دسترسی به منبع (ساعت؛ پیش‌فرض ۸۱۶ = ۳۴ روز).
 * آدرس منبع در پیشخوان نمایش داده/ویرایش نمی‌شود؛ فقط با ثابت CKB_LICENSE_URL در wp-config عوض می‌شود.
 */

/* ============================ Helpers ============================ */

/** هاست فعلی سایت، نرمال‌شده (بدون www) — دقیقاً مطابق امضای دامنه‌ها در گیت‌هاب. */
function ckb_license_host() {
	return strtolower( (string) parse_url( home_url(), PHP_URL_HOST ) );
}

/** آدرس فایل لایسنس — در پیشخوان نمایش داده نمی‌شود؛ فقط با ثابت CKB_LICENSE_URL در wp-config تغییر می‌کند. */
function ckb_license_source_url() {
	$url = get_option( 'ckb_license_url', '' );
	if ( ! $url && defined( 'CKB_LICENSE_URL' ) ) {
		$url = CKB_LICENSE_URL;
	}
	return $url ? $url : CKB_LICENSE_URL_DEFAULT;
}

/** آیا به‌روزرسانی با توکن مخزن خصوصی گیت‌هاب انجام شود؟ */
function ckb_license_github_api_url( $url, $token ) {
	if ( ! $token || false === strpos( $url, 'raw.githubusercontent.com' ) ) {
		return $url;
	}
	/* https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path} →
	   https://api.github.com/repos/{owner}/{repo}/contents/{path}?ref={branch} */
	$parts = wp_parse_url( $url );
	$segs  = array_values( array_filter( explode( '/', ltrim( (string) $parts['path'], '/' ) ) ) );
	if ( count( $segs ) < 4 ) {
		return $url;
	}
	$owner  = array_shift( $segs );
	$repo   = array_shift( $segs );
	$branch = array_shift( $segs );
	$path = implode( '/', $segs );
	return 'https://api.github.com/repos/' . rawurlencode( $owner ) . '/' . rawurlencode( $repo ) . '/contents/' . $path . '?ref=' . rawurlencode( $branch );
}

/** بررسی امضا و رمزگشایی payloadStr → آرایه یا WP_Error. */
function ckb_license_verify_payload( $payload_str, $signature_b64 ) {
	if ( ! function_exists( 'sodium_crypto_sign_verify_detached' ) ) {
		return new WP_Error( 'ckb_license_sodium_missing', 'پیش‌نیاز رمزنگاری (sodium) روی سرور در دسترس نیست.' );
	}
	if ( ! is_string( $payload_str ) || '' === $payload_str || ! is_string( $signature_b64 ) ) {
		return new WP_Error( 'ckb_license_malformed', 'ساختار فایل لایسنس نامعتبر است.' );
	}
	$sig = base64_decode( $signature_b64, true ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions
	if ( false === $sig || 64 !== strlen( $sig ) ) {
		return new WP_Error( 'ckb_license_bad_signature', 'امضای فایل لایسنس ناقص است.' );
	}
	$ok = sodium_crypto_sign_verify_detached( $sig, $payload_str, base64_decode( CKB_LICENSE_PUBLIC_KEY, true ) ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions
	if ( ! $ok ) {
		return new WP_Error( 'ckb_license_bad_signature', 'امضای فایل لایسنس نامعتبر است.' );
	}
	$payload = json_decode( $payload_str, true );
	if ( ! is_array( $payload ) || ! isset( $payload['domains'] ) ) {
		return new WP_Error( 'ckb_license_malformed', 'درون فایل لایسنس نامعتبر است.' );
	}
	return $payload;
}

/* ============================ Fetch & cache ============================ */

/**
 * واکشی فایل لایسنس از منبع؛ در موفقیت کش را به‌روزرسانی می‌کند و true برمی‌گردد.
 */
function ckb_license_fetch( $timeout = 7 ) {
	$lock = get_transient( 'ckb_license_fetch_lock' );
	if ( $lock ) {
		return new WP_Error( 'ckb_license_busy', 'آخرین به‌روزرسانی هنوز در جریان است.' );
	}
	set_transient( 'ckb_license_fetch_lock', time(), 90 );

	$url   = ckb_license_source_url();
	$token = (string) get_option( 'ckb_license_token', '' );

	$args = array(
		'timeout'    => (float) max( 3, $timeout ),
		'user-agent' => 'ChekadbamStudio/' . CKB_VERSION,
		'headers'    => array( 'Accept' => 'application/vnd.github.raw+json' ),
	);
	if ( $token ) {
		$args['headers']['Authorization'] = 'Bearer ' . $token;
		$url                              = ckb_license_github_api_url( $url, $token );
	}
	$response = wp_safe_remote_get( $url, $args );
	if ( is_wp_error( $response ) ) {
		return $response;
	}
	$code = (int) wp_remote_retrieve_response_code( $response );
	$body = (string) wp_remote_retrieve_body( $response );
	if ( 200 !== $code ) {
		return new WP_Error( 'ckb_license_http', 'منبع لایسنس با کد ' . $code . ' پاسخ داد (آدرس/توکن/شاخه را بررسی کن).' );
	}
	$lic = json_decode( $body, true );
	if ( ! is_array( $lic ) || empty( $lic['payloadStr'] ) || empty( $lic['signature'] ) ) {
		return new WP_Error( 'ckb_license_malformed', 'فایل دریافتی لایسنس الگوی امضاشده ندارد (license.json که خروجی sign.mjs است).' );
	}
	$verify = ckb_license_verify_payload( $lic['payloadStr'], $lic['signature'] );
	if ( is_wp_error( $verify ) ) {
		return $verify;
	}

	update_option(
		'ckb_license_cache',
		array(
			'payloadStr'  => (string) $lic['payloadStr'],
			'signature'   => (string) $lic['signature'],
			'fetchedAt'   => time(),
			'sourceUrl'   => $url,
		),
		false
	);
	ckb_license_maybe_ping( $verify );
	return true;
}

/** گزارش استفاده اختیاری به آدرس پینگ، در صورت تنظیم. */
function ckb_license_maybe_ping( $payload ) {
	$ping = (string) get_option( 'ckb_license_ping_url', '' );
	if ( ! $ping ) {
		return;
	}
	wp_safe_remote_post(
		$ping,
		array(
			'timeout' => 5,
			'headers' => array( 'Content-Type' => 'application/json; charset=utf-8' ),
			'body'    => wp_json_encode(
				array(
					'domain'    => ckb_license_host(),
					'siteUrl'   => home_url(),
					'version'   => CKB_VERSION,
					'status'    => ckb_license_state( false )['status'],
					'generatedAt' => isset( $payload['generatedAt'] ) ? $payload['generatedAt'] : '',
				)
			),
		)
	);
}

/** وضعیت لایسنس همین دامنه — هستهٔ تصمیم‌گیری همهٔ گیت‌ها. */
function ckb_license_state( $allow_refresh = true ) {
	static $computed = null;
	if ( null !== $computed ) {
		return $computed;
	}

	$host    = ckb_license_host();
	$cache   = get_option( 'ckb_license_cache', array() );
	$fetched = isset( $cache['fetchedAt'] ) ? (int) $cache['fetchedAt'] : 0;
	$now     = time();

	$refresh_hours = (int) apply_filters( 'ckb_license_refresh_hours', 720 );   /* یک ماه */
	$grace_hours   = (int) apply_filters( 'ckb_license_grace_hours', 816 );     /* ۳۴ روز */

	$state = array(
		'status'      => 'unlicensed',
		'active'      => false,
		'domain'      => $host,
		'until'       => null,
		'message'     => '',
		'fetchedAt'   => $fetched,
		'generatedAt' => '',
		'domains'     => array(),
	);

	$refresh = $allow_refresh && (
		0 === $fetched
		|| ( ( $now - $fetched ) > $refresh_hours * HOUR_IN_SECONDS )
	);

	if ( $refresh ) {
		if ( is_admin() || 0 === $fetched ) {
			/* پیشخوان یا اولین بار: واکشی فوری؛ کراون هم ۲ بار در روز به‌روزرسانی می‌کند. */
			ckb_license_fetch( is_admin() ? 7 : 4 );
			$cache   = get_option( 'ckb_license_cache', array() );
			$fetched = isset( $cache['fetchedAt'] ) ? (int) $cache['fetchedAt'] : 0;
			$state['fetchedAt'] = $fetched;
		} else {
			/* جلویی: برنامهٔ یک‌بارهٔ کراون (غیرمسدودکننده) و ادامه با کش. */
			if ( ! wp_next_scheduled( 'ckb_license_solo_refresh' ) ) {
				wp_schedule_single_event( time() + 30, 'ckb_license_solo_refresh' );
			}
		}
	}

	$state['domains'] = array();

	if ( $fetched && ! empty( $cache['payloadStr'] ) && ! empty( $cache['signature'] ) ) {
		$payload = ckb_license_verify_payload( $cache['payloadStr'], $cache['signature'] );
		$state['domains'] = is_array( $payload ) && isset( $payload['domains'] ) ? $payload['domains'] : array();
		$state['generatedAt'] = is_array( $payload ) && isset( $payload['generatedAt'] ) ? (string) $payload['generatedAt'] : '';

		if ( is_wp_error( $payload ) ) {
			$state = array(
				'status'      => 'unlicensed',
				'active'      => false,
				'domain'      => $host,
				'until'       => null,
				'message'     => $payload->get_error_message(),
				'fetchedAt'   => $fetched,
				'generatedAt' => '',
				'domains'     => array(),
			);
		} else {
			/* مهلت کلی فایل لایسنس (notAfter) */
			if ( ! empty( $payload['notAfter'] ) ) {
				$not_after = strtotime( (string) $payload['notAfter'] . ' 23:59:59 UTC' );
				if ( $not_after && $now > $not_after ) {
					$state['status']  = 'expired';
					$state['message'] = 'اعتبار کلی فایل لایسنس (' . $payload['notAfter'] . ') به پایان رسیده است.';
				}
			}

			/* جفت‌سازی دامنه: دقیق، یا wildcard «*.example.com» */
			$entry = null;
			foreach ( $state['domains'] as $key => $val ) {
				$key = strtolower( trim( $key ) );
				if ( '' === $key ) {
					continue;
				}
				if ( 0 === strpos( $key, '*.' ) ) {
					if ( $host === substr( $key, 1 ) || ( function_exists( 'str_ends_with' ) && str_ends_with( $host, substr( $key, 1 ) ) ) ) {
						$entry = $val;
						break;
					}
				} elseif ( $key === $host ) {
					$entry = $val;
					break;
				}
			}

			if ( 'expired' !== $state['status'] ) {
				if ( null === $entry ) {
					$state['status']  = 'disabled';
					$state['message'] = 'این دامنه در فهرست لایسنس نیست.';
				} else {
					$status = isset( $entry['status'] ) ? (string) $entry['status'] : 'active';
					if ( 'disabled' === $status ) {
						$state['status']  = 'disabled';
						$state['message'] = 'لایسنس این دامنه در گیت‌هاب غیرفعال شده است.';
					} elseif ( ! empty( $entry['until'] ) ) {
						$until    = strtotime( (string) $entry['until'] . ' 23:59:59 UTC' );
						$state['until'] = $entry['until'];
						if ( $until && $now > $until ) {
							$state['status']  = 'expired';
							$state['message'] = 'اعتبار این دامنه تا تاریخ ' . $entry['until'] . ' بوده و منقضی شده است.';
						}
					}
					if ( in_array( $state['status'], array( 'active', 'unlicensed' ), true ) ) {
						$state['status'] = 'active';
					}
				}
			}

			/* دورهٔ مرحمت: اگر منبع از دسترس خارج شده اما امضای کشی معتبر است */
			$stale = ( 0 !== $fetched ) && ( ( $now - $fetched ) > $grace_hours * HOUR_IN_SECONDS );
			if ( 'active' === $state['status'] && $stale ) {
				$state['status']  = 'expired';
				$state['message'] = 'بیش از ' . $grace_hours . ' ساعت از آخرین به‌روزرسانی موفق منبع لایسنس گذشته است (اتصال به گیت‌هاب برقرار نشده است).';
			} elseif ( 'active' === $state['status'] && ( $now - $fetched ) > $refresh_hours * HOUR_IN_SECONDS ) {
				$state['status'] = 'grace'; /* هنوز باز است، اما در حالت مرحمت — در پیشخوان هشدار می‌دهد */
			}
		}
	}

	if ( 'active' === $state['status'] || 'grace' === $state['status'] ) {
		$state['active'] = true;
	}
	$computed = $state;
	return $state;
}

/** آیا قلم/سرویس روی این دامنه مجاز است؟ */
function ckb_license_is_active() {
	return (bool) ckb_license_state()['active'];
}

/** جعبهٔ پیام بسته‌بودن — یکنواخت در همهٔ گیت‌ها. */
function ckb_license_blocked_html() {
	$state = ckb_license_state();
	$title = __( 'استودیوی چکادبام روی این دامنه غیرفعال است', 'chekadbam' );
	$msg   = (string) ( $state['message'] ? $state['message'] : __( 'این دامنه در فهرست لایسنس چکادبام مجاز نیست یا لایسنس منقضی شده است. با شرکت چکادبام تماس بگیرید.', 'chekadbam' ) );
	$host  = esc_html( $state['domain'] );
	return '<div dir="rtl" style="max-width:640px;margin:48px auto;padding:36px 30px;background:#0f172a;border:1px solid #1e293b;border-radius:20px;text-align:center;color:#f1f5f9;font-family:Vazirmatn,Tahoma,Arial,sans-serif;">'
		. '<div style="font-size:38px;line-height:1;margin-bottom:14px;">🔒</div>'
		. '<div style="font-size:17px;font-weight:800;color:#fbbf24;margin-bottom:10px;">' . esc_html( $title ) . '</div>'
		. '<div style="color:#94a3b8;font-size:13.5px;line-height:2;margin-bottom:6px;">' . esc_html( $msg ) . '</div>'
		. '<div style="color:#64748b;font-size:12px;">دامنهٔ جاری: <span dir="ltr">' . $host . '</span></div>'
		. '</div>';
}

/* ============================ Cron ============================ */

add_action( 'admin_init', 'ckb_license_schedule' );
function ckb_license_schedule() {
	$timestamp = wp_next_scheduled( 'ckb_license_cron_tick' );
	if ( $timestamp ) {
		/* مهاجرت: رویداد قبلی با تکرار متفاوت (مثلاً twicedaily) → یک‌بار بازنویسی ماهیانه */
		$event = function_exists( 'wp_get_scheduled_event' ) ? wp_get_scheduled_event( 'ckb_license_cron_tick' ) : null;
		if ( $event && isset( $event->schedule ) && 'monthly' !== $event->schedule ) {
			wp_unschedule_event( $timestamp, 'ckb_license_cron_tick' );
			$timestamp = false;
		}
	}
	if ( ! $timestamp ) {
		wp_schedule_event( time() + HOUR_IN_SECONDS, 'monthly', 'ckb_license_cron_tick' );
	}
}

add_action( 'ckb_license_cron_tick', 'ckb_license_run_cron_tick' );
add_action( 'ckb_license_solo_refresh', 'ckb_license_run_cron_tick' );
function ckb_license_run_cron_tick() {
	ckb_license_fetch( 12 );
}

/* ============================ Admin page ============================ */

add_action( 'admin_menu', 'ckb_license_menu', 14 );
function ckb_license_menu() {
	add_submenu_page(
		CKB_MENU_SLUG,
		__( 'لایسنس و دامنه‌ها', 'chekadbam' ),
		__( 'لایسنس و دامنه‌ها', 'chekadbam' ),
		'manage_options',
		'ckb-license',
		'ckb_license_render_page'
	);
}

function ckb_license_save_settings() {
	if ( ! isset( $_POST['ckb_license_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['ckb_license_nonce'] ) ), 'ckb_license_settings' ) ) {
		return;
	}
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	/* فقط توکن در پیشخوان قابل ویرایش است؛ آدرس منبع و گزارش از فرم حذف شده‌اند. */
	if ( isset( $_POST['ckb_license_token'] ) ) {
		update_option( 'ckb_license_token', sanitize_text_field( wp_unslash( $_POST['ckb_license_token'] ) ) );
	}
	if ( isset( $_POST['ckb_license_refresh_now'] ) ) {
		delete_transient( 'ckb_license_fetch_lock' );
		ckb_license_fetch( 10 );
	}
	echo '<div class="notice notice-success is-dismissible"><p>' . esc_html__( 'تنظیمات لایسنس ذخیره شد.', 'chekadbam' ) . '</p></div>';
}

function ckb_license_status_badge( $status_label, $color ) {
	return '<span style="background:' . esc_attr( $color ) . ';color:#fff;font-size:11.5px;font-weight:700;padding:3px 10px;border-radius:99px;">' . esc_html( $status_label ) . '</span>';
}

function ckb_license_render_page() {
	ckb_license_save_settings();

	$state   = ckb_license_state();
	$token   = (string) get_option( 'ckb_license_token', '' );

	$badges = array(
		'active'     => array( 'فعال', '#10b981' ),
		'grace'      => array( 'فعال (حالت مرحمت)', '#f59e0b' ),
		'disabled'   => array( 'غیرفعال', '#dc2626' ),
		'expired'    => array( 'منقضی', '#dc2626' ),
		'unlicensed' => array( 'لایسنس نامعتبر', '#dc2626' ),
	);
	$st     = $badges[ $state['status'] ] ?? array( $state['status'], '#64748b' );

	$last = $state['fetchedAt'] ? $state['fetchedAt'] : 0;
	$fetched_human = $last ? sprintf( __( '%1$s پیش (%2$s)', 'chekadbam' ), human_time_diff( $last, time() ), date_i18n( 'Y/m/d H:i', $last ) ) : '—';
	?>
	<div class="wrap ckb-wrap" dir="rtl">
		<h1><?php esc_html_e( 'لایسنس و دامنه‌ها', 'chekadbam' ); ?></h1>

		<div class="ckb-panel">
			<h2><?php esc_html_e( 'وضعیت همین دامنه', 'chekadbam' ); ?></h2>
			<p style="margin-top:0">
				<?php echo ckb_license_status_badge( $st[0], $st[1] ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
				<span dir="ltr" style="font-weight:700;margin-inline-start:10px"><?php echo esc_html( $state['domain'] ); ?></span>
				<?php if ( ! empty( $state['until'] ) ) : ?>
					<span>— اعتبار تا <?php echo esc_html( $state['until'] ); ?></span>
				<?php endif; ?>
			</p>
			<?php if ( ! empty( $state['message'] ) ) : ?>
				<p style="color:#dc2626;margin:4px 0 0"><?php echo esc_html( $state['message'] ); ?></p>
			<?php endif; ?>
			<p class="description">
				آخرین دریافت از منبع: <?php echo esc_html( $fetched_human ); ?> ·
				امضا: <?php echo esc_html( is_array( $state['domains'] ) ? sprintf( __( 'معتبر (%d دامنه در فایل)', 'chekadbam' ), count( $state['domains'] ) ) : '—' ); ?> ·
				صدور فایل: <?php echo esc_html( $state['generatedAt'] ? $state['generatedAt'] : '—' ); ?>
			</p>
			<?php ckb_license_refresh_button(); ?>
		</div>

		<div class="ckb-panel">
			<h2><?php esc_html_e( 'دامنه‌های داخل فایل لایسنس', 'chekadbam' ); ?></h2>
			<p class="description">
				<?php esc_html_e( 'این فهرست فقط از گیت‌هاب کنترل می‌شود (فایل license.json امضاشده). در مخزن گیت‌هاب، فایل domains.json را ویرایش کنید؛ اکشن خودکار فایل را امضا می‌کند و سایت‌ها ماهی یک‌بار به‌روز می‌شوند — برای اعمال فوری همین حالا «بررسی دوباره» را بزنید.', 'chekadbam' ); ?>
			</p>
			<?php if ( empty( $state['domains'] ) ) : ?>
				<p style="color:#dc2626"><?php esc_html_e( 'هیچ داده‌ای در دسترس نیست — آدرس منبع را بررسی کن و «بررسی دوباره» را بزن.', 'chekadbam' ); ?></p>
			<?php else : ?>
				<table class="widefat fixed striped ckb-table" style="max-width:780px">
					<thead>
						<tr>
							<th><?php esc_html_e( 'دامنه', 'chekadbam' ); ?></th>
							<th><?php esc_html_e( 'وضعیت', 'chekadbam' ); ?></th>
							<th><?php esc_html_e( 'اعتبار تا', 'chekadbam' ); ?></th>
							<th><?php esc_html_e( 'یادداشت', 'chekadbam' ); ?></th>
						</tr>
					</thead>
					<tbody>
					<?php foreach ( $state['domains'] as $d_host => $d_entry ) : ?>
						<?php
						$d_entry = (array) $d_entry;
						$d_status = isset( $d_entry['status'] ) && 'disabled' === $d_entry['status'] ? 'disabled' : 'active';
						$d_this   = strtolower( trim( (string) $d_host ) ) === $state['domain'];
						if ( ! empty( $d_entry['until'] ) && $d_status ) {
							$u = strtotime( (string) $d_entry['until'] . ' 23:59:59 UTC' );
							if ( $u && time() > $u ) {
								$d_status = 'expired';
							}
						}
						$d_badge  = array(
							'active'   => array( 'فعال', '#10b981' ),
							'disabled' => array( 'غیرفعال', '#64748b' ),
							'expired'  => array( 'منقضی', '#dc2626' ),
						)[ $d_status ];
						?>
						<tr>
							<td dir="ltr" style="text-align:left">
								<?php echo esc_html( $d_host ); ?>
								<?php if ( $d_this ) : ?><span style="font-weight:700;color:#10b981"> ← این سایت</span><?php endif; ?>
							</td>
							<td><?php echo ckb_license_status_badge( $d_badge[0], $d_badge[1] ); // phpcs:ignore WordPress.Security.EscapeOutput ?></td>
							<td><?php echo esc_html( ! empty( $d_entry['until'] ) ? $d_entry['until'] : '—' ); ?></td>
							<td><?php echo esc_html( ! empty( $d_entry['note'] ) ? $d_entry['note'] : '' ); ?></td>
						</tr>
					<?php endforeach; ?>
					</tbody>
				</table>
			<?php endif; ?>
		</div>

		<form method="post" class="ckb-panel" style="max-width:760px">
			<h2><?php esc_html_e( 'تنظیمات اتصال به مخزن لایسنس', 'chekadbam' ); ?></h2>
			<table class="form-table ckb-form">
				<tr>
					<th><label for="ckb_license_token"><?php esc_html_e( 'توکن مخزن خصوصی', 'chekadbam' ); ?></label></th>
					<td>
						<input type="password" id="ckb_license_token" name="ckb_license_token" value="<?php echo esc_attr( $token ); ?>" class="regular-text" dir="ltr" autocomplete="off" />
						<p class="description"><?php esc_html_e( 'توکن دسترسی Fine-grained فقط با مجوز «Contents: Read» روی مخزن لایسنس؛ مخزن خصوصی است و این توکن برای خواندن فایل امضاشده لازم است.', 'chekadbam' ); ?></p>
					</td>
				</tr>
			</table>
			<?php wp_nonce_field( 'ckb_license_settings', 'ckb_license_nonce' ); ?>
			<p>
				<button type="submit" class="button button-primary button-large"><?php esc_html_e( 'ذخیره تنظیمات لایسنس', 'chekadbam' ); ?></button>
				<button type="submit" name="ckb_license_refresh_now" value="1" class="button button-secondary button-large"><?php esc_html_e( 'ذخیره + بررسی دوباره', 'chekadbam' ); ?></button>
			</p>
		</form>

		<div class="ckb-panel" style="max-width:760px">
			<h2><?php esc_html_e( 'چطور دامنه فعال/غیرفعال کنم؟', 'chekadbam' ); ?></h2>
			<ol class="ckb-list" style="line-height:2.2">
				<li><?php esc_html_e( 'در مخزن گیت‌هاب لایسنس، فایل domains.json را ویرایش کن (status: «active» یا «disabled»، تاریخ اختیاری «until»).' ); ?></li>
				<li><?php esc_html_e( 'GitHub Action خودکار فایل را با کلید خصوصی امضا و license.json را کامیت می‌کند (یا با node sign.mjs دستی امضا کن).' ); ?></li>
				<li><?php esc_html_e( 'هر سایت ماهی یک‌بار فایل لایسنس را تازه می‌کند؛ با دکمهٔ «بررسی دوباره» تغییرات فوراً اعمال می‌شود. بدون اتصال به منبع هم تا ۳۴ روز با نسخهٔ آخر کار می‌کند.' ); ?></li>
			</ol>
			<p class="description"><?php esc_html_e( 'کلید عمومی امضا: c9yxe0tZ5janVvOPuoDZhRlaoeJu6Pr1fBpdpSge2Yc= — دستکاری فایل (افزودن دامنه بدون کلید خصوصی) باعث نامعتبرشدن امضا و قفل‌شدن افزونه می‌شود.', 'chekadbam' ); ?></p>
		</div>
	</div>
	<?php
}

/** دکمهٔ بررسی مجدد با AJAX (بدون رفرش صفحه). */
function ckb_license_refresh_button() {
	?>
	<p>
		<button type="button" class="button button-secondary" id="ckb-license-refresh-btn"><?php esc_html_e( 'بررسی دوباره همین حالا', 'chekadbam' ); ?></button>
		<span id="ckb-license-refresh-result" style="margin-inline-start:10px;font-weight:700"></span>
	</p>
	<script>
	(function () {
		var btn = document.getElementById('ckb-license-refresh-btn');
		if (!btn) return;
		btn.addEventListener('click', function () {
			var out = document.getElementById('ckb-license-refresh-result');
			btn.disabled = true; out.textContent = 'در حال دریافت…'; out.style.color = '#64748b';
			var fd = new FormData();
			fd.append('action', 'ckb_license_refresh');
			fd.append('nonce', '<?php echo esc_js( wp_create_nonce( 'ckb_license_refresh' ) ); ?>');
			fetch('<?php echo esc_url_raw( admin_url( 'admin-ajax.php' ) ); ?>', { method: 'POST', body: fd, credentials: 'same-origin' })
				.then(function (r) { return r.json(); })
				.then(function (res) {
					btn.disabled = false;
					var ok = res && res.success;
					out.textContent = ok ? 'به‌روزرسانی شد — صفحه را رفرش کن.' : 'خطا: ' + ((res && res.data) ? res.data : 'نامشخص');
					out.style.color = ok ? '#059669' : '#dc2626';
					if (ok) setTimeout(function () { location.reload(); }, 900);
				})
				.catch(function () { btn.disabled = false; out.textContent = 'خطای شبکه'; out.style.color = '#dc2626'; });
		});
	})();
	</script>
	<?php
}

add_action( 'wp_ajax_ckb_license_refresh', 'ckb_license_ajax_refresh' );
function ckb_license_ajax_refresh() {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_send_json_error( __( 'دسترسی ندارید.', 'chekadbam' ) );
	}
	check_ajax_referer( 'ckb_license_refresh', 'nonce' );
	delete_transient( 'ckb_license_fetch_lock' );
	$result = ckb_license_fetch( 12 );
	if ( is_wp_error( $result ) ) {
		wp_send_json_error( $result->get_error_message() );
	}
	wp_send_json_success( array( 'status' => ckb_license_state()['status'] ) );
}

/* ============================ Notice on dashboard ============================ */

add_action( 'admin_notices', 'ckb_license_admin_notice' );
function ckb_license_admin_notice() {
	$state = ckb_license_state();
	if ( $state['active'] && 'active' === $state['status'] ) {
		return;
	}
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$color = 'grace' === $state['status'] ? '#f59e0b' : '#dc2626';
	$msg   = $state['message'] ? $state['message'] : 'لایسنس چکادبام روی این دامنه فعال نیست — شورت‌کدها، استودیو و REST API متوقف‌اند.';
	echo '<div class="notice notice-error is-dismissible"><p style="color:' . esc_attr( $color ) . ';font-weight:700">⚠ ' . esc_html( $msg ) . ' <a href="' . esc_url( admin_url( 'admin.php?page=ckb-license' ) ) . '">' . esc_html__( 'صفحهٔ لایسنس', 'chekadbam' ) . '</a></p></div>';
}
