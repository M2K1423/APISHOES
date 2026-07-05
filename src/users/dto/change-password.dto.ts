import { IsString, IsNotEmpty, MinLength } from "class-validator";

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: "Mật khẩu không được để trống" })
  @MinLength(6, { message: "Mật khẩu phải có ít nhất 6 ký tự" })
  password!: string;
}
