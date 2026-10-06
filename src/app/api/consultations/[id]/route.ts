import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { consultationRequests } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const consultationId = parseInt(id, 10);
    if (isNaN(consultationId)) {
      return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 });
    }

    const body = await req.json();
    const updateData: any = {};
    if (body.status !== undefined) updateData.status = body.status;
    if (body.expertNotes !== undefined) updateData.expertNotes = body.expertNotes;

    const [updated] = await db
      .update(consultationRequests)
      .set(updateData)
      .where(eq(consultationRequests.id, consultationId))
      .returning();

    return NextResponse.json({ success: true, consultation: updated });
  } catch (error: any) {
    console.error("Error updating consultation:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
