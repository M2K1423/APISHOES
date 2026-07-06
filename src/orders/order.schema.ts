import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { CartItem } from "../cart/cart.schema";

@Schema({ timestamps: true })
export class Order extends Document {
  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({ type: Array, default: [] })
  items!: CartItem[];

  @Prop({ required: true })
  total!: number;

  @Prop({ required: true, default: "pending" })
  status!: string; // "pending", "processing", "shipped", "delivered", "cancelled"

  @Prop({ type: Object, required: true })
  shippingAddress!: {
    fullName: string;
    phone: string;
    email: string;
    address: string;
    note: string;
  };

  @Prop({ required: true })
  paymentMethod!: string;

  @Prop({ default: "unpaid", index: true })
  paymentStatus!: "unpaid" | "pending" | "paid" | "failed";

  @Prop({ select: false })
  paymentAccessToken?: string;

  @Prop()
  paymentTransactionNo?: string;

  @Prop()
  paymentResponseCode?: string;

  @Prop()
  paidAt?: Date;

  @Prop({
    type: [
      {
        status: { type: String, required: true },
        updatedAt: { type: Date, default: Date.now },
        updatedBy: { type: String, default: "system" },
        note: { type: String, default: "" }
      }
    ],
    default: []
  })
  statusHistory!: Array<{
    status: string;
    updatedAt: Date;
    updatedBy: string;
    note: string;
  }>;

  createdAt?: Date;
  updatedAt?: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
