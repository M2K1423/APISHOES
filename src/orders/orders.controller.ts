import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { OrdersService } from "./orders.service";

@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post(":userId")
  createOrder(
    @Param("userId") userId: string,
    @Body() body: any
  ) {
    return this.ordersService.createOrder(userId, body);
  }

  @Get(":userId")
  getOrdersByUser(@Param("userId") userId: string) {
    return this.ordersService.getOrdersByUser(userId);
  }

  @Get(":userId/:orderId")
  getOrderById(
    @Param("userId") userId: string,
    @Param("orderId") orderId: string
  ) {
    return this.ordersService.getOrderById(orderId, userId);
  }
}
