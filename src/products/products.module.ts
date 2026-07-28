import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ProductsController } from "./products.controller";
import { ProductsService } from "./products.service";
import { Product, ProductSchema } from "./product.schema";
import { Order, OrderSchema } from "../orders/order.schema";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [
    NotificationsModule,
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: Order.name, schema: OrderSchema }
    ])
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService, MongooseModule]
})
export class ProductsModule {}
