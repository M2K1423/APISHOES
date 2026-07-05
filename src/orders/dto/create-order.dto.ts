import { IsString, IsNotEmpty, IsNumber, Min, ValidateNested, IsArray, IsOptional, IsEmail, IsIn } from "class-validator";
import { Type } from "class-transformer";
import { CartItemDto } from "../../cart/dto/create-cart.dto";

export class ShippingAddressDto {
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  address!: string;

  @IsString()
  @IsOptional()
  note?: string;
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items!: CartItemDto[];

  @IsNumber()
  @Min(0)
  total!: number;

  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress!: ShippingAddressDto;

  @IsString()
  @IsNotEmpty()
  @IsIn(["cod", "vnpay"])
  paymentMethod!: string;
}

export class UpdateOrderStatusDto {
  @IsString()
  @IsNotEmpty()
  status!: string;
}
