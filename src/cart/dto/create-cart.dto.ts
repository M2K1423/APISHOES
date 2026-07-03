import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, ValidateNested, IsArray } from "class-validator";
import { Type } from "class-transformer";

export class CartItemDto {
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  brand!: string;

  @IsString()
  @IsNotEmpty()
  price!: string;

  @IsString()
  @IsOptional()
  oldPrice?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsString()
  @IsNotEmpty()
  size!: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsNumber()
  @Min(1)
  quantity!: number;
}

export class CreateCartDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items!: CartItemDto[];
}
