import {
  IsString,
  IsOptional,
  IsDateString,
  IsNotEmpty,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ItemSelectionType {
  LOTTERY = 'lottery',
  MANUAL = 'manual',
}

export enum ShareType {
  FREE = 'donation',
  TRADE = 'exchange',
}

export class CreateItemDto {
  @ApiProperty({ example: 'Eski Bisiklet', description: 'İlan başlığı' })
  @IsString()
  title: string;

  @ApiProperty({
    example: 'Biraz paslı ama çalışıyor.',
    description: 'İlan açıklaması',
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ example: 'İstanbul', description: 'Şehir' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'Kadıköy', description: 'İlçe' })
  @IsString()
  @IsNotEmpty()
  district: string;

  @ApiPropertyOptional({
    example: 'Caferağa Mah.',
    description: 'Mahalle (Opsiyonel)',
  })
  @IsString()
  @IsOptional()
  neighborhood?: string;

  @ApiPropertyOptional({ example: 'Bisiklet', description: 'İlan kategorisi' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/image.jpg',
    description: 'İlan görsel URL',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({
    example: '2024-12-31T23:59:59Z',
    description: 'Çekiliş tarihi (ISO 8601) - Manuel seçimde opsiyonel',
  })
  @IsOptional()
  @IsDateString()
  drawDate?: string; // ISO 8601 date string

  @ApiPropertyOptional({
    example: ['pickup', 'shipping_buyer'],
    description: 'Teslimat yöntemleri',
  })
  @IsOptional()
  deliveryMethods?: string[] | string; // FormData ile gelirken string veya array olabilir

  @ApiPropertyOptional({
    enum: ItemSelectionType,
    example: 'lottery',
    description: 'Kazanan belirleme yöntemi',
  })
  @IsOptional()
  @IsEnum(ItemSelectionType)
  selectionType?: ItemSelectionType;

  @ApiPropertyOptional({
    enum: ShareType,
    example: 'free',
    description: 'Paylaşım Türü (Ücretsiz Bağış / Takas)',
  })
  @IsOptional()
  @IsEnum(ShareType)
  shareType?: ShareType;

  @ApiPropertyOptional({
    example: 'Takas için kitap kabul ediyorum.',
    description: 'Takas tercihleri',
  })
  @IsOptional()
  @IsString()
  tradePreferences?: string;
}
