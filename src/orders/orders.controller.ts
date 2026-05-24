import { Body, Controller, Get, Param, Post, Put } from "@nestjs/common";
import { OrdersService } from "./orders.service";

@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get("all")
  getAllOrders() {
    return this.ordersService.getAllOrders();
  }

  @Post("user/:userId")
  createOrder(
    @Param("userId") userId: string,
    @Body() body: any
  ) {
    return this.ordersService.createOrder(userId, body);
  }

  @Get("user/:userId")
  getOrdersByUser(@Param("userId") userId: string) {
    return this.ordersService.getOrdersByUser(userId);
  }

  @Get("user/:userId/:orderId")
  getOrderById(
    @Param("userId") userId: string,
    @Param("orderId") orderId: string
  ) {
    return this.ordersService.getOrderById(orderId, userId);
  }

  @Put(":orderId/status")
  updateOrderStatus(
    @Param("orderId") orderId: string,
    @Body("status") status: string
  ) {
    return this.ordersService.updateOrderStatus(orderId, status);
  }
}
