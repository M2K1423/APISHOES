import { IsString, IsNotEmpty, IsOptional, IsArray, IsNumber, Min } from "class-validator";

export class CreateProductDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  brand!: string;

  @IsString()
  @IsOptional()
  productType?: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsNotEmpty()
  price!: string;

  @IsString()
  @IsNotEmpty()
  category!: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  imageUrls?: string[];

  @IsString()
  @IsOptional()
  oldPrice?: string;

  @IsString()
  @IsOptional()
  discount?: string;

  @IsString()
  @IsOptional()
  promotion?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  rating?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  reviewCount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  sold?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  colors?: string[];
}

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  brand?: string;

  @IsString()
  @IsOptional()
  productType?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  price?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  imageUrls?: string[];

  @IsString()
  @IsOptional()
  oldPrice?: string;

  @IsString()
  @IsOptional()
  discount?: string;

  @IsString()
  @IsOptional()
  promotion?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  rating?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  reviewCount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  sold?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  colors?: string[];
}
