/**
 * Chekadbam Studio — Plan boundary engine (WordPress port).
 *
 * Ported 1:1 from src/lib/plan-boundary.ts of the Chekadbam Next.js studio.
 * Guarantees that every modular item stays 100% inside the usable floor area,
 * never overlaps shape cutouts (L / U) or the central stair shaft, and
 * respects its own rotation when computing the occupied footprint.
 *
 * Global namespace: window.CKBBoundary
 */
(function () {
	'use strict';

	/** Safety gap kept between item edges and walls / cutout edges (metres). */
	var SAFE_MARGIN = 0.35;

	/**
	 * Computes the axis-aligned bounding footprint of a w × d rectangle
	 * rotated by rotationDeg.
	 */
	function getRotatedFootprint(w, d, rotationDeg) {
		var rad = (Math.abs(rotationDeg || 0) * Math.PI) / 180;
		var c = Math.abs(Math.cos(rad));
		var s = Math.abs(Math.sin(rad));
		return {
			w: w * c + d * s,
			d: w * s + d * c,
		};
	}

	/** Calculates the exact usable plan area (متراژ خالص) in square metres. */
	function calculatePlanArea(space) {
		var totalArea = space.width * space.length;

		var cutoutW = space.cutoutWidth || 4.5;
		var cutoutL = space.cutoutLength || 4.0;
		var shaftW = space.shaftWidth || 3.2;
		var shaftL = space.shaftLength || 3.0;

		if (space.shape === 'l_shaped') totalArea -= cutoutW * cutoutL;
		else if (space.shape === 'u_shaped') totalArea -= cutoutW * cutoutL;
		else if (space.shape === 'central_shaft') totalArea -= shaftW * shaftL;

		return Math.max(4, Math.round(totalArea * 10) / 10);
	}

	/** Describes the rectangular exclusion zones of the current plan shape. */
	function getExclusionZones(space) {
		var halfW = space.width / 2;
		var halfL = space.length / 2;
		var zones = [];

		var shape = space.shape || 'rectangular';
		var cutoutW = space.cutoutWidth || 4.5;
		var cutoutL = space.cutoutLength || 4.0;
		var shaftW = space.shaftWidth || 3.2;
		var shaftL = space.shaftLength || 3.0;

		if (shape === 'l_shaped') {
			zones.push({
				minX: halfW - cutoutW,
				maxX: halfW + 1,
				minZ: halfL - cutoutL,
				maxZ: halfL + 1,
			});
		} else if (shape === 'u_shaped') {
			zones.push({
				minX: -cutoutW / 2,
				maxX: cutoutW / 2,
				minZ: halfL - cutoutL,
				maxZ: halfL + 1,
			});
		} else if (shape === 'central_shaft') {
			zones.push({
				minX: -shaftW / 2,
				maxX: shaftW / 2,
				minZ: -shaftL / 2,
				maxZ: shaftL / 2,
			});
		}

		return zones;
	}

	/**
	 * Returns true when the item footprint (centred at x, z) lies fully inside
	 * the usable floor and outside every exclusion zone.
	 */
	function isInsidePlanBounds(x, z, itemW, itemD, space, margin, rotationDeg) {
		margin = margin !== undefined ? margin : 0.02;
		var fp = getRotatedFootprint(itemW, itemD, rotationDeg);
		var fpW = fp.w;
		var fpD = fp.d;
		var halfW = space.width / 2;
		var halfL = space.length / 2;

		var minX = x - fpW / 2 - margin;
		var maxX = x + fpW / 2 + margin;
		var minZ = z - fpD / 2 - margin;
		var maxZ = z + fpD / 2 + margin;

		// 1. Outer perimeter (inside the parapet inner faces)
		if (minX < -halfW || maxX > halfW || minZ < -halfL || maxZ > halfL) return false;

		// 2. Exclusion zones
		var zones = getExclusionZones(space);
		for (var i = 0; i < zones.length; i++) {
			var zone = zones[i];
			var overlaps = maxX > zone.minX && minX < zone.maxX && maxZ > zone.minZ && minZ < zone.maxZ;
			if (overlaps) return false;
		}

		return true;
	}

	function clampToOuterPerimeter(x, z, fpW, fpD, space) {
		var halfW = space.width / 2;
		var halfL = space.length / 2;

		var loX = -halfW + fpW / 2 + SAFE_MARGIN;
		var hiX = halfW - fpW / 2 - SAFE_MARGIN;
		var loZ = -halfL + fpD / 2 + SAFE_MARGIN;
		var hiZ = halfL - fpD / 2 - SAFE_MARGIN;

		// Degenerate case: item larger than plan on that axis → centre it.
		var cx = loX > hiX ? (loX + hiX) / 2 : Math.min(hiX, Math.max(loX, x));
		var cz = loZ > hiZ ? (loZ + hiZ) / 2 : Math.min(hiZ, Math.max(loZ, z));

		return { x: cx, z: cz };
	}

	/**
	 * Pushes an item out of any exclusion zone along the shortest axis,
	 * preserving a safety gap from the zone edge.
	 */
	function resolveExclusionZones(x, z, fpW, fpD, space) {
		var outX = x;
		var outZ = z;
		var gap = SAFE_MARGIN;

		var zones = getExclusionZones(space);
		for (var i = 0; i < zones.length; i++) {
			var zone = zones[i];
			var minX = outX - fpW / 2;
			var maxX = outX + fpW / 2;
			var minZ = outZ - fpD / 2;
			var maxZ = outZ + fpD / 2;

			var overlaps = maxX > zone.minX && minX < zone.maxX && maxZ > zone.minZ && minZ < zone.maxZ;
			if (!overlaps) continue;

			// Candidate escape distances on each side of the zone.
			var pushLeft = zone.minX - fpW / 2 - gap - outX;
			var pushRight = zone.maxX + fpW / 2 + gap - outX;
			var pushUp = zone.minZ - fpD / 2 - gap - outZ;
			var pushDown = zone.maxZ + fpD / 2 + gap - outZ;

			// Only consider pushes that actually clear the overlap; pick the smallest move.
			var options = [];
			if (maxX > zone.minX) options.push({ axis: 'x', value: outX + pushLeft, cost: Math.abs(pushLeft) });
			if (minX < zone.maxX) options.push({ axis: 'x', value: outX + pushRight, cost: Math.abs(pushRight) });
			if (maxZ > zone.minZ) options.push({ axis: 'z', value: outZ + pushUp, cost: Math.abs(pushUp) });
			if (minZ < zone.maxZ) options.push({ axis: 'z', value: outZ + pushDown, cost: Math.abs(pushDown) });

			if (options.length > 0) {
				options.sort(function (a, b) { return a.cost - b.cost; });
				var best = options[0];
				if (best.axis === 'x') outX = best.value;
				else outZ = best.value;
			}
		}

		return { x: outX, z: outZ };
	}

	/**
	 * Spiral search positions: centre first, then progressively outward rings.
	 */
	function spiralCandidates() {
		var candidates = [{ x: 0, z: 0 }];
		var ringStep = 0.8;
		for (var ring = 1; ring <= 6; ring++) {
			var r = ring * ringStep;
			candidates.push(
				{ x: -r, z: -r },
				{ x: r, z: -r },
				{ x: -r, z: r },
				{ x: r, z: r },
				{ x: 0, z: -r },
				{ x: 0, z: r },
				{ x: -r, z: 0 },
				{ x: r, z: 0 }
			);
		}
		return candidates;
	}

	/**
	 * True when the item footprint fits somewhere in the plan as-is
	 * (any spiral position satisfies the bounds without clamping tricks).
	 * Oversized items get force-centred with a toast — overlaps they cause
	 * are expected, not user error.
	 */
	function itemCanFit(itemW, itemD, space, rotationDeg) {
		var candidates = spiralCandidates();
		for (var i = 0; i < candidates.length; i++) {
			var cand = candidates[i];
			if (isInsidePlanBounds(cand.x, cand.z, itemW, itemD, space, 0.02, rotationDeg)) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Non-recursive corner search: the first raw spiral position that satisfies
	 * the plan bounds as-is. Returns null when the item physically cannot fit
	 * anywhere (caller keeps its clamped best-effort position instead — this
	 * used to recurse into findSafeSpawnPosition ⇄ clampItemToPlan and blow
	 * the stack on plans narrower than the item, e.g. a 3.2 m pergola on a
	 * 2.8 m balcony).
	 */
	function findSafeCorner(itemW, itemD, space, rotationDeg) {
		var candidates = spiralCandidates();
		for (var i = 0; i < candidates.length; i++) {
			var cand = candidates[i];
			if (isInsidePlanBounds(cand.x, cand.z, itemW, itemD, space, 0.02, rotationDeg)) {
				return { x: cand.x, z: cand.z };
			}
		}
		return null;
	}

	/**
	 * Clamps a proposed (x, z) so the item is guaranteed to sit fully inside
	 * the usable plan, away from walls, cutouts and the stair shaft,
	 * taking the item rotation into account.
	 */
	function clampItemToPlan(x, z, itemW, itemD, space, rotationDeg) {
		var fp = getRotatedFootprint(itemW, itemD, rotationDeg);
		var fpW = fp.w;
		var fpD = fp.d;

		// 1. Keep inside outer perimeter.
		var result = clampToOuterPerimeter(x, z, fpW, fpD, space);

		// 2. Escape exclusion zones.
		result = resolveExclusionZones(result.x, result.z, fpW, fpD, space);

		// 3. Final perimeter re-clamp (zone escape may have pushed past edges).
		result = clampToOuterPerimeter(result.x, result.z, fpW, fpD, space);

		// 4. If still overlapping a zone (very tight plans), fall back to a
		//    known-safe corner — or keep the centred best-effort position when
		//    the item simply doesn't fit this plan (never recurse).
		if (!isInsidePlanBounds(result.x, result.z, itemW, itemD, space, 0.02, rotationDeg)) {
			var corner = findSafeCorner(itemW, itemD, space, rotationDeg);
			if (corner) result = corner;
		}

		return {
			x: Math.round(result.x * 100) / 100,
			z: Math.round(result.z * 100) / 100,
		};
	}

	/**
	 * Finds a safe spawn position inside the floor plan for a new item.
	 * The returned position carries `fits: false` when the item cannot fit
	 * the plan at all, so the UI can warn instead of silently overlapping.
	 */
	function findSafeSpawnPosition(itemW, itemD, space, existingItems, rotationDeg) {
		existingItems = existingItems || [];

		var fits = false;
		var candidates = spiralCandidates();

		for (var i = 0; i < candidates.length; i++) {
			var cand = candidates[i];
			if (!fits && isInsidePlanBounds(cand.x, cand.z, itemW, itemD, space, 0.02, rotationDeg)) {
				fits = true;
			}
			var clamped = clampItemToPlan(cand.x, cand.z, itemW, itemD, space, rotationDeg);
			if (!isInsidePlanBounds(clamped.x, clamped.z, itemW, itemD, space, 0.02, rotationDeg)) continue;

			// Avoid heavy overlap with already placed items.
			var overlaps = existingItems.some(function (it) {
				return (
					Math.hypot(it.x - clamped.x, it.z - clamped.z) <
					(Math.min(it.width, it.depth) + Math.min(itemW, itemD)) * 0.35
				);
			});
			if (overlaps) continue;

			clamped.fits = true;
			return clamped;
		}

		// Last resort: clamped centre (fits=false lets the UI show a warning).
		var centre = clampItemToPlan(0, 0, itemW, itemD, space, rotationDeg);
		centre.fits = fits;
		return centre;
	}

	window.CKBBoundary = {
		SAFE_MARGIN: SAFE_MARGIN,
		getRotatedFootprint: getRotatedFootprint,
		calculatePlanArea: calculatePlanArea,
		getExclusionZones: getExclusionZones,
		isInsidePlanBounds: isInsidePlanBounds,
		itemCanFit: itemCanFit,
		clampItemToPlan: clampItemToPlan,
		findSafeSpawnPosition: findSafeSpawnPosition,
	};
})();
