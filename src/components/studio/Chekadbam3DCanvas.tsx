"use client";

import React, { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import * as THREE from "three";
import { SpaceConfig, StudioItem } from "@/lib/studio-types";
import { createWpcPlankTexture, createArtificialTurfTexture, createCanvasFabricTexture, createFallingWaterTexture, createWaterCausticsTexture } from "@/lib/materials-textures";
import { clampItemToPlan, isInsidePlanBounds } from "@/lib/plan-boundary";
import { createFoliageCluster, createTreeCanopy, createVineCluster, createGroundCover } from "@/lib/foliage";

/** Stable numeric seed derived from an item id so plants never re-shuffle. */
function seedFromId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h % 100000);
}

const faNum = (n: number) => n.toLocaleString("fa-IR", { maximumFractionDigits: 1 });

/** Per-frame living effects (falling water, ripples, flames) rebuilt with each buildItems pass. */
type AnimatedItemEffect =
  | { type: "scroll"; mat: THREE.MeshPhysicalMaterial; speed: number }
  | { type: "shimmer"; mat: THREE.MeshPhysicalMaterial }
  | { type: "splash"; mesh: THREE.Mesh; base: number; phase: number }
  | { type: "flame"; meshes: THREE.Mesh[]; light?: THREE.PointLight; base: number; phase: number };

export interface Chekadbam3DCanvasRef {
  takeScreenshot: () => string;
  resetCamera: () => void;
  setTopView: (isTop: boolean) => void;
}

interface Chekadbam3DCanvasProps {
  spaceConfig: SpaceConfig;
  items: StudioItem[];
  selectedItemId: string | null;
  onSelectItem: (id: string | null) => void;
  onUpdateItemPosition: (id: string, x: number, z: number) => void;
  lightingMode: "day" | "sunset" | "night";
  viewMode: "3d" | "top_2d";
  smartSnapping: boolean;
}

export const Chekadbam3DCanvas = forwardRef<Chekadbam3DCanvasRef, Chekadbam3DCanvasProps>(
  (
    {
      spaceConfig,
      items,
      selectedItemId,
      onSelectItem,
      onUpdateItemPosition,
      lightingMode,
      viewMode,
      smartSnapping,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Three.js instances
    const sceneRef = useRef<THREE.Scene | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const itemsGroupRef = useRef<THREE.Group | null>(null);
    const environmentGroupRef = useRef<THREE.Group | null>(null);
    const planDimsGroupRef = useRef<THREE.Group | null>(null);
    const lightsGroupRef = useRef<THREE.Group | null>(null);
    const selectionHelperRef = useRef<THREE.BoxHelper | null>(null);

    // Interaction & Orbit state
    const isOrbitingRef = useRef(false);
    const isDraggingItemRef = useRef(false);
    const clickedItemIdRef = useRef<string | null>(null);
    const dragPlaneRef = useRef<THREE.Plane>(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
    const previousMousePosRef = useRef({ x: 0, y: 0 });
    const pointerDownStartPosRef = useRef({ x: 0, y: 0 });
    const dragOffsetRef = useRef({ x: 0, z: 0 });
    const hasMovedPastThresholdRef = useRef(false);
    const cameraAngleRef = useRef({ theta: Math.PI / 4, phi: Math.PI / 3, radius: 20 });
    const targetLookAtRef = useRef(new THREE.Vector3(0, 0, 0));

    // itemId -> live THREE.Group, for direct (no-rebuild) transforms during drag
    const itemGroupsRef = useRef<Map<string, THREE.Group>>(new Map());
    // Invisible picking proxies (one box per item) for fast, stable raycast selection
    const hitProxiesRef = useRef<THREE.Mesh[]>([]);
    const animatedEffectsRef = useRef<AnimatedItemEffect[]>([]);
    // Last clamped position while dragging, committed once on pointer-up
    const dragLastPosRef = useRef<{ x: number; z: number } | null>(null);
    // Throttle for hover cursor feedback
    const lastHoverCheckRef = useRef(0);

    // Collision status
    const [hasCollisions, setHasCollisions] = useState(false);

    // Helper: Colors
    const getWPCColorHexStr = (colorId?: string) => {
      switch (colorId) {
        case "teak":
          return "#9b683e";
        case "charcoal":
          return "#2b2a29";
        case "oak":
          return "#c59d6f";
        case "walnut":
        default:
          return "#4a321f";
      }
    };

    const getMetalColorHex = (colorId?: string) => {
      switch (colorId) {
        case "charcoal":
          return 0x374151;
        case "cream":
          return 0xd6cebe;
        case "black":
        default:
          return 0x18181b;
      }
    };

    // Camera Reset
    const resetCamera = useCallback(() => {
      const maxDim = Math.max(spaceConfig.width, spaceConfig.length);
      cameraAngleRef.current = {
        theta: Math.PI / 4,
        phi: Math.PI / 3.2,
        radius: Math.max(14, maxDim * 1.6),
      };
      targetLookAtRef.current.set(0, 0, 0);
      updateCameraPosition();
    }, [spaceConfig.width, spaceConfig.length]);

    const setTopView = useCallback(
      (isTop: boolean) => {
        const maxDim = Math.max(spaceConfig.width, spaceConfig.length);
        if (isTop) {
          // Fit the whole plan (plus its dimension chains) inside the viewport
          const cam = cameraRef.current;
          const aspect = cam?.aspect || 1;
          const margin = 3.4; // plan edge → dimension chain + breathing room
          const needW = spaceConfig.width + margin * 2;
          const needH = spaceConfig.length + margin * 2;
          const fovTan = Math.tan(((cam?.fov || 45) * Math.PI) / 360);
          const fitRadius = Math.max(needH / (2 * fovTan), needW / (2 * fovTan * aspect));
          cameraAngleRef.current = {
            theta: 0,
            phi: 0.05,
            radius: Math.max(15, fitRadius),
          };
        } else {
          resetCamera();
        }
        updateCameraPosition();
      },
      [resetCamera, spaceConfig.width, spaceConfig.length]
    );

    const updateCameraPosition = () => {
      if (!cameraRef.current) return;
      const { theta, phi, radius } = cameraAngleRef.current;
      const x = radius * Math.sin(phi) * Math.sin(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.cos(theta);

      cameraRef.current.position.set(
        targetLookAtRef.current.x + x,
        targetLookAtRef.current.y + y,
        targetLookAtRef.current.z + z
      );
      cameraRef.current.lookAt(targetLookAtRef.current);
    };

    useImperativeHandle(ref, () => ({
      takeScreenshot: () => {
        if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return "";
        rendererRef.current.render(sceneRef.current, cameraRef.current);
        return rendererRef.current.domElement.toDataURL("image/jpeg", 0.95);
      },
      resetCamera,
      setTopView,
    }));

    // Lighting & Atmosphere
    const updateLighting = useCallback(() => {
      if (!lightsGroupRef.current || !sceneRef.current) return;
      const group = lightsGroupRef.current;

      while (group.children.length > 0) {
        group.remove(group.children[0]);
      }

      if (lightingMode === "day") {
        sceneRef.current.background = new THREE.Color(0xdcecf8);
        sceneRef.current.fog = new THREE.FogExp2(0xdcecf8, 0.01);

        const hemiLight = new THREE.HemisphereLight(0xffffff, 0xbfe3b4, 0.9);
        group.add(hemiLight);

        const sunLight = new THREE.DirectionalLight(0xfffaed, 1.5);
        sunLight.position.set(22, 32, 16);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.bias = -0.0004;
        const d = 20;
        sunLight.shadow.camera.left = -d;
        sunLight.shadow.camera.right = d;
        sunLight.shadow.camera.top = d;
        sunLight.shadow.camera.bottom = -d;
        group.add(sunLight);

        const fill = new THREE.DirectionalLight(0xa5d8ff, 0.45);
        fill.position.set(-15, 12, -15);
        group.add(fill);
      } else if (lightingMode === "sunset") {
        sceneRef.current.background = new THREE.Color(0xfde2c8);
        sceneRef.current.fog = new THREE.FogExp2(0xfde2c8, 0.012);

        const hemiLight = new THREE.HemisphereLight(0xffd1a4, 0x3b2447, 0.7);
        group.add(hemiLight);

        const sunLight = new THREE.DirectionalLight(0xff7a18, 1.7);
        sunLight.position.set(25, 9, 12);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        const d = 20;
        sunLight.shadow.camera.left = -d;
        sunLight.shadow.camera.right = d;
        sunLight.shadow.camera.top = d;
        sunLight.shadow.camera.bottom = -d;
        group.add(sunLight);

        const warmFill = new THREE.DirectionalLight(0xc084fc, 0.5);
        warmFill.position.set(-15, 10, -10);
        group.add(warmFill);
      } else {
        // Night mode
        sceneRef.current.background = new THREE.Color(0x0a1120);
        sceneRef.current.fog = new THREE.FogExp2(0x0a1120, 0.015);

        const hemiLight = new THREE.HemisphereLight(0x1e293b, 0x0f172a, 0.35);
        group.add(hemiLight);

        const moonLight = new THREE.DirectionalLight(0x60a5fa, 0.38);
        moonLight.position.set(12, 28, 12);
        moonLight.castShadow = true;
        group.add(moonLight);

        const ambientNight = new THREE.AmbientLight(0x1e1b4b, 0.45);
        group.add(ambientNight);
      }
    }, [lightingMode]);

    // Build Environment (Floor Decking, Parapet Walls, Geometry based on FloorPlanShape)
    const buildEnvironment = useCallback(() => {
      if (!environmentGroupRef.current) return;
      const group = environmentGroupRef.current;

      while (group.children.length > 0) {
        const child = group.children[0];
        group.remove(child);
        // Release GPU resources so repeated rebuilds don't leak geometries/textures
        child.traverse((obj) => {
          const mesh = obj as THREE.Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
          const mat = mesh.material as THREE.MeshStandardMaterial | undefined;
          if (mat) {
            if (mat.map) mat.map.dispose();
            if (mat.bumpMap) mat.bumpMap.dispose();
            mat.dispose();
          }
        });
      }

      const {
        width,
        length,
        parapetHeight,
        flooringType,
        wpcColor,
        shape = "rectangular",
        cutoutWidth = 4.5,
        cutoutLength = 4.0,
        shaftWidth = 3.2,
        shaftLength = 3.0,
      } = spaceConfig;

      const wpcHex = getWPCColorHexStr(wpcColor);
      const { map: wpcTexture, bumpMap: wpcBump } = createWpcPlankTexture(wpcHex, 0.2, 8);
      const { map: turfTexture, bumpMap: turfBump } = createArtificialTurfTexture();

      // Flooring Material
      let floorMat: THREE.Material;
      if (flooringType === "wpc_wood") {
        floorMat = new THREE.MeshStandardMaterial({
          map: wpcTexture,
          bumpMap: wpcBump,
          bumpScale: 0.08,
          roughness: 0.6,
          metalness: 0.05,
        });
      } else if (flooringType === "artificial_turf") {
        floorMat = new THREE.MeshStandardMaterial({
          map: turfTexture,
          bumpMap: turfBump,
          bumpScale: 0.12,
          roughness: 0.85,
          metalness: 0.0,
        });
      } else if (flooringType === "stone") {
        floorMat = new THREE.MeshStandardMaterial({
          color: 0x94a3b8,
          roughness: 0.8,
          metalness: 0.1,
        });
      } else {
        // Mixed
        floorMat = new THREE.MeshStandardMaterial({
          map: wpcTexture,
          bumpMap: wpcBump,
          bumpScale: 0.08,
          roughness: 0.6,
        });
      }

      const wallMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        roughness: 0.85,
      });

      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0xbae6fd,
        transparent: true,
        opacity: 0.45,
        roughness: 0.1,
        transmission: 0.6,
        ior: 1.5,
      });

      const railMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.8,
        roughness: 0.2,
      });

      const wallThick = 0.25;
      const pH = parapetHeight || 1.1;

      // Helper to add a parapet segment
      const addParapetSegment = (
        pW: number,
        pD: number,
        posX: number,
        posZ: number,
        solidH = Math.min(0.4, pH)
      ) => {
        // Solid bottom
        const baseGeo = new THREE.BoxGeometry(pW, solidH, pD);
        const baseMesh = new THREE.Mesh(baseGeo, wallMat);
        baseMesh.position.set(posX, solidH / 2, posZ);
        baseMesh.receiveShadow = true;
        baseMesh.castShadow = true;
        group.add(baseMesh);

        // Glass upper
        if (pH > solidH) {
          const glassH = pH - solidH;
          const glassGeo = new THREE.BoxGeometry(
            pW < pD ? 0.08 : pW - 0.08,
            glassH - 0.05,
            pD < pW ? 0.08 : pD - 0.08
          );
          const glassMesh = new THREE.Mesh(glassGeo, glassMat);
          glassMesh.position.set(posX, solidH + glassH / 2 - 0.025, posZ);
          group.add(glassMesh);

          // Top handrail
          const railGeo = new THREE.BoxGeometry(pW < pD ? 0.12 : pW, 0.05, pD < pW ? 0.12 : pD);
          const railMesh = new THREE.Mesh(railGeo, railMat);
          railMesh.position.set(posX, pH, posZ);
          railMesh.castShadow = true;
          group.add(railMesh);
        }
      };

      // Construct Floor & Parapets depending on shape
      if (shape === "l_shaped") {
        // L-Shape is constructed with 2 rectangular blocks: Main block & Wing block
        const mainW = width - cutoutWidth;
        const mainL = length;
        const mainX = -width / 2 + mainW / 2;
        const mainZ = 0;

        const wingW = cutoutWidth;
        const wingL = length - cutoutLength;
        const wingX = width / 2 - wingW / 2;
        const wingZ = -length / 2 + wingL / 2;

        // Block 1
        const fGeo1 = new THREE.BoxGeometry(mainW, 0.2, mainL);
        const fMesh1 = new THREE.Mesh(fGeo1, floorMat);
        fMesh1.position.set(mainX, -0.1, mainZ);
        fMesh1.receiveShadow = true;
        group.add(fMesh1);

        // Block 2
        const fGeo2 = new THREE.BoxGeometry(wingW, 0.2, wingL);
        const fMesh2 = new THREE.Mesh(fGeo2, floorMat);
        fMesh2.position.set(wingX, -0.1, wingZ);
        fMesh2.receiveShadow = true;
        group.add(fMesh2);

        // L-Shape Parapets
        // North Wall (full top width)
        addParapetSegment(width + wallThick * 2, wallThick, 0, -length / 2 - wallThick / 2);
        // West Wall (full left length)
        addParapetSegment(wallThick, length, -width / 2 - wallThick / 2, 0);
        // South Main Wall
        addParapetSegment(mainW + wallThick, wallThick, mainX - wallThick / 2, length / 2 + wallThick / 2);
        // Inner Corner Step Wall
        addParapetSegment(wallThick, cutoutLength, mainX + mainW / 2 + wallThick / 2, length / 2 - cutoutLength / 2);
        addParapetSegment(cutoutWidth, wallThick, wingX, length / 2 - cutoutLength + wallThick / 2);
        // East Wing Wall
        addParapetSegment(wallThick, wingL, width / 2 + wallThick / 2, wingZ);
      } else if (shape === "u_shaped") {
        // U-Shape: Left wing, Right wing, and connecting back corridor
        const wingW = (width - cutoutWidth) / 2;
        const backL = length - cutoutLength;

        // Left Wing
        const f1 = new THREE.Mesh(new THREE.BoxGeometry(wingW, 0.2, length), floorMat);
        f1.position.set(-width / 2 + wingW / 2, -0.1, 0);
        f1.receiveShadow = true;
        group.add(f1);

        // Right Wing
        const f2 = new THREE.Mesh(new THREE.BoxGeometry(wingW, 0.2, length), floorMat);
        f2.position.set(width / 2 - wingW / 2, -0.1, 0);
        f2.receiveShadow = true;
        group.add(f2);

        // Back bridge
        const f3 = new THREE.Mesh(new THREE.BoxGeometry(cutoutWidth, 0.2, backL), floorMat);
        f3.position.set(0, -0.1, -length / 2 + backL / 2);
        f3.receiveShadow = true;
        group.add(f3);

        // Parapets for U-Shape
        addParapetSegment(width + wallThick * 2, wallThick, 0, -length / 2 - wallThick / 2);
        addParapetSegment(wallThick, length, -width / 2 - wallThick / 2, 0);
        addParapetSegment(wallThick, length, width / 2 + wallThick / 2, 0);
        addParapetSegment(wingW + wallThick, wallThick, -width / 2 + wingW / 2, length / 2 + wallThick / 2);
        addParapetSegment(wingW + wallThick, wallThick, width / 2 - wingW / 2, length / 2 + wallThick / 2);
        // Inner courtyard perimeter
        addParapetSegment(wallThick, cutoutLength, -cutoutWidth / 2 - wallThick / 2, length / 2 - cutoutLength / 2);
        addParapetSegment(wallThick, cutoutLength, cutoutWidth / 2 + wallThick / 2, length / 2 - cutoutLength / 2);
        addParapetSegment(cutoutWidth, wallThick, 0, length / 2 - cutoutLength + wallThick / 2);
      } else if (shape === "central_shaft") {
        // Base full floor
        const floorGeo = new THREE.BoxGeometry(width, 0.2, length);
        const floorMesh = new THREE.Mesh(floorGeo, floorMat);
        floorMesh.position.set(0, -0.1, 0);
        floorMesh.receiveShadow = true;
        group.add(floorMesh);

        // Central concrete stair & elevator core tower
        const shaftH = 2.4;
        const shaftGeo = new THREE.BoxGeometry(shaftWidth, shaftH, shaftLength);
        const shaftMesh = new THREE.Mesh(shaftGeo, wallMat);
        shaftMesh.position.set(0, shaftH / 2, 0);
        shaftMesh.castShadow = true;
        shaftMesh.receiveShadow = true;
        group.add(shaftMesh);

        // Shaft Door and accent WPC canopy
        const doorGeo = new THREE.BoxGeometry(1.0, 2.0, 0.05);
        const doorMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
        const doorMesh = new THREE.Mesh(doorGeo, doorMat);
        doorMesh.position.set(0, 1.0, shaftLength / 2 + 0.02);
        group.add(doorMesh);

        // External 4 Parapets
        addParapetSegment(width + wallThick * 2, wallThick, 0, -length / 2 - wallThick / 2);
        addParapetSegment(width + wallThick * 2, wallThick, 0, length / 2 + wallThick / 2);
        addParapetSegment(wallThick, length, width / 2 + wallThick / 2, 0);
        addParapetSegment(wallThick, length, -width / 2 - wallThick / 2, 0);
      } else {
        // Standard Rectangular or Narrow Balcony
        const floorGeo = new THREE.BoxGeometry(width, 0.2, length);
        const floorMesh = new THREE.Mesh(floorGeo, floorMat);
        floorMesh.position.set(0, -0.1, 0);
        floorMesh.receiveShadow = true;
        group.add(floorMesh);

        // Outer Parapets
        addParapetSegment(width + wallThick * 2, wallThick, 0, -length / 2 - wallThick / 2);
        addParapetSegment(width + wallThick * 2, wallThick, 0, length / 2 + wallThick / 2);
        addParapetSegment(wallThick, length, width / 2 + wallThick / 2, 0);
        addParapetSegment(wallThick, length, -width / 2 - wallThick / 2, 0);
      }

      // Minimal metre grid — calm white hairlines on the dark deck: whisper-faint
      // 1 m cells, slightly stronger 5 m module rhythm, and a hairline frame tracing
      // the roof edge. Whole-metre extent, no overhang, no axis clutter.
      const roofHalfW = Math.floor(width) / 2;
      const roofHalfL = Math.floor(length) / 2;
      const buildGridLines = (step: number, color: number, opacity: number, y: number) => {
        const pts: number[] = [];
        for (let p = Math.ceil(-roofHalfW / step) * step; p <= roofHalfW + 1e-6; p += step) {
          pts.push(p, y, -roofHalfL, p, y, roofHalfL);
        }
        for (let p = Math.ceil(-roofHalfL / step) * step; p <= roofHalfL + 1e-6; p += step) {
          pts.push(-roofHalfW, y, p, roofHalfW, y, p);
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
        const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
        group.add(new THREE.LineSegments(geo, mat));
      };
      buildGridLines(1, 0xffffff, 0.07, 0.006);
      buildGridLines(5, 0xffffff, 0.16, 0.007);
      const frameGeo = new THREE.BufferGeometry();
      frameGeo.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(
          [
            -roofHalfW, 0.008, -roofHalfL, roofHalfW, 0.008, -roofHalfL,
            roofHalfW, 0.008, roofHalfL, -roofHalfW, 0.008, roofHalfL,
          ],
          3,
        ),
      );
      const frameMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22, depthWrite: false });
      group.add(new THREE.LineSegments(frameGeo, frameMat));

      // Distant Horizon Plane
      const groundGeo = new THREE.PlaneGeometry(140, 140);
      const groundMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.95 });
      const groundMesh = new THREE.Mesh(groundGeo, groundMat);
      groundMesh.rotation.x = -Math.PI / 2;
      groundMesh.position.set(0, -7, 0);
      group.add(groundMesh);
    }, [spaceConfig]);

    // Build Detailed 3D Objects with realistic WPC composite materials
    const createItemMeshGroup = useCallback(
      (item: StudioItem, isSelected: boolean) => {
        const itemGroup = new THREE.Group();
        itemGroup.name = `item-${item.id}`;
        itemGroup.userData = { itemId: item.id };

        const wpcHex = getWPCColorHexStr(item.wpcColor || spaceConfig.wpcColor);
        const metalColorHex = getMetalColorHex(item.metalColor || spaceConfig.metalColor);

        const { map: wpcTexture, bumpMap: wpcBump } = createWpcPlankTexture(wpcHex, 0.25, 6);

        // Realistic WPC material with wood planks texture and bump grooves
        const wpcMaterial = new THREE.MeshStandardMaterial({
          map: wpcTexture,
          bumpMap: wpcBump,
          bumpScale: 0.06,
          roughness: 0.55,
          metalness: 0.05,
        });

        const metalMaterial = new THREE.MeshStandardMaterial({
          color: metalColorHex,
          roughness: 0.35,
          metalness: 0.85,
        });

        const soilMaterial = new THREE.MeshStandardMaterial({
          color: 0x271c14,
          roughness: 0.95,
        });

        const foliageMaterial = new THREE.MeshStandardMaterial({
          color: 0x2e7d32,
          roughness: 0.7,
        });

        const foliageLightMaterial = new THREE.MeshStandardMaterial({
          color: 0x4ade80,
          roughness: 0.65,
        });

        const isNight = lightingMode === "night" || lightingMode === "sunset";

        switch (item.shapeType) {
          case "tree": {
            // Planter Pot (Cylinder with metal bands)
            const potGeo = new THREE.CylinderGeometry(0.35, 0.28, 0.55, 24);
            const potMesh = new THREE.Mesh(potGeo, metalMaterial);
            potMesh.position.y = 0.275;
            potMesh.castShadow = true;
            potMesh.receiveShadow = true;
            itemGroup.add(potMesh);

            // Soil
            const soilGeo = new THREE.CylinderGeometry(0.33, 0.33, 0.05, 24);
            const soilMesh = new THREE.Mesh(soilGeo, soilMaterial);
            soilMesh.position.y = 0.53;
            itemGroup.add(soilMesh);

            // Trunk
            const trunkGeo = new THREE.CylinderGeometry(0.06, 0.09, 1.1, 12);
            const trunkMat = new THREE.MeshStandardMaterial({ color: 0x452f1e, roughness: 0.9 });
            const trunkMesh = new THREE.Mesh(trunkGeo, trunkMat);
            trunkMesh.position.y = 1.0;
            trunkMesh.castShadow = true;
            itemGroup.add(trunkMesh);

            // Natural layered canopy of individual leaves
            const canopy = createTreeCanopy(0.56, seedFromId(item.id), true);
            canopy.position.set(0, 1.62, 0);
            itemGroup.add(canopy);

            // A few small ground-cover plants at the base of the trunk
            const potCover = createGroundCover(0.5, 0.5, seedFromId(item.id) + 4, true);
            potCover.position.set(0, 0.55, 0);
            itemGroup.add(potCover);

            if (isNight) {
              const spot = new THREE.PointLight(0xfef08a, 2.0, 4.5);
              spot.position.set(0, 0.6, 0);
              itemGroup.add(spot);
            }
            break;
          }

          case "bench_integrated": {
            // Left & Right WPC Planters
            const boxGeo = new THREE.BoxGeometry(0.5, item.height, 0.5);
            const leftBox = new THREE.Mesh(boxGeo, wpcMaterial);
            leftBox.position.set(-item.width / 2 + 0.25, item.height / 2, 0);
            leftBox.castShadow = true;
            leftBox.receiveShadow = true;
            itemGroup.add(leftBox);

            const rightBox = new THREE.Mesh(boxGeo, wpcMaterial);
            rightBox.position.set(item.width / 2 - 0.25, item.height / 2, 0);
            rightBox.castShadow = true;
            rightBox.receiveShadow = true;
            itemGroup.add(rightBox);

            // Metal rims
            const rimGeo = new THREE.BoxGeometry(0.52, 0.04, 0.52);
            const rimL = new THREE.Mesh(rimGeo, metalMaterial);
            rimL.position.set(-item.width / 2 + 0.25, item.height, 0);
            itemGroup.add(rimL);

            const rimR = new THREE.Mesh(rimGeo, metalMaterial);
            rimR.position.set(item.width / 2 - 0.25, item.height, 0);
            itemGroup.add(rimR);

            // Center WPC Slatted Bench Seat
            const seatW = item.width - 1.0;
            const seatGeo = new THREE.BoxGeometry(seatW, 0.08, 0.45);
            const seatMesh = new THREE.Mesh(seatGeo, wpcMaterial);
            seatMesh.position.set(0, 0.42, 0);
            seatMesh.castShadow = true;
            itemGroup.add(seatMesh);

            // Metal support legs
            const legGeo = new THREE.BoxGeometry(0.06, 0.38, 0.42);
            const legMesh = new THREE.Mesh(legGeo, metalMaterial);
            legMesh.position.set(0, 0.19, 0);
            legMesh.castShadow = true;
            itemGroup.add(legMesh);

            // Natural flowering plants in both side boxes
            const bushL = createFoliageCluster({
              radius: 0.26,
              seed: seedFromId(item.id) + 11,
              density: 1.1,
              heightScale: 1.05,
              withFlowers: true,
              tone: "normal",
            });
            bushL.position.set(-item.width / 2 + 0.25, item.height + 0.18, 0);
            itemGroup.add(bushL);

            const bushR = createFoliageCluster({
              radius: 0.26,
              seed: seedFromId(item.id) + 47,
              density: 1.1,
              heightScale: 1.05,
              withFlowers: true,
              tone: "light",
            });
            bushR.position.set(item.width / 2 - 0.25, item.height + 0.18, 0);
            itemGroup.add(bushR);

            if (isNight) {
              const led = new THREE.PointLight(0xffe699, 2.4, 4);
              led.position.set(0, 0.2, 0);
              itemGroup.add(led);
            }
            break;
          }

          case "bench_backrest": {
            // Slatted WPC bench with angled backrest on black steel sled frame
            const bW = item.width || 1.4;
            const bD = item.depth || 0.62;
            const seatH = 0.45;
            const seatD = bD * 0.72;
            const frameThk = 0.05;

            // --- Black steel sled legs (two sides) ---
            [-1, 1].forEach((side) => {
              const legX = (side * (bW / 2 - 0.16));

              // Bottom floor runner (sled foot)
              const footGeo = new THREE.BoxGeometry(0.07, 0.045, seatD + 0.06);
              const footMesh = new THREE.Mesh(footGeo, metalMaterial);
              footMesh.position.set(legX, 0.022, 0);
              footMesh.castShadow = true;
              footMesh.receiveShadow = true;
              itemGroup.add(footMesh);

              // Two vertical posts (front & back of the sled)
              [-1, 1].forEach((zSide) => {
                const postGeo = new THREE.BoxGeometry(0.055, seatH, frameThk);
                const postMesh = new THREE.Mesh(postGeo, metalMaterial);
                postMesh.position.set(legX, seatH / 2, zSide * (seatD / 2 - 0.03));
                postMesh.castShadow = true;
                itemGroup.add(postMesh);
              });

              // Horizontal cross stretcher between the two posts
              const braceGeo = new THREE.BoxGeometry(0.05, 0.05, seatD - 0.04);
              const braceMesh = new THREE.Mesh(braceGeo, metalMaterial);
              braceMesh.position.set(legX, seatH * 0.42, 0);
              braceMesh.castShadow = true;
              itemGroup.add(braceMesh);
            });

            // Long stretcher bar connecting both legs
            const longBraceGeo = new THREE.BoxGeometry(bW - 0.3, 0.045, 0.045);
            const longBraceMesh = new THREE.Mesh(longBraceGeo, metalMaterial);
            longBraceMesh.position.set(0, seatH * 0.42, 0);
            longBraceMesh.castShadow = true;
            itemGroup.add(longBraceMesh);

            // Seat perimeter steel rails
            [-1, 1].forEach((zSide) => {
              const railGeo = new THREE.BoxGeometry(bW, 0.05, 0.045);
              const railMesh = new THREE.Mesh(railGeo, metalMaterial);
              railMesh.position.set(0, seatH - 0.03, zSide * (seatD / 2));
              railMesh.castShadow = true;
              itemGroup.add(railMesh);
            });

            // --- WPC horizontal seat slats with visible gaps ---
            const seatSlatCount = 5;
            const seatSlatDepth = (seatD - 0.05) / seatSlatCount - 0.012;
            for (let s = 0; s < seatSlatCount; s++) {
              const slatGeo = new THREE.BoxGeometry(bW + 0.03, 0.035, seatSlatDepth);
              const slatMesh = new THREE.Mesh(slatGeo, wpcMaterial);
              const sz = -seatD / 2 + 0.03 + s * (seatSlatDepth + 0.012) + seatSlatDepth / 2;
              slatMesh.position.set(0, seatH, sz);
              slatMesh.castShadow = true;
              slatMesh.receiveShadow = true;
              itemGroup.add(slatMesh);
            }

            // --- Angled backrest ---
            const backTilt = -0.22; // radians, leaning back
            const backH = 0.42;
            const backZ = -seatD / 2 + 0.02;

            // Backrest support brackets (black steel)
            [-1, 1].forEach((side) => {
              const brkGeo = new THREE.BoxGeometry(0.05, 0.2, 0.05);
              const brkMesh = new THREE.Mesh(brkGeo, metalMaterial);
              brkMesh.position.set(side * (bW / 2 - 0.16), seatH + 0.08, backZ + 0.02);
              brkMesh.castShadow = true;
              itemGroup.add(brkMesh);
            });

            // Backrest frame group (tilted)
            const backGroup = new THREE.Group();
            backGroup.position.set(0, seatH + 0.18, backZ);
            backGroup.rotation.x = backTilt;

            // Side frame rails of the backrest
            [-1, 1].forEach((side) => {
              const sideGeo = new THREE.BoxGeometry(0.05, backH, 0.04);
              const sideMesh = new THREE.Mesh(sideGeo, metalMaterial);
              sideMesh.position.set(side * (bW / 2 - 0.03), backH / 2, 0);
              sideMesh.castShadow = true;
              backGroup.add(sideMesh);
            });

            // Backrest WPC slats with gaps
            const backSlatCount = 4;
            const backSlatH = (backH - 0.04) / backSlatCount - 0.022;
            for (let s = 0; s < backSlatCount; s++) {
              const bSlatGeo = new THREE.BoxGeometry(bW - 0.02, backSlatH, 0.035);
              const bSlatMesh = new THREE.Mesh(bSlatGeo, wpcMaterial);
              const by = 0.04 + s * (backSlatH + 0.022) + backSlatH / 2;
              bSlatMesh.position.set(0, by, 0.015);
              bSlatMesh.castShadow = true;
              bSlatMesh.receiveShadow = true;
              backGroup.add(bSlatMesh);
            }

            itemGroup.add(backGroup);

            if (item.hasLighting && isNight) {
              const benchLight = new THREE.PointLight(0xffe699, 1.8, 3.2);
              benchLight.position.set(0, 0.2, 0);
              itemGroup.add(benchLight);
            }
            break;
          }

          case "lounge_set": {
            // Modern 4-Piece Outdoor Conversation Lounge Set (Loveseat, 2 Armchairs, Slatted WPC Coffee Table)
            const { map: cushionTex, bumpMap: cushionBump } = createCanvasFabricTexture("#e8e2d5");
            const cushionMat = new THREE.MeshStandardMaterial({
              map: cushionTex,
              bumpMap: cushionBump,
              bumpScale: 0.04,
              roughness: 0.82,
              metalness: 0.01,
              color: 0xede8de,
            });

            const armTubeSize = 0.045;
            const seatElevation = 0.38; // height of wood base from ground
            const cushionThickness = 0.11;

            // Helper to build a lounge seating unit (Loveseat or Armchair)
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

              // Two side black steel rectangular loop armrests
              [-1, 1].forEach((side) => {
                const lx = side * (halfInnerW + armTubeSize / 2);

                // Bottom sled runner
                const bottomRunner = new THREE.Mesh(
                  new THREE.BoxGeometry(armTubeSize, armTubeSize, armD),
                  metalMaterial
                );
                bottomRunner.position.set(lx, armTubeSize / 2, 0);
                bottomRunner.castShadow = true;
                bottomRunner.receiveShadow = true;
                uGroup.add(bottomRunner);

                // Top armrest bar
                const topArm = new THREE.Mesh(
                  new THREE.BoxGeometry(armTubeSize, armTubeSize, armD),
                  metalMaterial
                );
                topArm.position.set(lx, armH - armTubeSize / 2, 0);
                topArm.castShadow = true;
                uGroup.add(topArm);

                // Front vertical leg post
                const frontPost = new THREE.Mesh(
                  new THREE.BoxGeometry(armTubeSize, armH, armTubeSize),
                  metalMaterial
                );
                frontPost.position.set(lx, armH / 2, armD / 2 - armTubeSize / 2);
                frontPost.castShadow = true;
                uGroup.add(frontPost);

                // Rear vertical leg post
                const rearPost = new THREE.Mesh(
                  new THREE.BoxGeometry(armTubeSize, armH, armTubeSize),
                  metalMaterial
                );
                rearPost.position.set(lx, armH / 2, -armD / 2 + armTubeSize / 2);
                rearPost.castShadow = true;
                uGroup.add(rearPost);
              });

              // Seat support horizontal steel frame
              const seatFrameFront = new THREE.Mesh(
                new THREE.BoxGeometry(unitW, armTubeSize, armTubeSize),
                metalMaterial
              );
              seatFrameFront.position.set(0, seatElevation - armTubeSize / 2, armD / 2 - armTubeSize / 2);
              seatFrameFront.castShadow = true;
              uGroup.add(seatFrameFront);

              const seatFrameRear = new THREE.Mesh(
                new THREE.BoxGeometry(unitW, armTubeSize, armTubeSize),
                metalMaterial
              );
              seatFrameRear.position.set(0, seatElevation - armTubeSize / 2, -armD / 2 + armTubeSize / 2);
              seatFrameRear.castShadow = true;
              uGroup.add(seatFrameRear);

              // Horizontal WPC wood slats under the seat cushion
              const slatCount = Math.max(4, Math.round(unitD / 0.14));
              const slatDepth = (armD - 0.08) / slatCount - 0.012;
              for (let s = 0; s < slatCount; s++) {
                const sMesh = new THREE.Mesh(
                  new THREE.BoxGeometry(unitW - 0.02, 0.028, slatDepth),
                  wpcMaterial
                );
                const sz = -armD / 2 + 0.04 + s * (slatDepth + 0.012) + slatDepth / 2;
                sMesh.position.set(0, seatElevation + 0.014, sz);
                sMesh.castShadow = true;
                sMesh.receiveShadow = true;
                uGroup.add(sMesh);
              }

              // Plush thick seat cushion (cream Sunbrella fabric)
              const seatCushion = new THREE.Mesh(
                new THREE.BoxGeometry(unitW - 0.03, cushionThickness, armD - 0.06),
                cushionMat
              );
              seatCushion.position.set(0, seatElevation + 0.028 + cushionThickness / 2, 0);
              seatCushion.castShadow = true;
              seatCushion.receiveShadow = true;
              uGroup.add(seatCushion);

              // Backrest tilted support frame
              const backTilt = -0.16; // radians lean
              const backH = 0.44;
              const backZ = -armD / 2 + 0.08;

              const backGroup = new THREE.Group();
              backGroup.position.set(0, seatElevation + 0.04, backZ);
              backGroup.rotation.x = backTilt;

              // Backrest outer steel frame uprights
              [-1, 1].forEach((side) => {
                const backUpright = new THREE.Mesh(
                  new THREE.BoxGeometry(armTubeSize * 0.9, backH, armTubeSize * 0.9),
                  metalMaterial
                );
                backUpright.position.set(side * (halfInnerW - armTubeSize / 2), backH / 2, 0);
                backUpright.castShadow = true;
                backGroup.add(backUpright);
              });

              // Vertical WPC wood slats behind the back cushion
              const backSlatCount = Math.max(3, Math.round(unitW / 0.18));
              const backSlatW = (unitW - armTubeSize * 2 - 0.04) / backSlatCount - 0.015;
              for (let bs = 0; bs < backSlatCount; bs++) {
                const bsMesh = new THREE.Mesh(
                  new THREE.BoxGeometry(backSlatW, backH - 0.04, 0.022),
                  wpcMaterial
                );
                const bsx = -(unitW - armTubeSize * 2 - 0.04) / 2 + bs * (backSlatW + 0.015) + backSlatW / 2;
                bsMesh.position.set(bsx, backH / 2, -0.01);
                bsMesh.castShadow = true;
                bsMesh.receiveShadow = true;
                backGroup.add(bsMesh);
              }

              // Plush backrest cushion (resting on seat against back slats)
              const backCushion = new THREE.Mesh(
                new THREE.BoxGeometry(unitW - 0.04, backH * 0.94, cushionThickness),
                cushionMat
              );
              backCushion.position.set(0, backH / 2, 0.055);
              backCushion.castShadow = true;
              backCushion.receiveShadow = true;
              backGroup.add(backCushion);

              uGroup.add(backGroup);
              return uGroup;
            };

            // 1. Two-Seater Loveseat Sofa (Rear Center)
            const loveseat = buildLoungeUnit(1.28, 0.74, 0.76, 0, -0.42, 0);
            itemGroup.add(loveseat);

            // 2. Left Single Armchair (facing inward-front)
            const leftArmchair = buildLoungeUnit(0.66, 0.72, 0.76, -0.88, 0.22, Math.PI / 12);
            itemGroup.add(leftArmchair);

            // 3. Right Single Armchair (facing inward-front)
            const rightArmchair = buildLoungeUnit(0.66, 0.72, 0.76, 0.88, 0.22, -Math.PI / 12);
            itemGroup.add(rightArmchair);

            // 4. Center Coffee Table with Black Steel Sled Loop Frame and WPC Slatted Top
            const tableW = 0.92;
            const tableD = 0.54;
            const tableH = 0.38;
            const tableGroup = new THREE.Group();
            tableGroup.position.set(0, 0, 0.16);

            // Left & Right black steel loop legs
            [-1, 1].forEach((side) => {
              const tx = side * (tableW / 2 - armTubeSize / 2);

              // Bottom runner
              const runner = new THREE.Mesh(
                new THREE.BoxGeometry(armTubeSize, armTubeSize, tableD),
                metalMaterial
              );
              runner.position.set(tx, armTubeSize / 2, 0);
              runner.castShadow = true;
              runner.receiveShadow = true;
              tableGroup.add(runner);

              // Top leg bar
              const topBar = new THREE.Mesh(
                new THREE.BoxGeometry(armTubeSize, armTubeSize, tableD),
                metalMaterial
              );
              topBar.position.set(tx, tableH - armTubeSize / 2, 0);
              topBar.castShadow = true;
              tableGroup.add(topBar);

              // Front & Rear vertical posts
              [-1, 1].forEach((zs) => {
                const post = new THREE.Mesh(
                  new THREE.BoxGeometry(armTubeSize, tableH, armTubeSize),
                  metalMaterial
                );
                post.position.set(tx, tableH / 2, zs * (tableD / 2 - armTubeSize / 2));
                post.castShadow = true;
                tableGroup.add(post);
              });
            });

            // Long perimeter apron frame
            [-1, 1].forEach((zs) => {
              const apron = new THREE.Mesh(
                new THREE.BoxGeometry(tableW - armTubeSize * 2, armTubeSize, armTubeSize),
                metalMaterial
              );
              apron.position.set(0, tableH - armTubeSize / 2, zs * (tableD / 2 - armTubeSize / 2));
              apron.castShadow = true;
              tableGroup.add(apron);
            });

            // Inset Horizontal WPC wood slats with fine grooves
            const tSlatCount = 6;
            const tSlatD = (tableD - armTubeSize * 2 - 0.02) / tSlatCount - 0.008;
            for (let ts = 0; ts < tSlatCount; ts++) {
              const tsMesh = new THREE.Mesh(
                new THREE.BoxGeometry(tableW - armTubeSize * 2 - 0.02, 0.024, tSlatD),
                wpcMaterial
              );
              const tsz = -(tableD - armTubeSize * 2 - 0.02) / 2 + ts * (tSlatD + 0.008) + tSlatD / 2;
              tsMesh.position.set(0, tableH + 0.012, tsz);
              tsMesh.castShadow = true;
              tsMesh.receiveShadow = true;
              tableGroup.add(tsMesh);
            }

            itemGroup.add(tableGroup);
            break;
          }

          case "firepit_table": {
            // Square WPC firepit table with black steel flame basket
            const tW = item.width || 1.1;
            const tD = item.depth || 1.1;
            const tH = item.height || 0.72;
            const topThk = 0.09;
            const baseW = tW * 0.6;
            const baseD = tD * 0.6;
            const baseH = tH - topThk - 0.05;

            // --- Pedestal base clad in horizontal WPC planks ---
            const planksY = 5;
            const plankH = baseH / planksY;
            for (let p = 0; p < planksY; p++) {
              const plankGeo = new THREE.BoxGeometry(baseW, plankH * 0.9, baseD);
              const plankMesh = new THREE.Mesh(plankGeo, wpcMaterial);
              plankMesh.position.set(0, 0.05 + p * plankH + plankH / 2, 0);
              plankMesh.castShadow = true;
              plankMesh.receiveShadow = true;
              itemGroup.add(plankMesh);
            }

            // Small black metal feet under the pedestal
            [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([fx, fz]) => {
              const footGeo = new THREE.BoxGeometry(0.055, 0.05, 0.055);
              const footMesh = new THREE.Mesh(footGeo, metalMaterial);
              footMesh.position.set(fx * (baseW / 2 - 0.05), 0.025, fz * (baseD / 2 - 0.05));
              footMesh.castShadow = true;
              itemGroup.add(footMesh);
            });

            // --- Tabletop: narrow WPC slats with fine grooves ---
            const topY = tH - topThk / 2;

            // Solid edge band around the top
            const bandGeo = new THREE.BoxGeometry(tW, topThk, tD);
            const bandMesh = new THREE.Mesh(bandGeo, wpcMaterial);
            bandMesh.position.set(0, topY, 0);
            bandMesh.castShadow = true;
            bandMesh.receiveShadow = true;
            itemGroup.add(bandMesh);

            // Narrow surface slats sitting slightly proud of the band
            const slatCount = 16;
            const innerW = tW - 0.08;
            const slatW = innerW / slatCount - 0.008;
            for (let s = 0; s < slatCount; s++) {
              const sGeo = new THREE.BoxGeometry(slatW, 0.012, tD - 0.08);
              const sMesh = new THREE.Mesh(sGeo, wpcMaterial);
              const sx = -innerW / 2 + s * (slatW + 0.008) + slatW / 2;
              sMesh.position.set(sx, topY + topThk / 2 + 0.006, 0);
              sMesh.castShadow = true;
              sMesh.receiveShadow = true;
              itemGroup.add(sMesh);
            }

            // --- Black steel flame basket with curved vertical bars ---
            const basketW = tW * 0.42;
            const basketD = tD * 0.32;
            const basketH = 0.17;
            const basketY = tH + basketH / 2;

            // Top and bottom rim frames
            [basketY + basketH / 2, basketY - basketH / 2].forEach((ry) => {
              const rimGeoX = new THREE.BoxGeometry(basketW, 0.022, 0.022);
              [-1, 1].forEach((zs) => {
                const rim = new THREE.Mesh(rimGeoX, metalMaterial);
                rim.position.set(0, ry, zs * (basketD / 2));
                rim.castShadow = true;
                itemGroup.add(rim);
              });

              const rimGeoZ = new THREE.BoxGeometry(0.022, 0.022, basketD);
              [-1, 1].forEach((xs) => {
                const rim = new THREE.Mesh(rimGeoZ, metalMaterial);
                rim.position.set(xs * (basketW / 2), ry, 0);
                rim.castShadow = true;
                itemGroup.add(rim);
              });
            });

            // Curved vertical bars along the long sides
            const barsPerSide = 9;
            for (let b = 0; b < barsPerSide; b++) {
              const bx = -basketW / 2 + 0.02 + (b * (basketW - 0.04)) / (barsPerSide - 1);
              [-1, 1].forEach((zs) => {
                const barGeo = new THREE.TorusGeometry(basketH * 0.55, 0.009, 6, 10, Math.PI * 0.6);
                const barMesh = new THREE.Mesh(barGeo, metalMaterial);
                barMesh.position.set(bx, basketY, zs * (basketD / 2));
                barMesh.rotation.z = Math.PI / 2 + (zs > 0 ? 0.35 : -0.35);
                barMesh.rotation.y = Math.PI / 2;
                barMesh.castShadow = true;
                itemGroup.add(barMesh);
              });
            }

            // Lava rock bed inside the basket
            const lavaMat = new THREE.MeshStandardMaterial({ color: 0x5b3a2a, roughness: 1 });
            for (let l = 0; l < 10; l++) {
              const rockGeo = new THREE.DodecahedronGeometry(0.026, 0);
              const rockMesh = new THREE.Mesh(rockGeo, lavaMat);
              rockMesh.position.set(
                -basketW / 2 + 0.05 + Math.random() * (basketW - 0.1),
                basketY - basketH * 0.28,
                -basketD / 2 + 0.04 + Math.random() * (basketD - 0.08)
              );
              itemGroup.add(rockMesh);
            }

            // Flames — flicker animated in the render loop
            const flameMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
            const flameCoreMat = new THREE.MeshBasicMaterial({ color: 0xfde68a });
            const flameMeshes: THREE.Mesh[] = [];
            [-0.09, 0, 0.09].forEach((fx, fi) => {
              const flameGeo = new THREE.ConeGeometry(0.038, 0.17 + fi * 0.02, 7);
              const flameMesh = new THREE.Mesh(flameGeo, fi === 1 ? flameCoreMat : flameMat);
              flameMesh.position.set(fx, basketY + 0.07, 0);
              itemGroup.add(flameMesh);
              flameMeshes.push(flameMesh);
            });

            const fireLight2 = new THREE.PointLight(0xf97316, isNight ? 3.2 : 1.4, 5.5);
            fireLight2.position.set(0, basketY + 0.2, 0);
            fireLight2.castShadow = true;
            itemGroup.add(fireLight2);
            animatedEffectsRef.current.push({
              type: "flame",
              meshes: flameMeshes,
              light: fireLight2,
              base: isNight ? 3.2 : 1.4,
              phase: seedFromId(item.id) % 100 / 16,
            });
            break;
          }

          case "pergola": {
            const pW = item.width;
            const pD = item.depth;
            const pH = item.height;
            const postSize = 0.14;

            // 4 Corner Metal Posts with WPC wraps
            const postGeo = new THREE.BoxGeometry(postSize, pH, postSize);
            const corners = [
              [-pW / 2 + postSize / 2, pH / 2, -pD / 2 + postSize / 2],
              [pW / 2 - postSize / 2, pH / 2, -pD / 2 + postSize / 2],
              [-pW / 2 + postSize / 2, pH / 2, pD / 2 - postSize / 2],
              [pW / 2 - postSize / 2, pH / 2, pD / 2 - postSize / 2],
            ];

            corners.forEach(([cx, cy, cz]) => {
              const post = new THREE.Mesh(postGeo, metalMaterial);
              post.position.set(cx, cy, cz);
              post.castShadow = true;
              post.receiveShadow = true;
              itemGroup.add(post);
            });

            // Main Beams
            const beamGeoX = new THREE.BoxGeometry(pW + 0.2, 0.16, 0.12);
            const beamFront = new THREE.Mesh(beamGeoX, metalMaterial);
            beamFront.position.set(0, pH - 0.08, pD / 2 - postSize / 2);
            beamFront.castShadow = true;
            itemGroup.add(beamFront);

            const beamBack = new THREE.Mesh(beamGeoX, metalMaterial);
            beamBack.position.set(0, pH - 0.08, -pD / 2 + postSize / 2);
            beamBack.castShadow = true;
            itemGroup.add(beamBack);

            // Cross WPC Louver Slats
            const louverCount = 9;
            const louverGeo = new THREE.BoxGeometry(0.08, 0.12, pD + 0.2);
            for (let i = 0; i < louverCount; i++) {
              const lx = -pW / 2 + (pW / (louverCount - 1)) * i;
              const louver = new THREE.Mesh(louverGeo, wpcMaterial);
              louver.position.set(lx, pH + 0.06, 0);
              louver.castShadow = true;
              itemGroup.add(louver);
            }

            if (isNight) {
              const centerLight = new THREE.PointLight(0xffe699, 2.8, 6.5);
              centerLight.position.set(0, pH - 0.2, 0);
              centerLight.castShadow = true;
              itemGroup.add(centerLight);
            }
            break;
          }

          case "pergola_deck": {
            // Full pergola module with integrated WPC deck platform
            const gW = item.width || 3.2;
            const gD = item.depth || 3.2;
            const gH = item.height || 2.6;
            const deckH = 0.1;
            const postSz = 0.075;
            const postInset = 0.42;
            const overhang = 0.3;

            // ---- Deck platform ----
            // Perimeter edge frame
            const edgeThk = 0.09;
            [
              [gW, edgeThk, 0, -gD / 2 + edgeThk / 2],
              [gW, edgeThk, 0, gD / 2 - edgeThk / 2],
            ].forEach(([w, d, px, pz]) => {
              const eg = new THREE.Mesh(new THREE.BoxGeometry(w, deckH, d), wpcMaterial);
              eg.position.set(px, deckH / 2, pz);
              eg.castShadow = true;
              eg.receiveShadow = true;
              itemGroup.add(eg);
            });
            [-1, 1].forEach((xs) => {
              const eg = new THREE.Mesh(new THREE.BoxGeometry(edgeThk, deckH, gD), wpcMaterial);
              eg.position.set(xs * (gW / 2 - edgeThk / 2), deckH / 2, 0);
              eg.castShadow = true;
              eg.receiveShadow = true;
              itemGroup.add(eg);
            });

            // Inner slatted deck surface
            const innerW = gW - edgeThk * 2 - 0.02;
            const innerD = gD - edgeThk * 2 - 0.02;
            const deckSlats = 22;
            const dSlatW = innerW / deckSlats - 0.006;
            for (let s = 0; s < deckSlats; s++) {
              const ds = new THREE.Mesh(new THREE.BoxGeometry(dSlatW, deckH * 0.85, innerD), wpcMaterial);
              ds.position.set(-innerW / 2 + s * (dSlatW + 0.006) + dSlatW / 2, deckH * 0.425, 0);
              ds.receiveShadow = true;
              itemGroup.add(ds);
            }

            // ---- Four twin-profile black steel posts ----
            const postH = gH - 0.34;
            const postPositions: Array<[number, number]> = [
              [-(gW / 2 - postInset), -(gD / 2 - postInset)],
              [gW / 2 - postInset, -(gD / 2 - postInset)],
              [-(gW / 2 - postInset), gD / 2 - postInset],
              [gW / 2 - postInset, gD / 2 - postInset],
            ];

            postPositions.forEach(([px, pz]) => {
              // twin tubes side by side
              [-1, 1].forEach((off) => {
                const post = new THREE.Mesh(
                  new THREE.BoxGeometry(postSz, postH, postSz),
                  metalMaterial
                );
                post.position.set(px + off * 0.055, deckH + postH / 2, pz);
                post.castShadow = true;
                post.receiveShadow = true;
                itemGroup.add(post);
              });
              // base plate
              const plate = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.02, 0.12), metalMaterial);
              plate.position.set(px, deckH + 0.01, pz);
              itemGroup.add(plate);
            });

            // ---- Black steel header beams (running along X, over posts) ----
            const headerY = deckH + postH + 0.05;
            [-1, 1].forEach((zs) => {
              const hb = new THREE.Mesh(
                new THREE.BoxGeometry(gW - postInset * 2 + overhang * 2, 0.1, 0.05),
                metalMaterial
              );
              hb.position.set(0, headerY, zs * (gD / 2 - postInset));
              hb.castShadow = true;
              itemGroup.add(hb);
            });

            // ---- Twin WPC main beams flanking the steel header ----
            const mainBeamLen = gW - postInset * 2 + overhang * 2;
            [-1, 1].forEach((zs) => {
              [-1, 1].forEach((off) => {
                const mb = new THREE.Mesh(
                  new THREE.BoxGeometry(mainBeamLen, 0.13, 0.055),
                  wpcMaterial
                );
                mb.position.set(0, headerY, zs * (gD / 2 - postInset) + off * 0.058);
                mb.castShadow = true;
                mb.receiveShadow = true;
                itemGroup.add(mb);

                // stepped end caps (protruding detail)
                [-1, 1].forEach((xs) => {
                  const cap = new THREE.Mesh(
                    new THREE.BoxGeometry(0.11, 0.06, 0.055),
                    wpcMaterial
                  );
                  cap.position.set(
                    xs * (mainBeamLen / 2 - 0.055),
                    headerY - 0.095,
                    zs * (gD / 2 - postInset) + off * 0.058
                  );
                  cap.castShadow = true;
                  itemGroup.add(cap);
                });
              });
            });

            // ---- Cross rafters (running along Z, on top of main beams) ----
            const rafterY = headerY + 0.12;
            const rafterLen = gD - postInset * 2 + overhang * 2;
            const rafterCount = 6;
            const rafterSpan = gW - postInset * 2;
            for (let r = 0; r < rafterCount; r++) {
              const rx = -rafterSpan / 2 + (r * rafterSpan) / (rafterCount - 1);
              const rafter = new THREE.Mesh(
                new THREE.BoxGeometry(0.085, 0.12, rafterLen),
                wpcMaterial
              );
              rafter.position.set(rx, rafterY, 0);
              rafter.castShadow = true;
              rafter.receiveShadow = true;
              itemGroup.add(rafter);

              // stepped rafter end caps
              [-1, 1].forEach((zs) => {
                const cap = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.055, 0.1), wpcMaterial);
                cap.position.set(rx, rafterY - 0.088, zs * (rafterLen / 2 - 0.05));
                cap.castShadow = true;
                itemGroup.add(cap);
              });
            }

            // ---- Thin top slats (perpendicular, forming checkered shade) ----
            const topSlatY = rafterY + 0.085;
            const topSlatCount = 7;
            const topSpan = gD - postInset * 2;
            for (let t = 0; t < topSlatCount; t++) {
              const tz = -topSpan / 2 + (t * topSpan) / (topSlatCount - 1);
              const tSlat = new THREE.Mesh(
                new THREE.BoxGeometry(rafterSpan + 0.1, 0.035, 0.075),
                wpcMaterial
              );
              tSlat.position.set(0, topSlatY, tz);
              tSlat.castShadow = true;
              itemGroup.add(tSlat);
            }

            if (isNight) {
              const pgLight = new THREE.PointLight(0xffe699, 2.8, 6.5);
              pgLight.position.set(0, headerY - 0.25, 0);
              pgLight.castShadow = true;
              itemGroup.add(pgLight);
            }
            break;
          }

          case "green_wall_planter": {
            // Free-standing WPC framed green wall with base planter trough
            const wW = item.width || 1.2;
            const wD = item.depth || 0.42;
            const wH = item.height || 1.8;
            const troughH = 0.3;
            const frameThk = 0.07;

            // ---- Base planter trough (black steel shell) ----
            const shell = new THREE.Mesh(
              new THREE.BoxGeometry(wW - 0.04, troughH, wD),
              metalMaterial
            );
            shell.position.set(0, troughH / 2 + 0.03, 0);
            shell.castShadow = true;
            shell.receiveShadow = true;
            itemGroup.add(shell);

            // Small black feet
            [-1, 1].forEach((xs) => {
              const foot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, wD * 0.8), metalMaterial);
              foot.position.set(xs * (wW / 2 - 0.14), 0.015, 0);
              itemGroup.add(foot);
            });

            // WPC cladding boards on trough front & back
            [-1, 1].forEach((zs) => {
              for (let b = 0; b < 2; b++) {
                const board = new THREE.Mesh(
                  new THREE.BoxGeometry(wW - 0.02, troughH / 2 - 0.012, 0.028),
                  wpcMaterial
                );
                board.position.set(
                  0,
                  0.05 + b * (troughH / 2) + troughH / 4 - 0.005,
                  zs * (wD / 2 + 0.012)
                );
                board.castShadow = true;
                itemGroup.add(board);
              }
            });

            // WPC cladding on trough sides
            [-1, 1].forEach((xs) => {
              const sideBoard = new THREE.Mesh(
                new THREE.BoxGeometry(0.028, troughH - 0.03, wD + 0.02),
                wpcMaterial
              );
              sideBoard.position.set(xs * (wW / 2 - 0.006), troughH / 2 + 0.035, 0);
              sideBoard.castShadow = true;
              itemGroup.add(sideBoard);
            });

            // Soil surface
            const soilTop = new THREE.Mesh(
              new THREE.BoxGeometry(wW - 0.14, 0.03, wD - 0.12),
              soilMaterial
            );
            soilTop.position.set(0, troughH + 0.02, 0);
            itemGroup.add(soilTop);

            // ---- Vertical WPC frame ----
            const frameBaseY = troughH + 0.03;
            const frameH = wH - frameBaseY;
            const frameZ = -wD / 2 + 0.06;

            // Left & right frame posts
            [-1, 1].forEach((xs) => {
              const postMesh = new THREE.Mesh(
                new THREE.BoxGeometry(frameThk, frameH, frameThk),
                wpcMaterial
              );
              postMesh.position.set(xs * (wW / 2 - frameThk / 2), frameBaseY + frameH / 2, frameZ);
              postMesh.castShadow = true;
              postMesh.receiveShadow = true;
              itemGroup.add(postMesh);
            });

            // Top horizontal frame beam
            const topBeam = new THREE.Mesh(
              new THREE.BoxGeometry(wW, frameThk, frameThk),
              wpcMaterial
            );
            topBeam.position.set(0, wH - frameThk / 2, frameZ);
            topBeam.castShadow = true;
            itemGroup.add(topBeam);

            // Secondary inner top rail (double-frame detail from photo)
            const innerBeam = new THREE.Mesh(
              new THREE.BoxGeometry(wW - frameThk * 2, frameThk * 0.8, frameThk * 0.8),
              wpcMaterial
            );
            innerBeam.position.set(0, wH - frameThk * 1.7, frameZ + 0.055);
            innerBeam.castShadow = true;
            itemGroup.add(innerBeam);

            // ---- Dark back trellis panel ----
            const panelMat = new THREE.MeshStandardMaterial({
              color: 0x1c1c1f,
              roughness: 0.85,
              metalness: 0.3,
            });
            const panel = new THREE.Mesh(
              new THREE.BoxGeometry(wW - frameThk * 2, frameH - 0.12, 0.022),
              panelMat
            );
            panel.position.set(0, frameBaseY + frameH / 2 - 0.04, frameZ + 0.005);
            panel.receiveShadow = true;
            itemGroup.add(panel);

            // ---- Real climbing vine growing up and over the frame ----
            const climbRows = 6;
            const clustersPerRow = 4;
            for (let r = 0; r < climbRows; r++) {
              const fy = frameBaseY + 0.1 + (r * (frameH - 0.24)) / (climbRows - 1);
              for (let c = 0; c < clustersPerRow; c++) {
                const fx = -wW / 2 + 0.18 + (c * (wW - 0.36)) / (clustersPerRow - 1);
                const cluster = createVineCluster(
                  0.16,
                  seedFromId(item.id) + r * 41 + c * 13,
                  0.24
                );
                cluster.position.set(fx, fy, frameZ + 0.12);
                itemGroup.add(cluster);
              }
            }

            // Fuller planting sitting directly in the trough
            const troughPlanting = createGroundCover(
              wW - 0.2,
              wD - 0.1,
              seedFromId(item.id) + 3,
              true
            );
            troughPlanting.position.set(0, troughH + 0.06, 0);
            itemGroup.add(troughPlanting);

            if (isNight) {
              const gwpLight = new THREE.PointLight(0xfef08a, 1.6, 3.2);
              gwpLight.position.set(0, troughH + 0.2, wD / 2);
              itemGroup.add(gwpLight);
            }
            break;
          }

          case "green_wall": {
            const frameGeo = new THREE.BoxGeometry(item.width, item.height, item.depth);
            const frameMesh = new THREE.Mesh(frameGeo, metalMaterial);
            frameMesh.position.set(0, item.height / 2, 0);
            frameMesh.castShadow = true;
            frameMesh.receiveShadow = true;
            itemGroup.add(frameMesh);

            // Dense living green wall built from real leaf clusters
            const gwRows = 7;
            const gwCols = Math.max(2, Math.round(item.width / 0.34));
            for (let r = 0; r < gwRows; r++) {
              const ly = 0.26 + (r * (item.height - 0.42)) / (gwRows - 1);
              for (let c = 0; c < gwCols; c++) {
                const lx =
                  -item.width / 2 + 0.16 + (c * (item.width - 0.32)) / Math.max(1, gwCols - 1);
                const clump = createVineCluster(
                  0.17,
                  seedFromId(item.id) + r * 31 + c * 7,
                  0.2
                );
                clump.position.set(lx, ly, item.depth / 2 + 0.03);
                itemGroup.add(clump);
              }
            }

            if (isNight) {
              const gwLight = new THREE.PointLight(0xfef08a, 1.6, 3.5);
              gwLight.position.set(0, item.height - 0.1, 0.25);
              itemGroup.add(gwLight);
            }
            break;
          }

          case "water_feature": {
            // Dual Staggered WPC Frame Waterfall with Square Pool Basin (as shown in reference photo)
            const wW = item.width || 1.3;
            const wD = item.depth || 1.1;
            const basinH = 0.32;
            const basinThk = 0.08;

            // --- 1. Base Basin with Horizontal WPC Cladding ---
            const planksY = 4;
            const plankH = (basinH - 0.04) / planksY;

            // 4 Outer Basin Cladding Walls
            [-1, 1].forEach((zs) => {
              for (let p = 0; p < planksY; p++) {
                const plank = new THREE.Mesh(
                  new THREE.BoxGeometry(wW, plankH * 0.92, 0.032),
                  wpcMaterial
                );
                plank.position.set(0, 0.02 + p * plankH + plankH / 2, zs * (wD / 2 - 0.016));
                plank.castShadow = true;
                itemGroup.add(plank);
              }
            });

            [-1, 1].forEach((xs) => {
              for (let p = 0; p < planksY; p++) {
                const plank = new THREE.Mesh(
                  new THREE.BoxGeometry(0.032, plankH * 0.92, wD - 0.06),
                  wpcMaterial
                );
                plank.position.set(xs * (wW / 2 - 0.016), 0.02 + p * plankH + plankH / 2, 0);
                plank.castShadow = true;
                itemGroup.add(plank);
              }
            });

            // Top 45-degree Mitered Basin Border Rim
            const topRimGeoX = new THREE.BoxGeometry(wW + 0.02, 0.04, basinThk);
            [-1, 1].forEach((zs) => {
              const rimX = new THREE.Mesh(topRimGeoX, wpcMaterial);
              rimX.position.set(0, basinH - 0.01, zs * (wD / 2 - basinThk / 2));
              rimX.castShadow = true;
              itemGroup.add(rimX);
            });

            const topRimGeoZ = new THREE.BoxGeometry(basinThk, 0.04, wD - basinThk * 2);
            [-1, 1].forEach((xs) => {
              const rimZ = new THREE.Mesh(topRimGeoZ, wpcMaterial);
              rimZ.position.set(xs * (wW / 2 - basinThk / 2), basinH - 0.01, 0);
              rimZ.castShadow = true;
              itemGroup.add(rimZ);
            });

            // Waterproof Metal Basin Lining Shell
            const linerMesh = new THREE.Mesh(
              new THREE.BoxGeometry(wW - basinThk * 2, basinH - 0.05, wD - basinThk * 2),
              metalMaterial
            );
            linerMesh.position.set(0, basinH / 2 - 0.02, 0);
            itemGroup.add(linerMesh);

            // Shimmering Pool Water Surface in the Basin
            const poolWaterMat = new THREE.MeshPhysicalMaterial({
              color: 0x38bdf8,
              transmission: 0.85,
              opacity: 0.9,
              transparent: true,
              roughness: 0.08,
              ior: 1.333,
              reflectivity: 0.9,
            });
            const poolCaustics = createWaterCausticsTexture();
            poolCaustics.repeat.set(2, 2);
            poolWaterMat.map = poolCaustics;
            poolWaterMat.needsUpdate = true;
            animatedEffectsRef.current.push({ type: "shimmer", mat: poolWaterMat });
            const poolWater = new THREE.Mesh(
              new THREE.PlaneGeometry(wW - basinThk * 2 - 0.04, wD - basinThk * 2 - 0.04),
              poolWaterMat
            );
            poolWater.rotation.x = -Math.PI / 2;
            poolWater.position.set(0, basinH - 0.07, 0);
            itemGroup.add(poolWater);

            // --- 2. Two Staggered Vertical WPC Water Cascade Frames ---
            const frameThk = 0.075;

            // Water curtain sheer sheet material — streak texture scrolled every frame
            const waterCurtainMat = new THREE.MeshPhysicalMaterial({
              color: 0xbae6fd,
              transmission: 0.92,
              transparent: true,
              opacity: 0.82,
              roughness: 0.12,
              ior: 1.333,
              side: THREE.DoubleSide,
            });
            const fallTex = createFallingWaterTexture();
            fallTex.repeat.set(2, 2);
            waterCurtainMat.map = fallTex;
            waterCurtainMat.needsUpdate = true;
            animatedEffectsRef.current.push({ type: "scroll", mat: waterCurtainMat, speed: 0.85 });

            // Helper to build a framed water blade cascade
            const buildCascadeFrame = (
              fWidth: number,
              fHeight: number,
              posZ: number
            ) => {
              const fGroup = new THREE.Group();
              const fBottomY = basinH - 0.02;

              // Left Post
              const postL = new THREE.Mesh(
                new THREE.BoxGeometry(frameThk, fHeight, frameThk),
                wpcMaterial
              );
              postL.position.set(-fWidth / 2 + frameThk / 2, fBottomY + fHeight / 2, posZ);
              postL.castShadow = true;
              fGroup.add(postL);

              // Right Post
              const postR = new THREE.Mesh(
                new THREE.BoxGeometry(frameThk, fHeight, frameThk),
                wpcMaterial
              );
              postR.position.set(fWidth / 2 - frameThk / 2, fBottomY + fHeight / 2, posZ);
              postR.castShadow = true;
              fGroup.add(postR);

              // Top Beam
              const topBeam = new THREE.Mesh(
                new THREE.BoxGeometry(fWidth, frameThk, frameThk),
                wpcMaterial
              );
              topBeam.position.set(0, fBottomY + fHeight - frameThk / 2, posZ);
              topBeam.castShadow = true;
              fGroup.add(topBeam);

              // Stepped Profile Inner Moldings
              const moldTop = new THREE.Mesh(
                new THREE.BoxGeometry(fWidth - frameThk * 2, frameThk * 0.4, frameThk * 0.5),
                wpcMaterial
              );
              moldTop.position.set(0, fBottomY + fHeight - frameThk * 1.1, posZ);
              fGroup.add(moldTop);

              // Stainless Steel Waterfall Spillway Blade Nozzle
              const bladeMesh = new THREE.Mesh(
                new THREE.BoxGeometry(fWidth - frameThk * 2, 0.02, 0.04),
                metalMaterial
              );
              bladeMesh.position.set(0, fBottomY + fHeight - frameThk * 1.25, posZ);
              fGroup.add(bladeMesh);

              // Vertical Waterfall Rain Sheet Pouring into Basin
              const sheetH = fHeight - frameThk * 1.25;
              const sheetW = fWidth - frameThk * 2.2;
              const sheetMesh = new THREE.Mesh(
                new THREE.PlaneGeometry(sheetW, sheetH),
                waterCurtainMat
              );
              sheetMesh.position.set(0, fBottomY + sheetH / 2, posZ);
              fGroup.add(sheetMesh);

              // Secondary water stream strands for realistic texture
              const strandCount = 12;
              for (let st = 0; st < strandCount; st++) {
                const sx = -sheetW / 2 + 0.02 + (st * (sheetW - 0.04)) / (strandCount - 1);
                const strandGeo = new THREE.CylinderGeometry(0.004, 0.006, sheetH, 4);
                const strandMesh = new THREE.Mesh(strandGeo, waterCurtainMat);
                strandMesh.position.set(sx, fBottomY + sheetH / 2, posZ + (st % 2 === 0 ? 0.008 : -0.008));
                fGroup.add(strandMesh);
              }

              // Pulsing splash ring where the falling blade lands in the basin
              const splashMat = new THREE.MeshBasicMaterial({
                color: 0xe0f2fe,
                transparent: true,
                opacity: 0.3,
                depthWrite: false,
              });
              const splash = new THREE.Mesh(new THREE.CircleGeometry(sheetW * 0.3, 24), splashMat);
              splash.rotation.x = -Math.PI / 2;
              splash.position.set(0, basinH - 0.055, posZ);
              fGroup.add(splash);
              animatedEffectsRef.current.push({ type: "splash", mesh: splash, base: 0.3, phase: posZ * 3 });

              return fGroup;
            };

            // Rear Frame (Taller)
            const rearFrame = buildCascadeFrame(wW * 0.76, 1.45, -wD * 0.22);
            itemGroup.add(rearFrame);

            // Front Frame (Slightly Lower & Stepped Forward, exactly as in photo)
            const frontFrame = buildCascadeFrame(wW * 0.65, 1.08, wD * 0.12);
            itemGroup.add(frontFrame);

            // Underwater LED Illumination
            if (isNight) {
              const waterGlow = new THREE.PointLight(0x38bdf8, 3.0, 4.5);
              waterGlow.position.set(0, basinH + 0.15, 0);
              itemGroup.add(waterGlow);

              const frameUplight = new THREE.PointLight(0xffedd5, 1.8, 3.5);
              frameUplight.position.set(0, basinH + 0.5, -wD * 0.05);
              itemGroup.add(frameUplight);
            }
            break;
          }

          case "firepit": {
            // Square WPC firepit table with black steel flame basket (as in reference photo)
            const tW = item.width || 1.1;
            const tD = item.depth || 1.1;
            const tH = item.height || 0.72;
            const topThk = 0.09;
            const baseW = tW * 0.6;
            const baseD = tD * 0.6;
            const baseH = tH - topThk - 0.05;

            // Pedestal base clad in horizontal WPC planks
            const planksY = 5;
            const plankH = baseH / planksY;
            for (let p = 0; p < planksY; p++) {
              const plankGeo = new THREE.BoxGeometry(baseW, plankH * 0.9, baseD);
              const plankMesh = new THREE.Mesh(plankGeo, wpcMaterial);
              plankMesh.position.set(0, 0.05 + p * plankH + plankH / 2, 0);
              plankMesh.castShadow = true;
              plankMesh.receiveShadow = true;
              itemGroup.add(plankMesh);
            }

            // Small black metal feet under the pedestal
            [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([fx, fz]) => {
              const footGeo = new THREE.BoxGeometry(0.055, 0.05, 0.055);
              const footMesh = new THREE.Mesh(footGeo, metalMaterial);
              footMesh.position.set(fx * (baseW / 2 - 0.05), 0.025, fz * (baseD / 2 - 0.05));
              footMesh.castShadow = true;
              itemGroup.add(footMesh);
            });

            // Tabletop: narrow WPC slats with fine grooves
            const topY = tH - topThk / 2;
            const bandGeo = new THREE.BoxGeometry(tW, topThk, tD);
            const bandMesh = new THREE.Mesh(bandGeo, wpcMaterial);
            bandMesh.position.set(0, topY, 0);
            bandMesh.castShadow = true;
            bandMesh.receiveShadow = true;
            itemGroup.add(bandMesh);

            const slatCount = 16;
            const innerW = tW - 0.08;
            const slatW = innerW / slatCount - 0.008;
            for (let s = 0; s < slatCount; s++) {
              const sGeo = new THREE.BoxGeometry(slatW, 0.012, tD - 0.08);
              const sMesh = new THREE.Mesh(sGeo, wpcMaterial);
              const sx = -innerW / 2 + s * (slatW + 0.008) + slatW / 2;
              sMesh.position.set(sx, topY + topThk / 2 + 0.006, 0);
              sMesh.castShadow = true;
              sMesh.receiveShadow = true;
              itemGroup.add(sMesh);
            }

            // Black steel flame basket with curved vertical bars
            const basketW = tW * 0.42;
            const basketD = tD * 0.32;
            const basketH = 0.17;
            const basketY = tH + basketH / 2;

            [basketY + basketH / 2, basketY - basketH / 2].forEach((ry) => {
              const rimGeoX = new THREE.BoxGeometry(basketW, 0.022, 0.022);
              [-1, 1].forEach((zs) => {
                const rim = new THREE.Mesh(rimGeoX, metalMaterial);
                rim.position.set(0, ry, zs * (basketD / 2));
                rim.castShadow = true;
                itemGroup.add(rim);
              });
              const rimGeoZ = new THREE.BoxGeometry(0.022, 0.022, basketD);
              [-1, 1].forEach((xs) => {
                const rim = new THREE.Mesh(rimGeoZ, metalMaterial);
                rim.position.set(xs * (basketW / 2), ry, 0);
                rim.castShadow = true;
                itemGroup.add(rim);
              });
            });

            const barsPerSide = 9;
            for (let b = 0; b < barsPerSide; b++) {
              const bx = -basketW / 2 + 0.02 + (b * (basketW - 0.04)) / (barsPerSide - 1);
              [-1, 1].forEach((zs) => {
                const barGeo = new THREE.TorusGeometry(basketH * 0.55, 0.009, 6, 10, Math.PI * 0.6);
                const barMesh = new THREE.Mesh(barGeo, metalMaterial);
                barMesh.position.set(bx, basketY, zs * (basketD / 2));
                barMesh.rotation.z = Math.PI / 2 + (zs > 0 ? 0.35 : -0.35);
                barMesh.rotation.y = Math.PI / 2;
                barMesh.castShadow = true;
                itemGroup.add(barMesh);
              });
            }

            // Volcanic lava rocks
            const lavaMat = new THREE.MeshStandardMaterial({ color: 0x5b3a2a, roughness: 1 });
            for (let l = 0; l < 10; l++) {
              const rockGeo = new THREE.DodecahedronGeometry(0.026, 0);
              const rockMesh = new THREE.Mesh(rockGeo, lavaMat);
              rockMesh.position.set(
                -basketW / 2 + 0.05 + Math.random() * (basketW - 0.1),
                basketY - basketH * 0.28,
                -basketD / 2 + 0.04 + Math.random() * (basketD - 0.08)
              );
              itemGroup.add(rockMesh);
            }

            // Clean glowing gas flames — flicker animated in the render loop
            const flameMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
            const flameCoreMat = new THREE.MeshBasicMaterial({ color: 0xfde68a });
            const flameMeshes: THREE.Mesh[] = [];
            [-0.09, 0, 0.09].forEach((fx, fi) => {
              const flameGeo = new THREE.ConeGeometry(0.038, 0.17 + fi * 0.02, 7);
              const flameMesh = new THREE.Mesh(flameGeo, fi === 1 ? flameCoreMat : flameMat);
              flameMesh.position.set(fx, basketY + 0.07, 0);
              itemGroup.add(flameMesh);
              flameMeshes.push(flameMesh);
            });

            const fireLight = new THREE.PointLight(0xf97316, isNight ? 3.4 : 1.5, 5.5);
            fireLight.position.set(0, basketY + 0.2, 0);
            fireLight.castShadow = true;
            itemGroup.add(fireLight);
            animatedEffectsRef.current.push({
              type: "flame",
              meshes: flameMeshes,
              light: fireLight,
              base: isNight ? 3.4 : 1.5,
              phase: seedFromId(item.id) % 100 / 16,
            });
            break;
          }

          case "umbrella": {
            // High-precision 3-meter Cantilever Hydraulic Offset Umbrella
            const uW = item.width || 3.0;
            const uH = item.height || 2.65;
            const offsetDist = uW * 0.42;

            const { map: canvasTex, bumpMap: canvasBump } = createCanvasFabricTexture("#f5f2eb");
            const canopyFabricMat = new THREE.MeshStandardMaterial({
              map: canvasTex,
              bumpMap: canvasBump,
              bumpScale: 0.05,
              roughness: 0.75,
              metalness: 0.05,
              side: THREE.DoubleSide,
            });

            const brushedAluMat = new THREE.MeshStandardMaterial({
              color: 0x18181b,
              roughness: 0.25,
              metalness: 0.85,
            });

            const chromePistonMat = new THREE.MeshStandardMaterial({
              color: 0xd4d4d8,
              roughness: 0.15,
              metalness: 0.95,
            });

            // 1. Heavy Wheeled Base Box (Granite/Water weight base with lockable casters)
            const baseGeo = new THREE.BoxGeometry(0.85, 0.18, 0.85);
            const baseMesh = new THREE.Mesh(baseGeo, brushedAluMat);
            baseMesh.position.set(-offsetDist, 0.09, 0);
            baseMesh.castShadow = true;
            baseMesh.receiveShadow = true;
            itemGroup.add(baseMesh);

            // 4 Base Casters / Wheels
            const wheelGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.04, 12);
            [[-0.35, -0.35], [0.35, -0.35], [-0.35, 0.35], [0.35, 0.35]].forEach(([wx, wz]) => {
              const wheel = new THREE.Mesh(wheelGeo, brushedAluMat);
              wheel.rotation.z = Math.PI / 2;
              wheel.position.set(-offsetDist + wx, 0.04, wz);
              itemGroup.add(wheel);
            });

            // 2. Foot Pedal 360-degree rotation turret hub
            const turretGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.12, 16);
            const turretMesh = new THREE.Mesh(turretGeo, brushedAluMat);
            turretMesh.position.set(-offsetDist, 0.24, 0);
            itemGroup.add(turretMesh);

            // Rotation foot pedal
            const pedalGeo = new THREE.BoxGeometry(0.15, 0.04, 0.06);
            const pedalMesh = new THREE.Mesh(pedalGeo, chromePistonMat);
            pedalMesh.position.set(-offsetDist + 0.12, 0.22, 0);
            itemGroup.add(pedalMesh);

            // 3. Main Vertical Mast Column (Heavy Anodized Aluminum Profile)
            const mastH = uH * 0.88;
            const mastGeo = new THREE.BoxGeometry(0.09, mastH, 0.09);
            const mastMesh = new THREE.Mesh(mastGeo, brushedAluMat);
            mastMesh.position.set(-offsetDist, 0.24 + mastH / 2, 0);
            mastMesh.castShadow = true;
            itemGroup.add(mastMesh);

            // Winch Crank Handle Box
            const winchGeo = new THREE.BoxGeometry(0.12, 0.16, 0.1);
            const winchMesh = new THREE.Mesh(winchGeo, brushedAluMat);
            winchMesh.position.set(-offsetDist, 1.2, 0.08);
            itemGroup.add(winchMesh);

            const crankGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.12, 8);
            const crankMesh = new THREE.Mesh(crankGeo, chromePistonMat);
            crankMesh.rotation.x = Math.PI / 2;
            crankMesh.position.set(-offsetDist, 1.2, 0.14);
            itemGroup.add(crankMesh);

            // 4. Cantilever Overhead Boom Arm & Diagonal Hydraulic Gas Cylinder
            const boomLength = offsetDist * 1.05;
            const boomGeo = new THREE.BoxGeometry(boomLength, 0.07, 0.07);
            const boomMesh = new THREE.Mesh(boomGeo, brushedAluMat);
            boomMesh.position.set(-offsetDist + boomLength / 2, uH - 0.05, 0);
            boomMesh.castShadow = true;
            itemGroup.add(boomMesh);

            // Diagonal Hydraulic Strut Piston
            const strutGeo = new THREE.CylinderGeometry(0.025, 0.025, offsetDist * 0.85, 12);
            const strutMesh = new THREE.Mesh(strutGeo, chromePistonMat);
            strutMesh.position.set(-offsetDist + offsetDist * 0.35, uH * 0.72, 0);
            strutMesh.rotation.z = -Math.PI / 4.2;
            strutMesh.castShadow = true;
            itemGroup.add(strutMesh);

            // 5. Central Canopy Suspension Hub
            const hubGeo = new THREE.CylinderGeometry(0.08, 0.06, 0.15, 16);
            const hubMesh = new THREE.Mesh(hubGeo, brushedAluMat);
            hubMesh.position.set(0, uH - 0.08, 0);
            itemGroup.add(hubMesh);

            // 6. 8 Aluminum Radial Folding Ribs
            const ribCount = 8;
            const ribLen = uW / 2;
            for (let r = 0; r < ribCount; r++) {
              const rAngle = (r * Math.PI * 2) / ribCount;
              const ribGeo = new THREE.BoxGeometry(ribLen, 0.025, 0.025);
              const ribMesh = new THREE.Mesh(ribGeo, brushedAluMat);
              ribMesh.position.set((Math.cos(rAngle) * ribLen) / 2, uH - 0.18, (Math.sin(rAngle) * ribLen) / 2);
              ribMesh.rotation.y = -rAngle;
              ribMesh.rotation.z = 0.12;
              ribMesh.castShadow = true;
              itemGroup.add(ribMesh);
            }

            // 7. Main Octagonal Sunbrella Fabric Canopy (Stitched Membrane)
            const canopyGeo = new THREE.ConeGeometry(uW / 2, 0.45, 8, 1, false);
            const canopyMesh = new THREE.Mesh(canopyGeo, canopyFabricMat);
            canopyMesh.position.set(0, uH - 0.22, 0);
            canopyMesh.castShadow = true;
            canopyMesh.receiveShadow = true;
            itemGroup.add(canopyMesh);

            // Top Wind Escape Air Vent Cap
            const ventGeo = new THREE.ConeGeometry(uW * 0.22, 0.18, 8);
            const ventMesh = new THREE.Mesh(ventGeo, canopyFabricMat);
            ventMesh.position.set(0, uH - 0.05, 0);
            ventMesh.castShadow = true;
            itemGroup.add(ventMesh);

            // Top finial cap
            const finialGeo = new THREE.SphereGeometry(0.05, 12, 12);
            const finialMesh = new THREE.Mesh(finialGeo, chromePistonMat);
            finialMesh.position.set(0, uH + 0.06, 0);
            itemGroup.add(finialMesh);

            if (isNight) {
              const underUmbrellaLight = new THREE.PointLight(0xffe699, 2.2, 5.0);
              underUmbrellaLight.position.set(0, uH - 0.35, 0);
              itemGroup.add(underUmbrellaLight);
            }
            break;
          }

          case "bbq": {
            // Modular Outdoor Kitchen Counter
            const bodyGeo = new THREE.BoxGeometry(item.width, item.height - 0.1, item.depth);
            const bodyMesh = new THREE.Mesh(bodyGeo, wpcMaterial);
            bodyMesh.position.set(0, (item.height - 0.1) / 2, 0);
            bodyMesh.castShadow = true;
            itemGroup.add(bodyMesh);

            // Stainless Steel Countertop
            const topGeo = new THREE.BoxGeometry(item.width + 0.04, 0.05, item.depth + 0.04);
            const topMesh = new THREE.Mesh(topGeo, metalMaterial);
            topMesh.position.set(0, item.height - 0.075, 0);
            itemGroup.add(topMesh);

            // 4-burner Grill with dome hood
            const grillGeo = new THREE.BoxGeometry(item.width * 0.55, 0.32, item.depth * 0.82);
            const grillMesh = new THREE.Mesh(grillGeo, metalMaterial);
            grillMesh.position.set(-item.width * 0.18, item.height + 0.08, 0);
            grillMesh.castShadow = true;
            itemGroup.add(grillMesh);

            // Stainless Sink & Faucet
            const sinkGeo = new THREE.BoxGeometry(item.width * 0.28, 0.12, item.depth * 0.65);
            const sinkMesh = new THREE.Mesh(sinkGeo, metalMaterial);
            sinkMesh.position.set(item.width * 0.28, item.height - 0.02, 0);
            itemGroup.add(sinkMesh);
            break;
          }

          case "louver": {
            // Vertical Louver Screen
            const frameGeo = new THREE.BoxGeometry(item.width, item.height, 0.08);
            const frameMesh = new THREE.Mesh(frameGeo, metalMaterial);
            frameMesh.position.set(0, item.height / 2, 0);
            itemGroup.add(frameMesh);

            const numSlat = 10;
            for (let i = 0; i < numSlat; i++) {
              const slatGeo = new THREE.BoxGeometry(item.width - 0.1, 0.09, 0.03);
              const slatMesh = new THREE.Mesh(slatGeo, wpcMaterial);
              slatMesh.position.set(0, 0.15 + (i * (item.height - 0.3)) / (numSlat - 1), 0);
              slatMesh.rotation.x = Math.PI / 6;
              slatMesh.castShadow = true;
              itemGroup.add(slatMesh);
            }
            break;
          }

          case "box":
          default: {
            const boxGeo = new THREE.BoxGeometry(item.width, item.height, item.depth);
            const boxMesh = new THREE.Mesh(boxGeo, wpcMaterial);
            boxMesh.position.set(0, item.height / 2, 0);
            boxMesh.castShadow = true;
            boxMesh.receiveShadow = true;
            itemGroup.add(boxMesh);

            // Metal Rim Top
            const rimGeo = new THREE.BoxGeometry(item.width + 0.02, 0.04, item.depth + 0.02);
            const rimMesh = new THREE.Mesh(rimGeo, metalMaterial);
            rimMesh.position.set(0, item.height, 0);
            itemGroup.add(rimMesh);

            if (item.category === "planting") {
              const soilGeo = new THREE.BoxGeometry(item.width - 0.06, 0.05, item.depth - 0.06);
              const soilMesh = new THREE.Mesh(soilGeo, soilMaterial);
              soilMesh.position.set(0, item.height - 0.02, 0);
              itemGroup.add(soilMesh);

              // Layered natural planting: low flowering cover + taller shrubs
              const cover = createGroundCover(
                item.width - 0.08,
                item.depth,
                seedFromId(item.id),
                true
              );
              cover.position.set(0, item.height + 0.04, 0);
              itemGroup.add(cover);

              const numShrubs = Math.max(1, Math.round(item.width / 0.55));
              for (let s = 0; s < numShrubs; s++) {
                const sx =
                  -item.width / 2 + 0.26 + (s * (item.width - 0.52)) / Math.max(1, numShrubs - 1);
                const shrub = createFoliageCluster({
                  radius: 0.21 + (s % 3) * 0.025,
                  seed: seedFromId(item.id) + s * 67,
                  density: 1,
                  heightScale: 1.15,
                  withFlowers: s % 2 === 0,
                  tone: s % 3 === 0 ? "light" : s % 3 === 1 ? "normal" : "dark",
                });
                shrub.position.set(sx, item.height + 0.2, (s % 2 === 0 ? 1 : -1) * item.depth * 0.1);
                itemGroup.add(shrub);
              }
            }

            if (item.hasLighting && isNight) {
              const boxLight = new THREE.PointLight(0xffe699, 2.0, 3.2);
              boxLight.position.set(0, 0.15, 0);
              itemGroup.add(boxLight);
            }
            break;
          }
        }

        itemGroup.position.set(item.x, item.y || 0, item.z);
        itemGroup.rotation.y = THREE.MathUtils.degToRad(item.rotation || 0);

        return itemGroup;
      },
      [spaceConfig, lightingMode]
    );

    const buildItems = useCallback(() => {
      if (!itemsGroupRef.current) return;
      const group = itemsGroupRef.current;

      while (group.children.length > 0) {
        const child = group.children[0];
        group.remove(child);
        // Release GPU resources so repeated rebuilds (e.g. after each drag) don't leak
        child.traverse((obj) => {
          const mesh = obj as THREE.Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
          const mat = mesh.material as THREE.MeshStandardMaterial | undefined;
          if (mat) {
            if (mat.map) mat.map.dispose();
            if (mat.bumpMap) mat.bumpMap.dispose();
            mat.dispose();
          }
        });
      }
      itemGroupsRef.current.clear();
      hitProxiesRef.current = [];
      animatedEffectsRef.current = [];

      let collisionsDetected = false;

      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const it1 = items[i];
          const it2 = items[j];
          const dist = Math.hypot(it1.x - it2.x, it1.z - it2.z);
          const minSafeDist = (Math.min(it1.width, it1.depth) + Math.min(it2.width, it2.depth)) / 3.0;
          if (dist < minSafeDist) {
            collisionsDetected = true;
          }
        }
      }
      setHasCollisions(collisionsDetected);

      // One shared invisible material for all picking proxies (fast + cheap)
      const proxyMat = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });

      items.forEach((item) => {
        const meshGroup = createItemMeshGroup(item, false);
        group.add(meshGroup);
        itemGroupsRef.current.set(item.id, meshGroup);

        // Invisible full-height picking box: one raycast target per item instead of hundreds of leaves/slat meshes
        const proxyGeo = new THREE.BoxGeometry(
          Math.max(item.width, 0.4),
          Math.max(item.height, 0.5),
          Math.max(item.depth, 0.4)
        );
        const proxy = new THREE.Mesh(proxyGeo, proxyMat);
        proxy.position.set(item.x, Math.max(item.height, 0.5) / 2, item.z);
        proxy.rotation.y = THREE.MathUtils.degToRad(item.rotation || 0);
        proxy.userData.itemId = item.id;
        proxy.name = `hit-proxy-${item.id}`;
        group.add(proxy);
        hitProxiesRef.current.push(proxy);
      });
    }, [items, createItemMeshGroup]);

    // ─────────────────────────────────────────────────────────────────────
    // Plan dimension chains (architectural style: extension lines, 45° ticks
    // and pill labels) — rendered just above the deck, visible in پلان ۲D view.
    // ─────────────────────────────────────────────────────────────────────
    const buildPlanDimensions = useCallback(() => {
      const scene = sceneRef.current;
      if (!scene) return;

      if (!planDimsGroupRef.current) {
        const g = new THREE.Group();
        g.name = "plan-dimensions";
        scene.add(g);
        planDimsGroupRef.current = g;
      }
      const group = planDimsGroupRef.current;

      // Clear previous build (dispose generated geometries, materials and label textures)
      group.traverse((obj) => {
        if ((obj as THREE.Line).isLine) {
          (obj as THREE.Line).geometry.dispose();
        }
        const mat = (obj as THREE.Line).material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else if (mat) {
          const sm = mat as THREE.SpriteMaterial;
          if (sm.map) sm.map.dispose();
          mat.dispose();
        }
      });
      while (group.children.length > 0) group.remove(group.children[0]);

      const {
        width,
        length,
        shape = "rectangular",
        cutoutWidth = 4.5,
        cutoutLength = 4.0,
        shaftWidth = 3.2,
        shaftLength = 3.0,
      } = spaceConfig;

      const halfW = width / 2;
      const halfL = length / 2;
      const y = 0.32; // hover height above the deck
      const off = 1.6; // chain distance from the parapet line
      const over = 0.4; // extension-line overshoot past the chain
      const maxDim = Math.max(width, length);

      const lineMat = new THREE.LineBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.95 });
      const innerLineMat = new THREE.LineBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.95 });
      const extMat = new THREE.LineBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.45 });
      const innerExtMat = new THREE.LineBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.45 });

      const addLine = (a: [number, number], b: [number, number], mat: THREE.LineBasicMaterial) => {
        const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(a[0], y, a[1]), new THREE.Vector3(b[0], y, b[1])]);
        group.add(new THREE.Line(geo, mat));
      };

      // 45° architectural tick slash at a chain node
      const addTick = (x: number, z: number, mat: THREE.LineBasicMaterial) => {
        const t = 0.3;
        addLine([x - t, z + t], [x + t, z - t], mat);
      };

      // Pill label sprite centred on the chain line
      const addLabel = (text: string, x: number, z: number, inner: boolean) => {
        const cnv = document.createElement("canvas");
        const ctx = cnv.getContext("2d");
        if (!ctx) return;
        const s = 2; // supersample for crisp text
        const font = `bold ${30 * s}px Tahoma, Vazirmatn, sans-serif`;
        ctx.font = font;
        const tw = ctx.measureText(text).width;
        cnv.width = Math.ceil(tw + 36 * s);
        cnv.height = 46 * s;
        const c = cnv.getContext("2d");
        if (!c) return;
        c.font = font;
        c.fillStyle = inner ? "rgba(30,22,7,0.94)" : "rgba(8,15,30,0.94)";
        c.strokeStyle = inner ? "#fbbf24" : "#7dd3fc";
        c.lineWidth = 1.5 * s;
        c.beginPath();
        c.roundRect(2, 2, cnv.width - 4, cnv.height - 4, (cnv.height - 4) / 2);
        c.fill();
        c.stroke();
        c.fillStyle = inner ? "#fde68a" : "#f0f9ff";
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.fillText(text, cnv.width / 2, cnv.height / 2 + 2);

        const tex = new THREE.CanvasTexture(cnv);
        tex.anisotropy = 4;
        const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
        const sprite = new THREE.Sprite(mat);
        const worldH = Math.min(2.2, Math.max(0.9, maxDim * 0.075));
        sprite.scale.set((cnv.width / cnv.height) * worldH, worldH, 1);
        sprite.position.set(x, y + 0.06, z);
        sprite.renderOrder = 10;
        group.add(sprite);
      };

      interface Seg {
        a: number;
        b: number;
        m: number;
        inner?: boolean;
      }

      /** Draws a horizontal chain (running along X) at a fixed z, with per-node extensions. */
      const drawHChain = (segs: Seg[], z: number, wallZ: (seg: Seg) => number) => {
        const first = segs[0];
        const last = segs[segs.length - 1];
        addLine([first.a, z], [last.b, z], first.inner || last.inner ? innerLineMat : lineMat);
        segs.forEach((seg) => {
          const mat = seg.inner ? innerLineMat : lineMat;
          const em = seg.inner ? innerExtMat : extMat;
          addTick(seg.a, z, mat);
          addTick(seg.b, z, mat);
          const wz = wallZ(seg);
          addLine([seg.a, wz + 0.15], [seg.a, z + over], em);
          addLine([seg.b, wz + 0.15], [seg.b, z + over], em);
          addLabel(`${faNum(seg.m)} m`, (seg.a + seg.b) / 2, z, !!seg.inner);
        });
      };

      /** Draws a vertical chain (running along Z) at a fixed x. */
      const drawVChain = (segs: Seg[], x: number, wallX: (seg: Seg) => number) => {
        const first = segs[0];
        const last = segs[segs.length - 1];
        addLine([x, first.a], [x, last.b], first.inner || last.inner ? innerLineMat : lineMat);
        segs.forEach((seg) => {
          const mat = seg.inner ? innerLineMat : lineMat;
          const em = seg.inner ? innerExtMat : extMat;
          addTick(x, seg.a, mat);
          addTick(x, seg.b, mat);
          const wx = wallX(seg);
          addLine([wx + 0.15, seg.a], [x + over, seg.a], em);
          addLine([wx + 0.15, seg.b], [x + over, seg.b], em);
          addLabel(`${faNum(seg.m)} m`, x, (seg.a + seg.b) / 2, !!seg.inner);
        });
      };

      // Overall width chain — south side, split per shape (cut-outs in amber)
      if (shape === "l_shaped") {
        const mainW = width - cutoutWidth;
        drawHChain(
          [
            { a: -halfW, b: -halfW + mainW, m: mainW },
            { a: -halfW + mainW, b: halfW, m: cutoutWidth, inner: true },
          ],
          halfL + off,
          (seg) => (seg.inner ? halfL - cutoutLength : halfL)
        );
      } else if (shape === "u_shaped") {
        const wingW = (width - cutoutWidth) / 2;
        drawHChain(
          [
            { a: -halfW, b: -halfW + wingW, m: wingW },
            { a: -halfW + wingW, b: halfW - wingW, m: cutoutWidth, inner: true },
            { a: halfW - wingW, b: halfW, m: wingW },
          ],
          halfL + off,
          (seg) => (seg.inner ? halfL - cutoutLength : halfL)
        );
      } else {
        drawHChain([{ a: -halfW, b: halfW, m: width }], halfL + off, () => halfL);
      }

      // Overall length chain — west side (full edge in every shape)
      drawVChain([{ a: -halfL, b: halfL, m: length }], -halfW - off, () => -halfW);

      // East side: L-shape wing + cutout depth
      if (shape === "l_shaped") {
        drawVChain(
          [
            { a: -halfL, b: halfL - cutoutLength, m: length - cutoutLength },
            { a: halfL - cutoutLength, b: halfL, m: cutoutLength, inner: true },
          ],
          halfW + off,
          (seg) => (seg.inner ? halfW - cutoutWidth : halfW)
        );
      }

      // U-shape: courtyard depth (inner, east of the cutout)
      if (shape === "u_shaped") {
        drawVChain(
          [{ a: halfL - cutoutLength, b: halfL, m: cutoutLength, inner: true }],
          cutoutWidth / 2 + 1.0,
          () => cutoutWidth / 2
        );
      }

      // Central shaft dims (amber, in-plan)
      if (shape === "central_shaft") {
        drawHChain([{ a: -shaftWidth / 2, b: shaftWidth / 2, m: shaftWidth, inner: true }], shaftLength / 2 + 1.1, () => shaftLength / 2);
        drawVChain([{ a: -shaftLength / 2, b: shaftLength / 2, m: shaftLength, inner: true }], shaftWidth / 2 + 1.1, () => shaftWidth / 2);
      }

      group.visible = viewMode === "top_2d";
    }, [spaceConfig, viewMode]);

    useEffect(() => {
      buildPlanDimensions();
    }, [buildPlanDimensions]);

    // Selection highlight — applied separately so a click never rebuilds the whole scene
    useEffect(() => {
      if (!sceneRef.current) return;
      if (selectionHelperRef.current) {
        sceneRef.current.remove(selectionHelperRef.current);
        selectionHelperRef.current = null;
      }
      if (selectedItemId) {
        const targetGroup = itemGroupsRef.current.get(selectedItemId);
        if (targetGroup) {
          selectionHelperRef.current = new THREE.BoxHelper(targetGroup, 0x10b981);
          sceneRef.current.add(selectionHelperRef.current);
        }
      }
    }, [selectedItemId, items]);

    useEffect(() => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const width = container.clientWidth;
      const height = container.clientHeight;

      const scene = new THREE.Scene();
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 200);
      cameraRef.current = camera;
      resetCamera();

      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
        preserveDrawingBuffer: true,
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      rendererRef.current = renderer;

      const lightsGroup = new THREE.Group();
      scene.add(lightsGroup);
      lightsGroupRef.current = lightsGroup;

      const envGroup = new THREE.Group();
      scene.add(envGroup);
      environmentGroupRef.current = envGroup;

      const itemsGroup = new THREE.Group();
      scene.add(itemsGroup);
      itemsGroupRef.current = itemsGroup;

      updateLighting();
      buildEnvironment();
      buildItems();

      let animationFrameId: number;
      const clock = new THREE.Clock();
      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        const t = clock.getElapsedTime();

        // Living item effects (falling water, ripples, flames)
        for (const fx of animatedEffectsRef.current) {
          if (fx.type === "scroll" && fx.mat.map) {
            fx.mat.map.offset.y = (t * fx.speed) % 1;
          } else if (fx.type === "shimmer" && fx.mat.map) {
            fx.mat.map.offset.y = (t * 0.06) % 1;
            fx.mat.map.offset.x = Math.sin(t * 0.4) * 0.05;
          } else if (fx.type === "splash") {
            const pulse = Math.sin(t * 5.2 + fx.phase);
            const s = 1 + 0.18 * pulse;
            fx.mesh.scale.set(s, s, 1);
            (fx.mesh.material as THREE.MeshBasicMaterial).opacity = fx.base * (0.65 + 0.35 * pulse);
          } else if (fx.type === "flame") {
            const s =
              1 + 0.13 * Math.sin(t * 11 + fx.phase) + 0.05 * Math.sin(t * 23 + fx.phase * 1.7);
            fx.meshes.forEach((m, i) => {
              m.scale.set(1 - 0.05 * Math.sin(t * 9 + i * 2.1), s + i * 0.04, 1);
            });
            if (fx.light) {
              fx.light.intensity = fx.base * (0.82 + 0.18 * Math.sin(t * 15 + fx.phase * 2.1));
            }
          }
        }

        if (selectionHelperRef.current) {
          selectionHelperRef.current.update();
        }
        renderer.render(scene, camera);
      };
      animate();

      const handleResize = () => {
        if (!container || !camera || !renderer) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };

      window.addEventListener("resize", handleResize);

      return () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener("resize", handleResize);
        renderer.dispose();
      };
    }, []);

    useEffect(() => {
      updateLighting();
    }, [lightingMode, updateLighting]);

    useEffect(() => {
      buildEnvironment();
      resetCamera();
    }, [spaceConfig, buildEnvironment, resetCamera]);

    useEffect(() => {
      buildItems();
    }, [items, buildItems]);

    useEffect(() => {
      setTopView(viewMode === "top_2d");
    }, [viewMode, setTopView]);

    // Precise item picking: raycast the real item meshes first, so overlapping or
    // nested items (e.g. a sofa inside a pergola's volume) stay selectable.
    //
    // Relation to the ground point of the same ray:
    // - real-mesh hits only count when they sit IN FRONT of the ground crossing,
    //   so a click aimed at the void past the plan can't grab items behind it;
    // - the invisible full-height proxy boxes are a forgiving fallback for clicks
    //   that miss detailed geometry, but never when the click lands outside the
    //   floor plan (tall picking volumes project past the deck and would move
    //   items the user never pointed at).
    const getItemIdFromScreenCoord = useCallback(
      (clientX: number, clientY: number): string | null => {
        const canvas = canvasRef.current;
        const camera = cameraRef.current;
        if (!canvas || !camera) return null;

        const rect = canvas.getBoundingClientRect();
        const mouseX = ((clientX - rect.left) / rect.width) * 2 - 1;
        const mouseY = -((clientY - rect.top) / rect.height) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

        const groundPoint = new THREE.Vector3();
        const groundHit = raycaster.ray.intersectPlane(dragPlaneRef.current, groundPoint);
        const groundDist = groundHit ? raycaster.ray.origin.distanceTo(groundPoint) : Infinity;
        const groundInsidePlan =
          groundHit !== null && isInsidePlanBounds(groundPoint.x, groundPoint.z, 0, 0, spaceConfig, 0);

        const itemMeshes = (itemsGroupRef.current?.children ?? []).filter(
          (c) => !c.name.startsWith("hit-proxy")
        );
        if (itemMeshes.length > 0) {
          const rawHits = raycaster.intersectObjects(itemMeshes, true);
          // Degenerate geometries can yield NaN-distance hits that poison THREE's
          // distance sort — drop them and re-sort deterministically.
          const hits = rawHits
            .filter((h) => Number.isFinite(h.distance) && h.distance < groundDist)
            .sort((a, b) => a.distance - b.distance);
          if (hits.length > 0) {
            let obj: THREE.Object3D | null = hits[0].object;
            while (obj && !obj.userData.itemId) obj = obj.parent;
            if (obj?.userData.itemId) return obj.userData.itemId as string;
          }
        }

        if (groundInsidePlan) {
          const proxyHits = raycaster.intersectObjects(hitProxiesRef.current, false);
          if (proxyHits.length > 0) {
            return (proxyHits[0].object.userData.itemId as string) || null;
          }
        }
        return null;
      },
      [spaceConfig]
    );

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      const camera = cameraRef.current;
      if (!canvas || !camera) return;

      previousMousePosRef.current = { x: e.clientX, y: e.clientY };
      pointerDownStartPosRef.current = { x: e.clientX, y: e.clientY };
      hasMovedPastThresholdRef.current = false;
      isDraggingItemRef.current = false;

      // Which item (if any) is under the pointer right now?
      const pressId = getItemIdFromScreenCoord(e.clientX, e.clientY);
      clickedItemIdRef.current = pressId;

      if (pressId && pressId === selectedItemId) {
        // Pressing on the ALREADY SELECTED item → prepare to drag-move it on the floor.
        isOrbitingRef.current = false;

        const rect = canvas.getBoundingClientRect();
        const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);
        const planeIntersect = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(dragPlaneRef.current, planeIntersect)) {
          const targetItem = items.find((it) => it.id === pressId);
          if (targetItem) {
            dragOffsetRef.current = {
              x: targetItem.x - planeIntersect.x,
              z: targetItem.z - planeIntersect.z,
            };
          }
        }
      } else {
        // Pressing on empty space or an unselected item → orbit camera on drag.
        isOrbitingRef.current = true;
      }

      try {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      } catch {}
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      const camera = cameraRef.current;
      if (!canvas || !camera) return;

      const deltaX = e.clientX - previousMousePosRef.current.x;
      const deltaY = e.clientY - previousMousePosRef.current.y;
      previousMousePosRef.current = { x: e.clientX, y: e.clientY };

      const moveDist = Math.hypot(
        e.clientX - pointerDownStartPosRef.current.x,
        e.clientY - pointerDownStartPosRef.current.y
      );

      if (moveDist > 6) {
        hasMovedPastThresholdRef.current = true;
      }

      // Case A: dragging the already-selected item → move it on the floor plane.
      // Direct transform of the live group (no React rebuild per move) for zero lag.
      if (
        clickedItemIdRef.current &&
        clickedItemIdRef.current === selectedItemId &&
        hasMovedPastThresholdRef.current
      ) {
        isDraggingItemRef.current = true;
        isOrbitingRef.current = false;

        const rect = canvas.getBoundingClientRect();
        const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

        const planeIntersect = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(dragPlaneRef.current, planeIntersect)) {
          const rawX = planeIntersect.x + dragOffsetRef.current.x;
          const rawZ = planeIntersect.z + dragOffsetRef.current.z;
          const target = items.find((it) => it.id === selectedItemId);
          if (target) {
            // Half-tile (0.5 m) quantum keeps drops aligned to the 1 m grid
            const snap = (p: number) => (smartSnapping ? Math.round(p * 2) / 2 : p);
            const clamped = clampItemToPlan(snap(rawX), snap(rawZ), target.width, target.depth, spaceConfig, target.rotation);
            dragLastPosRef.current = clamped;

            const liveGroup = itemGroupsRef.current.get(target.id);
            if (liveGroup) {
              liveGroup.position.set(clamped.x, 0, clamped.z);
            }
            const liveProxy = hitProxiesRef.current.find((p) => p.userData.itemId === target.id);
            if (liveProxy) {
              liveProxy.position.set(clamped.x, liveProxy.position.y, clamped.z);
            }
            if (selectionHelperRef.current) {
              selectionHelperRef.current.update();
            }
          }
        }
        return;
      }

      // Case B: dragging anywhere else → orbit the camera smoothly
      if (isOrbitingRef.current && e.buttons > 0) {
        const sensitivity = 0.0055;
        cameraAngleRef.current.theta -= deltaX * sensitivity;
        cameraAngleRef.current.phi = Math.max(
          0.05,
          Math.min(Math.PI / 2 - 0.02, cameraAngleRef.current.phi + deltaY * sensitivity)
        );
        updateCameraPosition();
        return;
      }

      // Case C: free hover (no button pressed) → throttled pointer cursor feedback
      if (e.buttons === 0) {
        const now = performance.now();
        if (now - lastHoverCheckRef.current > 80) {
          lastHoverCheckRef.current = now;
          const hoveredId = getItemIdFromScreenCoord(e.clientX, e.clientY);
          canvas.style.cursor = hoveredId ? "pointer" : "grab";
        }
      }
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const wasDragging = isDraggingItemRef.current;
      const pressedId = clickedItemIdRef.current;
      const lastPos = dragLastPosRef.current;

      if (wasDragging) {
        // Commit the final clamped position exactly once (single scene update)
        if (pressedId && lastPos) {
          onUpdateItemPosition(pressedId, lastPos.x, lastPos.z);
        }
      } else if (!hasMovedPastThresholdRef.current) {
        // Clean click / tap: select the pressed item, or deselect on empty space
        onSelectItem(pressedId);
      }

      isOrbitingRef.current = false;
      isDraggingItemRef.current = false;
      clickedItemIdRef.current = null;
      dragLastPosRef.current = null;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    };

    const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const zoomFactor = e.deltaY * 0.015;
      const maxDim = Math.max(spaceConfig.width, spaceConfig.length);
      cameraAngleRef.current.radius = Math.max(
        4,
        Math.min(maxDim * 3, cameraAngleRef.current.radius + zoomFactor)
      );
      updateCameraPosition();
    };

    return (
      <div ref={containerRef} className="relative w-full h-full select-none overflow-hidden bg-slate-900">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-grab active:cursor-grabbing block"
          style={{ touchAction: "none" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleWheel}
        />

        {/* Floating Collision Warning */}
        {hasCollisions && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-amber-500/90 text-slate-950 font-medium px-4 py-1.5 rounded-full text-xs shadow-lg backdrop-blur-md flex items-center gap-2 animate-pulse pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-amber-950 inline-block"></span>
            <span>توجه: برخی از ماژول‌ها بیش از حد به یکدیگر نزدیک یا دارای همپوشانی هستند.</span>
          </div>
        )}

        {/* Compass Pill */}
        <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-xl border border-slate-700/60 shadow flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-full border border-emerald-400 flex items-center justify-center text-[9px] text-emerald-400 font-bold">
            N
          </div>
          <span className="text-slate-300">شمال</span>
        </div>

        {/* Interaction Hint */}
        <div className="absolute bottom-4 right-4 hidden md:flex items-center gap-2 bg-slate-900/80 backdrop-blur-md text-[10px] text-slate-300 px-3 py-1.5 rounded-xl border border-slate-700/60 shadow pointer-events-none">
          <span className="text-emerald-400 font-bold">کلیک:</span>
          <span>انتخاب قطعه</span>
          <span className="text-slate-600">•</span>
          <span className="text-emerald-400 font-bold">درگ قطعه انتخاب‌شده:</span>
          <span>جابه‌جایی</span>
          <span className="text-slate-600">•</span>
          <span className="text-emerald-400 font-bold">درگ فضای خالی:</span>
          <span>چرخش دوربین</span>
        </div>
      </div>
    );
  }
);

Chekadbam3DCanvas.displayName = "Chekadbam3DCanvas";
