"use client";

import Image from "next/image";
import { useState } from "react";
import { cloudinaryLoader } from "@/lib/media/image-loader";
import { PHOTO_MAX_BYTES } from "@/lib/media/photo-limits";

type Ticket = {
  cloudName: string;
  apiKey: string;
  uploadUrl: string;
  signature: string;
  params: Record<string, string | number>;
};

type Uploaded = { publicId: string; width: number | null; height: number | null };

/**
 * Unggah langsung browser → Cloudinary dengan tiket bertanda tangan server
 * (PRD §5.4). Hasilnya mengisi field tersembunyi milik form induk.
 */
export function PhotoUpload({ chapterId }: { chapterId: string }) {
  const [uploaded, setUploaded] = useState<Uploaded | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > PHOTO_MAX_BYTES) {
      setUploaded(null);
      setStatus("Foto lebih dari 25 MB. Kecilkan dulu, ya.");
      return;
    }

    setStatus("Mengunggah…");
    setUploaded(null);

    const signResponse = await fetch("/api/upload/sign", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chapterId }),
    });
    if (!signResponse.ok) {
      const body = await signResponse.json().catch(() => ({}));
      setStatus(body.error ?? "Gagal meminta tiket unggah");
      return;
    }

    const ticket: Ticket = await signResponse.json();
    const body = new FormData();
    body.append("file", file);
    body.append("api_key", ticket.apiKey);
    for (const [key, value] of Object.entries(ticket.params)) {
      body.append(key, String(value));
    }
    body.append("signature", ticket.signature);

    const response = await fetch(ticket.uploadUrl, { method: "POST", body });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setStatus(payload.error?.message ?? "Cloudinary menolak berkas ini");
      return;
    }

    const result = await response.json();
    setUploaded({
      publicId: result.public_id,
      width: result.width ?? null,
      height: result.height ?? null,
    });
    setStatus("Foto siap disimpan.");
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
      <label className="text-sm text-neutral-700">
        <span className="mb-1 block font-medium">Foto</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          onChange={onFile}
          className="w-full text-sm"
        />
      </label>

      {status ? (
        <p className="mt-2 text-sm text-neutral-600" role="status">
          {status}
        </p>
      ) : null}

      {uploaded ? (
        <>
          <input type="hidden" name="publicId" value={uploaded.publicId} />
          <input
            type="hidden"
            name="width"
            value={uploaded.width ? String(uploaded.width) : ""}
          />
          <input
            type="hidden"
            name="height"
            value={uploaded.height ? String(uploaded.height) : ""}
          />
          <Image
            loader={cloudinaryLoader}
            src={uploaded.publicId}
            alt="Pratinjau foto"
            width={240}
            height={240}
            className="mt-3 size-40 rounded-xl object-cover"
          />
        </>
      ) : null}
    </div>
  );
}
