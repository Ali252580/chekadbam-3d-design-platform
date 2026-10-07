<?php
/**
 * Plugin Name: چکادبام استودیو منیجر (Chekadbam Studio Manager)
 * Plugin URI:  https://chekadbam.com
 * Description: استودیوی طراحی سه‌بعدی واقع‌گرایانه روف‌گاردن با مدل‌های واقعی محصولات (پرگولا، آبنما، درخت، ...)، مدیریت اقلام مدولار WPC، پلان‌های روف‌گاردن، CRM طرح‌ها، REST API هم‌خوان با Next.js، نمایشگر سه‌بعدی محصول و کد کوتاه فرم.
 * Version:     2.9.2
 * Author:      Chekadbam Engineering
 * Author URI:  https://chekadbam.com
 * Text Domain: chekadbam
 * Domain Path: /languages
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * License:     GPL-2.0-or-later
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'CKB_VERSION', '2.9.2' );
define( 'CKB_PLUGIN_FILE', __FILE__ );
define( 'CKB_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'CKB_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'CKB_MENU_SLUG', 'chekadbam-studio' );

require_once CKB_PLUGIN_DIR . 'includes/post-types.php';
require_once CKB_PLUGIN_DIR . 'includes/meta-boxes.php';
require_once CKB_PLUGIN_DIR . 'includes/admin-columns.php';
require_once CKB_PLUGIN_DIR . 'includes/rest-api.php';
require_once CKB_PLUGIN_DIR . 'includes/shortcodes.php';
require_once CKB_PLUGIN_DIR . 'includes/seed.php';
require_once CKB_PLUGIN_DIR . 'includes/wp-studio.php';
require_once CKB_PLUGIN_DIR . 'includes/wp-viewer.php';
require_once CKB_PLUGIN_DIR . 'includes/panel-sync.php';

/* ------------------------------ Activation ------------------------------ */

register_activation_hook( __FILE__, 'ckb_activate' );
function ckb_activate() {
	ckb_register_post_types();
	ckb_seed_defaults();
	flush_rewrite_rules();
}

register_deactivation_hook( __FILE__, function () {
	flush_rewrite_rules();
} );

/* ------------------------------ Admin menu ------------------------------ */

add_action( 'admin_menu', 'ckb_admin_menu', 9 );
function ckb_admin_menu() {
	add_menu_page(
		__( 'چکادبام استودیو', 'chekadbam' ),
		__( 'چکادبام استودیو', 'chekadbam' ),
		'manage_options',
		CKB_MENU_SLUG,
		'ckb_render_dashboard',
		'dashicons-layout',
		58
	);

	add_submenu_page(
		CKB_MENU_SLUG,
		__( 'داشبورد', 'chekadbam' ),
		__( 'داشبورد', 'chekadbam' ),
		'manage_options',
		CKB_MENU_SLUG,
		'ckb_render_dashboard'
	);

	add_submenu_page(
		CKB_MENU_SLUG,
		__( 'تنظیمات و اتصال استودیو', 'chekadbam' ),
		__( 'تنظیمات', 'chekadbam' ),
		'manage_options',
		'ckb-settings',
		'ckb_render_settings'
	);

	add_submenu_page(
		CKB_MENU_SLUG,
		__( 'راهنما و API', 'chekadbam' ),
		__( 'راهنما و API', 'chekadbam' ),
		'manage_options',
		'ckb-help',
		'ckb_render_help'
	);
}

/* ------------------------------ Dashboard ------------------------------ */

function ckb_render_dashboard() {
	$products = wp_count_posts( 'ckb_product' );
	$plans    = wp_count_posts( 'ckb_plan' );
	$designs  = wp_count_posts( 'ckb_design' );

	$status_counts = ckb_design_status_counts();
	$recent        = get_posts(
		array(
			'post_type'   => 'ckb_design',
			'post_status' => 'any',
			'numberposts' => 8,
			'orderby'     => 'date',
			'order'       => 'DESC',
		)
	);

	$total_area = 0;
	$all        = get_posts(
		array(
			'post_type'   => 'ckb_design',
			'post_status' => 'any',
			'numberposts' => -1,
			'fields'      => 'ids',
		)
	);
	foreach ( $all as $did ) {
		$total_area += (float) get_post_meta( $did, '_ckb_area', true );
	}
	?>
	<div class="wrap ckb-wrap" dir="rtl">
		<div class="ckb-hero-bar">
			<div>
				<h1 style="margin:0;color:#fff"><?php esc_html_e( 'داشبورد چکادبام استودیو', 'chekadbam' ); ?></h1>
				<p style="color:#c8f4e3;margin:6px 0 0"><?php esc_html_e( 'مدیریت اقلام مدولار، پلان‌های روف‌گاردن و طرح‌های ثبت‌شده کاربران.', 'chekadbam' ); ?></p>
			</div>
			<div class="ckb-hero-actions">
				<a class="ckb-btn ckb-btn-light" style="background:#10b981;color:#04221a;box-shadow:0 0 10px rgba(16,185,129,0.4);" href="<?php echo esc_url( admin_url( 'admin.php?page=wp-studio' ) ); ?>">✨ ورود به استودیوی طراحی ۳D</a>
				<a class="ckb-btn ckb-btn-light" href="<?php echo esc_url( admin_url( 'post-new.php?post_type=ckb_product' ) ); ?>">+ قلم جدید</a>
				<a class="ckb-btn ckb-btn-light" href="<?php echo esc_url( admin_url( 'post-new.php?post_type=ckb_plan' ) ); ?>">+ پلان جدید</a>
			</div>
		</div>

		<div class="ckb-cards">
			<a class="ckb-card" href="<?php echo esc_url( admin_url( 'edit.php?post_type=ckb_product' ) ); ?>">
				<span class="ckb-card-num"><?php echo esc_html( (int) ( $products->publish ?? 0 ) ); ?></span>
				<span class="ckb-card-label"><?php esc_html_e( 'اقلام مدولار', 'chekadbam' ); ?></span>
				<span class="ckb-card-act"><?php esc_html_e( 'افزودن / حذف قلم', 'chekadbam' ); ?></span>
			</a>
			<a class="ckb-card" href="<?php echo esc_url( admin_url( 'edit.php?post_type=ckb_plan' ) ); ?>">
				<span class="ckb-card-num"><?php echo esc_html( (int) ( $plans->publish ?? 0 ) ); ?></span>
				<span class="ckb-card-label"><?php esc_html_e( 'پلان‌های نقشه', 'chekadbam' ); ?></span>
				<span class="ckb-card-act"><?php esc_html_e( 'افزودن / حذف پلان', 'chekadbam' ); ?></span>
			</a>
			<a class="ckb-card" href="<?php echo esc_url( admin_url( 'edit.php?post_type=ckb_design' ) ); ?>">
				<span class="ckb-card-num"><?php echo esc_html( count( $all ) ); ?></span>
				<span class="ckb-card-label"><?php esc_html_e( 'طرح‌های ثبت‌شده', 'chekadbam' ); ?></span>
				<span class="ckb-card-act"><?php echo esc_html( number_format_i18n( $total_area, 1 ) ); ?> m² کل</span>
			</a>
			<a class="ckb-card ckb-card-alert" href="<?php echo esc_url( admin_url( 'edit.php?post_type=ckb_design&ckb_status_filter=' . rawurlencode( __( 'درخواست ثبت‌شده', 'chekadbam' ) ) ) ); ?>">
				<span class="ckb-card-num"><?php echo esc_html( $status_counts[ __( 'درخواست ثبت‌شده', 'chekadbam' ) ] ?? 0 ); ?></span>
				<span class="ckb-card-label"><?php esc_html_e( 'درخواست جدید', 'chekadbam' ); ?></span>
				<span class="ckb-card-act"><?php esc_html_e( 'نیازمند بررسی', 'chekadbam' ); ?></span>
			</a>
		</div>

		<div class="ckb-panel">
			<h2><?php esc_html_e( 'آخرین طرح‌های ثبت‌شده', 'chekadbam' ); ?></h2>
			<table class="widefat fixed striped ckb-table">
				<thead>
					<tr>
						<th><?php esc_html_e( 'مشتری', 'chekadbam' ); ?></th>
						<th><?php esc_html_e( 'تماس', 'chekadbam' ); ?></th>
						<th><?php esc_html_e( 'شهر', 'chekadbam' ); ?></th>
						<th><?php esc_html_e( 'فرم پلان', 'chekadbam' ); ?></th>
						<th><?php esc_html_e( 'متراژ', 'chekadbam' ); ?></th>
						<th><?php esc_html_e( 'اقلام', 'chekadbam' ); ?></th>
						<th><?php esc_html_e( 'وضعیت', 'chekadbam' ); ?></th>
						<th><?php esc_html_e( 'تاریخ', 'chekadbam' ); ?></th>
						<th></th>
					</tr>
				</thead>
				<tbody>
				<?php if ( empty( $recent ) ) : ?>
					<tr><td colspan="9"><?php esc_html_e( 'هنوز طرحی ثبت نشده است. از پایین همین صفحه می‌توانید داده‌های نمونه را نصب کنید.', 'chekadbam' ); ?></td></tr>
				<?php else : ?>
					<?php foreach ( $recent as $d ) :
						$items = json_decode( (string) get_post_meta( $d->ID, '_ckb_items_json', true ), true );
						$count = is_array( $items ) ? count( $items ) : 0;
						?>
						<tr>
							<td><strong><?php echo esc_html( get_post_meta( $d->ID, '_ckb_customer_name', true ) ?: $d->post_title ); ?></strong></td>
							<td dir="ltr"><a href="tel:<?php echo esc_attr( get_post_meta( $d->ID, '_ckb_customer_phone', true ) ); ?>"><?php echo esc_html( get_post_meta( $d->ID, '_ckb_customer_phone', true ) ); ?></a></td>
							<td><?php echo esc_html( get_post_meta( $d->ID, '_ckb_city', true ) ); ?></td>
							<td><?php echo esc_html( get_post_meta( $d->ID, '_ckb_shape', true ) ); ?></td>
							<td><?php echo esc_html( get_post_meta( $d->ID, '_ckb_area', true ) ); ?> m²</td>
							<td><?php echo esc_html( $count ); ?></td>
							<td><span class="ckb-badge"><?php echo esc_html( get_post_meta( $d->ID, '_ckb_status', true ) ); ?></span></td>
							<td><?php echo esc_html( get_the_date( 'Y/m/d', $d ) ); ?></td>
							<td><a class="button button-small button-primary" href="<?php echo esc_url( get_edit_post_link( $d->ID ) ); ?>"><?php esc_html_e( 'مشاهده و پیگیری', 'chekadbam' ); ?></a></td>
						</tr>
					<?php endforeach; ?>
				<?php endif; ?>
				</tbody>
			</table>
		</div>

		<?php ckb_render_seed_tools(); ?>
	</div>
	<?php
}

/* ------------------------------ Settings ------------------------------ */

function ckb_render_settings() {
	if ( isset( $_POST['ckb_settings_nonce'] ) && wp_verify_nonce( $_POST['ckb_settings_nonce'], 'ckb_save_settings' ) ) {
		update_option( 'ckb_studio_url', esc_url_raw( wp_unslash( $_POST['ckb_studio_url'] ?? '' ) ) );
		update_option( 'ckb_company_phone', sanitize_text_field( wp_unslash( $_POST['ckb_company_phone'] ?? '' ) ) );
		update_option( 'ckb_notify_email', sanitize_email( wp_unslash( $_POST['ckb_notify_email'] ?? get_option( 'admin_email' ) ) ) );
		echo '<div class="notice notice-success is-dismissible"><p>' . esc_html__( 'تنظیمات ذخیره شد.', 'chekadbam' ) . '</p></div>';
	}

	$studio_url = get_option( 'ckb_studio_url', home_url( '/studio' ) );
	$phone      = get_option( 'ckb_company_phone', '02144484801' );
	$email     = get_option( 'ckb_notify_email', get_option( 'admin_email' ) );
	$panel_url   = get_option( 'ckb_panel_api_url', '' );
	$panel_token = get_option( 'ckb_panel_api_token', '' );
	$sync_disabled = '1' === get_option( 'ckb_panel_sync_disabled', '0' );
	?>
	<div class="wrap ckb-wrap" dir="rtl">
		<h1><?php esc_html_e( 'تنظیمات و اتصال استودیو', 'chekadbam' ); ?></h1>
		<form method="post" class="ckb-panel" style="max-width:760px">
			<table class="form-table ckb-form">
				<tr>
					<th><label for="ckb_studio_url"><?php esc_html_e( 'آدرس استودیوی سه‌بعدی', 'chekadbam' ); ?></label></th>
					<td>
						<input type="url" id="ckb_studio_url" name="ckb_studio_url" value="<?php echo esc_attr( $studio_url ); ?>" class="regular-text" dir="ltr" />
						<p class="description"><?php esc_html_e( 'آدرس صفحه استودیو در سایت Next.js یا وردپرس؛ استودیو از REST API همین وردپرس اقلام و پلان‌ها را می‌خواند.', 'chekadbam' ); ?></p>
					</td>
				</tr>
				<tr>
					<th><label for="ckb_company_phone"><?php esc_html_e( 'تلفن ثابت شرکت', 'chekadbam' ); ?></label></th>
					<td><input type="text" id="ckb_company_phone" name="ckb_company_phone" value="<?php echo esc_attr( $phone ); ?>" class="regular-text" dir="ltr" /></td>
				</tr>
				<tr>
					<th><label for="ckb_notify_email"><?php esc_html_e( 'ایمیل اطلاع‌رسانی طرح جدید', 'chekadbam' ); ?></label></th>
					<td><input type="email" id="ckb_notify_email" name="ckb_notify_email" value="<?php echo esc_attr( $email ); ?>" class="regular-text" dir="ltr" /></td>
				</tr>
				<tr>
					<th><label for="ckb_panel_api_url"><?php esc_html_e( 'آدرس پنل (Next.js)', 'chekadbam' ); ?></label></th>
					<td>
						<input type="url" id="ckb_panel_api_url" name="ckb_panel_api_url" value="<?php echo esc_attr( $panel_url ); ?>" class="regular-text" dir="ltr" placeholder="https://panel.chekadbam.com" />
						<p class="description"><?php esc_html_e( 'هر طرح ثبت‌شده در وردپرس (استودیو، REST یا فرم مشاوره) بلافاصله به آدرس <پنل>/api/designs/wordpress ارسال و در CRM پنل ثبت می‌شود.', 'chekadbam' ); ?></p>
					</td>
				</tr>
				<tr>
					<th><label for="ckb_panel_api_token"><?php esc_html_e( 'توکن همگام‌سازی طرح‌ها', 'chekadbam' ); ?></label></th>
					<td>
						<input type="text" id="ckb_panel_api_token" name="ckb_panel_api_token" value="<?php echo esc_attr( $panel_token ); ?>" class="regular-text" dir="ltr" />
						<p class="description"><?php esc_html_e( 'باید با متغیر محیطی DESIGN_SYNC_TOKEN در پنل دقیقاً یکی باشد.', 'chekadbam' ); ?></p>
					</td>
				</tr>
				<tr>
					<th><?php esc_html_e( 'ارسال خودکار', 'chekadbam' ); ?></th>
					<td>
						<label>
							<input type="checkbox" name="ckb_panel_sync_disabled" value="1" <?php checked( $sync_disabled ); ?> />
							<?php esc_html_e( 'غیرفعال کردن ارسال خودکار طرح‌ها به پنل', 'chekadbam' ); ?>
						</label>
					</td>
				</tr>
				<tr>
					<th><?php esc_html_e( 'تست اتصال', 'chekadbam' ); ?></th>
					<td>
						<button type="button" class="button button-secondary" id="ckb-panel-test-btn"><?php esc_html_e( 'بررسی اتصال به پنل', 'chekadbam' ); ?></button>
						<span id="ckb-panel-test-result" style="margin-inline-start:12px;font-weight:700"></span>
					</td>
				</tr>
				<tr>
					<th><?php esc_html_e( 'کد کوتاه فرم ثبت طرح', 'chekadbam' ); ?></th>
					<td><code dir="ltr">[chekadbam_form]</code> <span class="description"><?php esc_html_e( 'برای نمایش فرم ساده ثبت طرح در هر صفحه/پست از این کد استفاده کنید.', 'chekadbam' ); ?></span></td>
				</tr>
			</table>
			<?php wp_nonce_field( 'ckb_save_settings', 'ckb_settings_nonce' ); ?>
			<p><button type="submit" class="button button-primary button-large"><?php esc_html_e( 'ذخیره تنظیمات', 'chekadbam' ); ?></button></p>
		</form>
		<script>
			(function () {
				var btn = document.getElementById('ckb-panel-test-btn');
				if (!btn) return;
				btn.addEventListener('click', function () {
					var result = document.getElementById('ckb-panel-test-result');
					var apiUrl = document.getElementById('ckb_panel_api_url').value;
					var apiToken = document.getElementById('ckb_panel_api_token').value;
					btn.disabled = true;
					result.textContent = 'در حال بررسی…';
					result.style.color = '#64748b';
					var fd = new FormData();
					fd.append('action', 'ckb_panel_sync_test');
					fd.append('nonce', '<?php echo esc_js( wp_create_nonce( 'ckb_panel_sync_test' ) ); ?>');
					fd.append('apiUrl', apiUrl);
					fd.append('apiToken', apiToken);
					fetch('<?php echo esc_url_raw( admin_url( 'admin-ajax.php' ) ); ?>', { method: 'POST', body: fd, credentials: 'same-origin' })
						.then(function (r) { return r.json(); })
						.then(function (res) {
							btn.disabled = false;
							result.textContent = (res && res.data) ? res.data : 'پاسخ نامشخص';
							result.style.color = (res && res.success) ? '#059669' : '#dc2626';
						})
						.catch(function () {
							btn.disabled = false;
							result.textContent = 'خطای شبکه';
							result.style.color = '#dc2626';
						});
				});
			})();
		</script>
	</div>
	<?php
}

/* ------------------------------ Seed tools ------------------------------ */

function ckb_render_seed_tools() {
	$nonce = wp_create_nonce( 'ckb_seed_action' );
	$url   = add_query_arg(
		array(
			'page'      => CKB_MENU_SLUG,
			'ckb_seed'  => '1',
			'_wpnonce'  => $nonce,
		),
		admin_url( 'admin.php' )
	);
	?>
	<div class="ckb-panel ckb-seed-panel">
		<h2><?php esc_html_e( 'داده‌های نمونه و ابزارها', 'chekadbam' ); ?></h2>
		<p class="description"><?php esc_html_e( 'اگر سایت تازه نصب شده یا داده‌های پیش‌فرض حذف شده‌اند، با این دکمه اقلام، پلان‌ها و طرح‌های نمونه را درج کنید (در صورت وجود داده، تکراری ساخته نمی‌شود).', 'chekadbam' ); ?></p>
		<p>
			<a class="button button-secondary" href="<?php echo esc_url( $url ); ?>"><?php esc_html_e( 'نصب/تکمیل داده‌های نمونه', 'chekadbam' ); ?></a>
		</p>
	</div>
	<?php
}

add_action( 'admin_init', 'ckb_handle_seed_action' );
function ckb_handle_seed_action() {
	if ( ! is_admin() ) {
		return;
	}
	if ( empty( $_GET['ckb_seed'] ) || ! current_user_can( 'manage_options' ) ) {
		return;
	}
	if ( ! isset( $_GET['_wpnonce'] ) || ! wp_verify_nonce( $_GET['_wpnonce'], 'ckb_seed_action' ) ) {
		return;
	}
	ckb_seed_defaults();
	wp_safe_redirect(
		add_query_arg(
			array(
				'page'        => CKB_MENU_SLUG,
				'ckb_seeded'  => '1',
			),
			admin_url( 'admin.php' )
		)
	);
	exit;
}

add_action( 'admin_notices', 'ckb_seed_notice' );
function ckb_seed_notice() {
	if ( ! empty( $_GET['ckb_seeded'] ) && current_user_can( 'manage_options' ) ) {
		echo '<div class="notice notice-success is-dismissible"><p>' . esc_html__( 'داده‌های نمونه با موفقیت بررسی و درج شد.', 'chekadbam' ) . '</p></div>';
	}
}

/* ------------------------------ Help page ------------------------------ */

function ckb_render_help() {
	$base = esc_url( rest_url( 'chekadbam/v1' ) );
	$studio_url = get_option( 'ckb_studio_url', home_url( '/studio' ) );
	?>
	<div class="wrap ckb-wrap" dir="rtl">
		<h1><?php esc_html_e( 'راهنما و اتصال API', 'chekadbam' ); ?></h1>

		<div class="ckb-panel">
			<h2><?php esc_html_e( 'مدیریت اقلام و پلان‌ها', 'chekadbam' ); ?></h2>
			<ul class="ckb-list">
				<li><?php esc_html_e( 'از منوی «اقلام مدولار»، قلم جدید با کد فنی، دسته، نوع شکل سه‌بعدی، طول، عرض، ارتفاع، وزن، قیمت، رنگ چوب‌پلاست/فلز و نورپردازی اضافه یا حذف کنید.', 'chekadbam' ); ?></li>
				<li><?php esc_html_e( 'از منوی «پلان‌های نقشه»، فرم پلان (مستطیلی، L، U، باکس پله، تراس طولی)، ابعاد، فرورفتگی‌ها و چیدمان اقلام را با افزودن/حذف ردیف تعریف کنید.', 'chekadbam' ); ?></li>
				<li><?php esc_html_e( 'طرح‌های کاربران در «طرح‌های ثبت‌شده» با تصویر پیش‌نمایش، فهرست اقلام، تلفن/واتساپ و تغییر وضعیت پیگیری قابل مشاهده‌اند.', 'chekadbam' ); ?></li>
			</ul>
		</div>

		<div class="ckb-panel">
			<h2><?php esc_html_e( 'اتصال استودیوی سه‌بعدی', 'chekadbam' ); ?></h2>
			<p><?php esc_html_e( 'آدرس استودیو:', 'chekadbam' ); ?> <code dir="ltr"><?php echo esc_url( $studio_url ); ?></code></p>
			<p class="description"><?php esc_html_e( 'در پروژه Next.js، آدرس پایه API را روی همین وردپرس تنظیم کنید؛ مثلاً https://yoursite.com/wp-json', 'chekadbam' ); ?></p>
			<table class="widefat fixed ckb-table" style="max-width:820px">
				<tbody>
					<tr><td dir="ltr"><code>GET <?php echo $base; ?>/products</code></td><td><?php esc_html_e( 'فهرست اقلام مدولار', 'chekadbam' ); ?></td></tr>
					<tr><td dir="ltr"><code>GET <?php echo $base; ?>/plans</code></td><td><?php esc_html_e( 'فهرست پلان‌ها و چیدمان‌ها', 'chekadbam' ); ?></td></tr>
					<tr><td dir="ltr"><code>POST <?php echo $base; ?>/designs</code></td><td><?php esc_html_e( 'ثبت طرح جدید کاربر (عمومی)', 'chekadbam' ); ?></td></tr>
					<tr><td dir="ltr"><code>GET <?php echo $base; ?>/designs</code></td><td><?php esc_html_e( 'فهرست طرح‌ها (فقط مدیر)', 'chekadbam' ); ?></td></tr>
				</tbody>
			</table>
			<pre dir="ltr" class="ckb-code">POST <?php echo $base; ?>/designs
{
  "name": "مهندس راد",
  "phone": "09120000000",
  "city": "تهران",
  "shape": "rectangular",
  "width": 10, "length": 8,
  "items": [ {"name":"فلاورباکس ۱۶۰","x":3.8,"z":0,"rotation":90} ],
  "snapshot": "https://.../shot.jpg"
}</pre>
		</div>
	</div>
	<?php
}

/* ------------------------------ Notification email ------------------------------ */

add_action( 'ckb_design_created', 'ckb_maybe_notify_admin', 10, 1 );
function ckb_maybe_notify_admin( $post_id ) {
	$to      = get_option( 'ckb_notify_email', get_option( 'admin_email' ) );
	if ( ! is_email( $to ) ) {
		return;
	}
	$name  = get_post_meta( $post_id, '_ckb_customer_name', true );
	$phone = get_post_meta( $post_id, '_ckb_customer_phone', true );
	$area  = get_post_meta( $post_id, '_ckb_area', true );
	$city  = get_post_meta( $post_id, '_ckb_city', true );

	$shape = get_post_meta( $post_id, '_ckb_shape', true );
	$items_count = (int) get_post_meta( $post_id, '_ckb_items_count', true );
	$bom = json_decode( (string) get_post_meta( $post_id, '_ckb_bom_json', true ), true );
	$weight   = is_array( $bom ) && isset( $bom['totalWeightKg'] ) ? $bom['totalWeightKg'] : '';
	$priceMin = is_array( $bom ) && isset( $bom['estimatedPriceMin'] ) ? number_format_i18n( (int) $bom['estimatedPriceMin'] ) : '';
	$priceMax = is_array( $bom ) && isset( $bom['estimatedPriceMax'] ) ? number_format_i18n( (int) $bom['estimatedPriceMax'] ) : '';

	$subject = sprintf( __( '[چکادبام] طرح جدید از %s', 'chekadbam' ), $name );
	$body    = "یک طرح جدید در استودیوی چکادبام ثبت شد:\n\n"
		. "مشتری: $name\nتلفن: $phone\nشهر: $city\n"
		. "فرم پلان: $shape\nمتراژ: $area m²\nتعداد اقلام: $items_count\n";
	if ( '' !== $weight ) {
		$body .= "وزن تقریبی: {$weight} kg\n";
	}
	if ( '' !== $priceMin && '' !== $priceMax ) {
		$body .= "بازه قیمت تقریبی: {$priceMin} تا {$priceMax} تومان\n";
	}
	$body .= "\n" . admin_url( 'post.php?post=' . $post_id . '&action=edit' );
	wp_mail( $to, $subject, $body );
}

/* ------------------------------ Assets ------------------------------ */

add_action( 'admin_enqueue_scripts', 'ckb_admin_assets' );
function ckb_admin_assets( $hook ) {
	$types = array( 'ckb_product', 'ckb_plan', 'ckb_design' );
	global $typenow;
	$is_type_page = in_array( $typenow, $types, true ) && in_array( $hook, array( 'post.php', 'post-new.php', 'edit.php' ), true );
	$is_ckb_page = ( strpos( (string) $hook, 'chekadbam' ) !== false || strpos( (string) $hook, 'ckb-' ) !== false || strpos( (string) $hook, 'wp-studio' ) !== false );

	if ( ! $is_type_page && ! $is_ckb_page ) {
		return;
	}

	// Always load local Three.js (no external CDN dependency)
	wp_enqueue_script( 'ckb-three', CKB_PLUGIN_URL . 'assets/three.min.js', array(), CKB_VERSION, false );
	wp_enqueue_style( 'ckb-admin', CKB_PLUGIN_URL . 'assets/admin.css', array(), CKB_VERSION );
	wp_enqueue_script( 'ckb-admin', CKB_PLUGIN_URL . 'assets/admin.js', array(), CKB_VERSION, true );

	// v2 modular studio/viewer assets (registered but only enqueued where needed)
	ckb_wpstudio_register_assets();

	// Live 3D preview on the item editor — «افزودن قلم با اندازه دلخواه»
	if ( 'ckb_product' === $typenow && in_array( $hook, array( 'post.php', 'post-new.php' ), true ) ) {
		wp_enqueue_script( 'ckb-textures', CKB_PLUGIN_URL . 'assets/ckb-textures.js', array( 'ckb-three' ), CKB_VERSION, true );
		wp_enqueue_script( 'ckb-foliage', CKB_PLUGIN_URL . 'assets/ckb-foliage.js', array( 'ckb-three' ), CKB_VERSION, true );
		wp_enqueue_script( 'ckb-models', CKB_PLUGIN_URL . 'assets/ckb-models.js', array( 'ckb-textures', 'ckb-foliage' ), CKB_VERSION, true );
		wp_enqueue_script( 'ckb-viewer', CKB_PLUGIN_URL . 'assets/viewer.js', array( 'ckb-models' ), CKB_VERSION, true );
		wp_enqueue_script( 'ckb-admin-preview', CKB_PLUGIN_URL . 'assets/admin-preview.js', array( 'ckb-viewer' ), CKB_VERSION, true );
	}
	wp_localize_script(
		'ckb-admin',
		'CKB_ADMIN',
		array(
			'products' => ckb_get_products_for_select(),
			'strings'  => array(
				'remove' => __( 'حذف', 'chekadbam' ),
				'add'    => __( 'افزودن قلم به چیدمان', 'chekadbam' ),
			),
		)
	);
}
