import { Body, Controller, Delete, Get, Param, Post, UseGuards, Req, ForbiddenException } from "@nestjs/common";
import { CartService } from "./cart.service";
import { FirebaseAuthGuard } from "../users/auth.guard";
import { CreateCartDto } from "./dto/create-cart.dto";
import { UsersService } from "../users/users.service";

@Controller("cart")
export class CartController {
  constructor(
    private readonly cartService: CartService,
    private readonly usersService: UsersService
  ) {}

  @Get(":userId")
  @UseGuards(FirebaseAuthGuard)
  async getCart(@Param("userId") userId: string, @Req() req: any) {
    const dbUser = await this.usersService.getUserByUid(req.user.uid);
    const isAdmin = dbUser ? dbUser.isAdmin : false;

    if (req.user.uid !== userId && !isAdmin) {
      throw new ForbiddenException("Cannot access another user's cart");
    }
    return this.cartService.getCart(userId);
  }

  @Post(":userId")
  @UseGuards(FirebaseAuthGuard)
  updateCart(
    @Param("userId") userId: string,
    @Body() body: CreateCartDto,
    @Req() req: any
  ) {
    if (req.user.uid !== userId) {
      throw new ForbiddenException("Cannot modify another user's cart");
    }
    return this.cartService.updateCart(userId, body.items || []);
  }

  @Delete(":userId")
  @UseGuards(FirebaseAuthGuard)
  clearCart(@Param("userId") userId: string, @Req() req: any) {
    if (req.user.uid !== userId) {
      throw new ForbiddenException("Cannot clear another user's cart");
    }
    return this.cartService.clearCart(userId);
  }
}
