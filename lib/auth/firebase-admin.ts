import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function adminApp() {
  const existing = getApps()[0];
  if (existing) return existing;

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Kredensial Firebase Admin belum diisi (lihat docs/manual-setup.md)",
    );
  }

  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

export type VerifiedProfile = {
  firebaseUid: string;
  email: string;
  name: string;
  photoUrl: string | null;
};

/** Memverifikasi ID token Firebase dan memastikan email sudah terverifikasi. */
export async function verifyIdToken(idToken: string): Promise<VerifiedProfile> {
  const decoded = await getAuth(adminApp()).verifyIdToken(idToken, true);
  const email = decoded.email;
  if (!email || !decoded.email_verified) {
    throw new Error("Email belum terverifikasi");
  }
  return {
    firebaseUid: decoded.uid,
    email: email.toLowerCase(),
    name: decoded.name?.trim() || email.split("@")[0],
    photoUrl: decoded.picture ?? null,
  };
}
