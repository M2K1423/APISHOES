import { Body, Controller, Get, Param, Post, Put, UseGuards, Req, ForbiddenException, Query } from "@nestjs/common";
import { OrdersService } from "./orders.service";
import { FirebaseAuthGuard } from "../users/auth.guard";
import { OptionalFirebaseAuthGuard } from "../users/optional-auth.guard";
import { RolesGuard } from "../users/roles.guard";
import { Roles } from "../users/roles.decorator";
import { CreateOrderDto, UpdateOrderStatusDto } from "./dto/create-order.dto";
import { UsersService } from "../users/users.service";
import { ParseObjectIdPipe } from "../common/pipes/parse-object-id.pipe";

@Controller("orders")
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly usersService: UsersService
  ) {}

  @Get("all")
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles("admin")
  getAllOrders(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
    @Query("status") status?: string
  ) {
    const pageNum = parseInt(page || "1", 10) || 1;
    const limitNum = parseInt(limit || "20", 10) || 20;
    return this.ordersService.getAllOrdersPaginated(pageNum, limitNum, search, status);
  }

  @Post("user/:userId")
  @UseGuards(OptionalFirebaseAuthGuard)
  createOrder(
    @Param("userId") userId: string,
    @Body() body: CreateOrderDto,
    @Req() req: any
  ) {
    if (req.user) {
      if (req.user.uid !== userId) {
        throw new ForbiddenException("Cannot place order for another user");
      }
    } else {
      if (!userId.startsWith("guest-") && !userId.includes("@")) {
        throw new ForbiddenException("Guest orders require a guest identifier or email");
      }
    }
    return this.ordersService.createOrder(userId, body);
  }

  @Get("user/:userId")
  @UseGuards(FirebaseAuthGuard)
  async getOrdersByUser(@Param("userId") userId: string, @Req() req: any) {
    const dbUser = await this.usersService.getUserByUid(req.user.uid);
    const isAdmin = dbUser ? dbUser.isAdmin : false;
    if (req.user.uid !== userId && !isAdmin) throw new ForbiddenException("Cannot access orders of another user");
    return this.ordersService.getOrdersByUser(userId);
  }

  @Get("user/:userId/:orderId")
  @UseGuards(FirebaseAuthGuard)
  async getOrderById(
    @Param("userId") userId: string,
    @Param("orderId", ParseObjectIdPipe) orderId: string,
    @Req() req: any
  ) {
    const dbUser = await this.usersService.getUserByUid(req.user.uid);
    const isAdmin = dbUser ? dbUser.isAdmin : false;
    if (req.user.uid !== userId && !isAdmin) throw new ForbiddenException("Cannot access order of another user");
    return this.ordersService.getOrderById(orderId, userId);
  }

  @Put(":orderId/status")
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles("admin")
  updateOrderStatus(
    @Param("orderId", ParseObjectIdPipe) orderId: string,
    @Body() body: UpdateOrderStatusDto
  ) {
    return this.ordersService.updateOrderStatus(orderId, body.status);
  }
}
