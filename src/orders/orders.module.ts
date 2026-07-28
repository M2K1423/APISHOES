import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Order, OrderSchema } from "./order.schema";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";
import { Product, ProductSchema } from "../products/product.schema";
import { RealtimeModule } from "../realtime/realtime.module";
import { CouponsModule } from "../coupons/coupons.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Product.name, schema: ProductSchema }
    ]),
    RealtimeModule,
    CouponsModule
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService]
})
export class OrdersModule {}
