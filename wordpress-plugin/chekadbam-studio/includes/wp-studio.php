<?php
/**
 * Chekadbam 3D Studio for WordPress — v2 renderer.
 *
 * Realistic 3D studio matching the Next.js Chekadbam studio:
 *  - 16 detailed modular product models (CKBModels)
 *  - Procedural WPC/fabric/turf textures (CKBTextures)
 *  - Organic foliage engine (CKBFoliage)
 *  - Plan boundary clamping (CKBBoundary)
 *  - BOM with weight & structural safety + toman price range (CKBBom)
 *  - Undo/Redo, smart snapping, keyboard shortcuts
 *  - Plan editor (6 shapes, custom dimensions, colors, flooring)
 *  - JPEG screenshot design submission via AJAX
 *
 * Available in WordPress admin via menu: "استودیوی طراحی ۳D بام"
 * and on the frontend via shortcode: [chekadbam_studio]
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/* ------------------------------ Admin Submenu Page ------------------------------ */

add_action( 'admin_menu', 'ckb_wpstudio_menu', 12 );
function ckb_wpstudio_menu() {
	add_submenu_page(
		CKB_MENU_SLUG,
		__( 'استودیوی طراحی سه‌بعدی بام', 'chekadbam' ),
		__( 'استودیوی طراحی ۳D بام', 'chekadbam' ),
		'manage_options',
		'wp-studio',
		'ckb_render_wpstudio_admin_page'
	);
}

function ckb_render_wpstudio_admin_page() {
	echo '<div class="wrap ckb-wrap" dir="rtl" style="margin:0;padding:0;">';
	echo ckb_get_wpstudio_html( true ); // phpcs:ignore WordPress.Security.EscapeOutput
	echo '</div>';
}

/* ------------------------------ Frontend Shortcode [chekadbam_studio] ------------------------------ */

add_shortcode( 'chekadbam_studio', 'ckb_render_wpstudio_shortcode_v2' );
function ckb_render_wpstudio_shortcode_v2( $atts ) {
	$atts = shortcode_atts(
		array(
			'height'    => '88vh',
			'fullscreen' => '1',
		),
		$atts,
		'chekadbam_studio'
	);
	return ckb_get_wpstudio_html( false, $atts['height'], '1' === $atts['fullscreen'] );
}

/* ------------------------------ Data preparation ------------------------------ */

/**
 * Products for the studio JS (from DB with fallback seed data).
 */
function ckb_get_studio_products() {
	$products = array();
	$posts    = get_posts(
		array(
			'post_type'   => 'ckb_product',
			'post_status' => 'publish',
			'numberposts' => -1,
			'orderby'     => 'title',
			'order'       => 'ASC',
		)
	);

	foreach ( $posts as $p ) {
		$products[] = array(
			'id'         => $p->ID,
			'code'       => get_post_meta( $p->ID, '_ckb_code', true ) ?: ( 'CK-' . $p->ID ),
			'name'       => ckb_repair_fa_text( $p->post_title ),
			'category'   => get_post_meta( $p->ID, '_ckb_category', true ) ?: 'planting',
			'w'          => (float) get_post_meta( $p->ID, '_ckb_width', true ) ?: 1.2,
			'd'          => (float) get_post_meta( $p->ID, '_ckb_depth', true ) ?: 0.5,
			'h'          => (float) get_post_meta( $p->ID, '_ckb_height', true ) ?: 0.5,
			'weight'     => (float) get_post_meta( $p->ID, '_ckb_weight', true ) ?: 40,
			'price'      => (int) get_post_meta( $p->ID, '_ckb_price', true ) ?: 5000000,
			'shape'      => get_post_meta( $p->ID, '_ckb_shape_type', true ) ?: 'box',
			'glbUrl'     => esc_url_raw( get_post_meta( $p->ID, '_ckb_glb_url', true ) ),
			'wpcColor'   => get_post_meta( $p->ID, '_ckb_wpc_color', true ) ?: 'walnut',
			'metalColor' => get_post_meta( $p->ID, '_ckb_metal_color', true ) ?: 'black',
			'light'      => '1' === get_post_meta( $p->ID, '_ckb_has_lighting', true ),
		);
	}

	if ( empty( $products ) ) {
		return ckb_default_studio_products();
	}
	return $products;
}

/** Fallback product catalog (matches seed.php). */
function ckb_default_studio_products() {
	return array(
		array( 'code' => 'CK-FB-160', 'name' => 'فلاورباکس مدولار ۱۶۰ سانتی‌متری عریض', 'category' => 'planting', 'w' => 1.6, 'd' => 0.5, 'h' => 0.55, 'weight' => 58, 'price' => 7900000, 'shape' => 'box', 'wpcColor' => 'walnut', 'metalColor' => 'black', 'light' => false ),
		array( 'code' => 'CK-FB-120', 'name' => 'فلاورباکس مدولار ۱۲۰ سانتی‌متری', 'category' => 'planting', 'w' => 1.2, 'd' => 0.45, 'h' => 0.5, 'weight' => 42, 'price' => 6100000, 'shape' => 'box', 'wpcColor' => 'walnut', 'metalColor' => 'black', 'light' => true ),
		array( 'code' => 'CK-BN-BR140', 'name' => 'نیمکت پشتی‌دار اسلت چوب‌پلاست', 'category' => 'furniture', 'w' => 1.4, 'd' => 0.62, 'h' => 0.88, 'weight' => 38, 'price' => 9800000, 'shape' => 'bench_backrest', 'wpcColor' => 'walnut', 'metalColor' => 'black', 'light' => false ),
		array( 'code' => 'CK-BN-INT', 'name' => 'مجموعه نیمکت متصل به دو فلاورباکس', 'category' => 'furniture', 'w' => 2.2, 'd' => 0.5, 'h' => 0.6, 'weight' => 76, 'price' => 11900000, 'shape' => 'bench_integrated', 'wpcColor' => 'walnut', 'metalColor' => 'black', 'light' => true ),
		array( 'code' => 'CK-LN-SET04', 'name' => 'ست مبل راحتی ۴ نفره با میز', 'category' => 'furniture', 'w' => 2.2, 'd' => 1.5, 'h' => 0.78, 'weight' => 64, 'price' => 26500000, 'shape' => 'lounge_set', 'wpcColor' => 'walnut', 'metalColor' => 'black', 'light' => false ),
		array( 'code' => 'CK-PG-DK320', 'name' => 'پرگولا مدولار با دک کف ۳.۲×۳.۲', 'category' => 'structures', 'w' => 3.2, 'd' => 3.2, 'h' => 2.6, 'weight' => 410, 'price' => 52000000, 'shape' => 'pergola_deck', 'wpcColor' => 'walnut', 'metalColor' => 'black', 'light' => true ),
		array( 'code' => 'CK-GW-FP120', 'name' => 'دیوار سبز مدولار قاب‌دار با تراف', 'category' => 'structures', 'w' => 1.2, 'd' => 0.42, 'h' => 1.8, 'weight' => 68, 'price' => 11200000, 'shape' => 'green_wall_planter', 'wpcColor' => 'walnut', 'metalColor' => 'black', 'light' => true ),
		array( 'code' => 'CK-WF-FRM130', 'name' => 'آبنمای قاب دوبل با حوضچه ریزش آب', 'category' => 'water_fire', 'w' => 1.3, 'd' => 1.1, 'h' => 1.45, 'weight' => 82, 'price' => 22800000, 'shape' => 'water_feature', 'wpcColor' => 'walnut', 'metalColor' => 'black', 'light' => true ),
		array( 'code' => 'CK-FP-SQ110', 'name' => 'میز آتشدان مربعی چوب‌پلاست', 'category' => 'water_fire', 'w' => 1.1, 'd' => 1.1, 'h' => 0.72, 'weight' => 92, 'price' => 21500000, 'shape' => 'firepit_table', 'wpcColor' => 'walnut', 'metalColor' => 'black', 'light' => true ),
		array( 'code' => 'CK-UMB-300', 'name' => 'سایبان چتری پایه‌کنار', 'category' => 'accessories', 'w' => 3.0, 'd' => 3.0, 'h' => 2.65, 'weight' => 85, 'price' => 15400000, 'shape' => 'umbrella', 'wpcColor' => 'walnut', 'metalColor' => 'black', 'light' => false ),
		array( 'code' => 'CK-SW-PG220', 'name' => 'تاب چوبی پرگولادار با فلاورباکس', 'category' => 'furniture', 'w' => 2.0, 'd' => 0.95, 'h' => 2.2, 'weight' => 165, 'price' => 42500000, 'shape' => 'box', 'glbUrl' => CKB_PLUGIN_URL . 'assets/models/swing-pergola-flowerbox.glb', 'wpcColor' => 'walnut', 'metalColor' => 'black', 'light' => true ),
		array( 'code' => 'CK-TR-POT', 'name' => 'درختچه تزیینی در گلدان مدولار', 'category' => 'planting', 'w' => 0.9, 'd' => 0.9, 'h' => 2.4, 'weight' => 55, 'price' => 8600000, 'shape' => 'tree', 'wpcColor' => 'walnut', 'metalColor' => 'black', 'light' => false ),
		array( 'code' => 'CK-BBQ-180', 'name' => 'باربیکیو و کانتر آشپزخانه بیرونی', 'category' => 'accessories', 'w' => 1.8, 'd' => 0.65, 'h' => 1.1, 'weight' => 120, 'price' => 34800000, 'shape' => 'bbq', 'wpcColor' => 'charcoal', 'metalColor' => 'charcoal', 'light' => false ),
	);
}

/**
 * Plans for the studio JS (from DB with fallback seed data).
 */
function ckb_get_studio_plans( $products = array() ) {
	$plans = array();
	$posts = get_posts(
		array(
			'post_type'   => 'ckb_plan',
			'post_status' => 'publish',
			'numberposts' => -1,
			'orderby'     => 'date',
			'order'       => 'ASC',
		)
	);

	foreach ( $posts as $pl ) {
		$items = json_decode( (string) get_post_meta( $pl->ID, '_ckb_plan_items', true ), true );
		if ( is_array( $items ) ) {
			foreach ( $items as $idx => $it ) {
				if ( isset( $it['name'] ) ) {
					$items[ $idx ]['name'] = ckb_repair_fa_text( $it['name'] );
				}
			}
		}
		$shape = get_post_meta( $pl->ID, '_ckb_plan_shape', true ) ?: 'rectangular';

		$plans[] = array(
			'id'            => $pl->ID,
			'name'          => ckb_repair_fa_text( $pl->post_title ),
			'shape'         => $shape,
			'shapeName'     => ckb_get_shape_label( $shape ),
			'width'         => (float) get_post_meta( $pl->ID, '_ckb_plan_width', true ) ?: 10,
			'length'        => (float) get_post_meta( $pl->ID, '_ckb_plan_length', true ) ?: 8,
			'parapetHeight' => (float) get_post_meta( $pl->ID, '_ckb_parapet', true ) ?: 1.1,
			'flooringType'  => get_post_meta( $pl->ID, '_ckb_flooring', true ) ?: 'wpc_wood',
			'wpcColor'      => get_post_meta( $pl->ID, '_ckb_wpc_color', true ) ?: 'walnut',
			'metalColor'    => get_post_meta( $pl->ID, '_ckb_metal_color', true ) ?: 'black',
			'cutoutWidth'   => (float) get_post_meta( $pl->ID, '_ckb_cutout_width', true ),
			'cutoutLength'  => (float) get_post_meta( $pl->ID, '_ckb_cutout_length', true ),
			'shaftWidth'    => (float) get_post_meta( $pl->ID, '_ckb_shaft_width', true ),
			'shaftLength'   => (float) get_post_meta( $pl->ID, '_ckb_shaft_length', true ),
			'items'         => is_array( $items ) ? $items : array(),
		);
	}

	if ( empty( $products ) ) {
		$products = ckb_get_studio_products();
	}
	$geom = ckb_product_geom_map( $products );

	/* v2.16.6 — چیدمان پیش‌فرض: نشیمن و آتشدان داخل پرگولا */
	foreach ( $plans as &$pl ) {
		$pl['items'] = ckb_nest_seating_under_pergola( $pl['items'], $geom );
	}
	unset( $pl );

	// Always guarantee the full set of shipped presets is available
	// (DB rows may hold fewer plans than the presets).
	if ( count( $plans ) < count( ckb_default_studio_plans() ) ) {
		$names = array();
		foreach ( $plans as $pl2 ) {
			$names[] = $pl2['name'];
		}
		foreach ( ckb_default_studio_plans() as $dflt ) {
			if ( ! in_array( $dflt['name'], $names, true ) ) {
				$dflt['items'] = ckb_nest_seating_under_pergola( $dflt['items'], $geom );
				$plans[]       = $dflt;
				$names[]       = $dflt['name'];
			}
		}
	}
	return $plans;
}

/** کد محصول → [شکل, عرض, عمق] تا اقلام پلن‌های دیتابیس (فقط productId) هم قابل تشخیص باشند. */
function ckb_product_geom_map( $products ) {
	$map = array();
	foreach ( (array) $products as $p ) {
		if ( ! isset( $p['code'] ) || '' === $p['code'] ) {
			continue;
		}
		$map[ $p['code'] ] = array(
			isset( $p['shape'] ) ? $p['shape'] : 'box',
			isset( $p['w'] ) ? (float) $p['w'] : 0,
			isset( $p['d'] ) ? (float) $p['d'] : 0,
		);
	}
	return $map;
}

/** شکل و ابعاد یک قلم پلن؛ در پلن‌های ذخیره‌شده در دیتابیس این‌ها از خود محصول می‌آید. */
function ckb_plan_item_geom( $item, $map ) {
	$shape = isset( $item['shapeType'] ) ? (string) $item['shapeType'] : '';
	$w     = isset( $item['w'] ) ? (float) $item['w'] : 0;
	$d     = isset( $item['d'] ) ? (float) $item['d'] : 0;
	$code  = isset( $item['productId'] ) ? (string) $item['productId'] : '';
	if ( ( '' === $shape || $w <= 0 ) && isset( $map[ $code ] ) ) {
		if ( '' === $shape ) {
			$shape = $map[ $code ][0];
		}
		if ( $w <= 0 ) {
			$w = $map[ $code ][1];
		}
		if ( $d <= 0 ) {
			$d = $map[ $code ][2];
		}
	}
	if ( $w <= 0 ) {
		$w = 1.0;
	}
	if ( $d <= 0 ) {
		$d = 1.0;
	}
	return array( $shape, $w, $d );
}

/**
 * v2.16.6 — چیدمان پیش‌فرض پلن‌ها: ست نشیمن (مبل/صندلی) و آتشدان کنار هم زیر پرگولا،
 * مثل عکس مرجع — نشیمن به عقبِ قاب پرگولا و آتشدان درست جلوی آن.
 * هر قلم به نزدیک‌ترین پرگولا می‌رود و جای خالی را برمی‌دارد تا با قلم دیگر تداخل نکند؛
 * پلن‌هایی که پرگولا ندارند دست نمی‌خورند.
 */
function ckb_nest_seating_under_pergola( $items, $map ) {
	$items = (array) $items;
	if ( count( $items ) < 2 ) {
		return $items;
	}

	$pergolas = array();
	$shapes   = array();
	foreach ( $items as $i => $it ) {
		$g = ckb_plan_item_geom( $it, $map );
		$shapes[ $i ] = $g;
		if ( 'pergola' === $g[0] || 'pergola_deck' === $g[0] ) {
			$pergolas[] = array(
				'x'   => isset( $it['x'] ) ? (float) $it['x'] : 0,
				'z'   => isset( $it['z'] ) ? (float) $it['z'] : 0,
				'w'   => $g[1],
				'd'   => $g[2],
				'rot' => isset( $it['rotation'] ) ? (float) $it['rotation'] : 0,
			);
		}
	}
	if ( empty( $pergolas ) ) {
		return $items;
	}

	/* اول نشیمن‌ها جا می‌گیرند (عقب-مرکز)، بعد آتشدان‌ها (جلو-مرکز) */
	$order = array();
	foreach ( $shapes as $i => $g ) {
		if ( 'lounge_set' === $g[0] ) {
			$order[] = $i;
		}
	}
	foreach ( $shapes as $i => $g ) {
		if ( 'firepit' === $g[0] || 'firepit_table' === $g[0] ) {
			$order[] = $i;
		}
	}

	$placed = array(); // ایندکس پرگولا => جعبه‌های اشغال‌شده در مختصات محلی
	foreach ( $order as $i ) {
		$g  = $shapes[ $i ];
		$x  = isset( $items[ $i ]['x'] ) ? (float) $items[ $i ]['x'] : 0;
		$z  = isset( $items[ $i ]['z'] ) ? (float) $items[ $i ]['z'] : 0;
		$p  = ckb_nearest_pergola( $pergolas, $x, $z );
		$pg = $pergolas[ $p ];

		$fire = ( 'firepit' === $g[0] || 'firepit_table' === $g[0] );
		$edge_x = max( 0, $pg['w'] / 2 - $g[1] / 2 - 0.1 );
		$edge_z = max( 0, $pg['d'] / 2 - $g[2] / 2 - 0.1 );

		/* اولویت جا: نشیمن عقب-مرکز، آتشدان جلو-مرکز، و بعد کناره‌ها */
		$cands = $fire
			? array( array( 0, 1 ), array( -1, 1 ), array( 1, 1 ), array( -1, 0 ), array( 1, 0 ), array( 0, -1 ) )
			: array( array( 0, -1 ), array( -1, 0 ), array( 1, 0 ), array( 0, 1 ), array( 0, 0 ) );

		$lx = $cands[0][0] * $edge_x;
		$lz = $cands[0][1] * $edge_z;
		foreach ( $cands as $c ) {
			$try_x = $c[0] * $edge_x;
			$try_z = $c[1] * $edge_z;
			$hit   = false;
			if ( isset( $placed[ $p ] ) ) {
				foreach ( $placed[ $p ] as $box ) {
					if ( abs( $try_x - $box[0] ) < ( $g[1] + $box[2] ) / 2 - 0.02
						&& abs( $try_z - $box[1] ) < ( $g[2] + $box[3] ) / 2 - 0.02 ) {
						$hit = true;
						break;
					}
				}
			}
			if ( ! $hit ) {
				$lx = $try_x;
				$lz = $try_z;
				break;
			}
		}
		$placed[ $p ][] = array( $lx, $lz, $g[1], $g[2] );

		/* چرخش پرگولا: بردار محلی به مختصات جهانی */
		$rad = deg2rad( $pg['rot'] );
		$cos = cos( $rad );
		$sin = sin( $rad );

		$items[ $i ]['x']        = round( $pg['x'] + $lx * $cos + $lz * $sin, 3 );
		$items[ $i ]['z']        = round( $pg['z'] - $lx * $sin + $lz * $cos, 3 );
		$items[ $i ]['rotation'] = $pg['rot'];
	}

	return $items;
}

/** ایندکس نزدیک‌ترین پرگولا به یک نقطه. */
function ckb_nearest_pergola( $pergolas, $x, $z ) {
	$best    = 0;
	$bestDst = null;
	foreach ( $pergolas as $p => $pg ) {
		$dst = sqrt( pow( $x - $pg['x'], 2 ) + pow( $z - $pg['z'], 2 ) );
		if ( null === $bestDst || $dst < $bestDst ) {
			$bestDst = $dst;
			$best    = $p;
		}
	}
	return $best;
}

/**
 * Repairs item/plan names stored with broken JSON unicode escapes
 * (a legacy save bug left names like "u067eu0631..." instead of Persian text).
 */
function ckb_repair_fa_text( $s ) {
	$s = (string) $s;
	if ( '' === $s ) { return $s; }
	if ( preg_match( '/[\x{0600}-\x{06FF}]/u', $s ) ) { return $s; }
	if ( ! preg_match( '/u([0-9a-fA-F]{4})/', $s ) ) { return $s; }
	$escaped = preg_replace( '/u([0-9a-fA-F]{4})/', '\\u$1', $s );
	$decoded = json_decode( '"' . $escaped . '"' );
	return is_string( $decoded ) ? $decoded : $s;
}

/** Fallback plans (matches seed.php). */
function ckb_default_studio_plans() {
	return array(
		array(
			'id' => 'l-shaped-penthouse',
			'name' => 'پلان L شکل | روف‌گاردن پنت‌هاوس (۱۲ × ۹ متر | ۸۳.۳ م²)',
			'shape' => 'l_shaped',
			'shapeName' => 'پلان',
			'width' => 12,
			'length' => 9,
			'parapetHeight' => 1.1,
			'flooringType' => 'wpc_wood',
			'wpcColor' => 'walnut',
			'metalColor' => 'black',
			'cutoutWidth' => 5.5,
			'cutoutLength' => 4.5,
			'shaftWidth' => 0,
			'shaftLength' => 0,
			'items' => array(
				/* سبک منسجم طراح: ست مبل و آتشدان هر دو زیر پرگولا (مبل عقب، آتشدان جلو)، فلاورباکس کنار دیوار */
				array( 'productId' => 'CK-PG-DK320', 'name' => 'پرگولا مدولار مدرن چوب‌پلاست ۳×۳ متر', 'category' => 'structures', 'x' => -1.5, 'z' => -2.1, 'rotation' => 0, 'w' => 3, 'd' => 3, 'h' => 2.5, 'shapeType' => 'pergola', 'priceEst' => 38500000, 'weightKg' => 280 ),
				array( 'productId' => 'CK-LN-SET04', 'name' => 'ست مبل راحتی ۴ نفره چوب‌پلاست و فلز مشکی (با میز)', 'category' => 'furniture', 'x' => -1.5, 'z' => -2.75, 'rotation' => 0, 'w' => 2.2, 'd' => 1.5, 'h' => 0.78, 'shapeType' => 'lounge_set', 'priceEst' => 26500000, 'weightKg' => 64 ),
				array( 'productId' => '', 'name' => 'آتشدان گازی مدرن روف‌گاردن', 'category' => 'water_fire', 'x' => -1.5, 'z' => -1.15, 'rotation' => 0, 'w' => 0.9, 'd' => 0.9, 'h' => 0.45, 'shapeType' => 'firepit', 'priceEst' => 14200000, 'weightKg' => 48 ),
				array( 'productId' => 'CK-PG-DK320', 'name' => 'پرگولا مدولار مدرن چوب‌پلاست ۳×۳ متر', 'category' => 'structures', 'x' => 1.3, 'z' => 2, 'rotation' => 90, 'w' => 3, 'd' => 3, 'h' => 2.5, 'shapeType' => 'pergola', 'priceEst' => 38500000, 'weightKg' => 280 ),
				array( 'productId' => 'CK-BN-BR140', 'name' => 'نیمکت پشتی‌دار اسلت چوب‌پلاست با شاسی مشکی', 'category' => 'furniture', 'x' => 1.3, 'z' => 1.4, 'rotation' => 0, 'w' => 1.4, 'd' => 0.62, 'h' => 0.88, 'shapeType' => 'bench_backrest', 'priceEst' => 9800000, 'weightKg' => 38 ),
				array( 'productId' => '', 'name' => 'آبنمای خطی مدرن استیل و چوب‌پلاست', 'category' => 'water_fire', 'x' => 4.9, 'z' => 1.6, 'rotation' => 90, 'w' => 1.4, 'd' => 0.45, 'h' => 1.2, 'shapeType' => 'water_feature', 'priceEst' => 16800000, 'weightKg' => 65 ),
				array( 'productId' => 'CK-FB-160', 'name' => 'فلاورباکس مدولار ۱۶۰ سانتی‌متری عریض', 'category' => 'planting', 'x' => -3, 'z' => 3.6, 'rotation' => 90, 'w' => 1.6, 'd' => 0.5, 'h' => 0.55, 'shapeType' => 'box', 'priceEst' => 7900000, 'weightKg' => 58 ),
				array( 'productId' => 'CK-FB-160', 'name' => 'فلاورباکس مدولار ۱۶۰ سانتی‌متری عریض', 'category' => 'planting', 'x' => -3, 'z' => 1.7, 'rotation' => 90, 'w' => 1.6, 'd' => 0.5, 'h' => 0.55, 'shapeType' => 'box', 'priceEst' => 7900000, 'weightKg' => 58 ),
				array( 'productId' => 'CK-GW-FP120', 'name' => 'دیوار سبز مدولار قاب‌دار با تراف کاشت پایه', 'category' => 'structures', 'x' => -5.7, 'z' => 1, 'rotation' => 90, 'w' => 1.2, 'd' => 0.42, 'h' => 1.8, 'shapeType' => 'green_wall_planter', 'priceEst' => 11200000, 'weightKg' => 68 ),
				array( 'productId' => 'CK-BBQ-180', 'name' => 'کانتر و باربیکیو ماژولار استیل و چوب‌پلاست', 'category' => 'accessories', 'x' => -1.5, 'z' => -0.2, 'rotation' => 0, 'w' => 1.8, 'd' => 0.65, 'h' => 0.9, 'shapeType' => 'bbq', 'priceEst' => 26500000, 'weightKg' => 95 ),
			),
		),
		array(
			'id' => 'central-shaft-roof',
			'name' => 'پلان بام با باکس پله مرکزی (۱۱ × ۱۰ متر | ۹۸.۵ م²)',
			'shape' => 'central_shaft',
			'shapeName' => 'پلان',
			'width' => 11,
			'length' => 10,
			'parapetHeight' => 1.1,
			'flooringType' => 'wpc_wood',
			'wpcColor' => 'teak',
			'metalColor' => 'black',
			'cutoutWidth' => 0,
			'cutoutLength' => 0,
			'shaftWidth' => 3.6,
			'shaftLength' => 3.2,
			'items' => array(
				/* سبک منسجم: پرگولا + مبل و آتشدان هر دو زیر آن، زون شرقی آبنما و نیمکت */
				array( 'productId' => 'CK-PG-DK320', 'name' => 'پرگولا مدولار مدرن چوب‌پلاست ۳×۳ متر', 'category' => 'structures', 'x' => -3.6, 'z' => -2.2, 'rotation' => 0, 'w' => 3, 'd' => 3, 'h' => 2.5, 'shapeType' => 'pergola', 'priceEst' => 38500000, 'weightKg' => 280 ),
				array( 'productId' => 'CK-LN-SET04', 'name' => 'ست مبل راحتی ۴ نفره چوب‌پلاست و فلز مشکی (با میز)', 'category' => 'furniture', 'x' => -3.6, 'z' => -2.85, 'rotation' => 0, 'w' => 2.2, 'd' => 1.5, 'h' => 0.78, 'shapeType' => 'lounge_set', 'priceEst' => 26500000, 'weightKg' => 64 ),
				array( 'productId' => '', 'name' => 'آتشدان گازی مدرن روف‌گاردن', 'category' => 'water_fire', 'x' => -3.6, 'z' => -1.25, 'rotation' => 0, 'w' => 0.9, 'd' => 0.9, 'h' => 0.45, 'shapeType' => 'firepit', 'priceEst' => 14200000, 'weightKg' => 48 ),
				array( 'productId' => '', 'name' => 'آبنمای خطی مدرن استیل و چوب‌پلاست', 'category' => 'water_fire', 'x' => 3.6, 'z' => -2, 'rotation' => 0, 'w' => 1.4, 'd' => 0.45, 'h' => 1.2, 'shapeType' => 'water_feature', 'priceEst' => 16800000, 'weightKg' => 65 ),
				array( 'productId' => 'CK-BN-BR140', 'name' => 'نیمکت پشتی‌دار اسلت چوب‌پلاست با شاسی مشکی', 'category' => 'furniture', 'x' => 3.6, 'z' => -0.8, 'rotation' => 90, 'w' => 1.4, 'd' => 0.62, 'h' => 0.88, 'shapeType' => 'bench_backrest', 'priceEst' => 9800000, 'weightKg' => 38 ),
				array( 'productId' => '', 'name' => 'دیواره سبز عمودی مدولار روی دیواره باکس پله', 'category' => 'structures', 'x' => 0, 'z' => -1.75, 'rotation' => 0, 'w' => 1.2, 'd' => 0.25, 'h' => 2, 'shapeType' => 'green_wall', 'priceEst' => 12500000, 'weightKg' => 85 ),
				array( 'productId' => 'CK-FB-120', 'name' => 'فلاورباکس مدولار ۱۲۰ سانتی‌متری', 'category' => 'planting', 'x' => -1.3, 'z' => 4.6, 'rotation' => 0, 'w' => 1.2, 'd' => 0.45, 'h' => 0.5, 'shapeType' => 'box', 'priceEst' => 6100000, 'weightKg' => 42 ),
				array( 'productId' => 'CK-FB-120', 'name' => 'فلاورباکس مدولار ۱۲۰ سانتی‌متری', 'category' => 'planting', 'x' => 0.1, 'z' => 4.6, 'rotation' => 0, 'w' => 1.2, 'd' => 0.45, 'h' => 0.5, 'shapeType' => 'box', 'priceEst' => 6100000, 'weightKg' => 42 ),
				array( 'productId' => 'CK-FB-120', 'name' => 'فلاورباکس مدولار ۱۲۰ سانتی‌متری', 'category' => 'planting', 'x' => 1.5, 'z' => 4.6, 'rotation' => 0, 'w' => 1.2, 'd' => 0.45, 'h' => 0.5, 'shapeType' => 'box', 'priceEst' => 6100000, 'weightKg' => 42 ),
				array( 'productId' => 'CK-FB-120', 'name' => 'فلاورباکس مدولار ۱۲۰ سانتی‌متری', 'category' => 'planting', 'x' => -5.2, 'z' => -4.5, 'rotation' => 90, 'w' => 1.2, 'd' => 0.45, 'h' => 0.5, 'shapeType' => 'box', 'priceEst' => 6100000, 'weightKg' => 42 ),
			),
		),
		array(
			'id' => 'narrow-linear-balcony',
			'name' => 'پلان تراس طولی کشیده (۱۰ × ۲.۸ متر | ۲۸ م²)',
			'shape' => 'narrow_balcony',
			'shapeName' => 'پلان',
			'width' => 10,
			'length' => 2.8,
			'parapetHeight' => 1.1,
			'flooringType' => 'mixed',
			'wpcColor' => 'oak',
			'metalColor' => 'black',
			'cutoutWidth' => 0,
			'cutoutLength' => 0,
			'shaftWidth' => 0,
			'shaftLength' => 0,
			'items' => array(
				/* سبک منسجم: نیمکت پشتی‌دار غرب + کاشت خطی کنار دیوار + آبنما + دیوار سبز شرق */
				array( 'productId' => 'CK-BN-BR140', 'name' => 'نیمکت پشتی‌دار اسلت چوب‌پلاست با شاسی مشکی', 'category' => 'furniture', 'x' => -3, 'z' => -0.35, 'rotation' => 0, 'w' => 1.4, 'd' => 0.62, 'h' => 0.88, 'shapeType' => 'bench_backrest', 'priceEst' => 9800000, 'weightKg' => 38 ),
				array( 'productId' => 'CK-FB-160', 'name' => 'فلاورباکس مدولار ۱۶۰ سانتی‌متری عریض', 'category' => 'planting', 'x' => -1.4, 'z' => 0.85, 'rotation' => 0, 'w' => 1.6, 'd' => 0.5, 'h' => 0.55, 'shapeType' => 'box', 'priceEst' => 7900000, 'weightKg' => 58 ),
				array( 'productId' => 'CK-FB-160', 'name' => 'فلاورباکس مدولار ۱۶۰ سانتی‌متری عریض', 'category' => 'planting', 'x' => 0.3, 'z' => 0.85, 'rotation' => 0, 'w' => 1.6, 'd' => 0.5, 'h' => 0.55, 'shapeType' => 'box', 'priceEst' => 7900000, 'weightKg' => 58 ),
				array( 'productId' => '', 'name' => 'آبنمای خطی مدرن استیل و چوب‌پلاست', 'category' => 'water_fire', 'x' => 1.9, 'z' => 0.4, 'rotation' => 0, 'w' => 1.4, 'd' => 0.45, 'h' => 1.2, 'shapeType' => 'water_feature', 'priceEst' => 16800000, 'weightKg' => 65 ),
				array( 'productId' => '', 'name' => 'دیواره سبز عمودی مدولار (Green Wall)', 'category' => 'structures', 'x' => 4.4, 'z' => 0, 'rotation' => 90, 'w' => 1.2, 'd' => 0.25, 'h' => 2, 'shapeType' => 'green_wall', 'priceEst' => 12500000, 'weightKg' => 85 ),
			),
		),
		array(
			'id' => 'u-shaped-courtyard',
			'name' => 'پلان U شکل | روف‌گاردن کافه (۱۴ × ۱۱ متر | ۱۱۸ م²)',
			'shape' => 'u_shaped',
			'shapeName' => 'پلان',
			'width' => 14,
			'length' => 11,
			'parapetHeight' => 1.2,
			'flooringType' => 'wpc_wood',
			'wpcColor' => 'charcoal',
			'metalColor' => 'black',
			'cutoutWidth' => 6,
			'cutoutLength' => 6,
			'shaftWidth' => 0,
			'shaftLength' => 0,
			'items' => array(
				/* سبک منسجم: پرگولا غرب با ست مبل و باربیکیو کنارش، پرگولا شرق با نیمکت و میز آتشدان زیر آن */
				array( 'productId' => 'CK-PG-DK320', 'name' => 'پرگولا مدولار مدرن چوب‌پلاست ۳×۳ متر', 'category' => 'structures', 'x' => -4.8, 'z' => -3.2, 'rotation' => 0, 'w' => 3, 'd' => 3, 'h' => 2.5, 'shapeType' => 'pergola', 'priceEst' => 38500000, 'weightKg' => 280 ),
				array( 'productId' => 'CK-LN-SET04', 'name' => 'ست مبل راحتی ۴ نفره چوب‌پلاست و فلز مشکی (با میز)', 'category' => 'furniture', 'x' => -4.8, 'z' => -3.85, 'rotation' => 0, 'w' => 2.2, 'd' => 1.5, 'h' => 0.78, 'shapeType' => 'lounge_set', 'priceEst' => 26500000, 'weightKg' => 64 ),
				array( 'productId' => 'CK-BBQ-180', 'name' => 'کانتر و باربیکیو ماژولار استیل و چوب‌پلاست', 'category' => 'accessories', 'x' => -4.8, 'z' => -0.7, 'rotation' => 0, 'w' => 1.8, 'd' => 0.65, 'h' => 0.9, 'shapeType' => 'bbq', 'priceEst' => 26500000, 'weightKg' => 95 ),
				array( 'productId' => 'CK-PG-DK320', 'name' => 'پرگولا مدولار مدرن چوب‌پلاست ۳×۳ متر', 'category' => 'structures', 'x' => 4.8, 'z' => -3.2, 'rotation' => 0, 'w' => 3, 'd' => 3, 'h' => 2.5, 'shapeType' => 'pergola', 'priceEst' => 38500000, 'weightKg' => 280 ),
				array( 'productId' => 'CK-BN-BR140', 'name' => 'نیمکت پشتی‌دار اسلت چوب‌پلاست با شاسی مشکی', 'category' => 'furniture', 'x' => 4.8, 'z' => -3.9, 'rotation' => 0, 'w' => 1.4, 'd' => 0.62, 'h' => 0.88, 'shapeType' => 'bench_backrest', 'priceEst' => 9800000, 'weightKg' => 38 ),
				array( 'productId' => '', 'name' => 'میز آتشدان مربعی چوب‌پلاست با سبد شعله فلزی', 'category' => 'water_fire', 'x' => 4.8, 'z' => -2.35, 'rotation' => 0, 'w' => 1.1, 'd' => 1.1, 'h' => 0.72, 'shapeType' => 'firepit_table', 'priceEst' => 21500000, 'weightKg' => 92 ),
				array( 'productId' => '', 'name' => 'آبنمای خطی مدرن استیل و چوب‌پلاست', 'category' => 'water_fire', 'x' => 4.8, 'z' => 3.6, 'rotation' => 90, 'w' => 1.4, 'd' => 0.45, 'h' => 1.2, 'shapeType' => 'water_feature', 'priceEst' => 16800000, 'weightKg' => 65 ),
				array( 'productId' => 'CK-GW-FP120', 'name' => 'دیوار سبز مدولار قاب‌دار با تراف کاشت پایه', 'category' => 'structures', 'x' => -4.8, 'z' => 3.6, 'rotation' => 0, 'w' => 1.2, 'd' => 0.42, 'h' => 1.8, 'shapeType' => 'green_wall_planter', 'priceEst' => 11200000, 'weightKg' => 68 ),
				array( 'productId' => 'CK-FB-160', 'name' => 'فلاورباکس مدولار ۱۶۰ سانتی‌متری عریض', 'category' => 'planting', 'x' => -2.9, 'z' => 4.6, 'rotation' => 0, 'w' => 1.6, 'd' => 0.5, 'h' => 0.55, 'shapeType' => 'box', 'priceEst' => 7900000, 'weightKg' => 58 ),
				array( 'productId' => 'CK-FB-160', 'name' => 'فلاورباکس مدولار ۱۶۰ سانتی‌متری عریض', 'category' => 'planting', 'x' => -1.2, 'z' => 4.6, 'rotation' => 0, 'w' => 1.6, 'd' => 0.5, 'h' => 0.55, 'shapeType' => 'box', 'priceEst' => 7900000, 'weightKg' => 58 ),
				array( 'productId' => 'CK-FB-160', 'name' => 'فلاورباکس مدولار ۱۶۰ سانتی‌متری عریض', 'category' => 'planting', 'x' => 2, 'z' => 4.6, 'rotation' => 0, 'w' => 1.6, 'd' => 0.5, 'h' => 0.55, 'shapeType' => 'box', 'priceEst' => 7900000, 'weightKg' => 58 ),
			),
		),
		array(
			'id' => 'luxury-penthouse-rect',
			'name' => 'پلان مستطیلی | پنت‌هاوس نیاوران (۱۰ × ۸ متر | ۸۰ م²)',
			'shape' => 'rectangular',
			'shapeName' => 'پلان',
			'width' => 10,
			'length' => 8,
			'parapetHeight' => 1.1,
			'flooringType' => 'wpc_wood',
			'wpcColor' => 'walnut',
			'metalColor' => 'black',
			'cutoutWidth' => 0,
			'cutoutLength' => 0,
			'shaftWidth' => 0,
			'shaftLength' => 0,
			'items' => array(
				/* سبک منسجم: پرگولا با مبل و آتشدان زیر آن در شمال‌غرب، آبنما شرق، نیمکت و کاشت خطی دیوار جنوب */
				array( 'productId' => 'CK-PG-DK320', 'name' => 'پرگولا مدولار مدرن چوب‌پلاست ۳×۳ متر', 'category' => 'structures', 'x' => -3.1, 'z' => -1.9, 'rotation' => 0, 'w' => 3, 'd' => 3, 'h' => 2.5, 'shapeType' => 'pergola', 'priceEst' => 38500000, 'weightKg' => 280 ),
				array( 'productId' => 'CK-LN-SET04', 'name' => 'ست مبل راحتی ۴ نفره چوب‌پلاست و فلز مشکی (با میز)', 'category' => 'furniture', 'x' => -3.1, 'z' => -2.55, 'rotation' => 0, 'w' => 2.2, 'd' => 1.5, 'h' => 0.78, 'shapeType' => 'lounge_set', 'priceEst' => 26500000, 'weightKg' => 64 ),
				array( 'productId' => '', 'name' => 'آتشدان گازی مدرن روف‌گاردن', 'category' => 'water_fire', 'x' => -3.1, 'z' => -0.95, 'rotation' => 0, 'w' => 0.9, 'd' => 0.9, 'h' => 0.45, 'shapeType' => 'firepit', 'priceEst' => 14200000, 'weightKg' => 48 ),
				array( 'productId' => '', 'name' => 'آبنمای خطی مدرن استیل و چوب‌پلاست', 'category' => 'water_fire', 'x' => 3.7, 'z' => -1.9, 'rotation' => 90, 'w' => 1.4, 'd' => 0.45, 'h' => 1.2, 'shapeType' => 'water_feature', 'priceEst' => 16800000, 'weightKg' => 65 ),
				array( 'productId' => '', 'name' => 'مجموعه ترکیبی نیمکت متصل به دو فلاورباکس', 'category' => 'furniture', 'x' => -0.7, 'z' => 3.15, 'rotation' => 0, 'w' => 2.2, 'd' => 0.5, 'h' => 0.6, 'shapeType' => 'bench_integrated', 'priceEst' => 11900000, 'weightKg' => 76 ),
				array( 'productId' => 'CK-FB-160', 'name' => 'فلاورباکس مدولار ۱۶۰ سانتی‌متری عریض', 'category' => 'planting', 'x' => 1.6, 'z' => 3.15, 'rotation' => 0, 'w' => 1.6, 'd' => 0.5, 'h' => 0.55, 'shapeType' => 'box', 'priceEst' => 7900000, 'weightKg' => 58 ),
				array( 'productId' => 'CK-FB-160', 'name' => 'فلاورباکس مدولار ۱۶۰ سانتی‌متری عریض', 'category' => 'planting', 'x' => 3.3, 'z' => 3.15, 'rotation' => 0, 'w' => 1.6, 'd' => 0.5, 'h' => 0.55, 'shapeType' => 'box', 'priceEst' => 7900000, 'weightKg' => 58 ),
				array( 'productId' => 'CK-GW-FP120', 'name' => 'دیوار سبز مدولار قاب‌دار با تراف کاشت پایه', 'category' => 'structures', 'x' => -4.65, 'z' => 0.9, 'rotation' => 90, 'w' => 1.2, 'd' => 0.42, 'h' => 1.8, 'shapeType' => 'green_wall_planter', 'priceEst' => 11200000, 'weightKg' => 68 ),
			),
		),
	);
}

/* ------------------------------ Assets ------------------------------ */

add_action( 'wp_enqueue_scripts', 'ckb_wpstudio_register_assets' );
add_action( 'admin_enqueue_scripts', 'ckb_wpstudio_register_assets' );

/* ── v2.12: بارگذاری غیرمسدودکننده اسکریپت‌های سنگین چکادبام (فقط فرانت‌اند) ──
   همه با defer چاپ می‌شوند؛ مرورگرها اسکریپت‌های defer را به ترتیب سند اجرا
   می‌کنند پس ترتیب وابستگی‌ها حفظ می‌شود. بوت استودیو و بوت شورت‌کد محصول
   هر دو با پولینگ منتظر وابستگی‌ها می‌مانند، پس امن است. در مدیریت دست
   نمی‌زنیم تا همگامی admin-preview دست‌نخورده بماند. */
add_filter( 'script_loader_tag', 'ckb_defer_studio_scripts', 10, 2 );
function ckb_defer_studio_scripts( $tag, $handle ) {
	if ( is_admin() ) {
		return $tag;
	}
	$defer_handles = array(
		'ckb-three', 'ckb-textures', 'ckb-foliage', 'ckb-gltfloader', 'ckb-models',
		'ckb-boundary', 'ckb-bom', 'ckb-blueprint', 'ckb-coach', 'ckb-hints',
		'ckb-viewer', 'ckb-studio-app',
	);
	if ( in_array( $handle, $defer_handles, true )
		&& strpos( $tag, 'defer' ) === false
		&& strpos( $tag, 'async' ) === false ) {
		$tag = str_replace( ' src=', ' defer src=', $tag );
	}
	return $tag;
}

/* v2.12: preconnect به CDN فونت — دست‌یابی سریع‌تر به وزیرمتن */
add_action( 'wp_head', 'ckb_preconnect_vazirmatn_cdn', 1 );
function ckb_preconnect_vazirmatn_cdn() {
	if ( ! is_singular() ) {
		return;
	}
	$post = get_post();
	if ( $post && ( has_shortcode( $post->post_content, 'chekadbam_studio' ) || has_shortcode( $post->post_content, 'chekadbam_3d' ) ) ) {
		echo '<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin="anonymous">' . "\n";
	}
}

// Load the studio stylesheet in the page head (no unstyled flash) when the
// current page embeds the full studio via [chekadbam_studio]
add_action( 'wp_enqueue_scripts', 'ckb_wpstudio_maybe_enqueue_early', 20 );
function ckb_wpstudio_maybe_enqueue_early() {
	if ( ! is_singular() ) {
		return;
	}
	$post = get_post();
	if ( $post && has_shortcode( $post->post_content, 'chekadbam_studio' ) ) {
		wp_enqueue_style( 'ckb-studio' );
	}
}
function ckb_wpstudio_register_assets() {
	/* v2.13.5 — cache-busting دو لایه: نسخه افزونه + mtime فایل.
	   قبلاً فقط «v=2.13.2» در URL بود؛ بعضی کش‌های CDN/هاست مقدار query را
	   نادیده می‌گرفتند و مرورگر JS قدیمی را می‌داد (منو قدیمی+رفع نشدن باگ‌ها).
	   با mtime، هر آپلود جدید فایل، URL یکتا می‌شود و کش خنثی می‌شود. */
	$mt = function ( $path ) {
		$file = str_replace( CKB_PLUGIN_URL, CKB_PLUGIN_DIR, $path );
		return CKB_VERSION . '.' . ( file_exists( $file ) ? (string) @filemtime( $file ) : '0' );
	};

	wp_register_style( 'ckb-studio', CKB_PLUGIN_URL . 'assets/studio.css', array(), $mt( CKB_PLUGIN_URL . 'assets/studio.css' ) );
	wp_register_script( 'ckb-three', CKB_PLUGIN_URL . 'assets/three.min.js', array(), $mt( CKB_PLUGIN_URL . 'assets/three.min.js' ), false );
	wp_register_script( 'ckb-textures', CKB_PLUGIN_URL . 'assets/ckb-textures.js', array( 'ckb-three' ), $mt( CKB_PLUGIN_URL . 'assets/ckb-textures.js' ), true );
	wp_register_script( 'ckb-foliage', CKB_PLUGIN_URL . 'assets/ckb-foliage.js', array( 'ckb-three' ), $mt( CKB_PLUGIN_URL . 'assets/ckb-foliage.js' ), true );
	wp_register_script( 'ckb-gltfloader', CKB_PLUGIN_URL . 'assets/ckb-gltfloader.js', array( 'ckb-three' ), $mt( CKB_PLUGIN_URL . 'assets/ckb-gltfloader.js' ), true ); /* GLTFLoader shim روی THREE باندل‌شده */
	wp_register_script( 'ckb-models', CKB_PLUGIN_URL . 'assets/ckb-models.js', array( 'ckb-three', 'ckb-textures', 'ckb-foliage', 'ckb-gltfloader' ), $mt( CKB_PLUGIN_URL . 'assets/ckb-models.js' ), true );
	wp_register_script( 'ckb-boundary', CKB_PLUGIN_URL . 'assets/ckb-boundary.js', array(), $mt( CKB_PLUGIN_URL . 'assets/ckb-boundary.js' ), true );
	wp_register_script( 'ckb-bom', CKB_PLUGIN_URL . 'assets/ckb-bom.js', array(), $mt( CKB_PLUGIN_URL . 'assets/ckb-bom.js' ), true );
	wp_register_script( 'ckb-blueprint', CKB_PLUGIN_URL . 'assets/ckb-blueprint.js', array( 'ckb-three' ), $mt( CKB_PLUGIN_URL . 'assets/ckb-blueprint.js' ), true );
	/* همراه طراح (v2.11): ماژول مستقل پنل راهنمای طراحی — بدون وابستگی */
	wp_register_script( 'ckb-coach', CKB_PLUGIN_URL . 'assets/ckb-coach.js', array(), $mt( CKB_PLUGIN_URL . 'assets/ckb-coach.js' ), true );
	/* راهنمای درون‌پلان (v2.14): قدم‌های حرکتی روی خود بوم — بدون وابستگی */
	wp_register_script( 'ckb-hints', CKB_PLUGIN_URL . 'assets/ckb-hints.js', array(), $mt( CKB_PLUGIN_URL . 'assets/ckb-hints.js' ), true );
	wp_register_script( 'ckb-viewer', CKB_PLUGIN_URL . 'assets/viewer.js', array( 'ckb-models' ), $mt( CKB_PLUGIN_URL . 'assets/viewer.js' ), true );
	wp_register_script( 'ckb-studio-app', CKB_PLUGIN_URL . 'assets/studio-app.js', array( 'ckb-models', 'ckb-boundary', 'ckb-bom' ), $mt( CKB_PLUGIN_URL . 'assets/studio-app.js' ), true );
}

/* ------------------------------ Core Studio HTML ------------------------------ */

function ckb_get_wpstudio_html( $is_admin = true, $height = '100vh', $fullscreen = false ) {
	/* لایسنس: استودیو فقط روی دامنه‌های مجاز (فایل امضاشدهٔ گیت‌هاب) رندر می‌شود */
	if ( ! ckb_license_is_active() ) {
		return ckb_license_blocked_html();
	}
	$products = ckb_get_studio_products();
	$plans    = ckb_get_studio_plans( $products );

	$studio_id = 'ckb-ws-' . wp_rand( 1000, 9999 );
	$ajax_url  = admin_url( 'admin-ajax.php' );
	$nonce     = wp_create_nonce( 'ckb_wpstudio' );
	// Public designer opens with the plans modal first (guide on first visit)
	$auto_plans = $is_admin ? false : true;

	wp_enqueue_style( 'ckb-studio' );
	// Persian UI font — falls back to system fonts when the CDN is unreachable
	wp_enqueue_style( 'ckb-vazirmatn', 'https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css', array(), null );
	wp_enqueue_script( 'ckb-three' );
	wp_enqueue_script( 'ckb-textures' );
	wp_enqueue_script( 'ckb-foliage' );
	wp_enqueue_script( 'ckb-models' );
	wp_enqueue_script( 'ckb-boundary' );
	wp_enqueue_script( 'ckb-bom' );
	wp_enqueue_script( 'ckb-blueprint' );
	wp_enqueue_script( 'ckb-coach' ); /* همراه طراح — قبل از studio-app تا در لحظه mount آماده باشد (v2.11) */
	wp_enqueue_script( 'ckb-hints' ); /* راهنمای درون‌پلان — قبل از studio-app (v2.14) */
	wp_enqueue_script( 'ckb-studio-app' );

	$config = array(
		'products'    => $products,
		'plans'       => $plans,
		'ajaxUrl'     => $ajax_url,
		'nonce'       => $nonce,
		'autoPlans'   => $auto_plans,
		/* کد تایید پیامکی (OTP): فقط فرم عمومی — استودیوی پیشخوان (کارمندان) معاف است */
		'otpEnabled'  => ckb_smsotp_available() && ! $is_admin,
		/* Mobile v2.8: server-side device sniff informs the JS render path */
		'isMobile'    => (bool) wp_is_mobile(),
	);
	// Bracket notation — the studio_id contains dashes, which are illegal in
	// JavaScript dot access (window.CKB_CONFIG_ckb-ws-1234 is a syntax error).
	wp_add_inline_script(
		'ckb-studio-app',
		"window['CKB_CONFIG_" . $studio_id . "'] = " . wp_json_encode( $config ) . ';',
		'before'
	);
	?>
	<div id="<?php echo esc_attr( $studio_id ); ?>" class="ckb-wstudio-container <?php echo $is_admin ? 'ckb-wstudio-admin' : 'ckb-wstudio-front'; ?> <?php echo $fullscreen ? 'ckb-studio-full' : ''; ?>" style="<?php echo $fullscreen ? '' : 'height:' . esc_attr( $height ) . ';'; ?>" dir="rtl">
		<!-- Header -->
		<div class="ckb-wstudio-header">
			<h3>
				<span style="width:8px;height:8px;border-radius:50%;background:#10b981;display:inline-block;"></span>
				استودیوی طراحی سه‌بعدی بام من (Chekadbam Studio)
			</h3>
			<div class="ckb-plan-badge" id="<?php echo esc_attr( $studio_id ); ?>-badge">
				پلان: در حال بارگذاری...
			</div>
			<?php if ( $is_admin ) : ?>
				<button class="ckb-wstudio-close" onclick="window.history.back()">✕ بستن استودیو</button>
			<?php endif; ?>
		</div>

		<!-- Body with 3D Canvas -->
		<div class="ckb-wstudio-body">
			<div class="ckb-wstudio-viewport">
				<div class="ckb-wstudio-compass">
					<div class="ckb-n-dot">N</div>
					<span>شمال</span>
				</div>
				<!-- One-off warning toast (studio-app.js showToast) -->
				<div class="ckb-wstudio-toast" id="<?php echo esc_attr( $studio_id ); ?>-toast" role="status"></div>
				<!-- Loading overlay (v2.13.2) — سرور-رندر: بلافاصله با HTML نمایش داده می‌شود و
				     کد جاوااسکریپت (studio-app.js addLoadingOverlay) بعد از اولین فریم آن را محو/حذف می‌کند.
				     اگر JS مسدود باشد هم کاربر پوشش را می‌بیند و صفحه‌ی خالی نمیگیرد. -->
				<div class="ckb-wstudio-loader is-server" id="<?php echo esc_attr( $studio_id ); ?>-loader" aria-hidden="true">
					<div class="ckb-loader-ring">
						<svg viewBox="0 0 64 64" fill="none"><circle class="ckb-loader-track" cx="32" cy="32" r="27" stroke-width="3" fill="none"/><circle class="ckb-loader-arc" cx="32" cy="32" r="27" stroke-width="3" stroke-linecap="round" fill="none" stroke-dasharray="42 128"/></svg>
						<div class="ckb-loader-core"><span></span></div>
					</div>
					<div class="ckb-loader-brand"><span class="ckb-loader-dot"></span><b>چکادبام استودیو</b></div>
					<div class="ckb-loader-note">در حال آماده‌سازی صحنه سه‌بعدی</div>
				</div>
			</div>

			<!-- Selected Item Floating Inspector -->
			<div class="ckb-wstudio-inspector" id="<?php echo esc_attr( $studio_id ); ?>-insp">
				<div class="ckb-insp-info">
					<span class="ckb-insp-name" id="<?php echo esc_attr( $studio_id ); ?>-insp-title">قلم</span>
					<span class="ckb-insp-pos" id="<?php echo esc_attr( $studio_id ); ?>-insp-pos" dir="ltr"></span>
				</div>
				<div class="ckb-insp-nudge" role="group" aria-label="جابه‌جایی ریز قلم (نیم‌متر)">
					<button type="button" id="<?php echo esc_attr( $studio_id ); ?>-btn-nudge-left" title="حرکت به چپ (۰.۵ متر)" aria-label="حرکت به چپ (۰.۵ متر)">→</button>
					<button type="button" id="<?php echo esc_attr( $studio_id ); ?>-btn-nudge-right" title="حرکت به راست (۰.۵ متر)" aria-label="حرکت به راست (۰.۵ متر)">←</button>
					<button type="button" id="<?php echo esc_attr( $studio_id ); ?>-btn-nudge-up" title="حرکت به بالا (۰.۵ متر)" aria-label="حرکت به بالا (۰.۵ متر)">↑</button>
					<button type="button" id="<?php echo esc_attr( $studio_id ); ?>-btn-nudge-down" title="حرکت به پایین (۰.۵ متر)" aria-label="حرکت به پایین (۰.۵ متر)">↓</button>
				</div>
				<button type="button" id="<?php echo esc_attr( $studio_id ); ?>-btn-rot45">چرخش ۴۵°</button>
				<button type="button" id="<?php echo esc_attr( $studio_id ); ?>-btn-rot90">چرخش ۹۰°</button>
				<button type="button" id="<?php echo esc_attr( $studio_id ); ?>-btn-dup" title="تکثیر قلم" aria-label="تکثیر قلم">⧉ تکثیر</button>
				<div class="ckb-insp-swatches" id="<?php echo esc_attr( $studio_id ); ?>-insp-colors" role="group" aria-label="رنگ چوب‌پلاست این قلم"></div>
				<button type="button" class="del" id="<?php echo esc_attr( $studio_id ); ?>-btn-del">حذف</button>
				<button type="button" id="<?php echo esc_attr( $studio_id ); ?>-btn-desel">✕</button>
			</div>

			<!-- Bottom Dock -->
			<div class="ckb-wstudio-dock">
				<button type="button" class="ckb-wstudio-btn primary" id="<?php echo esc_attr( $studio_id ); ?>-btn-save" aria-label="ثبت و ارسال طرح">
					<span class="ckb-btn-label">ثبت و ارسال طرح</span><span class="ckb-btn-label-sm">ثبت طرح</span>
				</button>
				<button type="button" class="ckb-wstudio-btn primary" id="<?php echo esc_attr( $studio_id ); ?>-btn-add" aria-label="افزودن اقلام به بام">
					+ <span class="ckb-btn-label">افزودن اقلام</span><span class="ckb-btn-label-sm">افزودن</span>
				</button>
				<button type="button" class="ckb-wstudio-btn" id="<?php echo esc_attr( $studio_id ); ?>-btn-plan-editor" aria-label="نقشه و ابعاد بام">
					📐 <span class="ckb-btn-label">نقشه و ابعاد بام</span><span class="ckb-btn-label-sm">نقشه بام</span>
				</button>
				<div class="ckb-wstudio-div ckb-wstudio-divider"></div>
				<button type="button" class="ckb-wstudio-btn" id="<?php echo esc_attr( $studio_id ); ?>-btn-undo" disabled aria-label="برگشت (Undo)">↶ <span class="ckb-btn-label">برگشت</span><span class="ckb-btn-label-sm">برگشت</span></button>
				<button type="button" class="ckb-wstudio-btn" id="<?php echo esc_attr( $studio_id ); ?>-btn-redo" disabled aria-label="جلو (Redo)">↷ <span class="ckb-btn-label">جلو</span><span class="ckb-btn-label-sm">جلو</span></button>
				<button type="button" class="ckb-wstudio-btn" id="<?php echo esc_attr( $studio_id ); ?>-btn-guide" title="راهنمای کار با استودیو" aria-label="راهنمای کار با استودیو">؟ <span class="ckb-btn-label">راهنما</span><span class="ckb-btn-label-sm">راهنما</span></button>
				<div class="ckb-wstudio-div ckb-wstudio-divider"></div>
				<button type="button" class="ckb-wstudio-btn active" id="<?php echo esc_attr( $studio_id ); ?>-btn-day" aria-label="نور روز">☀️ <span class="ckb-btn-label">روز</span><span class="ckb-btn-label-sm">روز</span></button>
				<button type="button" class="ckb-wstudio-btn" id="<?php echo esc_attr( $studio_id ); ?>-btn-sunset" aria-label="نور غروب">🌇 <span class="ckb-btn-label">غروب</span><span class="ckb-btn-label-sm">غروب</span></button>
				<button type="button" class="ckb-wstudio-btn" id="<?php echo esc_attr( $studio_id ); ?>-btn-night" aria-label="نور شب">🌙 <span class="ckb-btn-label">شب</span><span class="ckb-btn-label-sm">شب</span></button>
				<div class="ckb-wstudio-div ckb-wstudio-divider"></div>
				<button type="button" class="ckb-wstudio-btn" id="<?php echo esc_attr( $studio_id ); ?>-btn-view" aria-label="تغییر دید دوبعدی/سه‌بعدی">👁 <span class="ckb-btn-label">پلان ۲D</span><span class="ckb-btn-label-sm">پلان</span></button>
				<button type="button" class="ckb-wstudio-btn" id="<?php echo esc_attr( $studio_id ); ?>-btn-cam" aria-label="تنظیم مجدد دوربین" title="تنظیم مجدد دوربین">🔄 <span class="ckb-btn-label">دید اول</span><span class="ckb-btn-label-sm">دید</span></button>
				<div class="ckb-wstudio-div ckb-wstudio-divider"></div>
				<button type="button" class="ckb-wstudio-btn ckb-bom-btn" id="<?php echo esc_attr( $studio_id ); ?>-btn-bom" aria-label="فهرست اقلام و برآورد">📋 <span class="ckb-btn-label">فهرست اقلام و برآورد</span><span class="ckb-btn-label-sm">برآورد</span><span class="ckb-bom-count" id="<?php echo esc_attr( $studio_id ); ?>-bom-count" hidden>۰</span></button>
				<button type="button" class="ckb-wstudio-btn" id="<?php echo esc_attr( $studio_id ); ?>-btn-clear" aria-label="پاک کردن تمام اقلام" title="پاک کردن تمام اقلام" disabled>🧹 <span class="ckb-btn-label">پاک‌کردن اقلام</span><span class="ckb-btn-label-sm">پاک‌کردن</span></button>
				<button type="button" class="ckb-wstudio-btn ckb-dock-handle" id="<?php echo esc_attr( $studio_id ); ?>-btn-dock" aria-label="جمع‌کردن منو" aria-expanded="true" title="جمع‌کردن منو">⌄</button>
			</div>
		</div>

		<!-- Catalog Modal -->
		<div class="ckb-wstudio-modal" id="<?php echo esc_attr( $studio_id ); ?>-modal-catalog">
			<div class="ckb-wstudio-modal-box">
				<div class="ckb-wstudio-modal-head">
					<h4>کاتالوگ ماژول‌های چکادبام</h4>
					<div class="ckb-wstudio-x" data-close="catalog" role="button" aria-label="بستن" tabindex="0">✕</div>
				</div>
				<div class="ckb-catalog-tools">
					<input type="text" class="ckb-catalog-search" id="<?php echo esc_attr( $studio_id ); ?>-catalog-search" placeholder="جستجوی قلم، ابعاد یا کد..." aria-label="جستجو در کاتالوگ">
					<div class="ckb-catalog-cats" id="<?php echo esc_attr( $studio_id ); ?>-catalog-cats" role="group" aria-label="دسته‌بندی اقلام"></div>
				</div>
				<div class="ckb-catalog-grid" id="<?php echo esc_attr( $studio_id ); ?>-catalog-list"></div>
			</div>
		</div>

		<!-- Studio Guide Modal -->
		<div class="ckb-wstudio-modal" id="<?php echo esc_attr( $studio_id ); ?>-modal-guide">
			<div class="ckb-wstudio-modal-box ckb-guide-box">
				<div class="ckb-wstudio-modal-head">
					<div class="ckb-guide-head">
						<div class="ckb-guide-ic">؟</div>
						<div>
							<h4>راهنمای استودیوی طراحی بام</h4>
							<p>پنج قدم تا چیدمان کامل روف‌گاردن شما</p>
						</div>
					</div>
					<div class="ckb-wstudio-x" data-close="guide" role="button" aria-label="بستن" tabindex="0">✕</div>
				</div>
				<div class="ckb-guide-body">
					<ol class="ckb-guide-steps">
						<li><span class="ckb-guide-num">۱</span><div><b>بام خود را تعریف کنید</b><p>با «ابعاد بام من» شکل، ابعاد و کف‌سازی پشت‌بام را تنظیم کنید.</p></div></li>
						<li><span class="ckb-guide-num">۲</span><div><b>اقلام را اضافه کنید</b><p>«افزودن اقلام» هر قلم را در امن‌ترین نقطه پلان قرار می‌دهد؛ با جستجو و فیلتر دسته‌بندی، سریع به قلم موردنظر می‌رسید.</p></div></li>
						<li><span class="ckb-guide-num">۳</span><div><b>جابه‌جایی دقیق</b><p>قلم انتخاب‌شده را با ماوس یا انگشت بکشید، با دکمه‌های جهت‌دار نوار قلم نیم‌متر یک‌جا حرکتش دهید و با کلیدهای جهت‌دار هم همین کار را بکنید. چرخش ۴۵°، ۹۰°، تکثیر و رنگ چوب‌پلاست هم از همان نوار.</p></div></li>
						<li><span class="ckb-guide-num">۴</span><div><b>دید و نورپردازی</b><p>درگ روی فضای خالی دوربین را می‌چرخاند و اسکرول زوم می‌کند. سه حالت روز، غروب و شب حس فضای واقعی را می‌سازند.</p></div></li>
						<li><span class="ckb-guide-num">۵</span><div><b>فهرست اقلام و ذخیره</b><p>«فهرست اقلام و برآورد» متراژ اقلام را حساب می‌کند و «ثبت و ارسال طرح» برای مشاوره و اجرا ثبت می‌شود.</p></div></li>
					</ol>
					<p class="ckb-guide-hint">دکمه «؟ راهنما»، راهنمای قدم‌به‌قدم روی خود پلان را دوباره نشان می‌دهد.</p>
				</div>
				<div class="ckb-guide-foot">
					<span>استودیو چکادبام — طراحی روف‌گاردن مدولار</span>
					<button type="button" class="ckb-wstudio-btn primary" id="<?php echo esc_attr( $studio_id ); ?>-btn-guide-start">شروع طراحی</button>
				</div>
			</div>
		</div>

		<!-- Plan Editor Modal -->
		<div class="ckb-wstudio-modal" id="<?php echo esc_attr( $studio_id ); ?>-modal-plan">
			<div class="ckb-wstudio-modal-box">
				<div class="ckb-wstudio-modal-head">
					<h4>نقشه و ابعاد بام</h4>
					<div class="ckb-wstudio-head-actions">
						<button type="button" class="ckb-wstudio-btn" id="<?php echo esc_attr( $studio_id ); ?>-btn-pe-help" title="راهنمای تصویری این پنجره" aria-label="راهنمای تصویری این پنجره">؟ راهنمای تصویری</button>
						<div class="ckb-wstudio-x" data-close="plan" role="button" aria-label="بستن" tabindex="0">✕</div>
					</div>
				</div>
				<div class="ckb-pe-grid">
				<div class="ckb-pe-main">
				<div class="ckb-fgroup">
					<label>فرم پلان</label>
					<select id="<?php echo esc_attr( $studio_id ); ?>-pe-shape">
						<option value="rectangular">مستطیلی استاندارد</option>
						<option value="l_shaped">L شکل (دو زون)</option>
						<option value="u_shaped">U شکل (حیاط میانی)</option>
						<option value="central_shaft">با باکس پله / آسانسور مرکزی</option>
						<option value="narrow_balcony">تراس طولی کشیده</option>
						<option value="penthouse_split">پنت‌هاوس دوبالکه</option>
					</select>
				</div>
				<div class="ckb-grid3">
					<div class="ckb-fgroup">
						<label>طول بام (متر)</label>
						<input type="number" step="0.1" min="2" max="60" id="<?php echo esc_attr( $studio_id ); ?>-pe-width" value="10">
					</div>
					<div class="ckb-fgroup">
						<label>عرض بام (متر)</label>
						<input type="number" step="0.1" min="2" max="60" id="<?php echo esc_attr( $studio_id ); ?>-pe-length" value="8">
					</div>
					<div class="ckb-fgroup">
						<label>جان‌پناه (متر)</label>
						<input type="number" step="0.1" min="0.5" max="3" id="<?php echo esc_attr( $studio_id ); ?>-pe-parapet" value="1.1">
					</div>
				</div>
				<div class="ckb-pe-sec" id="<?php echo esc_attr( $studio_id ); ?>-pe-cut-sec">فرورفتگی L / U</div>
				<div class="ckb-grid2" id="<?php echo esc_attr( $studio_id ); ?>-pe-cut-group">
					<div class="ckb-fgroup">
						<label>طول فرورفتگی (متر)</label>
						<input type="number" step="0.1" min="0" id="<?php echo esc_attr( $studio_id ); ?>-pe-cutw" placeholder="مثلاً 4.5">
					</div>
					<div class="ckb-fgroup">
						<label>عرض فرورفتگی (متر)</label>
						<input type="number" step="0.1" min="0" id="<?php echo esc_attr( $studio_id ); ?>-pe-cutl" placeholder="مثلاً 4">
					</div>
				</div>
				<div class="ckb-pe-sec" id="<?php echo esc_attr( $studio_id ); ?>-pe-shaft-sec">باکس پله / آسانسور مرکزی</div>
				<div class="ckb-grid2" id="<?php echo esc_attr( $studio_id ); ?>-pe-shaft-group">
					<div class="ckb-fgroup">
						<label>طول باکس (متر)</label>
						<input type="number" step="0.1" min="0" id="<?php echo esc_attr( $studio_id ); ?>-pe-shaftw" placeholder="مثلاً 3.2">
					</div>
					<div class="ckb-fgroup">
						<label>عرض باکس (متر)</label>
						<input type="number" step="0.1" min="0" id="<?php echo esc_attr( $studio_id ); ?>-pe-shaftl" placeholder="مثلاً 3">
					</div>
				</div>
				<div class="ckb-pe-sec">متریال و رنگ‌ها</div>
				<div class="ckb-grid3">
					<div class="ckb-fgroup">
						<label>کف‌سازی</label>
						<select id="<?php echo esc_attr( $studio_id ); ?>-pe-flooring">
							<option value="wpc_wood">دک چوب‌پلاست WPC</option>
							<option value="artificial_turf">چمن مصنوعی</option>
							<option value="stone">سنگ</option>
							<option value="ceramic">سرامیک</option>
							<option value="mixed">ترکیبی</option>
						</select>
					</div>
					<div class="ckb-fgroup">
						<label>رنگ چوب‌پلاست</label>
						<select id="<?php echo esc_attr( $studio_id ); ?>-pe-wpc">
							<option value="walnut">گردویی شکلاتی</option>
							<option value="teak">تیک طبیعی</option>
							<option value="charcoal">دودی ذغالی</option>
							<option value="oak">بلوطی روشن</option>
						</select>
					</div>
					<div class="ckb-fgroup">
						<label>رنگ فلز</label>
						<select id="<?php echo esc_attr( $studio_id ); ?>-pe-metal">
							<option value="black">مشکی مات</option>
							<option value="charcoal">طوسی متالیک</option>
							<option value="cream">کرم شنی</option>
						</select>
					</div>
				</div>
				<p style="color:#34d399;font-size:12px;font-weight:bold;margin:8px 0 14px" id="<?php echo esc_attr( $studio_id ); ?>-pe-area"></p>
				</div>
				<div class="ckb-pe-side">
					<div class="ckb-pe-blueprint" id="<?php echo esc_attr( $studio_id ); ?>-pe-blueprint"></div>
				</div>
				</div>
				<div class="ckb-pe-actions">
					<button type="button" class="ckb-catalog-btn" id="<?php echo esc_attr( $studio_id ); ?>-btn-pe-apply">اعمال پلان جدید</button>
					<button type="button" class="ckb-wstudio-btn" id="<?php echo esc_attr( $studio_id ); ?>-btn-pe-cancel">انصراف</button>
				</div>
				</div>
			</div>

		<!-- BOM Modal -->
		<div class="ckb-wstudio-modal" id="<?php echo esc_attr( $studio_id ); ?>-modal-bom">
			<div class="ckb-wstudio-modal-box" style="max-width:820px">
				<div class="ckb-wstudio-modal-head">
					<h4>فهرست اقلام و برآورد پروژه</h4>
					<div class="ckb-wstudio-head-actions">
						<button type="button" class="ckb-wstudio-btn" id="<?php echo esc_attr( $studio_id ); ?>-btn-print" title="چاپ فهرست اقلام" aria-label="چاپ فهرست اقلام">🖨 چاپ</button>
						<div class="ckb-wstudio-x" data-close="bom" role="button" aria-label="بستن" tabindex="0">✕</div>
					</div>
				</div>
				<div class="ckb-bom-stats" id="<?php echo esc_attr( $studio_id ); ?>-bom-stats"></div>
				<div class="ckb-bom-wrap">
					<table class="ckb-bom-table">
						<thead>
							<tr>
								<th>شرح کالا</th>
								<th>کد</th>
								<th style="text-align:center">تعداد</th>
								<th style="text-align:center">متراژ (م²)</th>
							</tr>
						</thead>
						<tbody id="<?php echo esc_attr( $studio_id ); ?>-bom-body"></tbody>
					</table>
				</div>
				<p style="color:#64748b;font-size:10px;margin-top:10px">قیمت‌ها تقریبی است و پس از بازدید کارشناس نهایی می‌شود.</p>
			</div>
		</div>

		<!-- Save Form Modal -->
		<div class="ckb-wstudio-modal" id="<?php echo esc_attr( $studio_id ); ?>-modal-save">
			<div class="ckb-wstudio-modal-box ckb-save-box">
				<div class="ckb-wstudio-modal-head">
					<h4>ثبت و ارسال طرح به کارشناسان</h4>
					<div class="ckb-wstudio-x" data-close="save" role="button" aria-label="بستن" tabindex="0">✕</div>
				</div>
				<!-- Live snapshot of the current design, captured when the modal opens -->
				<div class="ckb-save-shot" id="<?php echo esc_attr( $studio_id ); ?>-save-shot" hidden>
					<img id="<?php echo esc_attr( $studio_id ); ?>-save-shot-img" alt="پیش‌نمایش طرح شما">
					<button type="button" class="ckb-wstudio-btn" id="<?php echo esc_attr( $studio_id ); ?>-btn-download">⬇ دانلود تصویر طرح</button>
				</div>
				<div class="ckb-notice" id="<?php echo esc_attr( $studio_id ); ?>-save-notice"></div>
				<div class="ckb-fgroup">
					<label>نام و نام خانوادگی *</label>
					<input type="text" id="<?php echo esc_attr( $studio_id ); ?>-inp-name" placeholder="مثال: مهندس راد">
				</div>
				<div class="ckb-fgroup">
					<label>شماره تماس همراه *</label>
					<div class="ckb-otp-row">
						<input type="tel" id="<?php echo esc_attr( $studio_id ); ?>-inp-phone" dir="ltr" placeholder="09120000000" autocomplete="tel">
						<button type="button" class="ckb-otp-send-btn" id="<?php echo esc_attr( $studio_id ); ?>-btn-otp-send" hidden>ارسال کد تایید</button>
					</div>
				</div>
				<!-- کد تایید پیامکی — فقط وقتی سرویس OTP فعال باشد نمایش داده می‌شود -->
				<div class="ckb-fgroup" id="<?php echo esc_attr( $studio_id ); ?>-otp-group" hidden>
					<label>کد تایید پیامکی *</label>
					<div class="ckb-otp-row">
						<input type="tel" id="<?php echo esc_attr( $studio_id ); ?>-inp-otp" class="ckb-otp-code-input" dir="ltr" inputmode="numeric" maxlength="5" placeholder="کد ۵ رقمی" autocomplete="one-time-code">
						<button type="button" class="ckb-otp-send-btn" id="<?php echo esc_attr( $studio_id ); ?>-btn-otp-resend" hidden>ارسال مجدد</button>
					</div>
					<small class="ckb-otp-hint" id="<?php echo esc_attr( $studio_id ); ?>-otp-hint"></small>
				</div>
				<div class="ckb-fgroup">
					<label>شهر پروژه</label>
					<input type="text" id="<?php echo esc_attr( $studio_id ); ?>-inp-city" value="تهران">
				</div>
				<div class="ckb-fgroup">
					<label>توضیحات</label>
					<textarea id="<?php echo esc_attr( $studio_id ); ?>-inp-notes" rows="2" placeholder="توضیحات اختیاری..."></textarea>
				</div>
				<!-- v2.13 اعتمادسازی: دیسکلیمر مهندسی (کارت ایستا) -->
				<div class="ckb-trust-row">
					<div class="ckb-disclaimer">
						<span class="ckb-di" aria-hidden="true">🛡</span>
						<div>
							<b>نقش مهندس تأییدکننده</b>
							<p>این طرح صرفاً برای بصری‌سازی و برآورد اولیه است؛ اجرا پس از بازدید کارشناس و تأیید سازه انجام می‌شود.</p>
						</div>
					</div>
				</div>
				<button type="button" class="ckb-catalog-btn" style="width:100%;padding:11px;font-size:13px;" id="<?php echo esc_attr( $studio_id ); ?>-btn-submit">
					ارسال طرح و دریافت مشاوره
				</button>
			</div>
		</div>
	</div>

	<script>
		(function boot() {
			var sid = <?php echo wp_json_encode( $studio_id ); ?>;
			var waited = 0;
			var missing = function () {
				var parts = [];
				if (!window['CKB_CONFIG_' + sid]) parts.push('تنظیمات (CKB_CONFIG)');
				if (typeof THREE === 'undefined') parts.push('کتابخانه Three.js');
				if (!window.CKBStudio) parts.push('موتور استودیو (ckb-studio-app)');
				return parts;
			};

			function showDiag() {
				var vp = document.querySelector('#' + sid + ' .ckb-wstudio-viewport');
				if (!vp) return;
				vp.innerHTML =
					'<div style="padding:32px;text-align:center;color:#fca5a5;direction:rtl;font-weight:bold;line-height:2">' +
					'استودیو راه‌اندازی نشد — این اسکریپت‌ها توسط بهینه‌ساز سایت حذف یا مسدود شده‌اند:<br>' +
					missing().join(' ، ') +
					'<br><small style="color:#94a3b8;font-weight:normal">در افزونه بهینه‌سازی/کش (Asset CleanUp، WP Rocket، LiteSpeed و…) اسکریپت‌های ckb-* و three.min.js را برای این صفحه فعال کنید.</small>' +
					'</div>';
			}

			function start() {
				var m = missing();
				if (m.length === 0) {
					try {
						window[sid + '_app'] = window.CKBStudio.mount(sid, window['CKB_CONFIG_' + sid]);
						// Fullscreen mode: pull the container out of any transformed
						// theme/Elementor wrapper (fixed positioning breaks inside them)
						var root2 = document.getElementById(sid);
						if (root2 && root2.className.indexOf('ckb-studio-full') !== -1 && root2.parentElement !== document.body) {
							document.body.appendChild(root2);
							window.dispatchEvent(new Event('resize'));
						}
						return;
					} catch (err) {
						console.error('Chekadbam Studio Init Error:', err);
						var vp = document.querySelector('#' + sid + ' .ckb-wstudio-viewport');
						if (vp) {
							vp.innerHTML = '<div style="padding:40px;text-align:center;color:#ef4444;direction:rtl;font-weight:bold;">خطا در راه‌اندازی استودیو: ' + (err.message || err) + '</div>';
						}
						return;
					}
				}
				waited += 60;
				if (waited > 6000) { showDiag(); return; } // keep waiting quietly afterwards
				setTimeout(start, 60);
			}

			if (document.readyState === 'loading') {
				document.addEventListener('DOMContentLoaded', start);
			} else {
				start();
			}
		})();
	</script>
	<?php
}
