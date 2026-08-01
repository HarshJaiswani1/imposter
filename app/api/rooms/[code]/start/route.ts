import { NextRequest } from "next/server";
import { startRound, toPublicRoom } from "@/lib/rooms";
import { handleApiError, noStore } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await params;
    const body = await req.json().catch(() => ({}));
    const adminId = typeof body.playerId === "string" ? body.playerId : "";
    const category = typeof body.category === "string" ? body.category : "";
    const adminPlaying = body.adminPlaying !== false;
    const imposterCount = typeof body.imposterCount === "number" ? body.imposterCount : 1;
    const room = await startRound(code, adminId, category, adminPlaying, imposterCount);
    return noStore({ room: toPublicRoom(room, adminId) });
  } catch (err) {
    return handleApiError(err);
  }
}
