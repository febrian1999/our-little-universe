"use client";

import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useState } from "react";
import { firebaseAuth } from "@/lib/auth/firebase";

// ponytail: email link menyusul bersama /auth/action; saat ini Google saja.
const MESSAGES: Record<string, string> = {
  not_allowed: "Akun ini belum diundang. Minta tautan undangan dulu, ya.",
  invalid_invite: "Undangan tidak valid atau sudah kedaluwarsa.",
  invalid_token: "Sesi Firebase tidak sah. Coba masuk ulang.",
  forbidden: "Permintaan ditolak (origin tidak cocok).",
  bad_request: "Permintaan tidak lengkap. Coba lagi.",
};

const FIREBASE_MESSAGES: Record<string, string> = {
  "auth/popup-closed-by-user": "Jendela masuk ditutup sebelum selesai.",
  "auth/cancelled-popup-request": "Jendela masuk lain sedang terbuka.",
  "auth/operation-not-allowed":
    "Provider Google belum diaktifkan di Firebase Console.",
  "auth/unauthorized-domain":
    "Domain ini belum diizinkan di Firebase Console (Authentication → Settings → Authorized domains).",
  "auth/popup-blocked": "Popup diblokir browser. Izinkan popup lalu coba lagi.",
  "auth/network-request-failed": "Jaringan gagal. Coba lagi.",
  "auth/invalid-api-key": "NEXT_PUBLIC_FIREBASE_API_KEY salah.",
  "auth/configuration-not-found": "Firebase Auth belum dikonfigurasi.",
};

export function LoginForm({ next, invite }: { next?: string; invite?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setBusy(true);
    setError(null);
    try {
      const credential = await signInWithPopup(
        firebaseAuth(),
        new GoogleAuthProvider(),
      );
      const idToken = await credential.user.getIdToken(true);

      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idToken, next, invite }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        redirectTo?: string;
      };

      if (!response.ok) {
        setError(
          MESSAGES[data.error ?? ""] ??
            `Gagal masuk (${data.error ?? `HTTP ${response.status}`}).`,
        );
        return;
      }

      // Hard navigation: pastikan cookie sesi ikut pada request berikutnya.
      window.location.assign(data.redirectTo ?? "/");
      return;
    } catch (cause) {
      const code = (cause as { code?: string }).code ?? "";
      setError(
        FIREBASE_MESSAGES[code] ?? `Gagal masuk (${code || "tanpa kode"}).`,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={signIn}
        disabled={busy}
        className="tap flex w-full items-center justify-center rounded-full bg-accent px-6 text-base font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-neutral-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {busy ? "Membuka gerbang…" : "Masuk dengan Google"}
      </button>

      <p
        aria-live="polite"
        className="mt-3 min-h-5 text-center text-sm text-neutral-600"
      >
        {error}
      </p>
    </div>
  );
}
