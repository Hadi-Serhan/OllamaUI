import { NextRequest, NextResponse } from "next/server";

const YOLO = process.env.YOLO_SERVICE!; // e.g. http://api:8080

export async function POST(req: NextRequest) {
  const { chat_id, img } = await req.json();
  if (!chat_id || !img) {
    return NextResponse.json({ error: "chat_id and img are required" }, { status: 400 });
  }
  const url = `${YOLO}/predict?chat_id=${encodeURIComponent(chat_id)}&img=${encodeURIComponent(img)}`;
  const r = await fetch(url, { method: "POST" });
  const json = await r.json();
  return NextResponse.json(json, { status: r.status });
}
