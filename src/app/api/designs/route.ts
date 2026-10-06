import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { designs } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const allDesigns = await db.select().from(designs).orderBy(desc(designs.createdAt));
    return NextResponse.json({ success: true, designs: allDesigns });
  } catch (error: any) {
    console.error("Error fetching designs:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      userName,
      userPhone,
      userEmail,
      city,
      spaceType,
      width,
      length,
      parapetHeight,
      flooringType,
      wpcColor,
      metalColor,
      layoutData,
      totalArea,
      greenArea,
      flooringArea,
      itemsCount,
      estimatedWeightKg,
      estimatedPriceMin,
      estimatedPriceMax,
      notes,
      snapshotUrl,
    } = body;

    const [newDesign] = await db
      .insert(designs)
      .values({
        title: title || `طرح سه‌بعدی ${city || "بام"}`,
        userName: userName || "کاربر مهمان",
        userPhone: userPhone || "",
        userEmail: userEmail || "",
        city: city || "تهران",
        spaceType: spaceType || "residential_roof",
        width: Number(width) || 10,
        length: Number(length) || 8,
        parapetHeight: Number(parapetHeight) || 1.1,
        flooringType: flooringType || "wpc_wood",
        wpcColor: wpcColor || "walnut",
        metalColor: metalColor || "black",
        layoutData: layoutData || [],
        totalArea: Number(totalArea) || 80,
        greenArea: Number(greenArea) || 20,
        flooringArea: Number(flooringArea) || 60,
        itemsCount: Number(itemsCount) || (Array.isArray(layoutData) ? layoutData.length : 0),
        estimatedWeightKg: Number(estimatedWeightKg) || 0,
        estimatedPriceMin: Number(estimatedPriceMin) || 0,
        estimatedPriceMax: Number(estimatedPriceMax) || 0,
        notes: notes || "",
        status: userPhone ? "درخواست ثبت‌شده" : "طرح اولیه",
        snapshotUrl: snapshotUrl || null,
        source: "panel",
      })
      .returning();

    return NextResponse.json({ success: true, design: newDesign });
  } catch (error: any) {
    console.error("Error saving design:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
