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
    <div className="w-full">
      <button
        type="button"
        onClick={signIn}
        disabled={busy}
        className="tap group relative flex w-full items-center justify-center gap-3 rounded-full bg-white px-6 py-3 text-sm font-semibold text-neutral-700 shadow-xs ring-1 ring-neutral-200/90 transition-all duration-200 hover:-translate-y-0.5 hover:bg-neutral-50/80 hover:shadow-md hover:ring-pink-300 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-500"
      >
        {busy ? (
          <span aria-hidden className="size-4 animate-spin rounded-full border-2 border-pink-500 border-t-transparent" />
        ) : (
          <GoogleIcon className="size-5 shrink-0" />
        )}
        <span>{busy ? "Membuka gerbang…" : "Masuk dengan Google"}</span>
      </button>

      {error ? (
        <div
          role="alert"
          aria-live="polite"
          className="mt-4 rounded-2xl bg-rose-50/90 p-3 text-center text-xs leading-relaxed text-rose-600 ring-1 ring-rose-200/70"
        >
          {error}
        </div>
      ) : (
        <p className="mt-4 text-center text-xs text-neutral-400">
          Akses khusus akun yang sudah terdaftar
        </p>
      )}
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}
