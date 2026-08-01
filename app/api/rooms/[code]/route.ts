import { NextRequest } from "next/server";
import { getRoom, toPublicRoom } from "@/lib/rooms";
import { handleApiError, noStore } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await params;
    const playerId = req.nextUrl.searchParams.get("playerId");
    const room = await getRoom(code);
    return noStore(toPublicRoom(room, playerId));
  } catch (err) {
    return handleApiError(err);
  }
}
