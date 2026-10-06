import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { designs } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const designId = parseInt(id, 10);
    if (isNaN(designId)) {
      return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 });
    }

    const [found] = await db.select().from(designs).where(eq(designs.id, designId));
    if (!found) {
      return NextResponse.json({ success: false, error: "Design not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, design: found });
  } catch (error: any) {
    console.error("Error fetching single design:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const designId = parseInt(id, 10);
    if (isNaN(designId)) {
      return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 });
    }

    const body = await req.json();
    const updateData: any = { updatedAt: new Date() };

    if (body.status !== undefined) updateData.status = body.status;
    if (body.expertNotes !== undefined) updateData.expertNotes = body.expertNotes;
    if (body.assignedExpert !== undefined) updateData.assignedExpert = body.assignedExpert;
    if (body.title !== undefined) updateData.title = body.title;
    if (body.layoutData !== undefined) updateData.layoutData = body.layoutData;

    const [updated] = await db
      .update(designs)
      .set(updateData)
      .where(eq(designs.id, designId))
      .returning();

    return NextResponse.json({ success: true, design: updated });
  } catch (error: any) {
    console.error("Error updating design:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
