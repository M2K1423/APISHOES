import { IsNotEmpty, IsString } from "class-validator";

export class CreateVnpayPaymentDto {
  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @IsString()
  @IsNotEmpty()
  paymentToken!: string;
}
