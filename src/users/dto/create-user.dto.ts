import { IsString, IsNotEmpty, IsEmail, IsOptional, IsUrl } from "class-validator";

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  uid!: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  displayName?: string;

  @IsUrl()
  @IsOptional()
  photoURL?: string;

  @IsString()
  @IsOptional()
  provider?: string;
}
