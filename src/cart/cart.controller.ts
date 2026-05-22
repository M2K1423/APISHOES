import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { CartService } from "./cart.service";

@Controller("cart")
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get(":userId")
  getCart(@Param("userId") userId: string) {
    return this.cartService.getCart(userId);
  }

  @Post(":userId")
  updateCart(
    @Param("userId") userId: string,
    @Body() body: { items: any[] }
  ) {
    return this.cartService.updateCart(userId, body.items || []);
  }

  @Delete(":userId")
  clearCart(@Param("userId") userId: string) {
    return this.cartService.clearCart(userId);
  }
}
