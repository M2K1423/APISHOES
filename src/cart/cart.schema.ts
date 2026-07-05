import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ _id: false })
export class CartItem {
  @Prop({ required: true })
  productId!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  brand!: string;

  @Prop({ required: true })
  price!: string;

  @Prop()
  oldPrice?: string;

  @Prop()
  image?: string;

  @Prop({ required: true })
  size!: string;

  @Prop()
  color?: string;

  @Prop({ required: true, default: 1 })
  quantity!: number;
}

@Schema({ timestamps: true })
export class Cart extends Document {
  @Prop({ required: true, unique: true, index: true })
  userId!: string;

  @Prop({ type: [SchemaFactory.createForClass(CartItem)], default: [] })
  items!: CartItem[];
}

export const CartSchema = SchemaFactory.createForClass(Cart);
