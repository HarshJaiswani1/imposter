import { NextRequest } from "next/server";
import { joinRoom, toPublicRoom } from "@/lib/rooms";
import { handleApiError, noStore } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await params;
    const body = await req.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name : "";
    const { room, playerId } = await joinRoom(code, name);
    return noStore({ playerId, room: toPublicRoom(room, playerId) });
  } catch (err) {
    return handleApiError(err);
  }
}
