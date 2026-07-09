import * as dotenv from "dotenv";
import * as path from "node:path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

import * as admin from "firebase-admin";

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

if (projectId) {
  process.env.GCLOUD_PROJECT = projectId;
}

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      projectId: projectId || undefined,
    });
    console.log("Firebase Admin SDK initialized successfully. Project ID:", projectId);
  } catch (error) {
    console.error("Firebase Admin SDK initialization failed:", error);
  }
}

export const firebaseAdmin = admin;
