import { NextRequest } from "next/server";
import { endVote, toPublicRoom } from "@/lib/rooms";
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
    const room = await endVote(code, adminId);
    return noStore({ room: toPublicRoom(room, adminId) });
  } catch (err) {
    return handleApiError(err);
  }
}
