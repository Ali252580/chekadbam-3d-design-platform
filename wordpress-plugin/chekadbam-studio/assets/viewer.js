/**
 * Chekadbam Studio (WordPress) — Single-product 3D viewer.
 *
 * Powers:
 *  - [chekadbam_3d code="..."] shortcode
 *  - [chekadbam_3d_gallery] shortcode
 *  - "پیش‌نمایش سه‌بعدی" metabox on the product edit screen
 *
 * Exposes: window.CKBViewer.mount(containerId, product)
 * The product object: {code, name, w, d, h, shape, category, wpcColor, metalColor, light}
 */
(function () {
	'use strict';

	function mount(containerId, product) {
		var holder = document.getElementById(containerId);
		if (!holder || !product) return;
		if (typeof THREE === 'undefined' || !window.CKBModels) {
			holder.innerHTML =
				'<div style="padding:30px;text-align:center;color:#f87171;direction:rtl;font-weight:bold;">' +
				'کتابخانه Three.js بارگذاری نشده است.</div>';
			return;
		}

		var Models = window.CKBModels;
		var MOBILE = !!(window.matchMedia && (
			window.matchMedia('(max-width: 768px)').matches ||
			window.matchMedia('(pointer: coarse)').matches
		));
		var width = holder.clientWidth || 480;
		var height = holder.clientHeight || 320;

		var scene = new THREE.Scene();
		scene.background = new THREE.Color(0x0f172a);
		scene.fog = new THREE.FogExp2(0x0f172a, 0.02);

		var camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
		var maxDim = Math.max(product.w, product.h, product.d, 0.5);
		var dist = maxDim * 2.3 + 1.2;

		var target = new THREE.Vector3(0, product.h / 2, 0);
		var angle = Math.PI / 5;
		var elev = Math.PI / 4.2;
		var radius = dist;

		function updateCam() {
			camera.position.set(
				target.x + radius * Math.sin(elev) * Math.sin(angle),
				target.y + radius * Math.cos(elev),
				target.z + radius * Math.sin(elev) * Math.cos(angle)
			);
			camera.lookAt(target);
		}
		updateCam();

		var renderer = new THREE.WebGLRenderer({
			antialias: true,
			alpha: false,
			preserveDrawingBuffer: true,
		});
		renderer.setSize(width, height);
		renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MOBILE ? 1.5 : 2));
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		renderer.toneMapping = THREE.ACESFilmicToneMapping;
		renderer.toneMappingExposure = 1.1;
		holder.appendChild(renderer.domElement);

		// Lights — pleasant studio setup
		scene.add(new THREE.HemisphereLight(0xffffff, 0x334155, 0.85));
		var key = new THREE.DirectionalLight(0xfff4e0, 1.5);
		key.position.set(5, 8, 5);
		key.castShadow = true;
		key.shadow.mapSize.width = 1024;
		key.shadow.mapSize.height = 1024;
		scene.add(key);
		var rim = new THREE.DirectionalLight(0x93c5fd, 0.5);
		rim.position.set(-5, 4, -5);
		scene.add(rim);

		// Soft studio floor
		var ground = new THREE.Mesh(
			new THREE.CircleGeometry(maxDim * 2.4 + 1, 48),
			new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.92 })
		);
		ground.rotation.x = -Math.PI / 2;
		ground.position.y = -0.001;
		ground.receiveShadow = true;
		scene.add(ground);

		// Modular 1 m tile grid (matches the studio canvas palette)
		var grid = new THREE.GridHelper(Math.ceil(maxDim * 4), Math.ceil(maxDim * 4), 0x7dd3fc, 0x334155);
		grid.material.opacity = 0.5;
		grid.material.transparent = true;
		grid.material.depthWrite = false;
		scene.add(grid);

		// Product model holder — rebuilt by update() for live editing
		var modelHolder = new THREE.Group();
		scene.add(modelHolder);

		function setProduct(p) {
			// Dispose the previous model's GPU resources
			while (modelHolder.children.length > 0) {
				var old = modelHolder.children[0];
				modelHolder.remove(old);
				old.traverse(function (o) {
					if (o.geometry) o.geometry.dispose();
					if (o.material) {
						if (o.material.map) o.material.map.dispose();
						if (o.material.bumpMap) o.material.bumpMap.dispose();
						o.material.dispose();
					}
				});
			}

			var model = Models.buildItemModel(
				{
					id: 'viewer-' + (p.code || containerId),
					width: p.w,
					depth: p.d,
					height: p.h,
					shapeType: p.shape || 'box',
					category: p.category || 'planting',
					wpcColor: p.wpcColor,
					metalColor: p.metalColor,
					hasLighting: false,
					x: 0, z: 0, y: 0, rotation: 0,
				},
				{ isNight: false }
			);
			modelHolder.add(model);

			// Refit camera, floor and grid to the new size
			maxDim = Math.max(p.w, p.h, p.d, 0.5);
			target.set(0, p.h / 2, 0);
			radius = maxDim * 2.3 + 1.2;
			ground.geometry.dispose();
			ground.geometry = new THREE.CircleGeometry(maxDim * 2.4 + 1, 48);
			scene.remove(grid);
			grid.geometry.dispose();
			if (grid.material) grid.material.dispose();
			grid = new THREE.GridHelper(Math.ceil(maxDim * 4), Math.ceil(maxDim * 4), 0x7dd3fc, 0x334155);
			grid.material.opacity = 0.5;
			grid.material.transparent = true;
			grid.material.depthWrite = false;
			scene.add(grid);
			updateCam();
		}

		setProduct(product);

		/* Interaction: drag to orbit, wheel/pinch to zoom, auto-rotate when idle */
		var canvas = renderer.domElement;
		var isDragging = false;
		var lastX = 0;
		var lastY = 0;
		var autoRotate = true;
		var lastInteraction = 0;

		/* Pinch-to-zoom state (mobile) */
		var pointers = new Map();
		var pinch = null; // { startDist, startRadius }
		function pinchDist() {
			var pts = Array.from(pointers.values());
			return Math.hypot(pts[0].clientX - pts[1].clientX, pts[0].clientY - pts[1].clientY);
		}

		canvas.addEventListener('pointerdown', function (e) {
			pointers.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });
			if (pointers.size === 2) {
				pinch = { startDist: pinchDist(), startRadius: radius };
				isDragging = false;
				return;
			}
			isDragging = true;
			autoRotate = false;
			lastX = e.clientX;
			lastY = e.clientY;
			lastInteraction = performance.now();
			try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
		});

		canvas.addEventListener('pointermove', function (e) {
			if (pointers.has(e.pointerId)) {
				pointers.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });
			}
			if (pinch && pointers.size >= 2) {
				var dist = pinchDist();
				if (pinch.startDist > 0 && dist > 0) {
					radius = Math.max(maxDim * 1.1, Math.min(maxDim * 6, pinch.startRadius * (pinch.startDist / dist)));
					updateCam();
					lastInteraction = performance.now();
				}
				return;
			}
			if (!isDragging) return;
			angle -= (e.clientX - lastX) * 0.008;
			elev = Math.max(0.1, Math.min(Math.PI / 2 - 0.03, elev + (e.clientY - lastY) * 0.006));
			lastX = e.clientX;
			lastY = e.clientY;
			lastInteraction = performance.now();
			updateCam();
		});

		canvas.addEventListener('pointerup', function (e) {
			pointers.delete(e.pointerId);
			if (pointers.size < 2) pinch = null;
			if (pointers.size > 0) return; /* lift one finger, keep orbiting with the other */
			isDragging = false;
			try { canvas.releasePointerCapture(e.pointerId); } catch (err) {}
		});

		canvas.addEventListener('pointercancel', function (e) {
			pointers.delete(e.pointerId);
			if (pointers.size < 2) pinch = null;
			if (pointers.size === 0) isDragging = false;
		});

		/* Mobile v2.8: pointer cancel (browser gesture / palm) must not leave the
		   canvas in a dragging state — mirrors the pointerup cleanup. */
		canvas.addEventListener('pointercancel', function (e) {
			pointers.delete(e.pointerId);
			if (pointers.size < 2) pinch = null;
			if (pointers.size === 0) {
				isDragging = false;
				try { canvas.releasePointerCapture(e.pointerId); } catch (err) {}
			}
		});

		/* Mobile v2.8: double-tap to reset the view (recentre + fit) —
		   the most-missed control on phones, where there is no reset button. */
		var lastTapT = 0, lastTapX = 0, lastTapY = 0;
		canvas.addEventListener('pointerup', function (e) {
			var now = performance.now();
			if (now - lastTapT < 320 && Math.hypot(e.clientX - lastTapX, e.clientY - lastTapY) < 30) {
				angle = Math.PI / 5;
				elev = Math.PI / 4.2;
				radius = maxDim * 2.3 + 1.2;
				updateCam();
				try { if (navigator.vibrate) navigator.vibrate(15); } catch (err) {}
				lastTapT = 0;
				return;
			}
			lastTapT = now; lastTapX = e.clientX; lastTapY = e.clientY;
		});

		// Resize handling — window resize AND container resize (mobile URL bar)
		function resize() {
			var nw = holder.clientWidth || width;
			var nh = holder.clientHeight || height;
			if (!nw || !nh) return;
			camera.aspect = nw / nh;
			camera.updateProjectionMatrix();
			renderer.setSize(nw, nh);
		}
		window.addEventListener('resize', resize);
		if (typeof ResizeObserver === 'function') {
			new ResizeObserver(function () { resize(); }).observe(holder);
		}

		/* Render loop with idle auto-rotate — paused when offscreen or on a
		   hidden tab; capped to ~30 fps on mobile (pages can embed several
		   viewers, each was burning a full 60 fps loop before) */
		var viewerVisible = true;
		if (typeof IntersectionObserver === 'function') {
			new IntersectionObserver(function (entries) {
				entries.forEach(function (en) { viewerVisible = en.isIntersecting; });
			}).observe(holder);
		}
		var lastFrame = 0;

		function animate() {
			requestAnimationFrame(animate);
			if (!document.body.contains(holder)) return;
			if (document.hidden || !viewerVisible) return;
			var now = performance.now();
			if (MOBILE && now - lastFrame < 33) return;
			lastFrame = now;
			if (!isDragging && autoRotate && performance.now() - lastInteraction > 60) {
				angle += 0.006;
				updateCam();
			}
			renderer.render(scene, camera);
		}
		animate();

		/* Mobile v2.8: reveal hint once after mount, fade after first touch */
		try {
			var hint = holder.querySelector('.ckb-3d-hint');
			if (hint) {
				hint.classList.add('ckb-hint-pulse');
				canvas.addEventListener('pointerdown', function once() {
					hint.classList.add('ckb-hint-seen');
					canvas.removeEventListener('pointerdown', once);
				}, { once: true });
			}
		} catch (errHint) {}

		return {
			update: setProduct,
			screenshot: function () {
				renderer.render(scene, camera);
				try { return renderer.domElement.toDataURL('image/jpeg', 0.9); } catch (e) { return ''; }
			},
			dispose: function () {
				window.removeEventListener('resize', resize);
				renderer.dispose();
			},
		};
	}

	window.CKBViewer = { mount: mount };
})();
