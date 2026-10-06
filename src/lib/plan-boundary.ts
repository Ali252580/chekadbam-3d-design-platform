import { SpaceConfig, StudioItem } from "./studio-types";

/**
 * Strict plan-boundary engine for the Chekadbam 3D Studio.
 *
 * Guarantees that every modular item:
 *  - stays 100% inside the usable floor area (never in parapet walls),
 *  - never overlaps shape cutouts (L / U courtyard) or the central stair shaft,
 *  - respects its own rotation when computing the occupied footprint.
 */

/** Safety gap kept between item edges and walls / cutout edges (metres). */
const SAFE_MARGIN = 0.35;

/**
 * Computes the axis-aligned bounding footprint of a w × d rectangle
 * that is rotated by `rotationDeg`. This is required so that rotated
 * long items (e.g. a 1.6 m flowerbox at 90°) never poke through walls.
 */
export function getRotatedFootprint(
  w: number,
  d: number,
  rotationDeg = 0
): { w: number; d: number } {
  const rad = (Math.abs(rotationDeg) * Math.PI) / 180;
  const c = Math.abs(Math.cos(rad));
  const s = Math.abs(Math.sin(rad));
  return {
    w: w * c + d * s,
    d: w * s + d * c,
  };
}

/** Calculates the exact usable plan area (متراژ خالص) in square metres. */
export function calculatePlanArea(space: SpaceConfig): number {
  let totalArea = space.width * space.length;

  const cutoutW = space.cutoutWidth || 4.5;
  const cutoutL = space.cutoutLength || 4.0;
  const shaftW = space.shaftWidth || 3.2;
  const shaftL = space.shaftLength || 3.0;

  if (space.shape === "l_shaped") totalArea -= cutoutW * cutoutL;
  else if (space.shape === "u_shaped") totalArea -= cutoutW * cutoutL;
  else if (space.shape === "central_shaft") totalArea -= shaftW * shaftL;

  return Math.max(4, Math.round(totalArea * 10) / 10);
}

/** Describes the rectangular exclusion zones of the current plan shape. */
function getExclusionZones(space: SpaceConfig): Array<{ minX: number; maxX: number; minZ: number; maxZ: number }> {
  const halfW = space.width / 2;
  const halfL = space.length / 2;
  const zones: Array<{ minX: number; maxX: number; minZ: number; maxZ: number }> = [];

  const shape = space.shape || "rectangular";
  const cutoutW = space.cutoutWidth || 4.5;
  const cutoutL = space.cutoutLength || 4.0;
  const shaftW = space.shaftWidth || 3.2;
  const shaftL = space.shaftLength || 3.0;

  if (shape === "l_shaped") {
    zones.push({
      minX: halfW - cutoutW,
      maxX: halfW + 1,
      minZ: halfL - cutoutL,
      maxZ: halfL + 1,
    });
  } else if (shape === "u_shaped") {
    zones.push({
      minX: -cutoutW / 2,
      maxX: cutoutW / 2,
      minZ: halfL - cutoutL,
      maxZ: halfL + 1,
    });
  } else if (shape === "central_shaft") {
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
export function isInsidePlanBounds(
  x: number,
  z: number,
  itemW: number,
  itemD: number,
  space: SpaceConfig,
  margin = 0.02,
  rotationDeg = 0
): boolean {
  const { w: fpW, d: fpD } = getRotatedFootprint(itemW, itemD, rotationDeg);
  const halfW = space.width / 2;
  const halfL = space.length / 2;

  const minX = x - fpW / 2 - margin;
  const maxX = x + fpW / 2 + margin;
  const minZ = z - fpD / 2 - margin;
  const maxZ = z + fpD / 2 + margin;

  // 1. Outer perimeter (inside the parapet inner faces)
  if (minX < -halfW || maxX > halfW || minZ < -halfL || maxZ > halfL) return false;

  // 2. Exclusion zones
  for (const zone of getExclusionZones(space)) {
    const overlaps = maxX > zone.minX && minX < zone.maxX && maxZ > zone.minZ && minZ < zone.maxZ;
    if (overlaps) return false;
  }

  return true;
}

function clampToOuterPerimeter(
  x: number,
  z: number,
  fpW: number,
  fpD: number,
  space: SpaceConfig
): { x: number; z: number } {
  const halfW = space.width / 2;
  const halfL = space.length / 2;

  let loX = -halfW + fpW / 2 + SAFE_MARGIN;
  let hiX = halfW - fpW / 2 - SAFE_MARGIN;
  let loZ = -halfL + fpD / 2 + SAFE_MARGIN;
  let hiZ = halfL - fpD / 2 - SAFE_MARGIN;

  // Degenerate case: item larger than plan on that axis → centre it.
  const cx = loX > hiX ? (loX + hiX) / 2 : Math.min(hiX, Math.max(loX, x));
  const cz = loZ > hiZ ? (loZ + hiZ) / 2 : Math.min(hiZ, Math.max(loZ, z));

  return { x: cx, z: cz };
}

/**
 * Pushes an item out of any exclusion zone along the shortest axis,
 * preserving a safety gap from the zone edge.
 */
function resolveExclusionZones(
  x: number,
  z: number,
  fpW: number,
  fpD: number,
  space: SpaceConfig
): { x: number; z: number } {
  let outX = x;
  let outZ = z;
  const gap = SAFE_MARGIN;

  for (const zone of getExclusionZones(space)) {
    const minX = outX - fpW / 2;
    const maxX = outX + fpW / 2;
    const minZ = outZ - fpD / 2;
    const maxZ = outZ + fpD / 2;

    const overlaps = maxX > zone.minX && minX < zone.maxX && maxZ > zone.minZ && minZ < zone.maxZ;
    if (!overlaps) continue;

    // Candidate escape distances on each side of the zone.
    const pushLeft = zone.minX - fpW / 2 - gap - outX; // move left
    const pushRight = zone.maxX + fpW / 2 + gap - outX; // move right
    const pushUp = zone.minZ - fpD / 2 - gap - outZ; // move up (-Z)
    const pushDown = zone.maxZ + fpD / 2 + gap - outZ; // move down (+Z)

    // Only consider pushes that actually clear the overlap; pick the smallest move.
    const options: Array<{ axis: "x" | "z"; value: number; cost: number }> = [];
    if (maxX > zone.minX) options.push({ axis: "x", value: outX + pushLeft, cost: Math.abs(pushLeft) });
    if (minX < zone.maxX) options.push({ axis: "x", value: outX + pushRight, cost: Math.abs(pushRight) });
    if (maxZ > zone.minZ) options.push({ axis: "z", value: outZ + pushUp, cost: Math.abs(pushUp) });
    if (minZ < zone.maxZ) options.push({ axis: "z", value: outZ + pushDown, cost: Math.abs(pushDown) });

    if (options.length > 0) {
      options.sort((a, b) => a.cost - b.cost);
      const best = options[0];
      if (best.axis === "x") outX = best.value;
      else outZ = best.value;
    }
  }

  return { x: outX, z: outZ };
}

/**
 * Clamps a proposed (x, z) so the item is guaranteed to sit fully inside
 * the usable plan, away from walls, cutouts and the stair shaft,
 * taking the item rotation into account.
 */
export function clampItemToPlan(
  x: number,
  z: number,
  itemW: number,
  itemD: number,
  space: SpaceConfig,
  rotationDeg = 0
): { x: number; z: number } {
  const { w: fpW, d: fpD } = getRotatedFootprint(itemW, itemD, rotationDeg);

  // 1. Keep inside outer perimeter.
  let result = clampToOuterPerimeter(x, z, fpW, fpD, space);

  // 2. Escape exclusion zones.
  result = resolveExclusionZones(result.x, result.z, fpW, fpD, space);

  // 3. Final perimeter re-clamp (zone escape may have pushed past edges).
  result = clampToOuterPerimeter(result.x, result.z, fpW, fpD, space);

  // 4. If still overlapping a zone (very tight plans), fall back to a known-safe corner.
  if (!isInsidePlanBounds(result.x, result.z, itemW, itemD, space, 0.02, rotationDeg)) {
    const fallback = findSafeSpawnPosition(itemW, itemD, space, [], rotationDeg);
    result = fallback;
  }

  return {
    x: Math.round(result.x * 100) / 100,
    z: Math.round(result.z * 100) / 100,
  };
}

/**
 * Finds a safe spawn position inside the floor plan for a new item.
 */
export function findSafeSpawnPosition(
  itemW: number,
  itemD: number,
  space: SpaceConfig,
  existingItems: StudioItem[],
  rotationDeg = 0
): { x: number; z: number } {
  const halfW = space.width / 2;
  const halfL = space.length / 2;

  // Spiral search: centre first, then progressively outward rings.
  const candidates: Array<{ x: number; z: number }> = [{ x: 0, z: 0 }];
  const ringStep = 0.8;
  for (let ring = 1; ring <= 6; ring++) {
    const r = ring * ringStep;
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

  for (const cand of candidates) {
    const clamped = clampItemToPlan(cand.x, cand.z, itemW, itemD, space, rotationDeg);
    if (!isInsidePlanBounds(clamped.x, clamped.z, itemW, itemD, space, 0.02, rotationDeg)) continue;

    // Avoid heavy overlap with already placed items.
    const overlaps = existingItems.some(
      (it) =>
        Math.hypot(it.x - clamped.x, it.z - clamped.z) <
        (Math.min(it.width, it.depth) + Math.min(itemW, itemD)) * 0.35
    );
    if (overlaps) continue;

    return clamped;
  }

  // Last resort: clamped centre.
  return clampItemToPlan(0, 0, itemW, itemD, space, rotationDeg);
}
