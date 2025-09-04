// components/YoloUpload.tsx
"use client";
import { useState } from "react";

export default function YoloUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [resp, setResp] = useState<any>(null);

  const chatId = "123"; // derive from user/session if you have it

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setStatus("Presigning...");
    const presign = await fetch("/api/s3/presign-upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        filename: file.name,
        content_type: file.type || "image/jpeg",
      }),
    }).then(r => r.json());

    setStatus("Uploading to S3...");
    const form = new FormData();
    Object.entries(presign.fields).forEach(([k, v]) => form.append(k, v as string));
    form.append("file", file);
    const s3Res = await fetch(presign.url, { method: "POST", body: form });
    if (!s3Res.ok) throw new Error("S3 upload failed");

    // IMPORTANT: send only the key (not bytes) to YOLO
    setStatus("Calling YOLO...");
    const yolo = await fetch("/api/yolo/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, img: file.name }), // YOLO will normalize to <chat_id>/original/<file>
    }).then(r => r.json());

    setResp(yolo);
    setStatus("Done");
  }

  return (
    <form onSubmit={onSubmit}>
      <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <button type="submit" disabled={!file}>Upload & Detect</button>
      <div>{status}</div>
      {resp && <pre>{JSON.stringify(resp, null, 2)}</pre>}
    </form>
  );
}
