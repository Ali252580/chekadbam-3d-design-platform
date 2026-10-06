import * as THREE from "three";

/**
 * Natural organic foliage & blooming flower generator for Chekadbam 3D Studio.
 *
 * Builds realistic botanicals:
 * - Curved, vein-creased, organic leaf blades in varied shades
 * - Realistic multi-petal blossoms with golden pistils (Jasmine, Wild Rose, Lavender florets)
 * - Delicate woody stems and drooping vine tendrils
 */

function makeRng(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

const LEAF_GREENS = [
  0x284f23, 0x336329, 0x3f762f, 0x4d8a37, 0x5c9f3f,
  0x6bb349, 0x7dc555, 0x466d30, 0x385c27, 0x528738,
  0x86b847, 0x98ca53,
];

const LEAF_ACCENTS = [0x9ec758, 0xaed866, 0xb8884c, 0x8a5b33, 0x704322];

// Rich natural garden flower colors (Jasmine White, Tea Rose, Soft Coral, Lavender Lilac, Golden Chamomile)
const FLOWER_PALETTES = [
  { petals: 0xfbf9f5, center: 0xf5c342 }, // White Jasmine
  { petals: 0xf7cad7, center: 0xeb984e }, // Soft Pink Rose
  { petals: 0xf4978e, center: 0xfbc531 }, // Coral Blossom
  { petals: 0xd8b4f8, center: 0xf6e58d }, // Lavender Lilac
  { petals: 0xffeaa7, center: 0xe67e22 }, // Golden Yellow
];

const geometryCache = new Map<string, THREE.BufferGeometry>();
const materialCache = new Map<string, THREE.MeshStandardMaterial>();

function getCurvedLeafGeometry(lengthBucket: number): THREE.BufferGeometry {
  const key = `leaf-curved-${lengthBucket}`;
  const cached = geometryCache.get(key);
  if (cached) return cached;

  const len = lengthBucket / 100;
  const wid = len * 0.48;

  const geo = new THREE.PlaneGeometry(wid, len, 6, 9);
  const pos = geo.attributes.position as THREE.BufferAttribute;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    // Clamp: float error makes the base row's t a tiny negative, and
    // Math.pow(negative, 0.68) = NaN poisons the whole vertex.
    const t = Math.min(1, Math.max(0, (y + len / 2) / len)); // 0 at base, 1 at tip

    // Leaf contour profile (egg/spear shaped)
    const profile = Math.sin(Math.PI * Math.pow(t, 0.68));
    const nx = x * profile;

    // V-shaped central midrib crease
    const crease = Math.abs(x) * 0.22;
    // Organic lengthwise tip droop
    const droop = -Math.pow(t, 2.2) * len * 0.35;
    // Subtle natural flutter wave
    const wave = Math.sin(t * Math.PI * 3) * len * 0.035;

    pos.setX(i, nx);
    pos.setZ(i, crease + droop * 0.4 + wave);
    pos.setY(i, y + droop * 0.28);
  }

  pos.needsUpdate = true;
  geo.computeVertexNormals();
  geo.computeBoundingBox();
  geo.computeBoundingSphere();
  geometryCache.set(key, geo);
  return geo;
}

function getPetalGeometry(sizeBucket: number): THREE.BufferGeometry {
  const key = `petal-${sizeBucket}`;
  const cached = geometryCache.get(key);
  if (cached) return cached;

  const size = sizeBucket / 1000;
  const geo = new THREE.PlaneGeometry(size * 0.85, size * 1.3, 4, 5);
  const pos = geo.attributes.position as THREE.BufferAttribute;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    // Clamp against float error — see the curved-leaf builder above.
    const t = Math.min(1, Math.max(0, (y + (size * 1.3) / 2) / (size * 1.3)));

    const profile = Math.sin(Math.PI * Math.pow(t, 0.75));
    const nx = x * profile;
    const cup = -Math.pow(t, 1.8) * size * 0.28 + (1 - Math.pow(x / (size * 0.4 || 1), 2)) * size * 0.12;

    pos.setX(i, nx);
    pos.setZ(i, cup);
    pos.setY(i, y);
  }

  pos.needsUpdate = true;
  geo.computeVertexNormals();
  geo.computeBoundingBox();
  geo.computeBoundingSphere();
  geometryCache.set(key, geo);
  return geo;
}

function getStemGeometry(heightBucket: number): THREE.BufferGeometry {
  const key = `stem-${heightBucket}`;
  const cached = geometryCache.get(key);
  if (cached) return cached;

  const h = heightBucket / 100;
  const geo = new THREE.CylinderGeometry(h * 0.016, h * 0.03, h, 6, 2);
  geometryCache.set(key, geo);
  return geo;
}

function getLeafMaterial(color: number): THREE.MeshStandardMaterial {
  const key = `leaf-mat-${color}`;
  const cached = materialCache.get(key);
  if (cached) return cached;

  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.65,
    metalness: 0.02,
    side: THREE.DoubleSide,
    flatShading: false,
  });
  materialCache.set(key, mat);
  return mat;
}

function getStemMaterial(): THREE.MeshStandardMaterial {
  const key = "stem-mat-natural";
  const cached = materialCache.get(key);
  if (cached) return cached;

  const mat = new THREE.MeshStandardMaterial({
    color: 0x435427,
    roughness: 0.88,
    metalness: 0.01,
  });
  materialCache.set(key, mat);
  return mat;
}

function getFlowerMaterial(color: number, isCenter = false): THREE.MeshStandardMaterial {
  const key = `fl-mat-${color}-${isCenter ? 1 : 0}`;
  const cached = materialCache.get(key);
  if (cached) return cached;

  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: isCenter ? 0.9 : 0.48,
    metalness: 0.01,
    side: THREE.DoubleSide,
    emissive: new THREE.Color(color).multiplyScalar(isCenter ? 0.2 : 0.08),
  });
  materialCache.set(key, mat);
  return mat;
}

export interface FoliageOptions {
  radius?: number;
  seed?: number;
  density?: number;
  heightScale?: number;
  withFlowers?: boolean;
  withStems?: boolean;
  tone?: "light" | "normal" | "dark";
  castShadow?: boolean;
}

/**
 * Creates a lush, multi-layered natural shrub cluster with realistic individual curved leaves and detailed blossoms.
 */
export function createFoliageCluster(options: FoliageOptions = {}): THREE.Group {
  const {
    radius = 0.26,
    seed = 1,
    density = 1,
    heightScale = 1,
    withFlowers = false,
    withStems = true,
    tone = "normal",
    castShadow = true,
  } = options;

  const rng = makeRng(seed * 9176 + Math.round(radius * 1000));
  const group = new THREE.Group();

  const toneOffset = tone === "light" ? 4 : tone === "dark" ? 0 : 2;

  // Soft shaded inner core for depth
  const coreGeo = new THREE.IcosahedronGeometry(radius * 0.65, 1);
  const corePos = coreGeo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < corePos.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(corePos, i);
    const lump = 1 + (rng() - 0.5) * 0.26;
    v.multiplyScalar(lump);
    corePos.setXYZ(i, v.x, v.y * heightScale, v.z);
  }
  corePos.needsUpdate = true;
  coreGeo.computeVertexNormals();
  coreGeo.computeBoundingBox();
  coreGeo.computeBoundingSphere();

  const coreMesh = new THREE.Mesh(
    coreGeo,
    getLeafMaterial(LEAF_GREENS[(toneOffset + 1) % LEAF_GREENS.length])
  );
  coreMesh.castShadow = castShadow;
  group.add(coreMesh);

  // Subtle natural branching stems
  if (withStems) {
    const stemCount = Math.max(2, Math.round(3 * density));
    for (let s = 0; s < stemCount; s++) {
      const h = radius * (1.2 + rng() * 0.5);
      const stem = new THREE.Mesh(getStemGeometry(Math.round(h * 100)), getStemMaterial());
      const lean = 0.16 + rng() * 0.28;
      const az = rng() * Math.PI * 2;
      stem.position.set(0, (h / 2) * heightScale - radius * 0.35, 0);
      stem.rotation.z = Math.cos(az) * lean;
      stem.rotation.x = Math.sin(az) * lean;
      stem.castShadow = castShadow;
      group.add(stem);
    }
  }

  // Realistic individual curved leaf blades
  const leafCount = Math.max(12, Math.round(30 * density));
  for (let i = 0; i < leafCount; i++) {
    const u = (i + 0.5) / leafCount;
    const phi = Math.acos(1 - 2 * u);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i + rng() * 0.85;

    const shell = radius * (0.74 + rng() * 0.36);
    const px = Math.sin(phi) * Math.cos(theta) * shell;
    const py = Math.cos(phi) * shell * heightScale;
    const pz = Math.sin(phi) * Math.sin(theta) * shell;

    const leafLen = radius * (0.75 + rng() * 0.55);
    const bucket = Math.max(6, Math.round(leafLen * 100));

    const paletteIndex = Math.floor(rng() * 5) + toneOffset;
    const useAccent = rng() > 0.85;
    const color = useAccent
      ? LEAF_ACCENTS[Math.floor(rng() * LEAF_ACCENTS.length)]
      : LEAF_GREENS[paletteIndex % LEAF_GREENS.length];

    const leaf = new THREE.Mesh(getCurvedLeafGeometry(bucket), getLeafMaterial(color));
    leaf.position.set(px, py, pz);

    leaf.lookAt(px * 2.5, py * 2.5 + radius * 0.3, pz * 2.5);
    leaf.rotateX(-Math.PI / 2 + (rng() - 0.5) * 0.65);
    leaf.rotateZ((rng() - 0.5) * Math.PI);
    leaf.rotateY((rng() - 0.5) * 0.55);

    leaf.castShadow = castShadow;
    group.add(leaf);
  }

  // Realistic blossoming flowers with 5 curved petals & stamens
  if (withFlowers) {
    const flowerCount = Math.max(3, Math.round(7 * density));
    const flPalette = FLOWER_PALETTES[Math.floor(rng() * FLOWER_PALETTES.length)];
    const petalBucket = Math.max(12, Math.round(radius * 130));
    const petalGeo = getPetalGeometry(petalBucket);

    for (let f = 0; f < flowerCount; f++) {
      const az = rng() * Math.PI * 2;
      const el = (rng() - 0.15) * Math.PI * 0.6;
      const shell = radius * (0.88 + rng() * 0.28);

      const fx = Math.cos(el) * Math.cos(az) * shell;
      const fy = Math.sin(el) * shell * heightScale + radius * 0.16;
      const fz = Math.cos(el) * Math.sin(az) * shell;

      const flower = new THREE.Group();
      const pCount = 5;
      const petalDist = radius * 0.06;

      for (let p = 0; p < pCount; p++) {
        const pa = (p / pCount) * Math.PI * 2 + (rng() - 0.5) * 0.15;
        const petal = new THREE.Mesh(petalGeo, getFlowerMaterial(flPalette.petals));
        petal.position.set(Math.cos(pa) * petalDist, Math.sin(pa) * petalDist, 0);
        petal.rotation.z = pa + Math.PI / 2;
        petal.rotation.x = (rng() - 0.5) * 0.2;
        flower.add(petal);
      }

      // Golden center stamen ball
      const centerGeo = new THREE.SphereGeometry(radius * 0.045, 7, 6);
      const centerMesh = new THREE.Mesh(centerGeo, getFlowerMaterial(flPalette.center, true));
      centerMesh.position.set(0, 0, radius * 0.015);
      flower.add(centerMesh);

      flower.position.set(fx, fy, fz);
      flower.lookAt(fx * 2, fy * 2 + 0.1, fz * 2);
      flower.rotateZ(rng() * Math.PI * 2);

      group.add(flower);
    }
  }

  return group;
}

/**
 * Builds a natural multi-tiered tree canopy with organic density.
 */
export function createTreeCanopy(
  radius = 0.54,
  seed = 7,
  withFlowers = false
): THREE.Group {
  const rng = makeRng(seed * 3301);
  const canopy = new THREE.Group();

  const lobes: Array<{ r: number; x: number; y: number; z: number; tone: "light" | "normal" | "dark" }> = [
    { r: radius, x: 0, y: 0, z: 0, tone: "normal" },
    { r: radius * 0.76, x: radius * 0.54, y: radius * 0.38, z: radius * 0.22, tone: "light" },
    { r: radius * 0.7, x: -radius * 0.52, y: radius * 0.24, z: -radius * 0.26, tone: "dark" },
    { r: radius * 0.62, x: radius * 0.12, y: radius * 0.64, z: -radius * 0.36, tone: "light" },
    { r: radius * 0.58, x: -radius * 0.22, y: -radius * 0.28, z: radius * 0.46, tone: "normal" },
  ];

  lobes.forEach((lobe, i) => {
    const cluster = createFoliageCluster({
      radius: lobe.r,
      seed: seed * 31 + i * 17,
      density: 1.2,
      heightScale: 0.94,
      withStems: false,
      withFlowers: withFlowers && i % 2 === 0,
      tone: lobe.tone,
    });
    cluster.position.set(
      lobe.x + (rng() - 0.5) * radius * 0.08,
      lobe.y + (rng() - 0.5) * radius * 0.08,
      lobe.z + (rng() - 0.5) * radius * 0.08
    );
    canopy.add(cluster);
  });

  return canopy;
}

/**
 * Trailing hanging vines for vertical green walls with drooping foliage runners.
 */
export function createVineCluster(
  radius = 0.2,
  seed = 3,
  trailLength = 0.34
): THREE.Group {
  const rng = makeRng(seed * 7717);
  const vine = new THREE.Group();

  const main = createFoliageCluster({
    radius,
    seed: seed * 13,
    density: 1.15,
    heightScale: 1.1,
    withStems: false,
    withFlowers: rng() > 0.4,
    tone: rng() > 0.5 ? "normal" : "light",
  });
  vine.add(main);

  const runners = 2 + Math.floor(rng() * 2);
  for (let r = 0; r < runners; r++) {
    const runner = new THREE.Group();
    const drop = trailLength * (0.65 + rng() * 0.65);

    const stem = new THREE.Mesh(getStemGeometry(Math.round(drop * 100)), getStemMaterial());
    stem.position.y = -drop / 2;
    stem.rotation.z = (rng() - 0.5) * 0.3;
    runner.add(stem);

    const leavesOnRunner = 3 + Math.floor(rng() * 3);
    for (let l = 0; l < leavesOnRunner; l++) {
      const t = (l + 1) / (leavesOnRunner + 1);
      const leafLen = radius * (0.52 + rng() * 0.35);
      const leaf = new THREE.Mesh(
        getCurvedLeafGeometry(Math.max(6, Math.round(leafLen * 100))),
        getLeafMaterial(LEAF_GREENS[Math.floor(rng() * LEAF_GREENS.length)])
      );
      leaf.position.set((rng() - 0.5) * radius * 0.35, -drop * t, (rng() - 0.5) * radius * 0.35);
      leaf.rotation.set(
        -Math.PI / 2 + (rng() - 0.5) * 0.7,
        rng() * Math.PI * 2,
        (rng() - 0.5) * 0.7
      );
      leaf.castShadow = true;
      runner.add(leaf);
    }

    runner.position.set(
      (rng() - 0.5) * radius * 1.2,
      -radius * 0.3,
      (rng() - 0.5) * radius * 0.6 + radius * 0.2
    );
    vine.add(runner);
  }

  return vine;
}

/**
 * Ground-cover planter filler with fresh green blades and scattered blossoms.
 */
export function createGroundCover(
  width: number,
  depth: number,
  seed = 5,
  withFlowers = true
): THREE.Group {
  const rng = makeRng(seed * 4421);
  const cover = new THREE.Group();

  const clumps = Math.max(3, Math.round(width / 0.24));
  for (let c = 0; c < clumps; c++) {
    const r = 0.11 + rng() * 0.07;
    const clump = createFoliageCluster({
      radius: r,
      seed: seed * 53 + c * 29,
      density: 0.95,
      heightScale: 0.8,
      withStems: false,
      withFlowers: withFlowers && rng() > 0.4,
      tone: rng() > 0.55 ? "light" : "normal",
    });
    clump.position.set(
      -width / 2 + 0.08 + (c * (width - 0.16)) / Math.max(1, clumps - 1) + (rng() - 0.5) * 0.04,
      r * 0.55,
      (rng() - 0.5) * Math.max(0.02, depth - 0.16)
    );
    cover.add(clump);
  }

  return cover;
}
