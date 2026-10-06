<?php
/**
 * Chekadbam 3D Viewer (WordPress) v2.
 *
 *  - [chekadbam_3d code="CK-FB-160" height="360px"] : single product 3D viewer
 *  - [chekadbam_3d_gallery category="planting" height="240px"] : gallery of viewers
 *  - Admin metabox "پیش‌نمایش سه‌بعدی" on ckb_product edit screen
 *  - AJAX ckb_save_design v2: JPEG screenshot upload, plan/BOM meta, richer email
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/* ============================ Shortcode: [chekadbam_3d] ============================ */

add_shortcode( 'chekadbam_3d', 'ckb_render_3d_shortcode' );
function ckb_render_3d_shortcode( $atts ) {
	$atts = shortcode_atts(
		array(
			'code'   => '',
			'id'     => 0,
			'height' => '360px',
			'title'  => '1',
		),
		$atts,
		'chekadbam_3d'
	);

	$product = ckb_get_viewer_product( (int) $atts['id'], (string) $atts['code'] );
	if ( ! $product ) {
		return '<div class="ckb-3d-missing">' . esc_html__( 'محصول موردنظر یافت نشد.', 'chekadbam' ) . '</div>';
	}

	return ckb_get_viewer_html( $product, $atts['height'], '1' === $atts['title'] );
}

/* ============================ Shortcode: [chekadbam_3d_gallery] ============================ */

add_shortcode( 'chekadbam_3d_gallery', 'ckb_render_3d_gallery_shortcode' );
function ckb_render_3d_gallery_shortcode( $atts ) {
	$atts = shortcode_atts(
		array(
			'category' => '',
			'height'   => '240px',
		),
		$atts,
		'chekadbam_3d_gallery'
	);

	$args = array(
		'post_type'   => 'ckb_product',
		'post_status' => 'publish',
		'numberposts' => -1,
		'orderby'     => 'title',
		'order'       => 'ASC',
	);
	if ( $atts['category'] ) {
		$args['meta_key']   = '_ckb_category';
		$args['meta_value'] = sanitize_key( $atts['category'] );
	}
	$posts = get_posts( $args );

	if ( empty( $posts ) ) {
		// Fallback: default catalog codes
		$out = '<div class="ckb-3d-gallery" dir="rtl">';
		foreach ( ckb_default_studio_products() as $prod ) {
			$out .= '<div class="ckb-3d-gallery-item">';
			$out .= '<h4>' . esc_html( $prod['name'] ) . '</h4>';
			$out .= ckb_get_viewer_html( $prod, $atts['height'], false );
			$out .= '<small>' . esc_html( $prod['code'] ) . '</small>';
			$out .= '</div>';
		}
		$out .= '</div>';
		return $out;
	}

	$out = '<div class="ckb-3d-gallery" dir="rtl">';
	foreach ( $posts as $p ) {
		$prod = array(
			'code'       => get_post_meta( $p->ID, '_ckb_code', true ) ?: ( 'CK-' . $p->ID ),
			'name'       => $p->post_title,
			'category'   => get_post_meta( $p->ID, '_ckb_category', true ) ?: 'planting',
			'w'          => (float) get_post_meta( $p->ID, '_ckb_width', true ) ?: 1.2,
			'd'          => (float) get_post_meta( $p->ID, '_ckb_depth', true ) ?: 0.5,
			'h'          => (float) get_post_meta( $p->ID, '_ckb_height', true ) ?: 0.5,
			'shape'      => get_post_meta( $p->ID, '_ckb_shape_type', true ) ?: 'box',
			'wpcColor'   => get_post_meta( $p->ID, '_ckb_wpc_color', true ) ?: 'walnut',
			'metalColor' => get_post_meta( $p->ID, '_ckb_metal_color', true ) ?: 'black',
		);
		$out .= '<div class="ckb-3d-gallery-item">';
		$out .= '<h4>' . esc_html( $prod['name'] ) . '</h4>';
		$out .= ckb_get_viewer_html( $prod, $atts['height'], false );
		$out .= '<small>' . esc_html( $prod['code'] ) . '</small>';
		$out .= '</div>';
	}
	$out .= '</div>';
	return $out;
}

/* ============================ Shared helpers ============================ */

/** Resolve product data by id or code (falls back to default catalog). */
function ckb_get_viewer_product( $post_id = 0, $code = '' ) {
	if ( $post_id ) {
		$p = get_post( $post_id );
		if ( $p && 'ckb_product' === $p->post_type ) {
			return array(
				'code'       => get_post_meta( $p->ID, '_ckb_code', true ) ?: ( 'CK-' . $p->ID ),
				'name'       => $p->post_title,
				'category'   => get_post_meta( $p->ID, '_ckb_category', true ) ?: 'planting',
				'w'          => (float) get_post_meta( $p->ID, '_ckb_width', true ) ?: 1.2,
				'd'          => (float) get_post_meta( $p->ID, '_ckb_depth', true ) ?: 0.5,
				'h'          => (float) get_post_meta( $p->ID, '_ckb_height', true ) ?: 0.5,
				'shape'      => get_post_meta( $p->ID, '_ckb_shape_type', true ) ?: 'box',
				'wpcColor'   => get_post_meta( $p->ID, '_ckb_wpc_color', true ) ?: 'walnut',
				'metalColor' => get_post_meta( $p->ID, '_ckb_metal_color', true ) ?: 'black',
			);
		}
	}

	if ( $code ) {
		$posts = get_posts(
			array(
				'post_type'   => 'ckb_product',
				'post_status' => 'publish',
				'numberposts' => 1,
				'meta_key'    => '_ckb_code',
				'meta_value'  => sanitize_text_field( $code ),
			)
		);
		if ( ! empty( $posts ) ) {
			return ckb_get_viewer_product( $posts[0]->ID );
		}
		// Fallback to default catalog by code
		foreach ( ckb_default_studio_products() as $prod ) {
			if ( $prod['code'] === $code ) {
				return $prod;
			}
		}
	}

	return null;
}

/** Viewer markup + boot script for one product. */
function ckb_get_viewer_html( $product, $height = '360px', $show_title = true ) {
	static $viewer_seq = 0;
	$viewer_seq++;

	$vid = 'ckb-3d-' . $viewer_seq . '-' . wp_rand( 100, 999 );

	wp_enqueue_style( 'ckb-studio' );
	wp_enqueue_script( 'ckb-three' );
	wp_enqueue_script( 'ckb-textures' );
	wp_enqueue_script( 'ckb-foliage' );
	wp_enqueue_script( 'ckb-models' );
	wp_enqueue_script( 'ckb-viewer' );

	wp_add_inline_script(
		'ckb-viewer',
		'(function boot(){' .
			'var el=document.getElementById(' . wp_json_encode( $vid ) . ');' .
			'if(!el||el.dataset.booted)return;' .
			'if(typeof THREE==="undefined"||!window.CKBViewer){setTimeout(boot,80);return;}' .
			'el.dataset.booted="1";' .
			'window.CKBViewer.mount(' . wp_json_encode( $vid ) . ', ' . wp_json_encode( $product ) . ');' .
		'})();'
	);

	ob_start();
	?>
	<div class="ckb-3d-viewer" id="<?php echo esc_attr( $vid ); ?>" style="height:<?php echo esc_attr( $height ); ?>;">
		<?php if ( $show_title ) : ?>
			<span class="ckb-3d-title"><?php echo esc_html( $product['name'] ); ?></span>
		<?php endif; ?>
		<span class="ckb-3d-hint">بچرخانید • زوم با اسکرول</span>
	</div>
	<?php
	return (string) ob_get_clean();
}

/* ============================ Admin metabox: 3D preview ============================ */

add_action( 'add_meta_boxes', 'ckb_add_3d_preview_metabox' );
function ckb_add_3d_preview_metabox() {
	add_meta_box(
		'ckb_3d_preview',
		__( 'پیش‌نمایش سه‌بعدی محصول', 'chekadbam' ),
		'ckb_render_3d_preview_metabox',
		'ckb_product',
		'normal',
		'default'
	);
}

function ckb_render_3d_preview_metabox( $post ) {
	// Initial frame from saved meta; the live script (admin-preview.js) then reads
	// the editor fields directly, so the model updates before saving.
	$product = array(
		'code'       => get_post_meta( $post->ID, '_ckb_code', true ) ?: ( 'CK-' . $post->ID ),
		'name'       => $post->post_title ?: __( 'پیش‌نمایش محصول', 'chekadbam' ),
		'category'   => get_post_meta( $post->ID, '_ckb_category', true ) ?: 'planting',
		'w'          => (float) get_post_meta( $post->ID, '_ckb_width', true ) ?: 1.2,
		'd'          => (float) get_post_meta( $post->ID, '_ckb_depth', true ) ?: 0.5,
		'h'          => (float) get_post_meta( $post->ID, '_ckb_height', true ) ?: 0.5,
		'shape'      => get_post_meta( $post->ID, '_ckb_shape_type', true ) ?: 'box',
		'wpcColor'   => get_post_meta( $post->ID, '_ckb_wpc_color', true ) ?: 'walnut',
		'metalColor' => get_post_meta( $post->ID, '_ckb_metal_color', true ) ?: 'black',
	);
	echo '<p class="description">' . esc_html__( 'مدل سه‌بعدی با تغییر اندازه، فرم و رنگ‌ها بلافاصله به‌روز می‌شود — بدون نیاز به ذخیره.', 'chekadbam' ) . '</p>';
	echo '<div id="ckb-admin-preview" class="ckb-admin-preview" data-product="' . esc_attr( wp_json_encode( $product ) ) . '"></div>'; // phpcs:ignore WordPress.Security.EscapeOutput
}

/* ============================ AJAX: save design v2 ============================ */

add_action( 'wp_ajax_ckb_save_design', 'ckb_wpstudio_save_design_v2' );
add_action( 'wp_ajax_nopriv_ckb_save_design', 'ckb_wpstudio_save_design_v2' );
function ckb_wpstudio_save_design_v2() {
	if ( ! isset( $_POST['nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['nonce'] ) ), 'ckb_wpstudio' ) ) {
		wp_send_json_error( 'خطای امنیتی در ارسال فرم.' );
	}

	$name   = isset( $_POST['name'] ) ? sanitize_text_field( wp_unslash( $_POST['name'] ) ) : '';
	$phone  = isset( $_POST['phone'] ) ? sanitize_text_field( wp_unslash( $_POST['phone'] ) ) : '';
	$email  = isset( $_POST['email'] ) ? sanitize_email( wp_unslash( $_POST['email'] ) ) : '';
	$city   = isset( $_POST['city'] ) ? sanitize_text_field( wp_unslash( $_POST['city'] ) ) : '';
	$shape  = isset( $_POST['shape'] ) ? sanitize_key( wp_unslash( $_POST['shape'] ) ) : 'rectangular';
	$width  = isset( $_POST['width'] ) ? floatval( $_POST['width'] ) : 0;
	$length = isset( $_POST['length'] ) ? floatval( $_POST['length'] ) : 0;
	$parapet = isset( $_POST['parapet'] ) ? floatval( $_POST['parapet'] ) : 1.1;
	$flooring = isset( $_POST['flooring'] ) ? sanitize_key( wp_unslash( $_POST['flooring'] ) ) : 'wpc_wood';
	$wpc_color = isset( $_POST['wpcColor'] ) ? sanitize_key( wp_unslash( $_POST['wpcColor'] ) ) : 'walnut';
	$metal_color = isset( $_POST['metalColor'] ) ? sanitize_key( wp_unslash( $_POST['metalColor'] ) ) : 'black';
	$notes  = isset( $_POST['notes'] ) ? sanitize_textarea_field( wp_unslash( $_POST['notes'] ) ) : '';
	$items  = isset( $_POST['itemsJson'] ) ? wp_unslash( $_POST['itemsJson'] ) : '[]';
	$plan   = isset( $_POST['planJson'] ) ? wp_unslash( $_POST['planJson'] ) : '{}';
	$bom    = isset( $_POST['bomJson'] ) ? wp_unslash( $_POST['bomJson'] ) : '{}';

	$items_arr = json_decode( (string) $items, true );
	if ( ! is_array( $items_arr ) ) {
		$items_arr = array();
	}

	// Calculate area respecting shape exclusions
	$area = $width * $length;
	if ( 'l_shaped' === $shape || 'u_shaped' === $shape ) {
		$cw = isset( $_POST['cutw'] ) ? floatval( $_POST['cutw'] ) : 0;
		$cl = isset( $_POST['cutl'] ) ? floatval( $_POST['cutl'] ) : 0;
		$area -= $cw * $cl;
	}
	if ( 'central_shaft' === $shape ) {
		$sw = isset( $_POST['shaftw'] ) ? floatval( $_POST['shaftw'] ) : 0;
		$sl = isset( $_POST['shaftl'] ) ? floatval( $_POST['shaftl'] ) : 0;
		$area -= $sw * $sl;
	}
	$area = max( 4, round( $area, 1 ) );

	$pid = wp_insert_post(
		array(
			'post_type'   => 'ckb_design',
			'post_status' => 'publish',
			'post_title'  => sprintf(
				/* translators: 1: customer name 2: date */
				__( 'طرح %1$s — %2$s', 'chekadbam' ),
				$name,
				wp_date( 'Y/m/d' )
			),
		)
	);

	if ( is_wp_error( $pid ) ) {
		wp_send_json_error( 'خطای ذخیره‌سازی در دیتابیس.' );
	}

	update_post_meta( $pid, '_ckb_customer_name', $name );
	update_post_meta( $pid, '_ckb_customer_phone', $phone );
	update_post_meta( $pid, '_ckb_customer_email', $email );
	update_post_meta( $pid, '_ckb_city', $city );
	update_post_meta( $pid, '_ckb_shape', $shape );
	update_post_meta( $pid, '_ckb_width', $width );
	update_post_meta( $pid, '_ckb_length', $length );
	update_post_meta( $pid, '_ckb_parapet', $parapet );
	update_post_meta( $pid, '_ckb_flooring', $flooring );
	update_post_meta( $pid, '_ckb_wpc_color', $wpc_color );
	update_post_meta( $pid, '_ckb_metal_color', $metal_color );
	update_post_meta( $pid, '_ckb_area', $area );
	update_post_meta( $pid, '_ckb_message', $notes );
	update_post_meta( $pid, '_ckb_items_json', wp_json_encode( $items_arr ) );
	update_post_meta( $pid, '_ckb_items_count', count( $items_arr ) );
	update_post_meta( $pid, '_ckb_plan_json', wp_json_encode( json_decode( (string) $plan, true ) ) );
	update_post_meta( $pid, '_ckb_bom_json', wp_json_encode( json_decode( (string) $bom, true ) ) );
	update_post_meta( $pid, '_ckb_status', __( 'درخواست ثبت‌شده', 'chekadbam' ) );

	// Handle the JPEG screenshot upload (data URL → uploads/ckb-designs/)
	if ( ! empty( $_POST['snapshot'] ) && is_string( $_POST['snapshot'] ) ) {
		$thumb = ckb_save_design_snapshot( wp_unslash( $_POST['snapshot'] ), $pid ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput -- validated inside
		if ( $thumb ) {
			update_post_meta( $pid, '_ckb_snapshot', $thumb );
		}
	}

	do_action( 'ckb_design_created', $pid );

	wp_send_json_success( array( 'id' => $pid ) );
}

/** Saves a base64 JPEG data URL into uploads and returns the URL (or false). */
function ckb_save_design_snapshot( $data_url, $post_id ) {
	if ( 0 !== strpos( (string) $data_url, 'data:image/jpeg;base64,' ) ) {
		return false;
	}

	$b64 = substr( $data_url, strlen( 'data:image/jpeg;base64,' ) );
	$bin = base64_decode( $b64, true );
	if ( false === $bin || strlen( $bin ) < 1000 ) {
		return false;
	}
	// Cap size at ~4MB decoded
	if ( strlen( $bin ) > 4 * MB_IN_BYTES ) {
		return false;
	}

	$upload = wp_upload_dir();
	if ( ! empty( $upload['error'] ) ) {
		return false;
	}

	$dir = trailingslashit( $upload['basedir'] ) . 'ckb-designs';
	if ( ! wp_mkdir_p( $dir ) ) {
		return false;
	}
	// Protect directory listing
	if ( ! file_exists( $dir . '/index.php' ) ) {
		@file_put_contents( $dir . '/index.php', "<?php // Silence is golden.\n" );
	}

	$filename = 'design-' . $post_id . '-' . time() . '.jpg';
	$path     = $dir . '/' . $filename;

	// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode
	if ( false === file_put_contents( $path, $bin ) ) {
		return false;
	}

	// Optional: attach to media library
	$attachment = array(
		'post_mime_type' => 'image/jpeg',
		'post_title'     => 'Chekadbam Design ' . $post_id,
		'post_content'   => '',
		'post_status'    => 'inherit',
	);
	$attach_id = wp_insert_attachment( $attachment, $path, $post_id );
	if ( ! is_wp_error( $attach_id ) ) {
		require_once ABSPATH . 'wp-admin/includes/image.php';
		wp_update_attachment_metadata( $attach_id, wp_generate_attachment_metadata( $attach_id, $path ) );
		update_post_meta( $post_id, '_ckb_snapshot_attach_id', $attach_id );
	}

	return trailingslashit( $upload['baseurl'] ) . 'ckb-designs/' . $filename;
}
