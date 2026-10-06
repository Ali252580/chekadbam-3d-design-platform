"use client";

import React from "react";
import { SpaceConfig } from "@/lib/studio-types";
import { calculatePlanArea } from "@/lib/plan-boundary";

interface PlanBlueprintProps {
  presetId: string;
  spaceConfig: SpaceConfig;
  className?: string;
}

const fa = (n: number) => n.toLocaleString("fa-IR", { maximumFractionDigits: 1 });

const DIM_LINE = "#7dd3fc";
const DIM_TEXT = "#f0f9ff";

/** Rounded pill label sitting on the dimension line (line passes behind the solid pill). */
function DimPill({ x, y, text, tone = "sky" }: { x: number; y: number; text: string; tone?: "sky" | "amber" | "emerald" }) {
  const toneStyles =
    tone === "amber"
      ? { stroke: "#fbbf24", fill: "#1a1206", text: "#fde68a" }
      : tone === "emerald"
        ? { stroke: "#10b981", fill: "#052e1f", text: "#6ee7b7" }
        : { stroke: DIM_LINE, fill: "#0b1220", text: DIM_TEXT };
  const w = text.length * 7.6 + 18;
  return (
    <g>
      <rect x={x - w / 2} y={y - 10} width={w} height={20} rx={10} fill={toneStyles.fill} stroke={toneStyles.stroke} strokeWidth="1" />
      <text x={x} y={y + 4.5} fill={toneStyles.text} fontSize="11.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
        {text}
      </text>
    </g>
  );
}

/** 45° architectural tick slash at a chain node. */
function DimTick({ x, y, size = 4.5 }: { x: number; y: number; size?: number }) {
  return <line x1={x - size} y1={y + size} x2={x + size} y2={y - size} stroke={DIM_LINE} strokeWidth="1.6" strokeLinecap="round" />;
}

/**
 * Professional architectural dimension chains (metres):
 * extension lines with gap + overshoot, 45° ticks and bold pill labels —
 * the style used by modern online floor-plan tools (Floorplanner / Coohom / Rayon).
 */
function PlanDimensions({
  x1,
  x2,
  y1,
  y2,
  width,
  length,
  netArea,
}: {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
  width: number;
  length: number;
  netArea: number;
}) {
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;
  const gap = 4; // gap between wall and extension line
  const over = 6; // extension overshoot past the dimension line

  // Horizontal dim (width) above the north edge
  const hy = y1 - 16;
  // Vertical dim (length) right of the east edge — keeps clear of the frame for narrow plans
  const vx = x2 + 16;

  return (
    <g fontFamily="monospace">
      {/* ── Width chain ── */}
      <line x1={x1} y1={y1 - gap} x2={x1} y2={hy - over} stroke={DIM_LINE} strokeWidth="0.8" strokeDasharray="2 2" opacity="0.75" />
      <line x1={x2} y1={y1 - gap} x2={x2} y2={hy - over} stroke={DIM_LINE} strokeWidth="0.8" strokeDasharray="2 2" opacity="0.75" />
      <line x1={x1} y1={hy} x2={x2} y2={hy} stroke={DIM_LINE} strokeWidth="1.2" />
      <DimTick x={x1} y={hy} />
      <DimTick x={x2} y={hy} />
      <DimPill x={cx} y={hy} text={`${fa(width)} m`} />

      {/* ── Length chain ── */}
      <line x1={x2 + gap} y1={y1} x2={vx + over} y2={y1} stroke={DIM_LINE} strokeWidth="0.8" strokeDasharray="2 2" opacity="0.75" />
      <line x1={x2 + gap} y1={y2} x2={vx + over} y2={y2} stroke={DIM_LINE} strokeWidth="0.8" strokeDasharray="2 2" opacity="0.75" />
      <line x1={vx} y1={y1} x2={vx} y2={y2} stroke={DIM_LINE} strokeWidth="1.2" />
      <DimTick x={vx} y={y1} />
      <DimTick x={vx} y={y2} />
      <DimPill x={vx} y={cy} text={`${fa(length)} m`} />

      {/* ── Net area chip (bottom-right, inside) ── */}
      <g>
        <rect x={x2 - 136} y={y2 - 30} width={130} height={22} rx={11} fill="#052e1f" stroke="#10b981" strokeWidth="1.2" />
        <text x={x2 - 71} y={y2 - 15} fill="#6ee7b7" fontSize="10.5" fontWeight="bold" textAnchor="middle">
          متراژ خالص: {fa(netArea)} m²
        </text>
      </g>
    </g>
  );
}

export function PlanBlueprintThumbnail({ presetId, spaceConfig, className = "" }: PlanBlueprintProps) {
  const width = spaceConfig.width;
  const length = spaceConfig.length;
  const netArea = calculatePlanArea(spaceConfig);

  return (
    <div className={`relative w-full h-full bg-[#080d1a] overflow-hidden select-none flex items-center justify-center ${className}`}>
      <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id={`bp-grid-${presetId}`} width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#38bdf8" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#bp-grid-${presetId})`} />
      </svg>

      <svg viewBox="0 0 400 250" className="w-full h-full p-2 relative z-10" xmlns="http://www.w3.org/2000/svg">
        {presetId === "l-shaped-penthouse" && <LShapedBlueprint width={width} length={length} netArea={netArea} />}
        {presetId === "central-shaft-roof" && <CentralShaftBlueprint width={width} length={length} netArea={netArea} />}
        {presetId === "narrow-linear-balcony" && <NarrowBalconyBlueprint width={width} length={length} netArea={netArea} />}
        {presetId === "u-shaped-courtyard" && <UShapedBlueprint width={width} length={length} netArea={netArea} />}
        {(presetId === "luxury-penthouse-rect" ||
          !["l-shaped-penthouse", "central-shaft-roof", "narrow-linear-balcony", "u-shaped-courtyard"].includes(presetId)) && (
          <RectangularBlueprint width={width} length={length} netArea={netArea} />
        )}

        <g transform="translate(26, 224)">
          <circle cx="0" cy="0" r="14" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
          <polygon points="0,-11 4,4 0,1 -4,4" fill="#38bdf8" />
          <text x="0" y="-16" fill="#38bdf8" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">N</text>
        </g>
      </svg>
    </div>
  );
}

interface BlueprintProps {
  width: number;
  length: number;
  netArea: number;
}

function LShapedBlueprint({ width, length, netArea }: BlueprintProps) {
  return (
    <g>
      <path d="M 50 35 L 340 35 L 340 120 L 210 120 L 210 215 L 50 215 Z" fill="#0f1f38" stroke="#e2e8f0" strokeWidth="3.5" strokeLinejoin="miter" />
      <path d="M 54 39 L 336 39 L 336 116 L 206 116 L 206 211 L 54 211 Z" fill="#13233f" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" />
      <pattern id="wpc-deck-l" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="6" stroke="#94a3b8" strokeWidth="0.6" strokeOpacity="0.4" />
      </pattern>
      <path d="M 54 39 L 336 39 L 336 116 L 206 116 L 206 211 L 54 211 Z" fill="url(#wpc-deck-l)" />
      <rect x="65" y="48" width="90" height="90" fill="#1e293b" fillOpacity="0.8" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4 2" />
      <rect x="235" y="48" width="70" height="26" rx="2" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.2" />
      <text x="270" y="64" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle">کاناپه دو نفره</text>
      <rect x="220" y="80" width="28" height="28" rx="2" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
      <rect x="292" y="80" width="28" height="28" rx="2" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
      <rect x="252" y="82" width="36" height="24" rx="2" fill="#475569" stroke="#94a3b8" strokeWidth="1" />
      <rect x="54" y="150" width="16" height="55" fill="#15803d" stroke="#4ade80" strokeWidth="1" />
      <text x="110" y="46" fill="#38bdf8" fontSize="9" fontWeight="bold" textAnchor="middle">زون ۱: پرگولا و نشیمن</text>
      <PlanDimensions x1={50} x2={340} y1={35} y2={215} width={width} length={length} netArea={netArea} />
    </g>
  );
}

function CentralShaftBlueprint({ width, length, netArea }: BlueprintProps) {
  return (
    <g>
      <rect x="50" y="35" width="290" height="180" fill="#0f1f38" stroke="#e2e8f0" strokeWidth="3.5" />
      <rect x="54" y="39" width="282" height="172" fill="#13233f" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" />
      <rect x="150" y="85" width="90" height="80" fill="#1e293b" stroke="#e2e8f0" strokeWidth="2.5" />
      {[92, 98, 104, 110, 116, 122, 128, 134, 140, 146, 152, 158].map((y, i) => (
        <line key={i} x1="152" y1={y} x2="195" y2={y} stroke="#64748b" strokeWidth="1" />
      ))}
      <rect x="200" y="90" width="35" height="40" fill="#0f172a" stroke="#94a3b8" strokeWidth="1" />
      <text x="195" y="178" fill="#e2e8f0" fontSize="8" fontWeight="bold" textAnchor="middle">باکس پله و آسانسور</text>
      <rect x="160" y="44" width="70" height="16" rx="2" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
      <rect x="160" y="190" width="70" height="16" rx="2" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
      <rect x="135" y="90" width="10" height="70" fill="#16a34a" stroke="#86efac" strokeWidth="1" />
      <rect x="245" y="95" width="12" height="60" fill="#06b6d4" stroke="#67e8f9" strokeWidth="1" />
      <PlanDimensions x1={50} x2={340} y1={35} y2={215} width={width} length={length} netArea={netArea} />
    </g>
  );
}

function NarrowBalconyBlueprint({ width, length, netArea }: BlueprintProps) {
  return (
    <g>
      <rect x="40" y="70" width="310" height="110" fill="#0f1f38" stroke="#e2e8f0" strokeWidth="3.5" />
      <rect x="44" y="74" width="302" height="102" fill="#13233f" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" />
      <rect x="110" y="80" width="65" height="18" rx="2" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
      <text x="142" y="92" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle">نیمکت چوب‌پلاست</text>
      <rect x="195" y="78" width="85" height="20" fill="#15803d" stroke="#4ade80" strokeWidth="1" />
      <rect x="325" y="80" width="14" height="90" fill="#16a34a" stroke="#86efac" strokeWidth="1" />
      <PlanDimensions x1={40} x2={350} y1={70} y2={180} width={width} length={length} netArea={netArea} />
    </g>
  );
}

function UShapedBlueprint({ width, length, netArea }: BlueprintProps) {
  return (
    <g>
      <path d="M 45 35 L 345 35 L 345 215 L 260 215 L 260 115 L 130 115 L 130 215 L 45 215 Z" fill="#0f1f38" stroke="#e2e8f0" strokeWidth="3.5" />
      <path d="M 49 39 L 341 39 L 341 211 L 256 211 L 256 119 L 134 119 L 134 211 L 49 211 Z" fill="#13233f" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" />
      <rect x="135" y="120" width="120" height="90" fill="#15803d" fillOpacity="0.4" stroke="#22c55e" strokeWidth="1" strokeDasharray="3 3" />
      <text x="195" y="165" fill="#86efac" fontSize="9" fontWeight="bold" textAnchor="middle">حیاط میانی / چمن</text>
      <rect x="55" y="48" width="70" height="70" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="4 2" />
      <rect x="265" y="48" width="70" height="70" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="4 2" />
      <PlanDimensions x1={45} x2={345} y1={35} y2={215} width={width} length={length} netArea={netArea} />
    </g>
  );
}

function RectangularBlueprint({ width, length, netArea }: BlueprintProps) {
  return (
    <g>
      <rect x="45" y="35" width="300" height="180" fill="#0f1f38" stroke="#e2e8f0" strokeWidth="3.5" />
      <rect x="49" y="39" width="292" height="172" fill="#13233f" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" />
      <rect x="60" y="48" width="85" height="85" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4 2" />
      <rect x="240" y="48" width="55" height="18" fill="#0891b2" stroke="#22d3ee" strokeWidth="1" />
      <rect x="200" y="95" width="30" height="30" rx="3" fill="#ea580c" stroke="#f97316" strokeWidth="1" />
      <rect x="160" y="185" width="80" height="18" rx="2" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
      <rect x="315" y="80" width="18" height="60" fill="#15803d" stroke="#4ade80" strokeWidth="1" />
      <PlanDimensions x1={45} x2={345} y1={35} y2={215} width={width} length={length} netArea={netArea} />
    </g>
  );
}
