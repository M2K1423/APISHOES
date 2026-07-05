import { Controller, Post, Body, Get, Put, Delete, Param, UseGuards, Req, ForbiddenException, BadRequestException } from "@nestjs/common";
import { UsersService } from "./users.service";
import { FirebaseAuthGuard } from "./auth.guard";
import { RolesGuard } from "./roles.guard";
import { Roles } from "./roles.decorator";
import { CreateUserDto } from "./dto/create-user.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";

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

  @Put(":uid/change-password")
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles("admin")
  async changePassword(
    @Param("uid") uid: string,
    @Body() body: ChangePasswordDto
  ) {
    await this.usersService.changeUserPassword(uid, body.password);
    return { success: true, message: "Cập nhật mật khẩu thành công." };
  }

  @Put(":uid/role")
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles("admin")
  async updateRole(
    @Param("uid") uid: string,
    @Body("isAdmin") isAdmin: boolean,
    @Req() req: any
  ) {
    if (typeof isAdmin !== "boolean") {
      throw new BadRequestException("Trạng thái phân quyền phải là boolean (true/false)");
    }

    // Chống tự hạ quyền của chính mình
    if (req.user.uid === uid && !isAdmin) {
      throw new ForbiddenException("Bạn không thể tự tước quyền quản trị (Admin) của chính mình!");
    }

    return this.usersService.updateUserRole(uid, isAdmin);
  }

  @Delete(":uid")
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles("admin")
  async deleteUser(@Param("uid") uid: string, @Req() req: any) {
    // Chống tự xóa chính mình
    if (req.user.uid === uid) {
      throw new ForbiddenException("Bạn không thể tự xóa tài khoản của chính mình!");
    }
    return this.usersService.deleteUser(uid);
  }
}
