import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'test@ornek.com',
    description: 'Kullanıcı e-posta adresi',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'sifre123', description: 'Kullanıcı şifresi' })
  @IsString()
  @MinLength(6)
  password: string;
}
