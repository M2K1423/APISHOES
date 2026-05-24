import { Controller, Post, Body, Get, Param } from "@nestjs/common";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  async createOrUpdate(@Body() body: any) {
    return this.usersService.upsertUser(body);
  }

  @Get()
  async getAllUsers() {
    return this.usersService.getAllUsers();
  }

  @Get(":uid")
  async getUserByUid(@Param("uid") uid: string) {
    return this.usersService.getUserByUid(uid);
  }
}
