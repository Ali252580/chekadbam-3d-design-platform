<?php
/**
 * Seeds default Chekadbam products & plans on activation (only when empty).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function ckb_seed_defaults() {
	ckb_seed_products();
	ckb_seed_plans();
	ckb_seed_designs();
}

/**
 * Auto-seed on first admin visit if posts are empty,
 * ensuring the studio and admin lists work immediately even without activation hook.
 */
add_action( 'admin_init', 'ckb_maybe_auto_seed' );
function ckb_maybe_auto_seed() {
	if ( ! is_admin() || ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$seeded = get_option( 'ckb_initial_seed_done', false );
	if ( ! $seeded ) {
		ckb_seed_defaults();
		update_option( 'ckb_initial_seed_done', '1' );
	}
}

function ckb_seed_products() {
	$existing = get_posts(
		array(
			'post_type'   => 'ckb_product',
			'post_status' => 'any',
			'numberposts' => 1,
			'fields'      => 'ids',
		)
	);
	if ( ! empty( $existing ) ) {
		return;
	}

	$items = array(
		array( 'code' => 'CK-FB-160', 'title' => 'فلاورباکس مدولار ۱۶۰ سانتی‌متری عریض', 'cat' => 'planting', 'w' => 1.6, 'd' => 0.5, 'h' => 0.55, 'weight' => 58, 'price' => 7900000, 'shape' => 'box', 'light' => 0 ),
		array( 'code' => 'CK-FB-120', 'title' => 'فلاورباکس مدولار ۱۲۰ سانتی‌متری', 'cat' => 'planting', 'w' => 1.2, 'd' => 0.45, 'h' => 0.5, 'weight' => 42, 'price' => 6100000, 'shape' => 'box', 'light' => 1 ),
		array( 'code' => 'CK-FB-CNR', 'title' => 'فلاورباکس کنج ۹۰ درجه مدولار', 'cat' => 'planting', 'w' => 0.9, 'd' => 0.9, 'h' => 0.5, 'weight' => 44, 'price' => 6800000, 'shape' => 'box', 'light' => 0 ),
		array( 'code' => 'CK-BN-BR140', 'title' => 'نیمکت پشتی‌دار اسلت چوب‌پلاست با شاسی مشکی', 'cat' => 'furniture', 'w' => 1.4, 'd' => 0.62, 'h' => 0.88, 'weight' => 38, 'price' => 9800000, 'shape' => 'bench_backrest', 'light' => 0 ),
		array( 'code' => 'CK-BN-INT', 'title' => 'مجموعه ترکیبی نیمکت متصل به دو فلاورباکس', 'cat' => 'furniture', 'w' => 2.2, 'd' => 0.5, 'h' => 0.6, 'weight' => 76, 'price' => 11900000, 'shape' => 'bench_integrated', 'light' => 1 ),
		array( 'code' => 'CK-LN-SET04', 'title' => 'ست مبل راحتی ۴ نفره چوب‌پلاست و فلز مشکی', 'cat' => 'furniture', 'w' => 2.2, 'd' => 1.5, 'h' => 0.78, 'weight' => 64, 'price' => 26500000, 'shape' => 'lounge_set', 'light' => 0 ),
		array( 'code' => 'CK-PG-DK320', 'title' => 'پرگولا مدولار چوب‌پلاست با دک کف ۳.۲×۳.۲', 'cat' => 'structures', 'w' => 3.2, 'd' => 3.2, 'h' => 2.6, 'weight' => 410, 'price' => 52000000, 'shape' => 'pergola_deck', 'light' => 1 ),
		array( 'code' => 'CK-GW-FP120', 'title' => 'دیوار سبز مدولار قاب‌دار با تراف کاشت', 'cat' => 'structures', 'w' => 1.2, 'd' => 0.42, 'h' => 1.8, 'weight' => 68, 'price' => 11200000, 'shape' => 'green_wall_planter', 'light' => 1 ),
		array( 'code' => 'CK-WF-FRM130', 'title' => 'آبنمای قاب دوبل چوب‌پلاست با حوضچه ریزش آب', 'cat' => 'water_fire', 'w' => 1.3, 'd' => 1.1, 'h' => 1.45, 'weight' => 82, 'price' => 22800000, 'shape' => 'water_feature', 'light' => 1 ),
		array( 'code' => 'CK-FP-SQ110', 'title' => 'میز آتشدان مربعی چوب‌پلاست با سبد شعله', 'cat' => 'water_fire', 'w' => 1.1, 'd' => 1.1, 'h' => 0.72, 'weight' => 92, 'price' => 21500000, 'shape' => 'firepit_table', 'light' => 1 ),
		array( 'code' => 'CK-UMB-300', 'title' => 'چتر سایبان هیدرولیک پایه‌کنار ۳ متری', 'cat' => 'accessories', 'w' => 3.0, 'd' => 3.0, 'h' => 2.65, 'weight' => 85, 'price' => 15400000, 'shape' => 'umbrella', 'light' => 0 ),
		array( 'code' => 'CK-FL-WPC', 'title' => 'تایل کف‌پوش چوب‌پلاست WPC پازلی', 'cat' => 'flooring', 'w' => 1.0, 'd' => 1.0, 'h' => 0.04, 'weight' => 18, 'price' => 2400000, 'shape' => 'box', 'light' => 0 ),
	);

	foreach ( $items as $it ) {
		$pid = wp_insert_post(
			array(
				'post_type'   => 'ckb_product',
				'post_status' => 'publish',
				'post_title'  => $it['title'],
			)
		);
		if ( is_wp_error( $pid ) ) {
			continue;
		}
		update_post_meta( $pid, '_ckb_code', $it['code'] );
		update_post_meta( $pid, '_ckb_category', $it['cat'] );
		update_post_meta( $pid, '_ckb_width', $it['w'] );
		update_post_meta( $pid, '_ckb_depth', $it['d'] );
		update_post_meta( $pid, '_ckb_height', $it['h'] );
		update_post_meta( $pid, '_ckb_weight', $it['weight'] );
		update_post_meta( $pid, '_ckb_price', $it['price'] );
		update_post_meta( $pid, '_ckb_shape_type', $it['shape'] );
		update_post_meta( $pid, '_ckb_wpc_color', 'walnut' );
		update_post_meta( $pid, '_ckb_metal_color', 'black' );
		update_post_meta( $pid, '_ckb_has_lighting', $it['light'] ? '1' : '0' );
	}
}

function ckb_seed_plans() {
	$existing = get_posts(
		array(
			'post_type'   => 'ckb_plan',
			'post_status' => 'any',
			'numberposts' => 1,
			'fields'      => 'ids',
		)
	);
	if ( ! empty( $existing ) ) {
		return;
	}

	$plans = array(
		array(
			'title'  => 'پلان مستطیلی پنت‌هاوس (۱۰×۸)',
			'shape'  => 'rectangular',
			'w'      => 10, 'l' => 8, 'parapet' => 1.1,
			'items'  => array(
				array( 'productId' => 'CK-PG-DK320', 'name' => 'پرگولا با دک کف', 'x' => -2.6, 'z' => -1.6, 'rotation' => 0 ),
				array( 'productId' => 'CK-WF-FRM130', 'name' => 'آبنمای قاب دوبل', 'x' => 3.2, 'z' => -2.6, 'rotation' => 0 ),
				array( 'productId' => 'CK-FB-160', 'name' => 'فلاورباکس ۱۶۰', 'x' => 4.0, 'z' => 0.4, 'rotation' => 90 ),
				array( 'productId' => 'CK-LN-SET04', 'name' => 'ست مبل راحتی', 'x' => -1.0, 'z' => 2.4, 'rotation' => 180 ),
				array( 'productId' => 'CK-FP-SQ110', 'name' => 'میز آتشدان', 'x' => 1.6, 'z' => 0.6, 'rotation' => 0 ),
			),
		),
		array(
			'title'  => 'پلان L شکل پنت‌هاوس (۱۲×۹)',
			'shape'  => 'l_shaped',
			'w'      => 12, 'l' => 9, 'parapet' => 1.1,
			'cutout_w' => 5.5, 'cutout_l' => 4.5,
			'items'  => array(
				array( 'productId' => 'CK-PG-DK320', 'name' => 'پرگولا با دک کف', 'x' => -3.4, 'z' => -2.0, 'rotation' => 0 ),
				array( 'productId' => 'CK-LN-SET04', 'name' => 'ست مبل راحتی', 'x' => 3.2, 'z' => -2.4, 'rotation' => 0 ),
				array( 'productId' => 'CK-FB-160', 'name' => 'فلاورباکس ۱۶۰', 'x' => -5.0, 'z' => 1.4, 'rotation' => 90 ),
				array( 'productId' => 'CK-BN-BR140', 'name' => 'نیمکت پشتی‌دار', 'x' => -0.6, 'z' => 3.2, 'rotation' => 180 ),
			),
		),
		array(
			'title'  => 'پلان تراس طولی (۱۰×۲.۸)',
			'shape'  => 'narrow_balcony',
			'w'      => 10, 'l' => 2.8, 'parapet' => 1.1,
			'items'  => array(
				array( 'productId' => 'CK-BN-BR140', 'name' => 'نیمکت پشتی‌دار', 'x' => -2.0, 'z' => -0.7, 'rotation' => 0 ),
				array( 'productId' => 'CK-FB-160', 'name' => 'فلاورباکس ۱۶۰', 'x' => 2.4, 'z' => -0.8, 'rotation' => 0 ),
				array( 'productId' => 'CK-GW-FP120', 'name' => 'دیوار سبز قاب‌دار', 'x' => 4.2, 'z' => 0.0, 'rotation' => 90 ),
			),
		),
	);

	foreach ( $plans as $pl ) {
		$pid = wp_insert_post(
			array(
				'post_type'   => 'ckb_plan',
				'post_status' => 'publish',
				'post_title'  => $pl['title'],
			)
		);
		if ( is_wp_error( $pid ) ) {
			continue;
		}
		update_post_meta( $pid, '_ckb_plan_shape', $pl['shape'] );
		update_post_meta( $pid, '_ckb_plan_width', $pl['w'] );
		update_post_meta( $pid, '_ckb_plan_length', $pl['l'] );
		update_post_meta( $pid, '_ckb_parapet', $pl['parapet'] );
		update_post_meta( $pid, '_ckb_cutout_width', isset( $pl['cutout_w'] ) ? $pl['cutout_w'] : '' );
		update_post_meta( $pid, '_ckb_cutout_length', isset( $pl['cutout_l'] ) ? $pl['cutout_l'] : '' );
		update_post_meta( $pid, '_ckb_shaft_width', '' );
		update_post_meta( $pid, '_ckb_shaft_length', '' );
		update_post_meta( $pid, '_ckb_flooring', 'wpc_wood' );
		update_post_meta( $pid, '_ckb_wpc_color', 'walnut' );
		update_post_meta( $pid, '_ckb_metal_color', 'black' );
		update_post_meta( $pid, '_ckb_plan_items', wp_json_encode( $pl['items'] ) );
	}
}

function ckb_seed_designs() {
	$existing = get_posts(
		array(
			'post_type'   => 'ckb_design',
			'post_status' => 'any',
			'numberposts' => 1,
			'fields'      => 'ids',
		)
	);
	if ( ! empty( $existing ) ) {
		return;
	}

	$designs = array(
		array(
			'title'  => 'طرح روف‌گاردن پنت‌هاوس نیاوران',
			'name'   => 'مهندس فرهمند',
			'phone'  => '09121112233',
			'email'  => 'farahmand@example.com',
			'city'   => 'تهران',
			'stype'  => 'پشت‌بام مسکونی',
			'shape'  => 'rectangular',
			'w'      => 10, 'l' => 8, 'area' => 80,
			'status' => 'در حال طراحی',
			'notes'  => 'بازدید اولیه انجام شد؛ بارگذاری سازه تأیید گردید.',
			'msg'    => 'تمایل به پرگولای چوب‌پلاست و نور خطی زیر نیمکت‌ها.',
			'snapshot' => 'https://images.pexels.com/photos/7587884/pexels-photo-7587884.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
			'items'  => array(
				array( 'name' => 'پرگولا با دک کف ۳.۲', 'x' => -2.6, 'z' => -1.6, 'rotation' => 0,  'w' => 3.2, 'd' => 3.2 ),
				array( 'name' => 'آبنمای قاب دوبل', 'x' => 3.2, 'z' => -2.6, 'rotation' => 0,  'w' => 1.3, 'd' => 1.1 ),
				array( 'name' => 'فلاورباکس ۱۶۰', 'x' => 4.0, 'z' => 0.4, 'rotation' => 90, 'w' => 1.6, 'd' => 0.5 ),
				array( 'name' => 'ست مبل راحتی ۴ نفره', 'x' => -1.0, 'z' => 2.4, 'rotation' => 180, 'w' => 2.2, 'd' => 1.5 ),
				array( 'name' => 'میز آتشدان مربعی', 'x' => 1.6, 'z' => 0.6, 'rotation' => 0,  'w' => 1.1, 'd' => 1.1 ),
			),
		),
		array(
			'title'  => 'طرح تراس سبز زعفرانیه',
			'name'   => 'خانم دکتر معتمدی',
			'phone'  => '09123334455',
			'email'  => 'motamedi@example.com',
			'city'   => 'تهران',
			'stype'  => 'تراس یا بالکن',
			'shape'  => 'l_shaped',
			'w'      => 6, 'l' => 4, 'area' => 21,
			'status' => 'در انتظار تماس',
			'notes'  => 'جهت بررسی ابعاد دقیق تماس گرفته شود.',
			'msg'    => 'نیاز به دیوار سبز برای محرمیت از ساختمان روبرو.',
			'snapshot' => 'https://images.pexels.com/photos/7587879/pexels-photo-7587879.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
			'items'  => array(
				array( 'name' => 'نیمکت پشتی‌دار اسلت', 'x' => -1.8, 'z' => -1.2, 'rotation' => 0,  'w' => 1.4, 'd' => 0.62 ),
				array( 'name' => 'دیوار سبز قاب‌دار', 'x' => -2.3, 'z' => 0.4, 'rotation' => 90, 'w' => 1.2, 'd' => 0.42 ),
				array( 'name' => 'فلاورباکس ۱۶۰', 'x' => 1.6, 'z' => -1.3, 'rotation' => 0,  'w' => 1.6, 'd' => 0.5 ),
			),
		),
		array(
			'title'  => 'طرح روف‌کافه لواسان',
			'name'   => 'مهندس کامیار',
			'phone'  => '09127778899',
			'email'  => 'kamyar@example.com',
			'city'   => 'لواسان',
			'stype'  => 'کافه یا رستوران',
			'shape'  => 'u_shaped',
			'w'      => 14, 'l' => 11, 'area' => 118,
			'status' => 'درخواست ثبت‌شده',
			'notes'  => '',
			'msg'    => 'برآورد قیمت و نقشه اجرایی برای کافه روف.',
			'snapshot' => 'https://images.pexels.com/photos/7722163/pexels-photo-7722163.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
			'items'  => array(
				array( 'name' => 'پرگولا با دک کف ۳.۲', 'x' => -4.8, 'z' => -2.5, 'rotation' => 0, 'w' => 3.2, 'd' => 3.2 ),
				array( 'name' => 'پرگولا با دک کف ۳.۲', 'x' => 4.8, 'z' => -2.5, 'rotation' => 0, 'w' => 3.2, 'd' => 3.2 ),
				array( 'name' => 'باربیکیو و کانتر', 'x' => -4.8, 'z' => 3.5, 'rotation' => 0, 'w' => 1.8, 'd' => 0.65 ),
				array( 'name' => 'آبنمای قاب دوبل', 'x' => 4.8, 'z' => 3.5, 'rotation' => 0, 'w' => 1.3, 'd' => 1.1 ),
				array( 'name' => 'میز آتشدان مربعی', 'x' => 0, 'z' => 3.5, 'rotation' => 0, 'w' => 1.1, 'd' => 1.1 ),
			),
		),
	);

	foreach ( $designs as $dg ) {
		$pid = wp_insert_post(
			array(
				'post_type'   => 'ckb_design',
				'post_status' => 'publish',
				'post_title'  => $dg['title'],
			)
		);
		if ( is_wp_error( $pid ) ) {
			continue;
		}
		update_post_meta( $pid, '_ckb_customer_name', $dg['name'] );
		update_post_meta( $pid, '_ckb_customer_phone', $dg['phone'] );
		update_post_meta( $pid, '_ckb_customer_email', $dg['email'] );
		update_post_meta( $pid, '_ckb_city', $dg['city'] );
		update_post_meta( $pid, '_ckb_space_type', $dg['stype'] );
		update_post_meta( $pid, '_ckb_shape', $dg['shape'] );
		update_post_meta( $pid, '_ckb_width', $dg['w'] );
		update_post_meta( $pid, '_ckb_length', $dg['l'] );
		update_post_meta( $pid, '_ckb_area', $dg['area'] );
		update_post_meta( $pid, '_ckb_items_count', count( $dg['items'] ) );
		update_post_meta( $pid, '_ckb_items_json', wp_json_encode( $dg['items'] ) );
		update_post_meta( $pid, '_ckb_snapshot', $dg['snapshot'] );
		update_post_meta( $pid, '_ckb_message', $dg['msg'] );
		update_post_meta( $pid, '_ckb_expert_notes', $dg['notes'] );
		update_post_meta( $pid, '_ckb_status', $dg['status'] );
	}
}
