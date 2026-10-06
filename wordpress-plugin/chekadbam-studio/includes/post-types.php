<?php
/**
 * Custom post types: products, plans, designs.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'init', 'ckb_register_post_types' );
function ckb_register_post_types() {

	/* ------------------------------ Products ------------------------------ */
	register_post_type(
		'ckb_product',
		array(
			'labels'          => array(
				'name'          => __( 'اقلام مدولار', 'chekadbam' ),
				'singular_name' => __( 'قلم مدولار', 'chekadbam' ),
				'add_new'       => __( 'افزودن قلم', 'chekadbam' ),
				'add_new_item'  => __( 'افزودن قلم مدولار جدید', 'chekadbam' ),
				'edit_item'     => __( 'ویرایش قلم مدولار', 'chekadbam' ),
				'all_items'     => __( 'همه اقلام مدولار', 'chekadbam' ),
				'search_items'  => __( 'جستجوی اقلام', 'chekadbam' ),
				'not_found'     => __( 'قلمی یافت نشد.', 'chekadbam' ),
			),
			'public'          => false,
			'show_ui'         => true,
			'show_in_menu'    => CKB_MENU_SLUG,
			'menu_icon'       => 'dashicons-archive',
			'supports'        => array( 'title', 'thumbnail', 'excerpt' ),
			'show_in_rest'    => false,
			'capability_type' => 'post',
		)
	);

	/* ------------------------------ Plans ------------------------------ */
	register_post_type(
		'ckb_plan',
		array(
			'labels'          => array(
				'name'          => __( 'پلان‌های نقشه', 'chekadbam' ),
				'singular_name' => __( 'پلان نقشه', 'chekadbam' ),
				'add_new'       => __( 'افزودن پلان', 'chekadbam' ),
				'add_new_item'  => __( 'افزودن پلان نقشه جدید', 'chekadbam' ),
				'edit_item'     => __( 'ویرایش پلان نقشه', 'chekadbam' ),
				'all_items'     => __( 'همه پلان‌ها', 'chekadbam' ),
				'search_items'  => __( 'جستجوی پلان‌ها', 'chekadbam' ),
				'not_found'     => __( 'پلانی یافت نشد.', 'chekadbam' ),
			),
			'public'          => false,
			'show_ui'         => true,
			'show_in_menu'    => CKB_MENU_SLUG,
			'menu_icon'       => 'dashicons-grid-view',
			'supports'        => array( 'title' ),
			'show_in_rest'    => false,
			'capability_type' => 'post',
		)
	);

	/* ------------------------------ Designs ------------------------------ */
	register_post_type(
		'ckb_design',
		array(
			'labels'          => array(
				'name'          => __( 'طرح‌های ثبت‌شده', 'chekadbam' ),
				'singular_name' => __( 'طرح ثبت‌شده', 'chekadbam' ),
				'add_new'       => __( 'افزودن دستی طرح', 'chekadbam' ),
				'add_new_item'  => __( 'افزودن طرح جدید', 'chekadbam' ),
				'edit_item'     => __( 'مشاهده و ویرایش طرح', 'chekadbam' ),
				'all_items'     => __( 'همه طرح‌های ثبت‌شده', 'chekadbam' ),
				'search_items'  => __( 'جستجوی طرح‌ها', 'chekadbam' ),
				'not_found'     => __( 'طرحی یافت نشد.', 'chekadbam' ),
			),
			'public'          => false,
			'show_ui'         => true,
			'show_in_menu'    => CKB_MENU_SLUG,
			'menu_icon'       => 'dashicons-portfolio',
			'supports'        => array( 'title' ),
			'show_in_rest'    => false,
			'capability_type' => 'post',
		)
	);
}

/* ------------------------------ Shared option lists ------------------------------ */

function ckb_product_categories() {
	return array(
		'planting'   => __( 'سیستم کاشت مدولار', 'chekadbam' ),
		'furniture'  => __( 'مبلمان فضای باز', 'chekadbam' ),
		'structures' => __( 'پرگولا و سایبان', 'chekadbam' ),
		'water_fire' => __( 'آبنما و آتشدان', 'chekadbam' ),
		'lighting'   => __( 'روشنایی و برق', 'chekadbam' ),
		'flooring'   => __( 'کف‌سازی و تایل WPC', 'chekadbam' ),
		'accessories'=> __( 'باربیکیو و اکسسوری', 'chekadbam' ),
	);
}

function ckb_shape_types() {
	return array(
		'box'               => __( 'باکس / فلاورباکس', 'chekadbam' ),
		'bench_backrest'    => __( 'نیمکت پشتی‌دار', 'chekadbam' ),
		'bench_integrated'  => __( 'نیمکت متصل به باکس', 'chekadbam' ),
		'lounge_set'        => __( 'ست مبل راحتی ۴ نفره', 'chekadbam' ),
		'pergola'           => __( 'پرگولا', 'chekadbam' ),
		'pergola_deck'      => __( 'پرگولا با دک کف', 'chekadbam' ),
		'green_wall'        => __( 'دیوار سبز', 'chekadbam' ),
		'green_wall_planter'=> __( 'دیوار سبز قاب‌دار با تراف', 'chekadbam' ),
		'water_feature'     => __( 'آبنما', 'chekadbam' ),
		'firepit'           => __( 'آتشدان دایره‌ای', 'chekadbam' ),
		'firepit_table'     => __( 'میز آتشدان مربعی', 'chekadbam' ),
		'umbrella'          => __( 'چتر سایبان پایه‌کنار', 'chekadbam' ),
		'tree'              => __( 'درختچه / گلدان', 'chekadbam' ),
		'bbq'               => __( 'باربیکیو و کانتر', 'chekadbam' ),
		'louver'            => __( 'پارتیشن لوور', 'chekadbam' ),
	);
}

function ckb_plan_shapes() {
	return array(
		'rectangular'    => __( 'مستطیلی استاندارد', 'chekadbam' ),
		'l_shaped'       => __( 'L شکل (دو زون)', 'chekadbam' ),
		'u_shaped'       => __( 'U شکل (حیاط میانی)', 'chekadbam' ),
		'central_shaft'  => __( 'با باکس پله / آسانسور مرکزی', 'chekadbam' ),
		'narrow_balcony' => __( 'تراس طولی کشیده', 'chekadbam' ),
	);
}

function ckb_flooring_types() {
	return array(
		'wpc_wood' => __( 'دک چوب‌پلاست WPC شیاردار استاندارد', 'chekadbam' ),
	);
}

function ckb_wpc_colors() {
	return array(
		'walnut'   => __( 'گردویی شکلاتی', 'chekadbam' ),
		'teak'     => __( 'تیک طبیعی', 'chekadbam' ),
		'charcoal' => __( 'دودی ذغالی', 'chekadbam' ),
		'oak'      => __( 'بلوطی روشن', 'chekadbam' ),
	);
}

function ckb_metal_colors() {
	return array(
		'black'    => __( 'مشکی مات', 'chekadbam' ),
		'charcoal' => __( 'طوسی متالیک', 'chekadbam' ),
		'cream'    => __( 'کرم شنی', 'chekadbam' ),
	);
}

function ckb_design_statuses() {
	return array(
		__( 'طرح اولیه', 'chekadbam' ),
		__( 'درخواست ثبت‌شده', 'chekadbam' ),
		__( 'در انتظار تماس', 'chekadbam' ),
		__( 'نیازمند بازدید', 'chekadbam' ),
		__( 'در حال طراحی', 'chekadbam' ),
		__( 'پیش‌فاکتور ارسال شد', 'chekadbam' ),
		__( 'قرارداد شده', 'chekadbam' ),
		__( 'بایگانی', 'chekadbam' ),
	);
}

/* ------------------------------ Helpers ------------------------------ */

/** Counts of designs grouped by status, keyed by the Persian status string. */
function ckb_design_status_counts() {
	$counts = array();
	foreach ( ckb_design_statuses() as $status ) {
		$counts[ $status ] = 0;
	}

	$posts = get_posts(
		array(
			'post_type'   => 'ckb_design',
			'post_status' => 'any',
			'numberposts' => -1,
			'fields'      => 'ids',
		)
	);
	foreach ( $posts as $pid ) {
		$s = get_post_meta( $pid, '_ckb_status', true );
		if ( $s && isset( $counts[ $s ] ) ) {
			$counts[ $s ]++;
		}
	}
	return $counts;
}

/**
 * Persian label for a plan shape key.
 * Shared by the studio renderer, REST API and plan editor.
 */
function ckb_get_shape_label( $shape ) {
	$labels = array(
		'rectangular'      => __( 'مستطیلی استاندارد', 'chekadbam' ),
		'l_shaped'         => __( 'L شکل (دو زون)', 'chekadbam' ),
		'u_shaped'         => __( 'U شکل (حیاط میانی)', 'chekadbam' ),
		'central_shaft'    => __( 'با باکس پله / آسانسور مرکزی', 'chekadbam' ),
		'narrow_balcony'   => __( 'تراس طولی کشیده', 'chekadbam' ),
		'penthouse_split'  => __( 'پنت‌هاوس دوبالکه', 'chekadbam' ),
	);
	return isset( $labels[ $shape ] ) ? $labels[ $shape ] : $shape;
}

/** Products list for the plan-items repeater select (with data attributes). */
function ckb_get_products_for_select() {
	$out  = array();
	$post = get_posts(
		array(
			'post_type'   => 'ckb_product',
			'post_status' => 'publish',
			'numberposts' => -1,
			'orderby'     => 'title',
			'order'       => 'ASC',
		)
	);
	foreach ( $post as $p ) {
		$out[] = array(
			'id'    => $p->ID,
			'title' => $p->post_title,
			'code'  => get_post_meta( $p->ID, '_ckb_code', true ),
			'w'     => (float) get_post_meta( $p->ID, '_ckb_width', true ),
			'd'     => (float) get_post_meta( $p->ID, '_ckb_depth', true ),
			'h'     => (float) get_post_meta( $p->ID, '_ckb_height', true ),
			'shape' => get_post_meta( $p->ID, '_ckb_shape_type', true ),
		);
	}
	return $out;
}
