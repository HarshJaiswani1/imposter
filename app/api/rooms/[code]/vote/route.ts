import { NextRequest } from "next/server";
import { castVote, toPublicRoom } from "@/lib/rooms";
import { handleApiError, noStore } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await params;
    const body = await req.json().catch(() => ({}));
    const playerId = typeof body.playerId === "string" ? body.playerId : "";
    const targetId = typeof body.targetId === "string" ? body.targetId : "";
    const room = await castVote(code, playerId, targetId);
    return noStore({ room: toPublicRoom(room, playerId) });
  } catch (err) {
    return handleApiError(err);
  }
}
