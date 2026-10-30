"use client";

import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { firebaseAuth } from "@/lib/auth/firebase";

// ponytail: email link menyusul bersama /auth/action; saat ini Google saja.
const MESSAGES: Record<string, string> = {
  not_allowed: "Akun ini belum diundang. Minta tautan undangan dulu, ya.",
  invalid_invite: "Undangan tidak valid atau sudah kedaluwarsa.",
  invalid_token: "Sesi Firebase tidak sah. Coba masuk ulang.",
  forbidden: "Permintaan ditolak.",
};

export function LoginForm({ next, invite }: { next?: string; invite?: string }) {
  const router = useRouter();
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
        setError(MESSAGES[data.error ?? ""] ?? "Gagal masuk. Coba lagi.");
        return;
      }

      router.replace(data.redirectTo ?? "/");
      router.refresh();
    } catch (cause) {
      const code = (cause as { code?: string }).code;
      if (code !== "auth/popup-closed-by-user" && code !== "auth/cancelled-popup-request") {
        setError("Gagal masuk dengan Google. Coba lagi.");
      }
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

      <p aria-live="polite" className="mt-3 min-h-5 text-center text-sm text-neutral-600">
        {error}
      </p>
    </div>
  );
}
