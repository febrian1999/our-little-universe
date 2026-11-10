"use client";

import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useState } from "react";
import { firebaseAuth } from "@/lib/auth/firebase";

const MESSAGES: Record<string, string> = {
  already_allowed: "Email ini sudah punya akses. Coba masuk lagi.",
  already_pending: "Permintaan sudah dikirim. Tunggu keputusan pemilik.",
  forbidden: "Permintaan ditolak (origin tidak cocok).",
  invalid_token: "Sesi Firebase tidak sah. Coba lagi.",
  bad_request: "Data tidak lengkap. Coba lagi.",
};

export function RequestAccessForm() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(formData: FormData) {
    setBusy(true);
    setError(null);
    try {
      const credential = await signInWithPopup(
        firebaseAuth(),
        new GoogleAuthProvider(),
      );
      const idToken = await credential.user.getIdToken(true);

      const response = await fetch("/api/auth/request-access", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          idToken,
          name: String(formData.get("name") ?? ""),
          message: String(formData.get("message") ?? ""),
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        setError(
          MESSAGES[data.error ?? ""] ??
            `Gagal mengirim (${data.error ?? `HTTP ${response.status}`}).`,
        );
        return;
      }
      setDone(true);
    } catch (cause) {
      const code = (cause as { code?: string }).code ?? "";
      setError(`Gagal masuk (${code || "tanpa kode"}).`);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <p
        role="status"
        className="w-full rounded-2xl bg-emerald-50/90 p-4 text-center text-sm leading-relaxed text-emerald-700 ring-1 ring-emerald-200/70"
      >
        Permintaan terkirim. Pemilik akan meninjau, lalu kamu bisa masuk setelah
        disetujui.
      </p>
    );
  }

  return (
    <form action={submit} className="w-full space-y-3 text-left">
      <label className="block text-sm text-neutral-700">
        <span className="mb-1 block font-medium">Nama panggilan</span>
        <input
          name="name"
          required
          maxLength={80}
          className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-base text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-500"
        />
      </label>
      <label className="block text-sm text-neutral-700">
        <span className="mb-1 block font-medium">Pesan (opsional)</span>
        <textarea
          name="message"
          rows={3}
          maxLength={500}
          className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-base text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-500"
        />
      </label>

      <button
        type="submit"
        disabled={busy}
        className="tap w-full rounded-full bg-white px-6 py-3 text-sm font-semibold text-neutral-700 shadow-xs ring-1 ring-neutral-200/90 transition-all duration-200 hover:-translate-y-0.5 hover:bg-neutral-50/80 hover:shadow-md hover:ring-pink-300 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-500"
      >
        {busy ? "Mengirim…" : "Masuk dengan Google & minta akses"}
      </button>

      {error ? (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-2xl bg-rose-50/90 p-3 text-center text-xs leading-relaxed text-rose-600 ring-1 ring-rose-200/70"
        >
          {error}
        </div>
      ) : null}
    </form>
  );
}
