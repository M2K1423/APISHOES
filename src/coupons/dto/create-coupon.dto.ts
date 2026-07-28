import { IsString, IsNotEmpty, IsEnum, IsNumber, Min, IsOptional, IsDateString, IsBoolean } from "class-validator";

export class CreateCouponDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsEnum(["percentage", "fixed"])
  discountType!: "percentage" | "fixed";

  @IsNumber()
  @Min(0)
  discountValue!: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  minOrderValue?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  maxDiscount?: number;

  @IsDateString()
  expiryDate!: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  usageLimit?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
