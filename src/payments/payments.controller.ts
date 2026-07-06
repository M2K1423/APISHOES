import { Body, Controller, Get, Post, Query, Req } from "@nestjs/common";
import type { Request } from "express";
import { CreateVnpayPaymentDto } from "./dto/create-vnpay-payment.dto";
import { VnpayService } from "./vnpay.service";

@Controller("payments/vnpay")
export class PaymentsController {
  constructor(private readonly vnpayService: VnpayService) {}

  @Post("create")
  create(@Body() body: CreateVnpayPaymentDto, @Req() request: Request) {
    const forwarded = request.headers["x-forwarded-for"];
    const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0]) || request.ip || "127.0.0.1";
    return this.vnpayService.createPaymentUrl(body.orderId, body.paymentToken, ip.replace("::ffff:", ""));
  }

  @Get("return")
  verifyReturn(@Query() query: Record<string, unknown>) {
    return this.vnpayService.verifyAndUpdate(query);
  }

  @Get("ipn")
  async ipn(@Query() query: Record<string, unknown>) {
    try {
      const result = await this.vnpayService.verifyAndUpdate(query);
      return { RspCode: result.code, Message: result.message };
    } catch {
      return { RspCode: "99", Message: "Unknown error" };
    }
  }
}
