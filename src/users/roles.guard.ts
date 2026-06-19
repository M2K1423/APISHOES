import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UsersService } from "./users.service";
import { ROLES_KEY } from "./roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private usersService: UsersService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // Set by FirebaseAuthGuard

    if (!user || !user.uid) {
      throw new ForbiddenException("No user found in request context");
    }

    const dbUser = await this.usersService.getUserByUid(user.uid);
    if (!dbUser) {
      throw new ForbiddenException("User does not exist in database");
    }

    // check if 'admin' is required, and verify if dbUser.isAdmin is true
    if (requiredRoles.includes("admin") && !dbUser.isAdmin) {
      throw new ForbiddenException("This action requires administrator privileges");
    }

    return true;
  }
}
