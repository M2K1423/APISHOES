import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ timestamps: true })
export class Review extends Document {
  @Prop({ required: true })
  productId!: string;

  @Prop({ required: true })
  productName!: string;

  @Prop({ default: "" })
  productImage!: string;

  @Prop({ required: true })
  userId!: string;

  @Prop({ required: true })
  userName!: string;

  @Prop({ required: true, min: 1, max: 5 })
  rating!: number;

  @Prop({ required: true })
  comment!: string;

  @Prop({ type: [String], default: [] })
  imageUrls!: string[];

  @Prop({ default: true })
  isVerifiedPurchase!: boolean;

  @Prop({ default: "approved" }) // approved, pending, rejected
  status!: string;

  @Prop({ default: "" })
  adminReply!: string;

  @Prop()
  adminReplyAt?: Date;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);
