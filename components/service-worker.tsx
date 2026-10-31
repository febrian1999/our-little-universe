"use client";

import { useEffect } from "react";

/** Mendaftarkan `/sw.js` supaya aplikasi bisa dipasang ke layar utama. */
export function ServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Gagal daftar tidak boleh mengganggu pemakaian; PWA hanya bonus.
    });
  }, []);

  return null;
}
