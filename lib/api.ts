import { NextResponse } from "next/server";
import { RoomError } from "./rooms";

export function handleApiError(err: unknown) {
  if (err instanceof RoomError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error(err);
  return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
}

export function noStore(body: unknown, init?: number) {
  return NextResponse.json(body, {
    status: init ?? 200,
    headers: { "Cache-Control": "no-store" },
  });
}
