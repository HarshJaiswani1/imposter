import { NextRequest } from "next/server";
import { createRoom, toPublicRoom } from "@/lib/rooms";
import { handleApiError, noStore } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name : "";
    const { room, adminId } = await createRoom(name);
    return noStore({ playerId: adminId, room: toPublicRoom(room, adminId) });
  } catch (err) {
    return handleApiError(err);
  }
}
