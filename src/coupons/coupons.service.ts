import { Injectable, BadRequestException, OnModuleInit } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Coupon } from "./coupon.schema";
import { CreateCouponDto } from "./dto/create-coupon.dto";

@Injectable()
export class CouponsService implements OnModuleInit {
  constructor(
    @InjectModel(Coupon.name) private readonly couponModel: Model<Coupon>
  ) {}

  async onModuleInit() {
    await this.seedDefaultCoupons();
  }

  async seedDefaultCoupons() {
    try {
      const count = await this.couponModel.countDocuments();
      if (count === 0) {
        const farFuture = new Date();
        farFuture.setFullYear(farFuture.getFullYear() + 2); // Valid for 2 years

        const defaults = [
          {
            code: "MYSHOES10",
            discountType: "percentage",
            discountValue: 10,
            minOrderValue: 300000,
            maxDiscount: 100000,
            expiryDate: farFuture,
            usageLimit: 500,
            isActive: true
          },
          {
            code: "WELCOME50",
            discountType: "fixed",
            discountValue: 50000,
            minOrderValue: 500000,
            maxDiscount: 0,
            expiryDate: farFuture,
            usageLimit: 200,
            isActive: true
          },
          {
            code: "FREESHIP",
            discountType: "fixed",
            discountValue: 30000,
            minOrderValue: 200000,
            maxDiscount: 0,
            expiryDate: farFuture,
            usageLimit: 1000,
            isActive: true
          },
          {
            code: "GIAM80K",
            discountType: "fixed",
            discountValue: 80000,
            minOrderValue: 600000,
            maxDiscount: 0,
            expiryDate: farFuture,
            usageLimit: 100,
            isActive: true
          }
        ];
        await this.couponModel.insertMany(defaults);
        console.log("Seeded default coupons successfully");
      }
    } catch (err) {
      console.error("Failed to seed coupons:", err);
    }
  }

  async createCoupon(dto: CreateCouponDto): Promise<Coupon> {
    const existing = await this.couponModel.findOne({ code: dto.code.toUpperCase().trim() }).exec();
    if (existing) {
      throw new BadRequestException("Mã giảm giá này đã tồn tại.");
    }
    const coupon = new this.couponModel({
      ...dto,
      code: dto.code.toUpperCase().trim(),
      expiryDate: new Date(dto.expiryDate)
    });
    return coupon.save();
  }

  async getAllCoupons(): Promise<Coupon[]> {
    return this.couponModel.find().sort({ createdAt: -1 }).exec();
  }

  async deleteCoupon(id: string): Promise<any> {
    return this.couponModel.findByIdAndDelete(id).exec();
  }

  async validateCoupon(code: string, orderTotal: number) {
    const formattedCode = String(code).toUpperCase().trim();
    const coupon = await this.couponModel.findOne({ code: formattedCode }).exec();

    if (!coupon || !coupon.isActive) {
      throw new BadRequestException("Mã giảm giá không tồn tại hoặc đã bị vô hiệu hóa.");
    }

    const now = new Date();
    if (new Date(coupon.expiryDate).getTime() < now.getTime()) {
      throw new BadRequestException("Mã giảm giá đã hết hạn sử dụng.");
    }

    if (coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException("Mã giảm giá đã đạt tối đa giới hạn sử dụng.");
    }

    if (orderTotal < coupon.minOrderValue) {
      throw new BadRequestException(
        `Đơn hàng chưa đạt giá trị tối thiểu ${coupon.minOrderValue.toLocaleString("vi-VN")}đ để sử dụng mã này.`
      );
    }

    let discountAmount = 0;
    if (coupon.discountType === "fixed") {
      discountAmount = coupon.discountValue;
    } else {
      discountAmount = Math.round(orderTotal * (coupon.discountValue / 100));
      if (coupon.maxDiscount > 0 && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    }

    // Limit discount amount to order total
    discountAmount = Math.min(discountAmount, orderTotal);

    return {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount
    };
  }

  async useCoupon(code: string): Promise<void> {
    const formattedCode = String(code).toUpperCase().trim();
    await this.couponModel.updateOne(
      { code: formattedCode },
      { $inc: { usedCount: 1 } }
    ).exec();
  }
}
