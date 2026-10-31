// Service worker minimal: cukup agar PWA bisa dipasang (Chrome butuh handler
// `fetch`). Tidak ada cache offline — isi aplikasi privat milik user, jadi
// tidak disimpan ke disk. Tambahkan cache kalau nanti benar-benar butuh offline.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
