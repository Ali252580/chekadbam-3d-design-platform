<?php
/**
 * Custom admin list-table columns + filters for products, plans, designs.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/* ------------------------------ Products ------------------------------ */

add_filter( 'manage_ckb_product_posts_columns', 'ckb_product_columns' );
function ckb_product_columns( $cols ) {
	return array(
		'cb'            => $cols['cb'],
		'title'         => __( 'نام قلم', 'chekadbam' ),
		'ckb_code'      => __( 'کد فنی', 'chekadbam' ),
		'ckb_category'  => __( 'دسته', 'chekadbam' ),
		'ckb_dims'      => __( 'ابعاد (m)', 'chekadbam' ),
		'ckb_weight'    => __( 'وزن (kg)', 'chekadbam' ),
		'ckb_price'     => __( 'قیمت (تومان)', 'chekadbam' ),
		'ckb_shape'     => __( 'شکل ۳D', 'chekadbam' ),
	);
}

add_action( 'manage_ckb_product_posts_custom_column', 'ckb_product_column_content', 10, 2 );
function ckb_product_column_content( $col, $post_id ) {
	switch ( $col ) {
		case 'ckb_code':
			echo '<code>' . esc_html( get_post_meta( $post_id, '_ckb_code', true ) ) . '</code>';
			break;
		case 'ckb_category':
			$cat = get_post_meta( $post_id, '_ckb_category', true );
			$map = ckb_product_categories();
			echo esc_html( $map[ $cat ] ?? $cat );
			break;
		case 'ckb_dims':
			$w = get_post_meta( $post_id, '_ckb_width', true );
			$d = get_post_meta( $post_id, '_ckb_depth', true );
			$h = get_post_meta( $post_id, '_ckb_height', true );
			echo '<span dir="ltr">' . esc_html( "{$w} × {$d} × {$h}" ) . '</span>';
			break;
		case 'ckb_weight':
			echo esc_html( get_post_meta( $post_id, '_ckb_weight', true ) );
			break;
		case 'ckb_price':
			echo esc_html( number_format_i18n( (int) get_post_meta( $post_id, '_ckb_price', true ) ) );
			break;
		case 'ckb_shape':
			$shape = get_post_meta( $post_id, '_ckb_shape_type', true );
			$map   = ckb_shape_types();
			echo esc_html( $map[ $shape ] ?? $shape );
			break;
	}
}

/* ------------------------------ Plans ------------------------------ */

add_filter( 'manage_ckb_plan_posts_columns', 'ckb_plan_columns' );
function ckb_plan_columns( $cols ) {
	return array(
		'cb'         => $cols['cb'],
		'title'      => __( 'نام پلان', 'chekadbam' ),
		'ckb_shape'  => __( 'فرم پلان', 'chekadbam' ),
		'ckb_size'   => __( 'ابعاد (m)', 'chekadbam' ),
		'ckb_area'   => __( 'متراژ خالص', 'chekadbam' ),
		'ckb_items'  => __( 'تعداد اقلام', 'chekadbam' ),
	);
}

add_action( 'manage_ckb_plan_posts_custom_column', 'ckb_plan_column_content', 10, 2 );
function ckb_plan_column_content( $col, $post_id ) {
	switch ( $col ) {
		case 'ckb_shape':
			$shape = get_post_meta( $post_id, '_ckb_plan_shape', true );
			$map   = ckb_plan_shapes();
			echo esc_html( $map[ $shape ] ?? $shape );
			break;
		case 'ckb_size':
			$w = get_post_meta( $post_id, '_ckb_plan_width', true );
			$l = get_post_meta( $post_id, '_ckb_plan_length', true );
			echo '<span dir="ltr">' . esc_html( "{$w} × {$l}" ) . '</span>';
			break;
		case 'ckb_area':
			$w  = (float) get_post_meta( $post_id, '_ckb_plan_width', true );
			$l  = (float) get_post_meta( $post_id, '_ckb_plan_length', true );
			$cw = (float) get_post_meta( $post_id, '_ckb_cutout_width', true );
			$cl = (float) get_post_meta( $post_id, '_ckb_cutout_length', true );
			$sw = (float) get_post_meta( $post_id, '_ckb_shaft_width', true );
			$sl = (float) get_post_meta( $post_id, '_ckb_shaft_length', true );
			$shape = get_post_meta( $post_id, '_ckb_plan_shape', true );
			$area  = $w * $l;
			if ( 'l_shaped' === $shape || 'u_shaped' === $shape ) {
				$area -= $cw * $cl;
			}
			if ( 'central_shaft' === $shape ) {
				$area -= $sw * $sl;
			}
			echo '<strong>' . esc_html( round( $area, 1 ) ) . ' m²</strong>';
			break;
		case 'ckb_items':
			$items = json_decode( (string) get_post_meta( $post_id, '_ckb_plan_items', true ), true );
			echo esc_html( is_array( $items ) ? count( $items ) : 0 );
			break;
	}
}

/* ------------------------------ Designs ------------------------------ */

add_filter( 'manage_ckb_design_posts_columns', 'ckb_design_columns' );
function ckb_design_columns( $cols ) {
	return array(
		'cb'           => $cols['cb'],
		'ckb_thumb'    => __( 'تصویر', 'chekadbam' ),
		'title'        => __( 'طرح', 'chekadbam' ),
		'ckb_customer' => __( 'مشتری', 'chekadbam' ),
		'ckb_contact'  => __( 'تماس', 'chekadbam' ),
		'ckb_city'     => __( 'شهر', 'chekadbam' ),
		'ckb_area'     => __( 'متراژ', 'chekadbam' ),
		'ckb_status'   => __( 'وضعیت', 'chekadbam' ),
		'date'         => __( 'تاریخ', 'chekadbam' ),
	);
}

add_action( 'manage_ckb_design_posts_custom_column', 'ckb_design_column_content', 10, 2 );
function ckb_design_column_content( $col, $post_id ) {
	switch ( $col ) {
		case 'ckb_thumb':
			$snapshot = get_post_meta( $post_id, '_ckb_snapshot', true );
			if ( $snapshot ) {
				printf(
					'<a href="%1$s" target="_blank"><img src="%2$s" alt="" style="width:64px;height:44px;object-fit:cover;border-radius:6px;border:1px solid #dcdcde;" /></a>',
					esc_url( $snapshot ),
					esc_url( $snapshot )
				);
			} else {
				echo '<span style="color:#a7aaad">—</span>';
			}
			break;
		case 'ckb_customer':
			echo esc_html( get_post_meta( $post_id, '_ckb_customer_name', true ) );
			break;
		case 'ckb_contact':
			$phone = get_post_meta( $post_id, '_ckb_customer_phone', true );
			echo '<a dir="ltr" href="tel:' . esc_attr( $phone ) . '">' . esc_html( $phone ) . '</a>';
			break;
		case 'ckb_city':
			echo esc_html( get_post_meta( $post_id, '_ckb_city', true ) );
			break;
		case 'ckb_area':
			echo esc_html( get_post_meta( $post_id, '_ckb_area', true ) ) . ' m²';
			break;
		case 'ckb_status':
			$status = get_post_meta( $post_id, '_ckb_status', true );
			echo '<span class="ckb-badge ckb-badge-' . esc_attr( sanitize_title( $status ) ) . '">' . esc_html( $status ) . '</span>';
			break;
	}
}

/* Status filter dropdown for designs list */
add_action( 'restrict_manage_posts', 'ckb_design_status_filter' );
function ckb_design_status_filter( $post_type ) {
	if ( 'ckb_design' !== $post_type ) {
		return;
	}
	$current = isset( $_GET['ckb_status_filter'] ) ? sanitize_text_field( wp_unslash( $_GET['ckb_status_filter'] ) ) : '';
	echo '<select name="ckb_status_filter" id="ckb_status_filter">';
	echo '<option value="">' . esc_html__( 'همه وضعیت‌ها', 'chekadbam' ) . '</option>';
	foreach ( ckb_design_statuses() as $s ) {
		$val = sanitize_title( $s );
		echo '<option value="' . esc_attr( $val ) . '" ' . selected( $current, $val, false ) . '>' . esc_html( $s ) . '</option>';
	}
	echo '</select>';
}

add_action( 'pre_get_posts', 'ckb_apply_design_status_filter' );
function ckb_apply_design_status_filter( $query ) {
	global $pagenow;
	if ( ! is_admin() || 'edit.php' !== $pagenow || ! $query->is_main_query() ) {
		return;
	}
	if ( 'ckb_design' !== $query->get( 'post_type' ) ) {
		return;
	}
	if ( empty( $_GET['ckb_status_filter'] ) ) {
		return;
	}
	$slug = sanitize_title( wp_unslash( $_GET['ckb_status_filter'] ) );
	foreach ( ckb_design_statuses() as $s ) {
		if ( sanitize_title( $s ) === $slug ) {
			$query->set(
				'meta_query',
				array(
					array(
						'key'   => '_ckb_status',
						'value' => $s,
					),
				)
			);
			return;
		}
	}
}
