import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCommunityDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(80)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(600)
  description: string;
}
