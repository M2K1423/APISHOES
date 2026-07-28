import { Controller, Post, Body, Get, Delete, Param } from "@nestjs/common";
import { CouponsService } from "./coupons.service";
import { CreateCouponDto } from "./dto/create-coupon.dto";
import { ValidateCouponDto } from "./dto/validate-coupon.dto";

@Controller("coupons")
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post()
  create(@Body() dto: CreateCouponDto) {
    return this.couponsService.createCoupon(dto);
  }

  @Get()
  findAll() {
    return this.couponsService.getAllCoupons();
  }

  @Delete(":id")
  delete(@Param("id") id: string) {
    return this.couponsService.deleteCoupon(id);
  }

  @Post("validate")
  validate(@Body() dto: ValidateCouponDto) {
    return this.couponsService.validateCoupon(dto.code, dto.orderTotal);
  }
}
