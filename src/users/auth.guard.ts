import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { firebaseAdmin } from "../firebase-admin.config";

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException("Authorization header is missing");
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
      // In development, if Firebase project ID is missing, provide a clear error message.
      const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      if (!projectId) {
        throw new UnauthorizedException(
          "Firebase Admin is not configured. Please set FIREBASE_PROJECT_ID in the .env file."
        );
      }
      throw new UnauthorizedException(`Authentication failed: ${error.message}`);
    }
  }
}
