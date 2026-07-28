import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ timestamps: true })
export class Coupon extends Document {
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  code!: string;

  @Prop({ required: true, enum: ["percentage", "fixed"] })
  discountType!: "percentage" | "fixed";

  @Prop({ required: true })
  discountValue!: number; // Percentage value (e.g. 10) or Cash value (e.g. 50000)

  @Prop({ default: 0 })
  minOrderValue!: number; // Minimum order value required to apply coupon

  @Prop({ default: 0 })
  maxDiscount!: number; // Capped discount amount for percentage coupons (0 means unlimited)

  @Prop({ required: true })
  expiryDate!: Date;

  @Prop({ default: 100 })
  usageLimit!: number;

  @Prop({ default: 0 })
  usedCount!: number;

  @Prop({ default: true })
  isActive!: boolean;
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);
