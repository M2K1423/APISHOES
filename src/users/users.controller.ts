import { Controller, Post, Body, Get, Param, UseGuards, Req, ForbiddenException } from "@nestjs/common";
import { UsersService } from "./users.service";
import { FirebaseAuthGuard } from "./auth.guard";
import { RolesGuard } from "./roles.guard";
import { Roles } from "./roles.decorator";
import { CreateUserDto } from "./dto/create-user.dto";

@Controller("users")
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  @UseGuards(FirebaseAuthGuard)
  async createOrUpdate(@Body() body: CreateUserDto, @Req() req: any) {
    // Ensure user can only create/update their own profile
    if (body.uid !== req.user.uid) {
      throw new ForbiddenException("Cannot create or update profile for another user ID");
    }
    return this.usersService.upsertUser(body);
  }

  @Get()
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles("admin")
  async getAllUsers() {
    return this.usersService.getAllUsers();
  }

  @Get(":uid")
  @UseGuards(FirebaseAuthGuard)
  async getUserByUid(@Param("uid") uid: string, @Req() req: any) {
    // Check database to verify if user is admin
    const dbUser = await this.usersService.getUserByUid(req.user.uid);
    const isAdmin = dbUser ? dbUser.isAdmin : false;

    if (req.user.uid !== uid && !isAdmin) {
      throw new ForbiddenException("You do not have permission to access this user's profile");
    }
    return this.usersService.getUserByUid(uid);
  }
}
