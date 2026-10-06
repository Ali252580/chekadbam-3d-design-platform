<?php
/**
 * REST API — Next.js-compatible payloads.
 * Namespace: chekadbam/v1
 *
 * The WordPress plugin and the Next.js studio (src/) now speak the exact same
 * data language so both front-ends can consume this single source of truth:
 *
 *  GET  /products → ChekadbamProduct[]-shaped payload (products-data.ts)
 *  GET  /plans    → SpaceConfig + StudioItem[]-shaped presets (studio-types.ts)
 *  POST /designs  → accepts the Next.js designs-table body (db/schema.ts) AND
 *                   the legacy studio form body (backwards compatible)
 *  GET  /designs  → designs-table-shaped rows (db/schema.ts)
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'rest_api_init', 'ckb_register_rest' );
function ckb_register_rest() {

	register_rest_route(
		'chekadbam/v1',
		'/products',
		array(
			'methods'             => 'GET',
			'permission_callback' => '__return_true',
			'callback'            => 'ckb_rest_get_products',
		)
	);

	register_rest_route(
		'chekadbam/v1',
		'/plans',
		array(
			'methods'             => 'GET',
			'permission_callback' => '__return_true',
			'callback'            => 'ckb_rest_get_plans',
		)
	);

	register_rest_route(
		'chekadbam/v1',
		'/designs',
		array(
			array(
				'methods'             => 'POST',
				'permission_callback' => '__return_true',
				'callback'            => 'ckb_rest_post_design',
			),
			array(
				'methods'             => 'GET',
				'permission_callback' => function () {
					return current_user_can( 'manage_options' );
				},
				'callback'            => 'ckb_rest_get_designs',
			),
		)
	);
}

/* ============================ Shared option lists (mirror products-data.ts) ============================ */

/** WPC color options — same ids/names as WPC_COLORS in products-data.ts. */
function ckb_rest_wpc_colors() {
	return array(
		array( 'id' => 'walnut',   'name' => 'گردویی شکلاتی (Dark Walnut)',  'colorHex' => '#4a321f' ),
		array( 'id' => 'teak',     'name' => 'تیک طبیعی / شنی (Natural Teak)', 'colorHex' => '#9b683e' ),
		array( 'id' => 'charcoal', 'name' => 'دودی ذغالی (Charcoal Ash)',    'colorHex' => '#2b2a29' ),
		array( 'id' => 'oak',      'name' => 'بلوطی روشن (Light Oak)',       'colorHex' => '#c59d6f' ),
	);
}

/** Metal color options — same ids/names as METAL_COLORS in products-data.ts. */
function ckb_rest_metal_colors() {
	return array(
		array( 'id' => 'black',    'name' => 'مشکی مات الکترواستاتیک',  'colorHex' => '#1a1a1a' ),
		array( 'id' => 'charcoal', 'name' => 'طوسی متالیک تیره',       'colorHex' => '#374151' ),
		array( 'id' => 'cream',    'name' => 'کرم شنی استخوانی',       'colorHex' => '#d6cebe' ),
	);
}

/** Category id → Persian label (same labels as ckb_product_categories()). */
function ckb_rest_category_name( $cat ) {
	$map = ckb_product_categories();
	return isset( $map[ $cat ] ) ? $map[ $cat ] : (string) $cat;
}

/** deadLoadRating from weight (heuristic mirroring the Next.js catalog). */
function ckb_rest_dead_load_rating( $weight_kg ) {
	if ( $weight_kg >= 150 ) {
		return 'heavy';
	}
	if ( $weight_kg >= 60 ) {
		return 'medium';
	}
	return 'light';
}

/** Persian digit dimension string, e.g. "۱۶۰ × ۵۰ × ۵۵ سانتی‌متر". */
function ckb_rest_unit_string( $w, $d, $h ) {
	$fa = array( '۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹' );
	$fmt = function ( $m ) use ( $fa ) {
		$cm = (string) round( $m * 100 );
		return strtr( $cm, array_combine( array( '0', '1', '2', '3', '4', '5', '6', '7', '8', '9' ), $fa ) );
	};
	return $fmt( $w ) . ' × ' . $fmt( $d ) . ' × ' . $fmt( $h ) . ' سانتی‌متر';
}

/* ============================ GET /products ============================ */

/**
 * Returns products shaped like ChekadbamProduct from products-data.ts so the
 * Next.js studio can consume the WordPress catalog unchanged.
 */
function ckb_rest_get_products() {
	$posts = get_posts(
		array(
			'post_type'   => 'ckb_product',
			'post_status' => 'publish',
			'numberposts' => -1,
			'orderby'     => 'title',
			'order'       => 'ASC',
		)
	);

	$out = array();
	foreach ( $posts as $p ) {
		$w = (float) get_post_meta( $p->ID, '_ckb_width', true );
		$d = (float) get_post_meta( $p->ID, '_ckb_depth', true );
		$h = (float) get_post_meta( $p->ID, '_ckb_height', true );
		$weight = (float) get_post_meta( $p->ID, '_ckb_weight', true );
		$cat    = get_post_meta( $p->ID, '_ckb_category', true ) ?: 'planting';
		$wpc_id = get_post_meta( $p->ID, '_ckb_wpc_color', true ) ?: 'walnut';
		$metal_id = get_post_meta( $p->ID, '_ckb_metal_color', true ) ?: 'black';

		// Resolve hex for the selected colors
		$wpc_hex = '#4a321f';
		foreach ( ckb_rest_wpc_colors() as $c ) {
			if ( $c['id'] === $wpc_id ) { $wpc_hex = $c['colorHex']; break; }
		}
		$metal_hex = '#1a1a1a';
		foreach ( ckb_rest_metal_colors() as $c ) {
			if ( $c['id'] === $metal_id ) { $metal_hex = $c['colorHex']; break; }
		}

		$thumb = get_the_post_thumbnail_url( $p->ID, 'large' );

		$out[] = array(
			// string id like the Next.js catalog (falls back to wp id)
			'id'           => get_post_meta( $p->ID, '_ckb_code', true ) ?: ( 'wp-' . $p->ID ),
			'wpId'         => $p->ID,
			'code'         => get_post_meta( $p->ID, '_ckb_code', true ),
			'name'         => $p->post_title,
			'category'     => $cat,
			'categoryName' => ckb_rest_category_name( $cat ),
			'shortDesc'    => (string) $p->post_excerpt,
			'fullDesc'     => (string) $p->post_content,
			'dimensions'   => array(
				'width'      => $w,
				'depth'      => $d,
				'height'     => $h,
				'unitString' => ckb_rest_unit_string( $w, $d, $h ),
			),
			'weightKg'       => $weight,
			'deadLoadRating' => ckb_rest_dead_load_rating( $weight ),
			'priceEstToman'  => (int) get_post_meta( $p->ID, '_ckb_price', true ),
			'materials'      => array(
				'wpcColors'   => ckb_rest_wpc_colors(),
				'metalColors' => ckb_rest_metal_colors(),
			),
			'model3D'        => array(
				'shapeType'     => get_post_meta( $p->ID, '_ckb_shape_type', true ) ?: 'box',
				'primaryColor'  => $wpc_hex,
				'secondaryColor' => $metal_hex,
				'hasLighting'   => '1' === get_post_meta( $p->ID, '_ckb_has_lighting', true ),
			),
			'features'       => array(),
			'specs'          => new stdClass(),
			'image'          => $thumb ? $thumb : '',
			'gallery'        => $thumb ? array( $thumb ) : array(),
			'cadAvailable'   => true,
			'isPopular'      => false,
			// Flat fields consumed by the WordPress studio JS (unchanged contract)
			'w'              => $w,
			'd'              => $d,
			'h'              => $h,
			'weight'         => $weight,
			'price'          => (int) get_post_meta( $p->ID, '_ckb_price', true ),
			'shape'          => get_post_meta( $p->ID, '_ckb_shape_type', true ) ?: 'box',
			'wpcColor'       => $wpc_id,
			'metalColor'     => $metal_id,
			'light'          => '1' === get_post_meta( $p->ID, '_ckb_has_lighting', true ),
		);
	}
	return rest_ensure_response( array( 'success' => true, 'products' => $out ) );
}

/* ============================ GET /plans ============================ */

/**
 * Returns plans shaped like PresetDesign.spaceConfig + StudioItem[] from
 * studio-types.ts so the Next.js studio can load WordPress plans unchanged.
 */
function ckb_rest_get_plans() {
	$posts = get_posts(
		array(
			'post_type'   => 'ckb_plan',
			'post_status' => 'publish',
			'numberposts' => -1,
			'orderby'     => 'date',
			'order'       => 'ASC',
		)
	);

	$space_types = array(
		'residential_roof' => 'پشت‌بام مسکونی پنت‌هاوس',
		'terrace'          => 'تراس یا بالکن',
		'courtyard'        => 'حیاط مرکزی',
		'villa_roof'       => 'بام ویلا',
		'cafe_restaurant'  => 'کافه یا رستوران',
		'office'           => 'تراس اداری',
		'healthcare'       => 'فضای درمانی',
		'commercial'       => 'فضای تجاری',
	);

	$out = array();
	foreach ( $posts as $p ) {
		$shape = get_post_meta( $p->ID, '_ckb_plan_shape', true ) ?: 'rectangular';
		$w     = (float) get_post_meta( $p->ID, '_ckb_plan_width', true ) ?: 10;
		$l     = (float) get_post_meta( $p->ID, '_ckb_plan_length', true ) ?: 8;
		$cw    = (float) get_post_meta( $p->ID, '_ckb_cutout_width', true );
		$cl    = (float) get_post_meta( $p->ID, '_ckb_cutout_length', true );
		$sw    = (float) get_post_meta( $p->ID, '_ckb_shaft_width', true );
		$sl    = (float) get_post_meta( $p->ID, '_ckb_shaft_length', true );

		$area = $w * $l;
		if ( 'l_shaped' === $shape || 'u_shaped' === $shape ) {
			$area -= $cw * $cl;
		}
		if ( 'central_shaft' === $shape ) {
			$area -= $sw * $sl;
		}
		$area = max( 4, round( $area, 1 ) );

		$raw_items = json_decode( (string) get_post_meta( $p->ID, '_ckb_plan_items', true ), true );
		$raw_items = is_array( $raw_items ) ? $raw_items : array();

		// Normalize plan items to StudioItem shape (studio-types.ts)
		$items = array();
		foreach ( $raw_items as $it ) {
			$items[] = array(
				'id'         => isset( $it['id'] ) ? $it['id'] : ( 'wp-item-' . wp_rand( 100000, 999999 ) ),
				'productId'  => isset( $it['productId'] ) ? $it['productId'] : '',
				'name'       => isset( $it['name'] ) ? $it['name'] : '',
				'category'   => isset( $it['category'] ) ? $it['category'] : 'planting',
				'x'          => isset( $it['x'] ) ? (float) $it['x'] : 0,
				'z'          => isset( $it['z'] ) ? (float) $it['z'] : 0,
				'y'          => isset( $it['y'] ) ? (float) $it['y'] : 0,
				'rotation'   => isset( $it['rotation'] ) ? (float) $it['rotation'] : 0,
				'width'      => isset( $it['width'] ) ? (float) $it['width'] : ( isset( $it['w'] ) ? (float) $it['w'] : 1 ),
				'depth'      => isset( $it['depth'] ) ? (float) $it['depth'] : ( isset( $it['d'] ) ? (float) $it['d'] : 0.5 ),
				'height'     => isset( $it['height'] ) ? (float) $it['height'] : ( isset( $it['h'] ) ? (float) $it['h'] : 0.5 ),
				'shapeType'  => isset( $it['shapeType'] ) ? $it['shapeType'] : 'box',
				'priceEst'   => isset( $it['priceEst'] ) ? (int) $it['priceEst'] : 0,
				'weightKg'   => isset( $it['weightKg'] ) ? (float) $it['weightKg'] : 0,
				'wpcColor'   => isset( $it['wpcColor'] ) ? $it['wpcColor'] : 'walnut',
				'metalColor' => isset( $it['metalColor'] ) ? $it['metalColor'] : 'black',
				'hasLighting'=> ! empty( $it['hasLighting'] ),
			);
		}

		$space_type = get_post_meta( $p->ID, '_ckb_space_type', true );
		if ( ! $space_type || ! isset( $space_types[ $space_type ] ) ) {
			$space_type = 'residential_roof';
		}

		$out[] = array(
			'id'      => $p->ID,
			'name'    => $p->post_title,
			// SpaceConfig-shaped block (studio-types.ts)
			'spaceConfig' => array(
				'spaceType'     => $space_type,
				'spaceTypeName' => $space_types[ $space_type ],
				'shape'         => $shape,
				'shapeName'     => ckb_get_shape_label( $shape ),
				'width'         => $w,
				'length'        => $l,
				'parapetHeight' => (float) get_post_meta( $p->ID, '_ckb_parapet', true ) ?: 1.1,
				'city'          => get_post_meta( $p->ID, '_ckb_city', true ) ?: 'تهران',
				'flooringType'  => get_post_meta( $p->ID, '_ckb_flooring', true ) ?: 'wpc_wood',
				'wpcColor'      => get_post_meta( $p->ID, '_ckb_wpc_color', true ) ?: 'walnut',
				'metalColor'    => get_post_meta( $p->ID, '_ckb_metal_color', true ) ?: 'black',
				'cutoutWidth'   => $cw,
				'cutoutLength'  => $cl,
				'shaftWidth'    => $sw,
				'shaftLength'   => $sl,
			),
			// Legacy flat fields consumed by the WordPress studio JS (unchanged contract)
			'shape'         => $shape,
			'shapeName'     => ckb_get_shape_label( $shape ),
			'width'         => $w,
			'length'        => $l,
			'areaM2'        => $area,
			'area'          => $area,
			'parapetHeight' => (float) get_post_meta( $p->ID, '_ckb_parapet', true ) ?: 1.1,
			'parapet'       => (float) get_post_meta( $p->ID, '_ckb_parapet', true ) ?: 1.1,
			'cutoutWidth'   => $cw,
			'cutoutLength'  => $cl,
			'shaftWidth'    => $sw,
			'shaftLength'   => $sl,
			'flooring'      => get_post_meta( $p->ID, '_ckb_flooring', true ) ?: 'wpc_wood',
			'flooringType'  => get_post_meta( $p->ID, '_ckb_flooring', true ) ?: 'wpc_wood',
			'wpcColor'      => get_post_meta( $p->ID, '_ckb_wpc_color', true ) ?: 'walnut',
			'metalColor'    => get_post_meta( $p->ID, '_ckb_metal_color', true ) ?: 'black',
			'items'         => $items,
		);
	}
	return rest_ensure_response( array( 'success' => true, 'plans' => $out ) );
}

/* ============================ POST /designs ============================ */

/**
 * Accepts BOTH request bodies:
 *
 * A) Next.js studio body (db/schema.ts / SaveConsultationModal.tsx):
 *    { title, userName, userPhone, userEmail, city, spaceType, width, length,
 *      parapetHeight, flooringType, wpcColor, metalColor, layoutData: StudioItem[],
 *      totalArea, greenArea, flooringArea, itemsCount, estimatedWeightKg,
 *      estimatedPriceMin, estimatedPriceMax, notes, snapshotUrl }
 *
 * B) Legacy studio/AJAX body:
 *    { name, phone, email, city, shape, width, length, area, items, snapshot, message }
 */
function ckb_rest_post_design( WP_REST_Request $req ) {
	$params = $req->get_json_params();
	if ( ! is_array( $params ) ) {
		$params = $req->get_body_params();
	}

	// A) Next.js names first, then legacy fallbacks
	$name  = sanitize_text_field( $params['userName'] ?? ( $params['name'] ?? '' ) );
	$phone = sanitize_text_field( $params['userPhone'] ?? ( $params['phone'] ?? '' ) );

	if ( '' === $name || '' === $phone ) {
		return new WP_Error( 'ckb_missing_fields', __( 'نام و شماره تماس الزامی است.', 'chekadbam' ), array( 'status' => 400 ) );
	}

	$width  = floatval( $params['width'] ?? 0 );
	$length = floatval( $params['length'] ?? 0 );

	// Layout data: Next.js sends StudioItem[] as layoutData; legacy sends items
	$items = $params['layoutData'] ?? ( $params['items'] ?? array() );
	if ( is_string( $items ) ) {
		$items = json_decode( $items, true );
	}
	if ( ! is_array( $items ) ) {
		$items = array();
	}

	// Area: prefer explicit totalArea, then legacy area, else compute minus cutouts
	$shape = sanitize_key( $params['shape'] ?? 'rectangular' );
	if ( isset( $params['spaceConfig']['shape'] ) ) {
		$shape = sanitize_key( $params['spaceConfig']['shape'] );
	}
	$area = 0;
	if ( isset( $params['totalArea'] ) ) {
		$area = floatval( $params['totalArea'] );
	} elseif ( isset( $params['area'] ) ) {
		$area = floatval( $params['area'] );
	}
	if ( $area <= 0 ) {
		$area = $width * $length;
		$cw = floatval( $params['cutoutWidth'] ?? 0 );
		$cl = floatval( $params['cutoutLength'] ?? 0 );
		$sw = floatval( $params['shaftWidth'] ?? 0 );
		$sl = floatval( $params['shaftLength'] ?? 0 );
		if ( 'l_shaped' === $shape || 'u_shaped' === $shape ) { $area -= $cw * $cl; }
		if ( 'central_shaft' === $shape ) { $area -= $sw * $sl; }
	}
	$area = max( 4, round( $area, 1 ) );

	// Plan config: Next.js may nest spaceConfig; flatten for storage
	$space = isset( $params['spaceConfig'] ) && is_array( $params['spaceConfig'] ) ? $params['spaceConfig'] : $params;

	$title = sanitize_text_field( $params['title'] ?? '' );
	if ( '' === $title ) {
		$title = sprintf(
			/* translators: 1: customer name 2: date */
			__( 'طرح %1$s — %2$s', 'chekadbam' ),
			$name,
			wp_date( 'Y/m/d' )
		);
	}

	$post_id = wp_insert_post(
		array(
			'post_type'   => 'ckb_design',
			'post_status' => 'publish',
			'post_title'  => $title,
		)
	);

	if ( is_wp_error( $post_id ) ) {
		return $post_id;
	}

	update_post_meta( $post_id, '_ckb_customer_name', $name );
	update_post_meta( $post_id, '_ckb_customer_phone', $phone );
	update_post_meta( $post_id, '_ckb_customer_email', sanitize_email( $params['userEmail'] ?? ( $params['email'] ?? '' ) ) );
	update_post_meta( $post_id, '_ckb_city', sanitize_text_field( $params['city'] ?? 'تهران' ) );
	update_post_meta( $post_id, '_ckb_space_type', sanitize_text_field( $space['spaceType'] ?? ( $params['spaceType'] ?? 'residential_roof' ) ) );
	update_post_meta( $post_id, '_ckb_shape', $shape );
	update_post_meta( $post_id, '_ckb_width', $width );
	update_post_meta( $post_id, '_ckb_length', $length );
	update_post_meta( $post_id, '_ckb_parapet', floatval( $space['parapetHeight'] ?? 1.1 ) );
	update_post_meta( $post_id, '_ckb_flooring', sanitize_key( $space['flooringType'] ?? 'wpc_wood' ) );
	update_post_meta( $post_id, '_ckb_wpc_color', sanitize_key( $space['wpcColor'] ?? 'walnut' ) );
	update_post_meta( $post_id, '_ckb_metal_color', sanitize_key( $space['metalColor'] ?? 'black' ) );
	update_post_meta( $post_id, '_ckb_area', $area );
	update_post_meta( $post_id, '_ckb_green_area', floatval( $params['greenArea'] ?? 0 ) );
	update_post_meta( $post_id, '_ckb_flooring_area', floatval( $params['flooringArea'] ?? 0 ) );
	update_post_meta( $post_id, '_ckb_items_count', isset( $params['itemsCount'] ) ? (int) $params['itemsCount'] : count( $items ) );
	update_post_meta( $post_id, '_ckb_items_json', wp_json_encode( $items ) );

	// BOM (from Next.js or computed client-side by the WP studio)
	$bom = null;
	if ( isset( $params['bom'] ) && is_array( $params['bom'] ) ) {
		$bom = $params['bom'];
	} elseif ( isset( $params['estimatedWeightKg'] ) || isset( $params['estimatedPriceMin'] ) ) {
		$bom = array(
			'totalWeightKg'      => floatval( $params['estimatedWeightKg'] ?? 0 ),
			'estimatedPriceMin'  => (int) ( $params['estimatedPriceMin'] ?? 0 ),
			'estimatedPriceMax'  => (int) ( $params['estimatedPriceMax'] ?? 0 ),
		);
	}
	if ( $bom ) {
		update_post_meta( $post_id, '_ckb_bom_json', wp_json_encode( $bom ) );
	}

	// Snapshot: Next.js sends a URL or a data URL; both are stored safely
	$snapshot = $params['snapshotUrl'] ?? ( $params['snapshot'] ?? '' );
	if ( $snapshot && is_string( $snapshot ) && 0 === strpos( $snapshot, 'data:image/' ) ) {
		$saved = ckb_save_design_snapshot( $snapshot, $post_id );
		$snapshot = $saved ? $saved : '';
	} else {
		$snapshot = esc_url_raw( (string) $snapshot );
	}
	update_post_meta( $post_id, '_ckb_snapshot', $snapshot );
	update_post_meta( $post_id, '_ckb_message', sanitize_textarea_field( $params['notes'] ?? ( $params['message'] ?? '' ) ) );
	update_post_meta( $post_id, '_ckb_status', __( 'درخواست ثبت‌شده', 'chekadbam' ) );

	/**
	 * Fires after a design is created via REST or the front shortcode.
	 * Used to send the admin notification email.
	 */
	do_action( 'ckb_design_created', $post_id );

	return rest_ensure_response(
		array(
			'success' => true,
			// Next.js expects { design: { id } }; legacy expects flat id — provide both
			'design'  => array( 'id' => $post_id ),
			'id'      => $post_id,
			'editUrl' => get_edit_post_link( $post_id, 'raw' ),
		)
	);
}

/* ============================ GET /designs (admin) ============================ */

/**
 * Returns designs shaped like rows of the Next.js designs table (db/schema.ts).
 */
function ckb_rest_get_designs() {
	$posts = get_posts(
		array(
			'post_type'   => 'ckb_design',
			'post_status' => 'any',
			'numberposts' => 200,
			'orderby'     => 'date',
			'order'       => 'DESC',
		)
	);

	$out = array();
	foreach ( $posts as $p ) {
		$bom = json_decode( (string) get_post_meta( $p->ID, '_ckb_bom_json', true ), true );
		$out[] = array(
			'id'      => $p->ID,
			'title'   => $p->post_title,
			// Next.js field names
			'userName'            => get_post_meta( $p->ID, '_ckb_customer_name', true ),
			'userPhone'           => get_post_meta( $p->ID, '_ckb_customer_phone', true ),
			'userEmail'           => get_post_meta( $p->ID, '_ckb_customer_email', true ),
			'city'                => get_post_meta( $p->ID, '_ckb_city', true ),
			'spaceType'           => get_post_meta( $p->ID, '_ckb_space_type', true ),
			'width'               => (float) get_post_meta( $p->ID, '_ckb_width', true ),
			'length'              => (float) get_post_meta( $p->ID, '_ckb_length', true ),
			'parapetHeight'       => (float) get_post_meta( $p->ID, '_ckb_parapet', true ),
			'flooringType'        => get_post_meta( $p->ID, '_ckb_flooring', true ),
			'wpcColor'            => get_post_meta( $p->ID, '_ckb_wpc_color', true ),
			'metalColor'          => get_post_meta( $p->ID, '_ckb_metal_color', true ),
			'layoutData'          => json_decode( (string) get_post_meta( $p->ID, '_ckb_items_json', true ), true ),
			'totalArea'           => (float) get_post_meta( $p->ID, '_ckb_area', true ),
			'greenArea'           => (float) get_post_meta( $p->ID, '_ckb_green_area', true ),
			'flooringArea'        => (float) get_post_meta( $p->ID, '_ckb_flooring_area', true ),
			'itemsCount'          => (int) get_post_meta( $p->ID, '_ckb_items_count', true ),
			'estimatedWeightKg'   => is_array( $bom ) && isset( $bom['totalWeightKg'] ) ? (float) $bom['totalWeightKg'] : 0,
			'estimatedPriceMin'   => is_array( $bom ) && isset( $bom['estimatedPriceMin'] ) ? (int) $bom['estimatedPriceMin'] : 0,
			'estimatedPriceMax'   => is_array( $bom ) && isset( $bom['estimatedPriceMax'] ) ? (int) $bom['estimatedPriceMax'] : 0,
			'notes'               => get_post_meta( $p->ID, '_ckb_message', true ),
			'expertNotes'         => get_post_meta( $p->ID, '_ckb_expert_notes', true ),
			'status'              => get_post_meta( $p->ID, '_ckb_status', true ),
			'snapshotUrl'         => get_post_meta( $p->ID, '_ckb_snapshot', true ),
			'createdAt'           => get_the_date( 'c', $p ),
			// Legacy field names (kept for the existing CRM/admin tooling)
			'name'     => get_post_meta( $p->ID, '_ckb_customer_name', true ),
			'phone'    => get_post_meta( $p->ID, '_ckb_customer_phone', true ),
			'shape'    => get_post_meta( $p->ID, '_ckb_shape', true ),
			'area'     => (float) get_post_meta( $p->ID, '_ckb_area', true ),
			'items'    => json_decode( (string) get_post_meta( $p->ID, '_ckb_items_json', true ), true ),
			'snapshot' => get_post_meta( $p->ID, '_ckb_snapshot', true ),
			'date'     => get_the_date( 'Y-m-d H:i', $p ),
		);
	}
	return rest_ensure_response( array( 'success' => true, 'designs' => $out ) );
}
