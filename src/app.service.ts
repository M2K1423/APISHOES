import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: "ok",
      service: "api-shoes",
      message: "Shoes API is running",
      debug: {
        FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || "not set",
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "not set",
        GCLOUD_PROJECT: process.env.GCLOUD_PROJECT || "not set",
        GOOGLE_CLOUD_PROJECT: process.env.GOOGLE_CLOUD_PROJECT || "not set"
      }
    };
  }
}