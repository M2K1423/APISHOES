import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { firebaseAdmin } from "../firebase-admin.config";

@Injectable()
export class OptionalFirebaseAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      // Allow guest users without token
      return true;
    }

    const [type, token] = authHeader.split(" ");

    if (type !== "Bearer" || !token) {
      throw new UnauthorizedException("Invalid authorization header format. Use 'Bearer <token>'");
    }

    try {
      const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
      request.user = decodedToken;
      return true;
    } catch (error: any) {
      const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      if (!projectId) {
        // Skip validation if Firebase project ID is missing in dev mode (for fallback purposes)
        console.warn("Firebase ID token verification failed due to missing Project ID.");
        return true;
      }
      throw new UnauthorizedException(`Authentication failed: ${error.message}`);
    }
  }
}
