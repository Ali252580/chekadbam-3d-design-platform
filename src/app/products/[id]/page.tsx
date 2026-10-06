"use client";

import React, { useState, useEffect, useRef, use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import * as THREE from "three";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CHEKADBAM_PRODUCTS, WPC_COLORS, METAL_COLORS } from "@/lib/products-data";
import { createWpcPlankTexture, createCanvasFabricTexture } from "@/lib/materials-textures";
import { createFoliageCluster, createTreeCanopy, createVineCluster, createGroundCover } from "@/lib/foliage";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Layers,
  Scale,
  Maximize2,
  Check,
  Send,
  Phone,
} from "lucide-react";

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const product = CHEKADBAM_PRODUCTS.find((p) => p.id === id);

  if (!product) {
    notFound();
  }

  // Material states
  const [selectedWPC, setSelectedWPC] = useState(WPC_COLORS[0].id);
  const [selectedMetal, setSelectedMetal] = useState(METAL_COLORS[0].id);
  const [inquiryName, setInquiryName] = useState("");
  const [inquiryPhone, setInquiryPhone] = useState("");
  const [inquirySent, setInquirySent] = useState(false);

  // 3D Turntable Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshGroupRef = useRef<THREE.Group | null>(null);

  // Turntable animation & interaction
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.clientWidth || 500;
    const height = canvas.clientHeight || 400;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090d16);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(2.5, 2.0, 3.5);
    camera.lookAt(0, 0.4, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;

    // Lights
    const hemi = new THREE.HemisphereLight(0xffffff, 0x1e293b, 1.2);
    scene.add(hemi);

    const dir = new THREE.DirectionalLight(0xffffff, 1.5);
    dir.position.set(5, 8, 5);
    dir.castShadow = true;
    scene.add(dir);

    const rimLight = new THREE.DirectionalLight(0x10b981, 0.6);
    rimLight.position.set(-5, 4, -5);
    scene.add(rimLight);

    // Floor shadow catcher
    const shadowGeo = new THREE.PlaneGeometry(10, 10);
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.35 });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.receiveShadow = true;
    scene.add(shadowMesh);

    // Modular 1 m tile grid (matches the studio canvas palette)
    const grid = new THREE.GridHelper(6, 6, 0x7dd3fc, 0x334155);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.5;
    (grid.material as THREE.Material).depthWrite = false;
    grid.position.y = 0.001;
    scene.add(grid);

    const group = new THREE.Group();
    scene.add(group);
    meshGroupRef.current = group;

    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      if (group) {
        group.rotation.y += 0.004;
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      renderer.dispose();
    };
  }, []);

  // Update product mesh in 3D scene when materials change
  useEffect(() => {
    if (!meshGroupRef.current) return;
    const group = meshGroupRef.current;

    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    const wpcHexStr =
      selectedWPC === "teak"
        ? "#9b683e"
        : selectedWPC === "charcoal"
        ? "#2b2a29"
        : selectedWPC === "oak"
        ? "#c59d6f"
        : "#4a321f";

    const metalColorHex =
      selectedMetal === "charcoal" ? 0x374151 : selectedMetal === "cream" ? 0xd6cebe : 0x18181b;

    const { map: wpcTexture, bumpMap: wpcBump } = createWpcPlankTexture(wpcHexStr, 0.25, 6);
    const { map: canvasTexture, bumpMap: canvasBump } = createCanvasFabricTexture("#f5f2eb");

    const wpcMat = new THREE.MeshStandardMaterial({
      map: wpcTexture,
      bumpMap: wpcBump,
      bumpScale: 0.08,
      roughness: 0.55,
      metalness: 0.05,
    });

    const metalMat = new THREE.MeshStandardMaterial({
      color: metalColorHex,
      roughness: 0.35,
      metalness: 0.85,
    });

    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xd4d4d8,
      roughness: 0.15,
      metalness: 0.95,
    });

    const fabricMat = new THREE.MeshStandardMaterial({
      map: canvasTexture,
      bumpMap: canvasBump,
      bumpScale: 0.06,
      roughness: 0.8,
      side: THREE.DoubleSide,
    });

    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.7 });

    const { width, depth, height } = product.dimensions;

    if (product.model3D.shapeType === "umbrella") {
      // 3-meter Cantilever Hydraulic Offset Umbrella
      const uW = width || 3.0;
      const uH = height || 2.65;
      const offsetDist = uW * 0.42;

      // Heavy wheeled base box
      const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.18, 0.85), metalMat);
      baseMesh.position.set(-offsetDist, 0.09, 0);
      baseMesh.castShadow = true;
      group.add(baseMesh);

      // 4 wheels
      const wheelGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.04, 12);
      [[-0.35, -0.35], [0.35, -0.35], [-0.35, 0.35], [0.35, 0.35]].forEach(([wx, wz]) => {
        const wheel = new THREE.Mesh(wheelGeo, metalMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(-offsetDist + wx, 0.04, wz);
        group.add(wheel);
      });

      // Turret hub & pedal
      const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.12, 16), metalMat);
      turret.position.set(-offsetDist, 0.24, 0);
      group.add(turret);

      const pedal = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.04, 0.06), chromeMat);
      pedal.position.set(-offsetDist + 0.12, 0.22, 0);
      group.add(pedal);

      // Main Mast
      const mastH = uH * 0.88;
      const mast = new THREE.Mesh(new THREE.BoxGeometry(0.09, mastH, 0.09), metalMat);
      mast.position.set(-offsetDist, 0.24 + mastH / 2, 0);
      mast.castShadow = true;
      group.add(mast);

      // Crank handle
      const crankBox = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.1), metalMat);
      crankBox.position.set(-offsetDist, 1.2, 0.08);
      group.add(crankBox);

      const crankLever = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.12, 8), chromeMat);
      crankLever.rotation.x = Math.PI / 2;
      crankLever.position.set(-offsetDist, 1.2, 0.14);
      group.add(crankLever);

      // Cantilever boom & hydraulic strut
      const boomLen = offsetDist * 1.05;
      const boom = new THREE.Mesh(new THREE.BoxGeometry(boomLen, 0.07, 0.07), metalMat);
      boom.position.set(-offsetDist + boomLen / 2, uH - 0.05, 0);
      boom.castShadow = true;
      group.add(boom);

      const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, offsetDist * 0.85, 12), chromeMat);
      strut.position.set(-offsetDist + offsetDist * 0.35, uH * 0.72, 0);
      strut.rotation.z = -Math.PI / 4.2;
      strut.castShadow = true;
      group.add(strut);

      // Hub & 8 Ribs
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.15, 16), metalMat);
      hub.position.set(0, uH - 0.08, 0);
      group.add(hub);

      const ribCount = 8;
      const ribLen = uW / 2;
      for (let r = 0; r < ribCount; r++) {
        const rAngle = (r * Math.PI * 2) / ribCount;
        const rib = new THREE.Mesh(new THREE.BoxGeometry(ribLen, 0.025, 0.025), metalMat);
        rib.position.set((Math.cos(rAngle) * ribLen) / 2, uH - 0.18, (Math.sin(rAngle) * ribLen) / 2);
        rib.rotation.y = -rAngle;
        rib.rotation.z = 0.12;
        rib.castShadow = true;
        group.add(rib);
      }

      // Octagonal Sunbrella Canopy
      const canopy = new THREE.Mesh(new THREE.ConeGeometry(uW / 2, 0.45, 8), fabricMat);
      canopy.position.set(0, uH - 0.22, 0);
      canopy.castShadow = true;
      group.add(canopy);

      // Top Wind Vent
      const vent = new THREE.Mesh(new THREE.ConeGeometry(uW * 0.22, 0.18, 8), fabricMat);
      vent.position.set(0, uH - 0.05, 0);
      vent.castShadow = true;
      group.add(vent);

      const finial = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), chromeMat);
      finial.position.set(0, uH + 0.06, 0);
      group.add(finial);
    } else if (product.model3D.shapeType === "tree") {
      const potMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.28, 0.6, 24), metalMat);
      potMesh.position.y = 0.3;
      potMesh.castShadow = true;
      group.add(potMesh);

      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.09, 1.1, 12),
        new THREE.MeshStandardMaterial({ color: 0x452f1e })
      );
      trunk.position.y = 1.0;
      trunk.castShadow = true;
      group.add(trunk);

      const crown = createTreeCanopy(0.58, 21, true);
      crown.position.y = 1.66;
      group.add(crown);

      const potCover = createGroundCover(0.5, 0.5, 9, true);
      potCover.position.y = 0.6;
      group.add(potCover);
    } else if (product.model3D.shapeType === "pergola") {
      const postSize = 0.14;
      const postGeo = new THREE.BoxGeometry(postSize, height, postSize);
      const corners = [
        [-width / 2 + postSize / 2, height / 2, -depth / 2 + postSize / 2],
        [width / 2 - postSize / 2, height / 2, -depth / 2 + postSize / 2],
        [-width / 2 + postSize / 2, height / 2, depth / 2 - postSize / 2],
        [width / 2 - postSize / 2, height / 2, depth / 2 - postSize / 2],
      ];
      corners.forEach(([cx, cy, cz]) => {
        const post = new THREE.Mesh(postGeo, metalMat);
        post.position.set(cx, cy, cz);
        post.castShadow = true;
        group.add(post);
      });

      const beamGeoX = new THREE.BoxGeometry(width + 0.2, 0.16, 0.12);
      const beamFront = new THREE.Mesh(beamGeoX, metalMat);
      beamFront.position.set(0, height - 0.08, depth / 2 - postSize / 2);
      group.add(beamFront);

      const beamBack = new THREE.Mesh(beamGeoX, metalMat);
      beamBack.position.set(0, height - 0.08, -depth / 2 + postSize / 2);
      group.add(beamBack);

      const louverCount = 8;
      const louverGeo = new THREE.BoxGeometry(0.08, 0.12, depth + 0.2);
      for (let i = 0; i < louverCount; i++) {
        const lx = -width / 2 + (width / (louverCount - 1)) * i;
        const louver = new THREE.Mesh(louverGeo, wpcMat);
        louver.position.set(lx, height + 0.06, 0);
        louver.castShadow = true;
        group.add(louver);
      }
    } else if (product.model3D.shapeType === "pergola_deck") {
      const gW = width;
      const gD = depth;
      const gH = height;
      const deckH = 0.1;
      const postSz = 0.075;
      const postInset = 0.42;
      const overhang = 0.3;
      const edgeThk = 0.09;

      [-1, 1].forEach((zs) => {
        const eg = new THREE.Mesh(new THREE.BoxGeometry(gW, deckH, edgeThk), wpcMat);
        eg.position.set(0, deckH / 2, zs * (gD / 2 - edgeThk / 2));
        eg.castShadow = true;
        group.add(eg);
      });
      [-1, 1].forEach((xs) => {
        const eg = new THREE.Mesh(new THREE.BoxGeometry(edgeThk, deckH, gD), wpcMat);
        eg.position.set(xs * (gW / 2 - edgeThk / 2), deckH / 2, 0);
        eg.castShadow = true;
        group.add(eg);
      });

      const innerW = gW - edgeThk * 2 - 0.02;
      const innerD = gD - edgeThk * 2 - 0.02;
      const deckSlats = 22;
      const dSlatW = innerW / deckSlats - 0.006;
      for (let s = 0; s < deckSlats; s++) {
        const ds = new THREE.Mesh(new THREE.BoxGeometry(dSlatW, deckH * 0.85, innerD), wpcMat);
        ds.position.set(-innerW / 2 + s * (dSlatW + 0.006) + dSlatW / 2, deckH * 0.425, 0);
        group.add(ds);
      }

      const postH = gH - 0.34;
      const postPositions: Array<[number, number]> = [
        [-(gW / 2 - postInset), -(gD / 2 - postInset)],
        [gW / 2 - postInset, -(gD / 2 - postInset)],
        [-(gW / 2 - postInset), gD / 2 - postInset],
        [gW / 2 - postInset, gD / 2 - postInset],
      ];
      postPositions.forEach(([px, pz]) => {
        [-1, 1].forEach((off) => {
          const post = new THREE.Mesh(new THREE.BoxGeometry(postSz, postH, postSz), metalMat);
          post.position.set(px + off * 0.055, deckH + postH / 2, pz);
          post.castShadow = true;
          group.add(post);
        });
        const plate = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.02, 0.12), metalMat);
        plate.position.set(px, deckH + 0.01, pz);
        group.add(plate);
      });

      const headerY = deckH + postH + 0.05;
      const mainBeamLen = gW - postInset * 2 + overhang * 2;
      [-1, 1].forEach((zs) => {
        const hb = new THREE.Mesh(new THREE.BoxGeometry(mainBeamLen, 0.1, 0.05), metalMat);
        hb.position.set(0, headerY, zs * (gD / 2 - postInset));
        hb.castShadow = true;
        group.add(hb);

        [-1, 1].forEach((off) => {
          const mb = new THREE.Mesh(new THREE.BoxGeometry(mainBeamLen, 0.13, 0.055), wpcMat);
          mb.position.set(0, headerY, zs * (gD / 2 - postInset) + off * 0.058);
          mb.castShadow = true;
          group.add(mb);

          [-1, 1].forEach((xs) => {
            const cap = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.06, 0.055), wpcMat);
            cap.position.set(
              xs * (mainBeamLen / 2 - 0.055),
              headerY - 0.095,
              zs * (gD / 2 - postInset) + off * 0.058
            );
            group.add(cap);
          });
        });
      });

      const rafterY = headerY + 0.12;
      const rafterLen = gD - postInset * 2 + overhang * 2;
      const rafterCount = 6;
      const rafterSpan = gW - postInset * 2;
      for (let r = 0; r < rafterCount; r++) {
        const rx = -rafterSpan / 2 + (r * rafterSpan) / (rafterCount - 1);
        const rafter = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.12, rafterLen), wpcMat);
        rafter.position.set(rx, rafterY, 0);
        rafter.castShadow = true;
        group.add(rafter);

        [-1, 1].forEach((zs) => {
          const cap = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.055, 0.1), wpcMat);
          cap.position.set(rx, rafterY - 0.088, zs * (rafterLen / 2 - 0.05));
          group.add(cap);
        });
      }

      const topSlatY = rafterY + 0.085;
      const topSlatCount = 7;
      const topSpan = gD - postInset * 2;
      for (let t = 0; t < topSlatCount; t++) {
        const tz = -topSpan / 2 + (t * topSpan) / (topSlatCount - 1);
        const tSlat = new THREE.Mesh(new THREE.BoxGeometry(rafterSpan + 0.1, 0.035, 0.075), wpcMat);
        tSlat.position.set(0, topSlatY, tz);
        tSlat.castShadow = true;
        group.add(tSlat);
      }
    } else if (product.model3D.shapeType === "green_wall_planter") {
      const wW = width;
      const wD = depth;
      const wH = height;
      const troughH = 0.3;
      const frameThk = 0.07;
      const soilMat = new THREE.MeshStandardMaterial({ color: 0x271c14, roughness: 0.95 });

      const shell = new THREE.Mesh(new THREE.BoxGeometry(wW - 0.04, troughH, wD), metalMat);
      shell.position.set(0, troughH / 2 + 0.03, 0);
      shell.castShadow = true;
      group.add(shell);

      [-1, 1].forEach((xs) => {
        const foot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, wD * 0.8), metalMat);
        foot.position.set(xs * (wW / 2 - 0.14), 0.015, 0);
        group.add(foot);
      });

      [-1, 1].forEach((zs) => {
        for (let b = 0; b < 2; b++) {
          const board = new THREE.Mesh(
            new THREE.BoxGeometry(wW - 0.02, troughH / 2 - 0.012, 0.028),
            wpcMat
          );
          board.position.set(0, 0.05 + b * (troughH / 2) + troughH / 4 - 0.005, zs * (wD / 2 + 0.012));
          board.castShadow = true;
          group.add(board);
        }
      });

      [-1, 1].forEach((xs) => {
        const sideBoard = new THREE.Mesh(
          new THREE.BoxGeometry(0.028, troughH - 0.03, wD + 0.02),
          wpcMat
        );
        sideBoard.position.set(xs * (wW / 2 - 0.006), troughH / 2 + 0.035, 0);
        group.add(sideBoard);
      });

      const soilTop = new THREE.Mesh(new THREE.BoxGeometry(wW - 0.14, 0.03, wD - 0.12), soilMat);
      soilTop.position.set(0, troughH + 0.02, 0);
      group.add(soilTop);

      const frameBaseY = troughH + 0.03;
      const frameH = wH - frameBaseY;
      const frameZ = -wD / 2 + 0.06;

      [-1, 1].forEach((xs) => {
        const postMesh = new THREE.Mesh(new THREE.BoxGeometry(frameThk, frameH, frameThk), wpcMat);
        postMesh.position.set(xs * (wW / 2 - frameThk / 2), frameBaseY + frameH / 2, frameZ);
        postMesh.castShadow = true;
        group.add(postMesh);
      });

      const topBeam = new THREE.Mesh(new THREE.BoxGeometry(wW, frameThk, frameThk), wpcMat);
      topBeam.position.set(0, wH - frameThk / 2, frameZ);
      topBeam.castShadow = true;
      group.add(topBeam);

      const innerBeam = new THREE.Mesh(
        new THREE.BoxGeometry(wW - frameThk * 2, frameThk * 0.8, frameThk * 0.8),
        wpcMat
      );
      innerBeam.position.set(0, wH - frameThk * 1.7, frameZ + 0.055);
      group.add(innerBeam);

      const panelMat = new THREE.MeshStandardMaterial({ color: 0x1c1c1f, roughness: 0.85, metalness: 0.3 });
      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(wW - frameThk * 2, frameH - 0.12, 0.022),
        panelMat
      );
      panel.position.set(0, frameBaseY + frameH / 2 - 0.04, frameZ + 0.005);
      group.add(panel);

      const climbRows = 6;
      const clustersPerRow = 4;
      for (let r = 0; r < climbRows; r++) {
        const fy = frameBaseY + 0.1 + (r * (frameH - 0.24)) / (climbRows - 1);
        for (let c = 0; c < clustersPerRow; c++) {
          const fx = -wW / 2 + 0.18 + (c * (wW - 0.36)) / (clustersPerRow - 1);
          const cluster = createVineCluster(0.16, 101 + r * 41 + c * 13, 0.24);
          cluster.position.set(fx, fy, frameZ + 0.12);
          group.add(cluster);
        }
      }

      const troughPlanting = createGroundCover(wW - 0.2, wD - 0.1, 57, true);
      troughPlanting.position.set(0, troughH + 0.06, 0);
      group.add(troughPlanting);
    } else if (product.model3D.shapeType === "bench_backrest") {
      const bW = width;
      const seatH = 0.45;
      const seatD = depth * 0.72;

      [-1, 1].forEach((side) => {
        const legX = side * (bW / 2 - 0.16);

        const foot = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.045, seatD + 0.06), metalMat);
        foot.position.set(legX, 0.022, 0);
        foot.castShadow = true;
        group.add(foot);

        [-1, 1].forEach((zSide) => {
          const post = new THREE.Mesh(new THREE.BoxGeometry(0.055, seatH, 0.05), metalMat);
          post.position.set(legX, seatH / 2, zSide * (seatD / 2 - 0.03));
          post.castShadow = true;
          group.add(post);
        });

        const brace = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, seatD - 0.04), metalMat);
        brace.position.set(legX, seatH * 0.42, 0);
        group.add(brace);
      });

      const longBrace = new THREE.Mesh(new THREE.BoxGeometry(bW - 0.3, 0.045, 0.045), metalMat);
      longBrace.position.set(0, seatH * 0.42, 0);
      group.add(longBrace);

      [-1, 1].forEach((zSide) => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(bW, 0.05, 0.045), metalMat);
        rail.position.set(0, seatH - 0.03, zSide * (seatD / 2));
        group.add(rail);
      });

      const seatSlatCount = 5;
      const seatSlatDepth = (seatD - 0.05) / seatSlatCount - 0.012;
      for (let s = 0; s < seatSlatCount; s++) {
        const slat = new THREE.Mesh(new THREE.BoxGeometry(bW + 0.03, 0.035, seatSlatDepth), wpcMat);
        slat.position.set(0, seatH, -seatD / 2 + 0.03 + s * (seatSlatDepth + 0.012) + seatSlatDepth / 2);
        slat.castShadow = true;
        group.add(slat);
      }

      const backH = 0.42;
      const backZ = -seatD / 2 + 0.02;

      [-1, 1].forEach((side) => {
        const brk = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.2, 0.05), metalMat);
        brk.position.set(side * (bW / 2 - 0.16), seatH + 0.08, backZ + 0.02);
        group.add(brk);
      });

      const backGroup = new THREE.Group();
      backGroup.position.set(0, seatH + 0.18, backZ);
      backGroup.rotation.x = -0.22;

      [-1, 1].forEach((side) => {
        const sideRail = new THREE.Mesh(new THREE.BoxGeometry(0.05, backH, 0.04), metalMat);
        sideRail.position.set(side * (bW / 2 - 0.03), backH / 2, 0);
        backGroup.add(sideRail);
      });

      const backSlatCount = 4;
      const backSlatH = (backH - 0.04) / backSlatCount - 0.022;
      for (let s = 0; s < backSlatCount; s++) {
        const bSlat = new THREE.Mesh(new THREE.BoxGeometry(bW - 0.02, backSlatH, 0.035), wpcMat);
        bSlat.position.set(0, 0.04 + s * (backSlatH + 0.022) + backSlatH / 2, 0.015);
        bSlat.castShadow = true;
        backGroup.add(bSlat);
      }

      group.add(backGroup);
    } else if (product.model3D.shapeType === "lounge_set") {
      const armTubeSize = 0.045;
      const seatElevation = 0.38;
      const cushionThickness = 0.11;

      const buildLoungeUnit = (
        unitW: number,
        unitD: number,
        unitH: number,
        posX: number,
        posZ: number,
        rotY: number
      ) => {
        const uGroup = new THREE.Group();
        uGroup.position.set(posX, 0, posZ);
        uGroup.rotation.y = rotY;

        const armH = 0.62;
        const armD = unitD * 0.95;
        const halfInnerW = unitW / 2;

        [-1, 1].forEach((side) => {
          const lx = side * (halfInnerW + armTubeSize / 2);

          const bottomRunner = new THREE.Mesh(
            new THREE.BoxGeometry(armTubeSize, armTubeSize, armD),
            metalMat
          );
          bottomRunner.position.set(lx, armTubeSize / 2, 0);
          bottomRunner.castShadow = true;
          uGroup.add(bottomRunner);

          const topArm = new THREE.Mesh(
            new THREE.BoxGeometry(armTubeSize, armTubeSize, armD),
            metalMat
          );
          topArm.position.set(lx, armH - armTubeSize / 2, 0);
          topArm.castShadow = true;
          uGroup.add(topArm);

          const frontPost = new THREE.Mesh(
            new THREE.BoxGeometry(armTubeSize, armH, armTubeSize),
            metalMat
          );
          frontPost.position.set(lx, armH / 2, armD / 2 - armTubeSize / 2);
          frontPost.castShadow = true;
          uGroup.add(frontPost);

          const rearPost = new THREE.Mesh(
            new THREE.BoxGeometry(armTubeSize, armH, armTubeSize),
            metalMat
          );
          rearPost.position.set(lx, armH / 2, -armD / 2 + armTubeSize / 2);
          rearPost.castShadow = true;
          uGroup.add(rearPost);
        });

        const seatFrameFront = new THREE.Mesh(
          new THREE.BoxGeometry(unitW, armTubeSize, armTubeSize),
          metalMat
        );
        seatFrameFront.position.set(0, seatElevation - armTubeSize / 2, armD / 2 - armTubeSize / 2);
        uGroup.add(seatFrameFront);

        const seatFrameRear = new THREE.Mesh(
          new THREE.BoxGeometry(unitW, armTubeSize, armTubeSize),
          metalMat
        );
        seatFrameRear.position.set(0, seatElevation - armTubeSize / 2, -armD / 2 + armTubeSize / 2);
        uGroup.add(seatFrameRear);

        const slatCount = Math.max(4, Math.round(unitD / 0.14));
        const slatDepth = (armD - 0.08) / slatCount - 0.012;
        for (let s = 0; s < slatCount; s++) {
          const sMesh = new THREE.Mesh(
            new THREE.BoxGeometry(unitW - 0.02, 0.028, slatDepth),
            wpcMat
          );
          const sz = -armD / 2 + 0.04 + s * (slatDepth + 0.012) + slatDepth / 2;
          sMesh.position.set(0, seatElevation + 0.014, sz);
          uGroup.add(sMesh);
        }

        const seatCushion = new THREE.Mesh(
          new THREE.BoxGeometry(unitW - 0.03, cushionThickness, armD - 0.06),
          fabricMat
        );
        seatCushion.position.set(0, seatElevation + 0.028 + cushionThickness / 2, 0);
        seatCushion.castShadow = true;
        uGroup.add(seatCushion);

        const backTilt = -0.16;
        const backH = 0.44;
        const backZ = -armD / 2 + 0.08;

        const backGroup = new THREE.Group();
        backGroup.position.set(0, seatElevation + 0.04, backZ);
        backGroup.rotation.x = backTilt;

        [-1, 1].forEach((side) => {
          const backUpright = new THREE.Mesh(
            new THREE.BoxGeometry(armTubeSize * 0.9, backH, armTubeSize * 0.9),
            metalMat
          );
          backUpright.position.set(side * (halfInnerW - armTubeSize / 2), backH / 2, 0);
          backGroup.add(backUpright);
        });

        const backSlatCount = Math.max(3, Math.round(unitW / 0.18));
        const backSlatW = (unitW - armTubeSize * 2 - 0.04) / backSlatCount - 0.015;
        for (let bs = 0; bs < backSlatCount; bs++) {
          const bsMesh = new THREE.Mesh(
            new THREE.BoxGeometry(backSlatW, backH - 0.04, 0.022),
            wpcMat
          );
          const bsx = -(unitW - armTubeSize * 2 - 0.04) / 2 + bs * (backSlatW + 0.015) + backSlatW / 2;
          bsMesh.position.set(bsx, backH / 2, -0.01);
          backGroup.add(bsMesh);
        }

        const backCushion = new THREE.Mesh(
          new THREE.BoxGeometry(unitW - 0.04, backH * 0.94, cushionThickness),
          fabricMat
        );
        backCushion.position.set(0, backH / 2, 0.055);
        backCushion.castShadow = true;
        backGroup.add(backCushion);

        uGroup.add(backGroup);
        return uGroup;
      };

      const loveseat = buildLoungeUnit(1.28, 0.74, 0.76, 0, -0.42, 0);
      group.add(loveseat);

      const leftArmchair = buildLoungeUnit(0.66, 0.72, 0.76, -0.88, 0.22, Math.PI / 12);
      group.add(leftArmchair);

      const rightArmchair = buildLoungeUnit(0.66, 0.72, 0.76, 0.88, 0.22, -Math.PI / 12);
      group.add(rightArmchair);

      const tableW = 0.92;
      const tableD = 0.54;
      const tableH = 0.38;
      const tableGroup = new THREE.Group();
      tableGroup.position.set(0, 0, 0.16);

      [-1, 1].forEach((side) => {
        const tx = side * (tableW / 2 - armTubeSize / 2);

        const runner = new THREE.Mesh(
          new THREE.BoxGeometry(armTubeSize, armTubeSize, tableD),
          metalMat
        );
        runner.position.set(tx, armTubeSize / 2, 0);
        tableGroup.add(runner);

        const topBar = new THREE.Mesh(
          new THREE.BoxGeometry(armTubeSize, armTubeSize, tableD),
          metalMat
        );
        topBar.position.set(tx, tableH - armTubeSize / 2, 0);
        tableGroup.add(topBar);

        [-1, 1].forEach((zs) => {
          const post = new THREE.Mesh(
            new THREE.BoxGeometry(armTubeSize, tableH, armTubeSize),
            metalMat
          );
          post.position.set(tx, tableH / 2, zs * (tableD / 2 - armTubeSize / 2));
          tableGroup.add(post);
        });
      });

      [-1, 1].forEach((zs) => {
        const apron = new THREE.Mesh(
          new THREE.BoxGeometry(tableW - armTubeSize * 2, armTubeSize, armTubeSize),
          metalMat
        );
        apron.position.set(0, tableH - armTubeSize / 2, zs * (tableD / 2 - armTubeSize / 2));
        tableGroup.add(apron);
      });

      const tSlatCount = 6;
      const tSlatD = (tableD - armTubeSize * 2 - 0.02) / tSlatCount - 0.008;
      for (let ts = 0; ts < tSlatCount; ts++) {
        const tsMesh = new THREE.Mesh(
          new THREE.BoxGeometry(tableW - armTubeSize * 2 - 0.02, 0.024, tSlatD),
          wpcMat
        );
        const tsz = -(tableD - armTubeSize * 2 - 0.02) / 2 + ts * (tSlatD + 0.008) + tSlatD / 2;
        tsMesh.position.set(0, tableH + 0.012, tsz);
        tsMesh.castShadow = true;
        tableGroup.add(tsMesh);
      }

      group.add(tableGroup);
    } else if (product.model3D.shapeType === "firepit_table") {
      const tW = width;
      const tD = depth;
      const tH = height;
      const topThk = 0.09;
      const baseW = tW * 0.6;
      const baseD = tD * 0.6;
      const baseH = tH - topThk - 0.05;

      const planksY = 5;
      const plankH = baseH / planksY;
      for (let p = 0; p < planksY; p++) {
        const plank = new THREE.Mesh(new THREE.BoxGeometry(baseW, plankH * 0.9, baseD), wpcMat);
        plank.position.set(0, 0.05 + p * plankH + plankH / 2, 0);
        plank.castShadow = true;
        group.add(plank);
      }

      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([fx, fz]) => {
        const foot = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.05, 0.055), metalMat);
        foot.position.set(fx * (baseW / 2 - 0.05), 0.025, fz * (baseD / 2 - 0.05));
        group.add(foot);
      });

      const topY = tH - topThk / 2;
      const band = new THREE.Mesh(new THREE.BoxGeometry(tW, topThk, tD), wpcMat);
      band.position.set(0, topY, 0);
      band.castShadow = true;
      group.add(band);

      const slatCount = 16;
      const innerW = tW - 0.08;
      const slatW = innerW / slatCount - 0.008;
      for (let s = 0; s < slatCount; s++) {
        const sMesh = new THREE.Mesh(new THREE.BoxGeometry(slatW, 0.012, tD - 0.08), wpcMat);
        sMesh.position.set(-innerW / 2 + s * (slatW + 0.008) + slatW / 2, topY + topThk / 2 + 0.006, 0);
        sMesh.castShadow = true;
        group.add(sMesh);
      }

      const basketW = tW * 0.42;
      const basketD = tD * 0.32;
      const basketH = 0.17;
      const basketY = tH + basketH / 2;

      [basketY + basketH / 2, basketY - basketH / 2].forEach((ry) => {
        [-1, 1].forEach((zs) => {
          const rim = new THREE.Mesh(new THREE.BoxGeometry(basketW, 0.022, 0.022), metalMat);
          rim.position.set(0, ry, zs * (basketD / 2));
          group.add(rim);
        });
        [-1, 1].forEach((xs) => {
          const rim = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.022, basketD), metalMat);
          rim.position.set(xs * (basketW / 2), ry, 0);
          group.add(rim);
        });
      });

      const barsPerSide = 9;
      for (let b = 0; b < barsPerSide; b++) {
        const bx = -basketW / 2 + 0.02 + (b * (basketW - 0.04)) / (barsPerSide - 1);
        [-1, 1].forEach((zs) => {
          const bar = new THREE.Mesh(
            new THREE.TorusGeometry(basketH * 0.55, 0.009, 6, 10, Math.PI * 0.6),
            metalMat
          );
          bar.position.set(bx, basketY, zs * (basketD / 2));
          bar.rotation.z = Math.PI / 2 + (zs > 0 ? 0.35 : -0.35);
          bar.rotation.y = Math.PI / 2;
          group.add(bar);
        });
      }

      const lavaMat = new THREE.MeshStandardMaterial({ color: 0x5b3a2a, roughness: 1 });
      for (let l = 0; l < 10; l++) {
        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.026, 0), lavaMat);
        rock.position.set(
          -basketW / 2 + 0.05 + Math.random() * (basketW - 0.1),
          basketY - basketH * 0.28,
          -basketD / 2 + 0.04 + Math.random() * (basketD - 0.08)
        );
        group.add(rock);
      }

      const flameMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
      const flameCoreMat = new THREE.MeshBasicMaterial({ color: 0xfde68a });
      [-0.09, 0, 0.09].forEach((fx, fi) => {
        const flame = new THREE.Mesh(new THREE.ConeGeometry(0.038, 0.17 + fi * 0.02, 7), fi === 1 ? flameCoreMat : flameMat);
        flame.position.set(fx, basketY + 0.07, 0);
        group.add(flame);
      });
    } else if (product.model3D.shapeType === "bench_integrated") {
      const boxGeo = new THREE.BoxGeometry(0.5, height, 0.5);
      const leftBox = new THREE.Mesh(boxGeo, wpcMat);
      leftBox.position.set(-width / 2 + 0.25, height / 2, 0);
      leftBox.castShadow = true;
      group.add(leftBox);

      const rightBox = new THREE.Mesh(boxGeo, wpcMat);
      rightBox.position.set(width / 2 - 0.25, height / 2, 0);
      rightBox.castShadow = true;
      group.add(rightBox);

      const seatW = width - 1.0;
      const seatMesh = new THREE.Mesh(new THREE.BoxGeometry(seatW, 0.08, 0.45), wpcMat);
      seatMesh.position.set(0, 0.42, 0);
      seatMesh.castShadow = true;
      group.add(seatMesh);

      const legMesh = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.38, 0.42), metalMat);
      legMesh.position.set(0, 0.19, 0);
      group.add(legMesh);

      const bushL = createFoliageCluster({
        radius: 0.26,
        seed: 31,
        density: 1.1,
        heightScale: 1.05,
        withFlowers: true,
      });
      bushL.position.set(-width / 2 + 0.25, height + 0.18, 0);
      group.add(bushL);

      const bushR = createFoliageCluster({
        radius: 0.26,
        seed: 77,
        density: 1.1,
        heightScale: 1.05,
        withFlowers: true,
        tone: "light",
      });
      bushR.position.set(width / 2 - 0.25, height + 0.18, 0);
      group.add(bushR);
    } else if (product.model3D.shapeType === "water_feature") {
      const wW = width || 1.3;
      const wD = depth || 1.1;
      const basinH = 0.32;
      const basinThk = 0.08;

      const planksY = 4;
      const plankH = (basinH - 0.04) / planksY;

      [-1, 1].forEach((zs) => {
        for (let p = 0; p < planksY; p++) {
          const plank = new THREE.Mesh(
            new THREE.BoxGeometry(wW, plankH * 0.92, 0.032),
            wpcMat
          );
          plank.position.set(0, 0.02 + p * plankH + plankH / 2, zs * (wD / 2 - 0.016));
          plank.castShadow = true;
          group.add(plank);
        }
      });

      [-1, 1].forEach((xs) => {
        for (let p = 0; p < planksY; p++) {
          const plank = new THREE.Mesh(
            new THREE.BoxGeometry(0.032, plankH * 0.92, wD - 0.06),
            wpcMat
          );
          plank.position.set(xs * (wW / 2 - 0.016), 0.02 + p * plankH + plankH / 2, 0);
          plank.castShadow = true;
          group.add(plank);
        }
      });

      const topRimGeoX = new THREE.BoxGeometry(wW + 0.02, 0.04, basinThk);
      [-1, 1].forEach((zs) => {
        const rimX = new THREE.Mesh(topRimGeoX, wpcMat);
        rimX.position.set(0, basinH - 0.01, zs * (wD / 2 - basinThk / 2));
        rimX.castShadow = true;
        group.add(rimX);
      });

      const topRimGeoZ = new THREE.BoxGeometry(basinThk, 0.04, wD - basinThk * 2);
      [-1, 1].forEach((xs) => {
        const rimZ = new THREE.Mesh(topRimGeoZ, wpcMat);
        rimZ.position.set(xs * (wW / 2 - basinThk / 2), basinH - 0.01, 0);
        rimZ.castShadow = true;
        group.add(rimZ);
      });

      const poolWaterMat = new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        transmission: 0.85,
        opacity: 0.9,
        transparent: true,
        roughness: 0.08,
        ior: 1.333,
      });
      const poolWater = new THREE.Mesh(
        new THREE.PlaneGeometry(wW - basinThk * 2 - 0.04, wD - basinThk * 2 - 0.04),
        poolWaterMat
      );
      poolWater.rotation.x = -Math.PI / 2;
      poolWater.position.set(0, basinH - 0.07, 0);
      group.add(poolWater);

      const frameThk = 0.075;
      const waterCurtainMat = new THREE.MeshPhysicalMaterial({
        color: 0xbae6fd,
        transmission: 0.92,
        transparent: true,
        opacity: 0.82,
        roughness: 0.12,
        ior: 1.333,
        side: THREE.DoubleSide,
      });

      const buildCascadeFrame = (fWidth: number, fHeight: number, posZ: number) => {
        const fGroup = new THREE.Group();
        const fBottomY = basinH - 0.02;

        const postL = new THREE.Mesh(new THREE.BoxGeometry(frameThk, fHeight, frameThk), wpcMat);
        postL.position.set(-fWidth / 2 + frameThk / 2, fBottomY + fHeight / 2, posZ);
        postL.castShadow = true;
        fGroup.add(postL);

        const postR = new THREE.Mesh(new THREE.BoxGeometry(frameThk, fHeight, frameThk), wpcMat);
        postR.position.set(fWidth / 2 - frameThk / 2, fBottomY + fHeight / 2, posZ);
        postR.castShadow = true;
        fGroup.add(postR);

        const topBeam = new THREE.Mesh(new THREE.BoxGeometry(fWidth, frameThk, frameThk), wpcMat);
        topBeam.position.set(0, fBottomY + fHeight - frameThk / 2, posZ);
        topBeam.castShadow = true;
        fGroup.add(topBeam);

        const sheetH = fHeight - frameThk * 1.25;
        const sheetW = fWidth - frameThk * 2.2;
        const sheetMesh = new THREE.Mesh(new THREE.PlaneGeometry(sheetW, sheetH), waterCurtainMat);
        sheetMesh.position.set(0, fBottomY + sheetH / 2, posZ);
        fGroup.add(sheetMesh);

        for (let st = 0; st < 10; st++) {
          const sx = -sheetW / 2 + 0.02 + (st * (sheetW - 0.04)) / 9;
          const strandMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.006, sheetH, 4), waterCurtainMat);
          strandMesh.position.set(sx, fBottomY + sheetH / 2, posZ + (st % 2 === 0 ? 0.008 : -0.008));
          fGroup.add(strandMesh);
        }

        return fGroup;
      };

      group.add(buildCascadeFrame(wW * 0.76, 1.45, -wD * 0.22));
      group.add(buildCascadeFrame(wW * 0.65, 1.08, wD * 0.12));
    } else {
      const box = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), wpcMat);
      box.position.y = height / 2;
      box.castShadow = true;
      box.receiveShadow = true;
      group.add(box);

      const rim = new THREE.Mesh(new THREE.BoxGeometry(width + 0.02, 0.04, depth + 0.02), metalMat);
      rim.position.y = height;
      group.add(rim);

      if (product.category === "planting") {
        const cover = createGroundCover(width - 0.08, depth, 13, true);
        cover.position.set(0, height + 0.04, 0);
        group.add(cover);

        const numShrubs = Math.max(1, Math.round(width / 0.55));
        for (let l = 0; l < numShrubs; l++) {
          const lx = -width / 2 + 0.26 + (l * (width - 0.52)) / Math.max(1, numShrubs - 1);
          const shrub = createFoliageCluster({
            radius: 0.21 + (l % 3) * 0.025,
            seed: 211 + l * 67,
            density: 1,
            heightScale: 1.15,
            withFlowers: l % 2 === 0,
            tone: l % 3 === 0 ? "light" : l % 3 === 1 ? "normal" : "dark",
          });
          shrub.position.set(lx, height + 0.2, (l % 2 === 0 ? 1 : -1) * depth * 0.1);
          group.add(shrub);
        }
      }
    }
  }, [product, selectedWPC, selectedMetal]);

  const handleSendInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryName || !inquiryPhone) return;
    try {
      await fetch("/api/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: inquiryName,
          phone: inquiryPhone,
          message: `استعلام قیمت و موجودی محصول: ${product.name} (${product.code})`,
          servicesNeeded: ["استعلام کالا", product.name],
        }),
      });
      setInquirySent(true);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans text-right" dir="rtl">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Link href="/products" className="hover:text-white transition-colors">
            محصولات مدولار
          </Link>
          <span>/</span>
          <span className="text-emerald-400 font-medium">{product.name}</span>
        </div>

        {/* Product Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* 3D Visualizer Canvas & Controls */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative rounded-3xl overflow-hidden border border-slate-700 bg-slate-900 shadow-2xl aspect-[4/3]">
              <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />

              <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur border border-slate-700 px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 text-emerald-400 font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>نمایشگر ۳D تعاملی (۳۶۰ درجه)</span>
              </div>

            </div>

            {/* Material Switchers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  رنگ چوب‌پلاست WPC:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {WPC_COLORS.map((col) => (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => setSelectedWPC(col.id)}
                      className={`p-2 rounded-lg border text-right flex items-center gap-2 text-xs transition-all ${
                        selectedWPC === col.id
                          ? "bg-emerald-500/15 border-emerald-500 text-emerald-300"
                          : "bg-slate-800 border-slate-700 text-slate-300"
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded" style={{ backgroundColor: col.colorHex }} />
                      <span className="truncate">{col.name.split(" ")[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  رنگ استراکچر فلزی:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {METAL_COLORS.map((col) => (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => setSelectedMetal(col.id)}
                      className={`p-2 rounded-lg border text-center flex flex-col items-center gap-1 text-xs transition-all ${
                        selectedMetal === col.id
                          ? "bg-emerald-500/15 border-emerald-500 text-emerald-300"
                          : "bg-slate-800 border-slate-700 text-slate-300"
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: col.colorHex }} />
                      <span className="truncate text-[10px]">{col.name.split(" ")[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Product Info & Direct CTAs */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                  {product.code}
                </span>
                <span className="text-xs text-slate-400">{product.categoryName}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                {product.name}
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {product.fullDesc}
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">ابعاد محصول:</span>
                <span className="font-mono font-bold text-white mt-0.5 block">
                  {product.dimensions.unitString}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">وزن خالی سازه:</span>
                <span className="font-mono font-bold text-emerald-400 mt-0.5 block">
                  {product.weightKg} کیلوگرم
                </span>
              </div>
            </div>

            {/* Price Box & 3D Studio Trigger */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-emerald-950/40 border border-emerald-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 font-medium">برآورد قیمت واحد:</span>
                <div className="font-mono text-left">
                  <span className="text-xl font-black text-emerald-400">
                    {(product.priceEstToman / 1000000).toLocaleString("fa-IR")}
                  </span>
                  <span className="text-xs text-slate-300 mr-1.5">میلیون تومان</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <Link
                  href="/studio"
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>افزودن به طراح سه‌بعدی بام من</span>
                </Link>

                <a
                  href={`https://wa.me/982144484801?text=${encodeURIComponent(`سلام، استعلام قیمت و سفارش محصول ${product.name} (${product.code})`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors"
                >
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span>سفارش از واتساپ</span>
                </a>
              </div>
            </div>

            {/* Quick Inquiry Form */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-xs">
              <h4 className="font-bold text-white text-xs">ثبت استعلام فوری این محصول:</h4>
              {inquirySent ? (
                <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 rounded-xl text-center">
                  استعلام شما ثبت شد. کارشناس فروش با شما تماس خواهد گرفت.
                </div>
              ) : (
                <form onSubmit={handleSendInquiry} className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="نام شما"
                      value={inquiryName}
                      onChange={(e) => setInquiryName(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-emerald-500 text-xs"
                    />
                    <input
                      type="tel"
                      required
                      placeholder="شماره تماس"
                      value={inquiryPhone}
                      onChange={(e) => setInquiryPhone(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-emerald-500 text-xs"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>ارسال استعلام</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Technical Specifications Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            <span>مشخصات فنی و استانداردهای تولید چکادبام</span>
          </h3>

          <div className="border border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-right text-xs">
              <tbody className="divide-y divide-slate-800">
                {Object.entries(product.specs).map(([key, val], idx) => (
                  <tr key={idx} className="hover:bg-slate-850">
                    <td className="p-3.5 font-bold text-slate-300 w-1/3 bg-slate-950/40">{key}</td>
                    <td className="p-3.5 text-slate-300 font-mono">{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>



      <Footer />
    </div>
  );
}
