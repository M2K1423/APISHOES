import { Module } from "@nestjs/common";
import { OrdersModule } from "../orders/orders.module";
import { PaymentsController } from "./payments.controller";
import { VnpayService } from "./vnpay.service";

@Module({
  imports: [OrdersModule],
  controllers: [PaymentsController],
  providers: [VnpayService]
})
export class PaymentsModule {}
