"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { SpaceConfig, StudioItem } from "@/lib/studio-types";
import { PRESET_DESIGNS, calculateBillOfMaterials, PresetDesign } from "@/lib/studio-presets";
import { clampItemToPlan, findSafeSpawnPosition } from "@/lib/plan-boundary";
import { ChekadbamProduct } from "@/lib/products-data";
import { Chekadbam3DCanvas, Chekadbam3DCanvasRef } from "@/components/studio/Chekadbam3DCanvas";
import { StudioToolbar } from "@/components/studio/StudioToolbar";
import { ProductDrawer } from "@/components/studio/ProductDrawer";
import { BillOfMaterialsModal } from "@/components/studio/BillOfMaterialsModal";
import { SaveConsultationModal } from "@/components/studio/SaveConsultationModal";
import { PlanSpaceModal } from "@/components/studio/PlanSpaceModal";
import { StudioGuideModal } from "@/components/studio/StudioGuideModal";
import { ItemInspectorBar } from "@/components/studio/ItemInspectorBar";
import { ArrowRight, Sparkles } from "lucide-react";

export default function ChekadbamStudioPage() {
  const canvasRef = useRef<Chekadbam3DCanvasRef | null>(null);

  // Default preset with every item pre-clamped inside the plan boundaries
  const defaultPreset = PRESET_DESIGNS[0];
  const initialItems: StudioItem[] = defaultPreset.items.map((it) => {
    const clamped = clampItemToPlan(it.x, it.z, it.width, it.depth, defaultPreset.spaceConfig, it.rotation);
    return { ...it, x: clamped.x, z: clamped.z };
  });

  // Studio State
  const [spaceConfig, setSpaceConfig] = useState<SpaceConfig>(defaultPreset.spaceConfig);
  const [items, setItems] = useState<StudioItem[]>(initialItems);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [lightingMode, setLightingMode] = useState<"day" | "sunset" | "night">("sunset");
  const [viewMode, setViewMode] = useState<"3d" | "top_2d">("3d");
  const [smartSnapping, setSmartSnapping] = useState<boolean>(true);

  // Undo / Redo History Stacks
  const [history, setHistory] = useState<StudioItem[][]>([initialItems]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Modals state
  const [isProductDrawerOpen, setIsProductDrawerOpen] = useState(false);
  const [isBOMModalOpen, setIsBOMModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isPlanSpaceOpen, setIsPlanSpaceOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string>("");

  // First-visit onboarding: let the 3D scene mount first, then show the guide once.
  // The short deferral also keeps the effect free of synchronous setState.
  useEffect(() => {
    if (window.localStorage.getItem("chekadbam-studio-guide-seen")) return;
    const id = window.setTimeout(() => {
      window.localStorage.setItem("chekadbam-studio-guide-seen", "1");
      setIsGuideOpen(true);
    }, 900);
    return () => window.clearTimeout(id);
  }, []);

  // Record history step
  const pushHistory = (newItems: StudioItem[]) => {
    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(newItems);
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const nextIndex = historyIndex - 1;
      setHistoryIndex(nextIndex);
      setItems(history[nextIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setItems(history[nextIndex]);
    }
  };

  // Add Product to canvas - guaranteed to stay 100% inside the floor plan boundaries
  const handleAddProduct = (product: ChekadbamProduct) => {
    const safePos = findSafeSpawnPosition(
      product.dimensions.width,
      product.dimensions.depth,
      spaceConfig,
      items
    );

    const newItem: StudioItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productId: product.id,
      name: product.name,
      category: product.category,
      x: safePos.x,
      z: safePos.z,
      y: 0,
      rotation: 0,
      width: product.dimensions.width,
      depth: product.dimensions.depth,
      height: product.dimensions.height,
      shapeType: product.model3D.shapeType,
      priceEst: product.priceEstToman,
      weightKg: product.weightKg,
      wpcColor: spaceConfig.wpcColor,
      metalColor: spaceConfig.metalColor,
      hasLighting: product.model3D.hasLighting,
    };

    const newItems = [...items, newItem];
    setItems(newItems);
    pushHistory(newItems);
    setSelectedItemId(newItem.id);
  };

  // Update item position - strictly clamped to plan boundaries (rotation-aware)
  const handleUpdateItemPosition = useCallback(
    (id: string, proposedX: number, proposedZ: number) => {
      setItems((prev) =>
        prev.map((it) => {
          if (it.id === id) {
            const clamped = clampItemToPlan(
              proposedX,
              proposedZ,
              it.width,
              it.depth,
              spaceConfig,
              it.rotation
            );
            return { ...it, x: clamped.x, z: clamped.z };
          }
          return it;
        })
      );
    },
    [spaceConfig]
  );

  // Transformations - nudge movement with strict boundary clamping
  const handleMoveItem = (id: string, dx: number, dz: number) => {
    const newItems = items.map((it) => {
      if (it.id === id) {
        const proposedX = it.x + dx;
        const proposedZ = it.z + dz;
        const clamped = clampItemToPlan(proposedX, proposedZ, it.width, it.depth, spaceConfig, it.rotation);
        return { ...it, x: clamped.x, z: clamped.z };
      }
      return it;
    });
    setItems(newItems);
    pushHistory(newItems);
  };

  // Rotate then re-clamp so a rotated footprint never ends up inside a wall
  const handleRotateItem = (id: string, deltaAngle: number) => {
    const newItems = items.map((it) => {
      if (it.id === id) {
        const newRotation = (it.rotation + deltaAngle) % 360;
        const clamped = clampItemToPlan(it.x, it.z, it.width, it.depth, spaceConfig, newRotation);
        return { ...it, rotation: newRotation, x: clamped.x, z: clamped.z };
      }
      return it;
    });
    setItems(newItems);
    pushHistory(newItems);
  };

  // Duplicate at a guaranteed-safe position inside the plan
  const handleDuplicateItem = (id: string) => {
    const target = items.find((it) => it.id === id);
    if (!target) return;

    const proposed = clampItemToPlan(
      target.x + 0.6,
      target.z + 0.6,
      target.width,
      target.depth,
      spaceConfig,
      target.rotation
    );

    const duplicated: StudioItem = {
      ...target,
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      x: proposed.x,
      z: proposed.z,
    };

    const newItems = [...items, duplicated];
    setItems(newItems);
    pushHistory(newItems);
    setSelectedItemId(duplicated.id);
  };

  const handleDeleteItem = (id: string) => {
    const newItems = items.filter((it) => it.id !== id);
    setItems(newItems);
    pushHistory(newItems);
    setSelectedItemId(null);
  };

  const handleUpdateItemMaterial = (id: string, wpcColor?: string, metalColor?: string) => {
    const newItems = items.map((it) =>
      it.id === id
        ? {
            ...it,
            wpcColor: wpcColor || it.wpcColor,
            metalColor: metalColor || it.metalColor,
          }
        : it
    );
    setItems(newItems);
    pushHistory(newItems);
  };

  const handleClearCanvas = () => {
    if (window.confirm("آیا از پاک کردن تمامی ماژول‌های صحنه اطمینان دارید؟")) {
      setItems([]);
      pushHistory([]);
      setSelectedItemId(null);
    }
  };

  // Apply a custom plan shape/dimensions — keep current items, re-clamp inside new bounds
  const handleApplySpace = (newConfig: SpaceConfig) => {
    setSpaceConfig(newConfig);
    const reClampedItems = items.map((it) => {
      const clamped = clampItemToPlan(it.x, it.z, it.width, it.depth, newConfig, it.rotation);
      return { ...it, x: clamped.x, z: clamped.z };
    });
    setItems(reClampedItems);
    pushHistory(reClampedItems);
  };

  // Load a ready-made preset plan (shape + dimensions + layout items)
  const handleApplyPreset = (preset: PresetDesign) => {
    setSpaceConfig(preset.spaceConfig);
    const clampedItems = preset.items.map((it) => {
      const clamped = clampItemToPlan(it.x, it.z, it.width, it.depth, preset.spaceConfig, it.rotation);
      return { ...it, x: clamped.x, z: clamped.z };
    });
    setItems(clampedItems);
    pushHistory(clampedItems);
    setSelectedItemId(null);
  };

  // Open Save Modal with fresh screenshot
  const handleOpenSave = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.takeScreenshot();
      setScreenshotDataUrl(dataUrl);
    }
    setIsSaveModalOpen(true);
  };

  // Calculate live Bill of Materials
  const bom = calculateBillOfMaterials(spaceConfig, items);
  const selectedItem = items.find((it) => it.id === selectedItemId) || null;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans text-right select-none" dir="rtl">
      {/* 100% Full-Screen 3D Canvas Viewport */}
      <div className="absolute inset-0 w-full h-full">
        <Chekadbam3DCanvas
          ref={canvasRef}
          spaceConfig={spaceConfig}
          items={items}
          selectedItemId={selectedItemId}
          onSelectItem={setSelectedItemId}
          onUpdateItemPosition={handleUpdateItemPosition}
          lightingMode={lightingMode}
          viewMode={viewMode}
          smartSnapping={smartSnapping}
        />
      </div>

      {/* Floating Minimal Brand Badge & Exit (Top Left) */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        <Link
          href="/"
          title="بازگشت به سایت اصلی"
          className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-700/70 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 shadow-lg backdrop-blur-md transition-all"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">بازگشت</span>
        </Link>

        <div className="px-3.5 py-1.5 rounded-xl bg-slate-900/85 border border-slate-700/70 text-xs flex items-center gap-2.5 shadow-lg backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold text-white text-[11px]">چکادبام ۳D</span>
        </div>
      </div>

      {/* Floating Tools & Quick Item Selector (Top Right) */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {/* Quick Placed Item Selector Dropdown */}
        {items.length > 0 && (
          <div className="relative">
            <select
              value={selectedItemId || ""}
              onChange={(e) => setSelectedItemId(e.target.value ? e.target.value : null)}
              className="bg-slate-900/85 hover:bg-slate-900 border border-slate-700/80 text-emerald-300 font-bold rounded-xl px-3 py-1.5 text-xs shadow-lg backdrop-blur-md focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="" className="bg-slate-900 text-slate-400">
                {selectedItemId ? "انتخاب اقلام دیگر..." : `انتخاب اقلام (${items.length} عدد)`}
              </option>
              {items.map((it, idx) => (
                <option key={it.id} value={it.id} className="bg-slate-900 text-slate-200">
                  {idx + 1}. {it.name}
                </option>
              ))}
            </select>
          </div>
        )}

      </div>

      {/* Selected Item Floating Inspector Bar (Floats comfortably above bottom toolbar) */}
      <ItemInspectorBar
        selectedItem={selectedItem}
        onMoveItem={handleMoveItem}
        onRotateItem={handleRotateItem}
        onDuplicateItem={handleDuplicateItem}
        onDeleteItem={handleDeleteItem}
        onUpdateItemMaterial={handleUpdateItemMaterial}
        onDeselect={() => setSelectedItemId(null)}
      />

      {/* Main Floating Minimalist Control Dock (Bottom Center) */}
      <StudioToolbar
        onOpenPlanSpace={() => setIsPlanSpaceOpen(true)}
        onOpenProductDrawer={() => setIsProductDrawerOpen(true)}
        onOpenBOM={() => setIsBOMModalOpen(true)}
        onOpenSave={handleOpenSave}
        onOpenGuide={() => setIsGuideOpen(true)}
        onResetCamera={() => canvasRef.current?.resetCamera()}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onClearCanvas={handleClearCanvas}
        lightingMode={lightingMode}
        setLightingMode={setLightingMode}
        viewMode={viewMode}
        setViewMode={setViewMode}
        smartSnapping={smartSnapping}
        setSmartSnapping={setSmartSnapping}
        itemsCount={items.length}
      />

      {/* Modals */}
      <PlanSpaceModal
        isOpen={isPlanSpaceOpen}
        onClose={() => setIsPlanSpaceOpen(false)}
        spaceConfig={spaceConfig}
        onApplySpace={handleApplySpace}
        onApplyPreset={handleApplyPreset}
      />

      <ProductDrawer
        isOpen={isProductDrawerOpen}
        onClose={() => setIsProductDrawerOpen(false)}
        onAddProduct={handleAddProduct}
      />

      <BillOfMaterialsModal
        isOpen={isBOMModalOpen}
        onClose={() => setIsBOMModalOpen(false)}
        bom={bom}
      />

      <SaveConsultationModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        spaceConfig={spaceConfig}
        items={items}
        bom={bom}
        screenshotDataUrl={screenshotDataUrl}
      />

      <StudioGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onStartDesign={() => {
          // Plan selection comes first, then the design space — order matters
          setIsGuideOpen(false);
          setIsPlanSpaceOpen(true);
        }}
      />

    </div>
  );
}
