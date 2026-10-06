<?php
/**
 * Admin meta boxes + save handlers for products, plans and designs.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'add_meta_boxes', 'ckb_add_meta_boxes' );
function ckb_add_meta_boxes() {
	add_meta_box( 'ckb_product_meta', __( 'مشخصات فنی قلم مدولار', 'chekadbam' ), 'ckb_render_product_meta', 'ckb_product', 'normal', 'high' );
	add_meta_box( 'ckb_plan_meta', __( 'ابعاد و فرم پلان', 'chekadbam' ), 'ckb_render_plan_meta', 'ckb_plan', 'normal', 'high' );
	add_meta_box( 'ckb_plan_items', __( 'چیدمان اقلام روی پلان', 'chekadbam' ), 'ckb_render_plan_items', 'ckb_plan', 'normal', 'core' );
	add_meta_box( 'ckb_design_meta', __( 'اطلاعات مشتری و وضعیت پیگیری', 'chekadbam' ), 'ckb_render_design_meta', 'ckb_design', 'normal', 'high' );
	add_meta_box( 'ckb_design_view', __( 'پیش‌نمایش و فهرست اقلام طرح', 'chekadbam' ), 'ckb_render_design_view', 'ckb_design', 'normal', 'core' );
}

/* ------------------------------ Product meta ------------------------------ */

function ckb_render_product_meta( $post ) {
	wp_nonce_field( 'ckb_save_product', 'ckb_product_nonce' );
	$code   = get_post_meta( $post->ID, '_ckb_code', true );
	$cat    = get_post_meta( $post->ID, '_ckb_category', true );
	$w      = get_post_meta( $post->ID, '_ckb_width', true );
	$d      = get_post_meta( $post->ID, '_ckb_depth', true );
	$h      = get_post_meta( $post->ID, '_ckb_height', true );
	$weight = get_post_meta( $post->ID, '_ckb_weight', true );
	$price  = get_post_meta( $post->ID, '_ckb_price', true );
	$shape  = get_post_meta( $post->ID, '_ckb_shape_type', true );
	$wpc    = get_post_meta( $post->ID, '_ckb_wpc_color', true );
	$metal  = get_post_meta( $post->ID, '_ckb_metal_color', true );
	$light  = get_post_meta( $post->ID, '_ckb_has_lighting', true );
	?>
	<table class="form-table ckb-form">
		<tr>
			<th><?php esc_html_e( 'کد فنی', 'chekadbam' ); ?></th>
			<td><input type="text" name="ckb_code" value="<?php echo esc_attr( $code ); ?>" placeholder="CK-FB-160" dir="ltr" class="regular-text" /></td>
		</tr>
		<tr>
			<th><?php esc_html_e( 'دسته‌بندی', 'chekadbam' ); ?></th>
			<td>
				<select name="ckb_category">
					<?php foreach ( ckb_product_categories() as $k => $label ) : ?>
						<option value="<?php echo esc_attr( $k ); ?>" <?php selected( $cat, $k ); ?>><?php echo esc_html( $label ); ?></option>
					<?php endforeach; ?>
				</select>
			</td>
		</tr>
		<tr>
			<th><?php esc_html_e( 'نوع شکل سه‌بعدی', 'chekadbam' ); ?></th>
			<td>
				<select name="ckb_shape_type">
					<?php foreach ( ckb_shape_types() as $k => $label ) : ?>
						<option value="<?php echo esc_attr( $k ); ?>" <?php selected( $shape, $k ); ?>><?php echo esc_html( $label ); ?></option>
					<?php endforeach; ?>
				</select>
			</td>
		</tr>
		<tr>
			<th><label for="ckb_width"><?php esc_html_e( 'طول (متر)', 'chekadbam' ); ?></label></th>
			<td><input type="number" step="0.01" min="0" id="ckb_width" name="ckb_width" value="<?php echo esc_attr( $w ); ?>" dir="ltr" class="small-text" /> <span class="description">مثلاً 1.60</span></td>
		</tr>
		<tr>
			<th><label for="ckb_depth"><?php esc_html_e( 'عرض (متر)', 'chekadbam' ); ?></label></th>
			<td><input type="number" step="0.01" min="0" id="ckb_depth" name="ckb_depth" value="<?php echo esc_attr( $d ); ?>" dir="ltr" class="small-text" /> <span class="description">مثلاً 0.50</span></td>
		</tr>
		<tr>
			<th><label for="ckb_height"><?php esc_html_e( 'ارتفاع (متر)', 'chekadbam' ); ?></label></th>
			<td><input type="number" step="0.01" min="0" id="ckb_height" name="ckb_height" value="<?php echo esc_attr( $h ); ?>" dir="ltr" class="small-text" /> <span class="description">مثلاً 0.55</span></td>
		</tr>
		<tr>
			<th><?php esc_html_e( 'وزن (کیلوگرم)', 'chekadbam' ); ?></th>
			<td><input type="number" step="0.1" name="ckb_weight" value="<?php echo esc_attr( $weight ); ?>" /></td>
		</tr>
		<tr>
			<th><?php esc_html_e( 'قیمت تقریبی (تومان)', 'chekadbam' ); ?></th>
			<td><input type="number" step="100000" name="ckb_price" value="<?php echo esc_attr( $price ); ?>" dir="ltr" /></td>
		</tr>
		<tr>
			<th><?php esc_html_e( 'رنگ چوب‌پلاست', 'chekadbam' ); ?></th>
			<td>
				<select name="ckb_wpc_color">
					<?php foreach ( ckb_wpc_colors() as $k => $label ) : ?>
						<option value="<?php echo esc_attr( $k ); ?>" <?php selected( $wpc, $k ); ?>><?php echo esc_html( $label ); ?></option>
					<?php endforeach; ?>
				</select>
			</td>
		</tr>
		<tr>
			<th><?php esc_html_e( 'رنگ فلز', 'chekadbam' ); ?></th>
			<td>
				<select name="ckb_metal_color">
					<?php foreach ( ckb_metal_colors() as $k => $label ) : ?>
						<option value="<?php echo esc_attr( $k ); ?>" <?php selected( $metal, $k ); ?>><?php echo esc_html( $label ); ?></option>
					<?php endforeach; ?>
				</select>
			</td>
		</tr>
		<tr>
			<th><?php esc_html_e( 'نورپردازی شبانه', 'chekadbam' ); ?></th>
			<td><label><input type="checkbox" name="ckb_has_lighting" value="1" <?php checked( $light, '1' ); ?> /> <?php esc_html_e( 'دارای نور مخفی / اسپات', 'chekadbam' ); ?></label></td>
		</tr>
	</table>
	<p class="description"><?php esc_html_e( 'تصویر محصول را از «تصویر شاخص» سمت چپ تنظیم کنید؛ توضیح کوتاه در «چکیده» و توضیح کامل در محتوای نوشته.', 'chekadbam' ); ?></p>
	<?php
}

/* ------------------------------ Plan meta ------------------------------ */

function ckb_render_plan_meta( $post ) {
	wp_nonce_field( 'ckb_save_plan', 'ckb_plan_nonce' );
	$shape = get_post_meta( $post->ID, '_ckb_plan_shape', true );
	$w     = get_post_meta( $post->ID, '_ckb_plan_width', true );
	$l     = get_post_meta( $post->ID, '_ckb_plan_length', true );
	$par   = get_post_meta( $post->ID, '_ckb_parapet', true );
	$cw    = get_post_meta( $post->ID, '_ckb_cutout_width', true );
	$cl    = get_post_meta( $post->ID, '_ckb_cutout_length', true );
	$sw    = get_post_meta( $post->ID, '_ckb_shaft_width', true );
	$sl    = get_post_meta( $post->ID, '_ckb_shaft_length', true );
	$floor = get_post_meta( $post->ID, '_ckb_flooring', true );
	$wpc   = get_post_meta( $post->ID, '_ckb_wpc_color', true );
	$metal = get_post_meta( $post->ID, '_ckb_metal_color', true );
	?>
	<table class="form-table ckb-form">
		<tr>
			<th><?php esc_html_e( 'فرم پلان', 'chekadbam' ); ?></th>
			<td>
				<select name="ckb_plan_shape">
					<?php foreach ( ckb_plan_shapes() as $k => $label ) : ?>
						<option value="<?php echo esc_attr( $k ); ?>" <?php selected( $shape, $k ); ?>><?php echo esc_html( $label ); ?></option>
					<?php endforeach; ?>
				</select>
			</td>
		</tr>
		<tr>
			<th><?php esc_html_e( 'ابعاد کلی (متر)', 'chekadbam' ); ?></th>
			<td class="ckb-inline">
				<label><?php esc_html_e( 'طول', 'chekadbam' ); ?> <input type="number" step="0.1" name="ckb_plan_width" value="<?php echo esc_attr( $w ); ?>" /></label>
				<label><?php esc_html_e( 'عرض', 'chekadbam' ); ?> <input type="number" step="0.1" name="ckb_plan_length" value="<?php echo esc_attr( $l ); ?>" /></label>
				<label><?php esc_html_e( 'جان‌پناه', 'chekadbam' ); ?> <input type="number" step="0.1" name="ckb_parapet" value="<?php echo esc_attr( $par ); ?>" /></label>
			</td>
		</tr>
		<tr>
			<th><?php esc_html_e( 'فرورفتگی L/U (متر)', 'chekadbam' ); ?></th>
			<td class="ckb-inline">
				<label><?php esc_html_e( 'طول', 'chekadbam' ); ?> <input type="number" step="0.1" name="ckb_cutout_width" value="<?php echo esc_attr( $cw ); ?>" /></label>
				<label><?php esc_html_e( 'عرض', 'chekadbam' ); ?> <input type="number" step="0.1" name="ckb_cutout_length" value="<?php echo esc_attr( $cl ); ?>" /></label>
			</td>
		</tr>
		<tr>
			<th><?php esc_html_e( 'باکس پله مرکزی (متر)', 'chekadbam' ); ?></th>
			<td class="ckb-inline">
				<label><?php esc_html_e( 'طول', 'chekadbam' ); ?> <input type="number" step="0.1" name="ckb_shaft_width" value="<?php echo esc_attr( $sw ); ?>" /></label>
				<label><?php esc_html_e( 'عرض', 'chekadbam' ); ?> <input type="number" step="0.1" name="ckb_shaft_length" value="<?php echo esc_attr( $sl ); ?>" /></label>
			</td>
		</tr>
		<tr>
			<th><?php esc_html_e( 'کف‌سازی', 'chekadbam' ); ?></th>
			<td>
				<strong><?php esc_html_e( 'دک چوب‌پلاست (WPC شیاردار)', 'chekadbam' ); ?></strong>
				<input type="hidden" name="ckb_flooring" value="wpc_wood" />
				<input type="hidden" name="ckb_wpc_color" value="walnut" />
				<input type="hidden" name="ckb_metal_color" value="black" />
				<p class="description"><?php esc_html_e( 'کف‌پوش استاندارد روف‌گاردن چکادبام به صورت دک چوب‌پلاست شیاردار ضدلغزش اجرا می‌شود.', 'chekadbam' ); ?></p>
			</td>
		</tr>
	</table>
	<?php
}

function ckb_render_plan_items( $post ) {
	$items_json = get_post_meta( $post->ID, '_ckb_plan_items', true );
	$items      = json_decode( (string) $items_json, true );
	if ( ! is_array( $items ) ) {
		$items = array();
	}
	?>
	<input type="hidden" name="ckb_plan_items" id="ckb-plan-items-input" value="<?php echo esc_attr( $items_json ); ?>" />
	<div id="ckb-plan-items" data-items="<?php echo esc_attr( $items_json ); ?>">
		<table class="widefat ckb-table" id="ckb-items-table">
			<thead>
				<tr>
					<th><?php esc_html_e( 'قلم مدولار', 'chekadbam' ); ?></th>
					<th style="width:110px"><?php esc_html_e( 'ابعاد (طول×عرض×ارتفاع m)', 'chekadbam' ); ?></th>
					<th style="width:70px">X (m)</th>
					<th style="width:70px">Z (m)</th>
					<th style="width:80px"><?php esc_html_e( 'چرخش', 'chekadbam' ); ?></th>
					<th style="width:50px"></th>
				</tr>
			</thead>
			<tbody id="ckb-items-rows"></tbody>
		</table>
		<p>
			<button type="button" class="button" id="ckb-add-item">+ <?php esc_html_e( 'افزودن قلم به چیدمان', 'chekadbam' ); ?></button>
			<span class="description"><?php esc_html_e( 'موقعیت X/Z بر حسب متر از مرکز پلان؛ اقلام در استودیو داخل نقشه محدود می‌شوند.', 'chekadbam' ); ?></span>
		</p>
	</div>
	<?php
}

/* ------------------------------ Design meta ------------------------------ */

function ckb_render_design_meta( $post ) {
	wp_nonce_field( 'ckb_save_design', 'ckb_design_nonce' );
	$name   = get_post_meta( $post->ID, '_ckb_customer_name', true );
	$phone  = get_post_meta( $post->ID, '_ckb_customer_phone', true );
	$email  = get_post_meta( $post->ID, '_ckb_customer_email', true );
	$city   = get_post_meta( $post->ID, '_ckb_city', true );
	$stype  = get_post_meta( $post->ID, '_ckb_space_type', true );
	$shape  = get_post_meta( $post->ID, '_ckb_shape', true );
	$w      = get_post_meta( $post->ID, '_ckb_width', true );
	$l      = get_post_meta( $post->ID, '_ckb_length', true );
	$area   = get_post_meta( $post->ID, '_ckb_area', true );
	$status = get_post_meta( $post->ID, '_ckb_status', true );
	$notes  = get_post_meta( $post->ID, '_ckb_expert_notes', true );
	$msg    = get_post_meta( $post->ID, '_ckb_message', true );
	?>
	<table class="form-table ckb-form">
		<tr>
			<th><?php esc_html_e( 'مشتری', 'chekadbam' ); ?></th>
			<td>
				<strong><?php echo esc_html( $name ); ?></strong>
				&nbsp; <a dir="ltr" href="tel:<?php echo esc_attr( $phone ); ?>">📞 <?php echo esc_html( $phone ); ?></a>
				<?php if ( $phone ) : ?>
					&nbsp; <a dir="ltr" target="_blank" href="https://wa.me/98<?php echo esc_attr( ltrim( (string) $phone, '0' ) ); ?>">💬 واتساپ</a>
				<?php endif; ?>
				<?php if ( $email ) : ?>
					&nbsp; <a href="mailto:<?php echo esc_attr( $email ); ?>">✉️ <?php echo esc_html( $email ); ?></a>
				<?php endif; ?>
			</td>
		</tr>
		<tr>
			<th><?php esc_html_e( 'مشخصات فضا', 'chekadbam' ); ?></th>
			<td>
				<?php echo esc_html( $city ); ?> • <?php echo esc_html( $stype ); ?> • <?php echo esc_html( $shape ); ?>
				• <?php echo esc_html( $w ); ?>×<?php echo esc_html( $l ); ?> m
				• <strong><?php echo esc_html( $area ); ?> m²</strong>
			</td>
		</tr>
		<?php if ( $msg ) : ?>
		<tr>
			<th><?php esc_html_e( 'توضیح مشتری', 'chekadbam' ); ?></th>
			<td><?php echo esc_html( $msg ); ?></td>
		</tr>
		<?php endif; ?>
		<tr>
			<th><?php esc_html_e( 'وضعیت پیگیری', 'chekadbam' ); ?></th>
			<td>
				<select name="ckb_status">
					<?php foreach ( ckb_design_statuses() as $s ) : ?>
						<option value="<?php echo esc_attr( $s ); ?>" <?php selected( $status, $s ); ?>><?php echo esc_html( $s ); ?></option>
					<?php endforeach; ?>
				</select>
			</td>
		</tr>
		<tr>
			<th><?php esc_html_e( 'یادداشت کارشناس', 'chekadbam' ); ?></th>
			<td><textarea name="ckb_expert_notes" rows="3" class="large-text"><?php echo esc_textarea( $notes ); ?></textarea></td>
		</tr>
	</table>
	<?php
}

function ckb_render_design_view( $post ) {
	$snapshot = get_post_meta( $post->ID, '_ckb_snapshot', true );
	$json     = get_post_meta( $post->ID, '_ckb_items_json', true );
	$items    = json_decode( (string) $json, true );
	if ( ! is_array( $items ) ) {
		$items = array();
	}
	?>
	<?php if ( $snapshot ) : ?>
		<p><img src="<?php echo esc_url( $snapshot ); ?>" alt="" style="max-width:480px;width:100%;border-radius:10px;border:1px solid #dcdcde;" /></p>
	<?php else : ?>
		<p class="description"><?php esc_html_e( 'تصویر پیش‌نمایشی ثبت نشده است.', 'chekadbam' ); ?></p>
	<?php endif; ?>

	<h4><?php esc_html_e( 'اقلام چیده‌شده در طرح', 'chekadbam' ); ?> (<?php echo esc_html( count( $items ) ); ?>)</h4>
	<table class="widefat striped ckb-table">
		<thead>
			<tr>
				<th>#</th>
				<th><?php esc_html_e( 'نام قلم', 'chekadbam' ); ?></th>
				<th>X</th>
				<th>Z</th>
				<th><?php esc_html_e( 'چرخش', 'chekadbam' ); ?></th>
			</tr>
		</thead>
		<tbody>
		<?php if ( empty( $items ) ) : ?>
			<tr><td colspan="5"><?php esc_html_e( 'اقلامی ثبت نشده است.', 'chekadbam' ); ?></td></tr>
		<?php else : ?>
			<?php foreach ( $items as $i => $it ) : ?>
				<tr>
					<td><?php echo esc_html( $i + 1 ); ?></td>
					<td><?php echo esc_html( $it['name'] ?? '—' ); ?></td>
					<td><?php echo esc_html( $it['x'] ?? 0 ); ?></td>
					<td><?php echo esc_html( $it['z'] ?? 0 ); ?></td>
					<td><?php echo esc_html( $it['rotation'] ?? 0 ); ?>°</td>
				</tr>
			<?php endforeach; ?>
		<?php endif; ?>
		</tbody>
	</table>
	<?php
}

/* ------------------------------ Save handlers ------------------------------ */

add_action( 'save_post_ckb_product', 'ckb_save_product' );
function ckb_save_product( $post_id ) {
	if ( ! isset( $_POST['ckb_product_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['ckb_product_nonce'] ) ), 'ckb_save_product' ) ) {
		return;
	}
	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
		return;
	}
	if ( ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}

	$code   = isset( $_POST['ckb_code'] ) ? sanitize_text_field( wp_unslash( $_POST['ckb_code'] ) ) : '';
	$cat    = isset( $_POST['ckb_category'] ) ? sanitize_key( $_POST['ckb_category'] ) : 'planting';
	$shape  = isset( $_POST['ckb_shape_type'] ) ? sanitize_key( $_POST['ckb_shape_type'] ) : 'box';
	$w      = isset( $_POST['ckb_width'] ) ? floatval( $_POST['ckb_width'] ) : 0;
	$d      = isset( $_POST['ckb_depth'] ) ? floatval( $_POST['ckb_depth'] ) : 0;
	$h      = isset( $_POST['ckb_height'] ) ? floatval( $_POST['ckb_height'] ) : 0;
	$weight = isset( $_POST['ckb_weight'] ) ? floatval( $_POST['ckb_weight'] ) : 0;
	$price  = isset( $_POST['ckb_price'] ) ? intval( $_POST['ckb_price'] ) : 0;
	$wpc    = isset( $_POST['ckb_wpc_color'] ) ? sanitize_key( $_POST['ckb_wpc_color'] ) : 'walnut';
	$metal  = isset( $_POST['ckb_metal_color'] ) ? sanitize_key( $_POST['ckb_metal_color'] ) : 'black';
	$light  = ! empty( $_POST['ckb_has_lighting'] ) ? '1' : '0';

	update_post_meta( $post_id, '_ckb_code', $code );
	update_post_meta( $post_id, '_ckb_category', $cat );
	update_post_meta( $post_id, '_ckb_shape_type', $shape );
	update_post_meta( $post_id, '_ckb_width', $w );
	update_post_meta( $post_id, '_ckb_depth', $d );
	update_post_meta( $post_id, '_ckb_height', $h );
	update_post_meta( $post_id, '_ckb_weight', $weight );
	update_post_meta( $post_id, '_ckb_price', $price );
	update_post_meta( $post_id, '_ckb_wpc_color', $wpc );
	update_post_meta( $post_id, '_ckb_metal_color', $metal );
	update_post_meta( $post_id, '_ckb_has_lighting', $light );
}

add_action( 'save_post_ckb_plan', 'ckb_save_plan' );
function ckb_save_plan( $post_id ) {
	if ( ! isset( $_POST['ckb_plan_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['ckb_plan_nonce'] ) ), 'ckb_save_plan' ) ) {
		return;
	}
	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
		return;
	}
	if ( ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}

	$shape = isset( $_POST['ckb_plan_shape'] ) ? sanitize_key( $_POST['ckb_plan_shape'] ) : 'rectangular';
	$w     = isset( $_POST['ckb_plan_width'] ) ? floatval( $_POST['ckb_plan_width'] ) : 10;
	$l     = isset( $_POST['ckb_plan_length'] ) ? floatval( $_POST['ckb_plan_length'] ) : 8;
	$par   = isset( $_POST['ckb_parapet'] ) ? floatval( $_POST['ckb_parapet'] ) : 1.1;
	$cw    = isset( $_POST['ckb_cutout_width'] ) ? floatval( $_POST['ckb_cutout_width'] ) : 0;
	$cl    = isset( $_POST['ckb_cutout_length'] ) ? floatval( $_POST['ckb_cutout_length'] ) : 0;
	$sw    = isset( $_POST['ckb_shaft_width'] ) ? floatval( $_POST['ckb_shaft_width'] ) : 0;
	$sl    = isset( $_POST['ckb_shaft_length'] ) ? floatval( $_POST['ckb_shaft_length'] ) : 0;

	update_post_meta( $post_id, '_ckb_plan_shape', $shape );
	update_post_meta( $post_id, '_ckb_plan_width', $w );
	update_post_meta( $post_id, '_ckb_plan_length', $l );
	update_post_meta( $post_id, '_ckb_parapet', $par );
	update_post_meta( $post_id, '_ckb_cutout_width', $cw );
	update_post_meta( $post_id, '_ckb_cutout_length', $cl );
	update_post_meta( $post_id, '_ckb_shaft_width', $sw );
	update_post_meta( $post_id, '_ckb_shaft_length', $sl );
	update_post_meta( $post_id, '_ckb_flooring', 'wpc_wood' );
	update_post_meta( $post_id, '_ckb_wpc_color', 'walnut' );
	update_post_meta( $post_id, '_ckb_metal_color', 'black' );

	$raw = isset( $_POST['ckb_plan_items'] ) ? wp_unslash( $_POST['ckb_plan_items'] ) : '[]';
	$arr = json_decode( (string) $raw, true );
	if ( is_array( $arr ) ) {
		$clean = array();
		foreach ( $arr as $it ) {
			$clean[] = array(
				'productId' => sanitize_text_field( $it['productId'] ?? '' ),
				'name'      => sanitize_text_field( $it['name'] ?? '' ),
				'x'         => floatval( $it['x'] ?? 0 ),
				'z'         => floatval( $it['z'] ?? 0 ),
				'rotation'  => floatval( $it['rotation'] ?? 0 ),
				'w'         => floatval( $it['w'] ?? 0 ),
				'd'         => floatval( $it['d'] ?? 0 ),
				'h'         => floatval( $it['h'] ?? 0 ),
			);
		}
		update_post_meta( $post_id, '_ckb_plan_items', wp_json_encode( $clean ) );
	}
}

add_action( 'save_post_ckb_design', 'ckb_save_design' );
function ckb_save_design( $post_id ) {
	if ( ! isset( $_POST['ckb_design_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['ckb_design_nonce'] ) ), 'ckb_save_design' ) ) {
		return;
	}
	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
		return;
	}
	if ( ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}

	$status = isset( $_POST['ckb_status'] ) ? sanitize_text_field( wp_unslash( $_POST['ckb_status'] ) ) : '';
	$notes  = isset( $_POST['ckb_expert_notes'] ) ? sanitize_textarea_field( wp_unslash( $_POST['ckb_expert_notes'] ) ) : '';

	update_post_meta( $post_id, '_ckb_status', $status );
	update_post_meta( $post_id, '_ckb_expert_notes', $notes );
}
