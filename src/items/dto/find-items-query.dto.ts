import { IsOptional, IsInt, Min, Max, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ItemPostType, ShareType } from './create-item.dto';

export class FindItemsQueryDto {
  @ApiPropertyOptional({ example: 1, description: 'Sayfa numarası (1-indexed)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, description: 'Sayfa başına kayıt (max 50)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;

  @ApiPropertyOptional({ example: 'İstanbul', description: 'Virgülle ayrılmış şehir filtresi' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Kadıköy', description: 'Virgülle ayrılmış ilçe filtresi' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ example: 'Elektronik', description: 'Virgülle ayrılmış kategori filtresi' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ enum: ShareType })
  @IsOptional()
  @IsEnum(ShareType)
  shareType?: string;

  @ApiPropertyOptional({ enum: ItemPostType })
  @IsOptional()
  @IsEnum(ItemPostType)
  postType?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
