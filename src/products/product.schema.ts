import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true, unique: true })
  id!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  brand!: string;

  @Prop({ default: "" })
  productType!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ required: true })
  price!: string;

  @Prop({ required: true })
  category!: string;

  @Prop({ type: [String], default: [] })
  imageUrls!: string[];

  @Prop({ required: true })
  oldPrice!: string;

  @Prop({ required: true })
  discount!: string;

  @Prop({ required: true })
  promotion!: string;

  @Prop({ required: true })
  rating!: number;

  @Prop({ required: true })
  reviewCount!: number;

  @Prop({ required: true })
  sold!: number;

  @Prop({ type: [String], default: [] })
  colors!: string[];
}

export const ProductSchema = SchemaFactory.createForClass(Product);