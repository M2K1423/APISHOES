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

  @Prop({ default: "" })
  oldPrice!: string;

  @Prop({ default: "" })
  discount!: string;

  @Prop({ default: "" })
  promotion!: string;

  @Prop({ default: 0 })
  rating!: number;

  @Prop({ default: 0 })
  reviewCount!: number;

  @Prop({ default: 0 })
  sold!: number;

  @Prop({ type: [String], default: [] })
  colors!: string[];
}

export const ProductSchema = SchemaFactory.createForClass(Product);