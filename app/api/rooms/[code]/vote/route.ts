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
    const targetIds = Array.isArray(body.targetIds)
      ? body.targetIds.filter((id: unknown): id is string => typeof id === "string")
      : [];
    const room = await castVote(code, playerId, targetIds);
    return noStore({ room: toPublicRoom(room, playerId) });
  } catch (err) {
    return handleApiError(err);
  }
}
