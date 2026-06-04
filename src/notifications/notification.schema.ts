import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({ timestamps: true })
export class Notification {
  @Prop({ required: true })
  type!: string;

  @Prop({ required: true })
  productId!: string;

  @Prop({ required: true })
  productName!: string;

  @Prop({ default: "" })
  productBrand!: string;

  @Prop({ default: "" })
  productPrice!: string;

  @Prop({ type: String, default: null })
  productImageUrl!: string | null;

  @Prop({ required: true })
  message!: string;

  createdAt!: Date;
  updatedAt!: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
