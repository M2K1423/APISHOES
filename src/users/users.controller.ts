import { Controller, Post, Body } from "@nestjs/common";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  async createOrUpdate(@Body() body: any) {
    return this.usersService.upsertUser(body);
  }
}
