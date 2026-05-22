import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { CartItem } from "../cart/cart.schema";

@Schema({ timestamps: true })
export class Order extends Document {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ type: Array, default: [] })
  items: CartItem[];

  @Prop({ required: true })
  total: number;

  @Prop({ required: true, default: "pending" })
  status: string; // "pending", "processing", "shipped", "delivered", "cancelled"

  @Prop({ type: Object, required: true })
  shippingAddress: {
    fullName: string;
    phone: string;
    email: string;
    address: string;
    note: string;
  };

  @Prop({ required: true })
  paymentMethod: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
