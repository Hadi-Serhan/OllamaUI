import { NextRequest, NextResponse } from "next/server";
import { S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";

const REGION = process.env.AWS_REGION!;
const BUCKET = process.env.AWS_S3_BUCKET!;
const s3 = new S3Client({ region: REGION }); // uses EC2 role in Docker on EC2
const MAX_BYTES = 10 * 1024 * 1024;

function buildKey(chatId: string, filename: string) {
  const base = filename.split(/[\\/]/).pop() || "upload.jpg";
  return `${chatId.replace(/^\/+|\/+$/g, "")}/original/${base}`;
}

export async function POST(req: NextRequest) {
  const { chat_id, filename, content_type } = await req.json();
  if (!chat_id || !filename) {
    return NextResponse.json({ error: "chat_id and filename are required" }, { status: 400 });
  }

  const Key = buildKey(chat_id, filename);
  const Fields: Record<string, string> = {};
  const Conditions: any[] = [["content-length-range", 1, MAX_BYTES]];

  if (content_type) {
    Fields["Content-Type"] = content_type;
    Conditions.push({ "Content-Type": content_type });
  }

  const presigned = await createPresignedPost(s3, {
    Bucket: BUCKET,
    Key,
    Fields,
    Conditions,
    Expires: 3600,
  });

  return NextResponse.json({ ...presigned, key: Key });
}
