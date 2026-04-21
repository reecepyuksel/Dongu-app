import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DeliveryStatus } from './entities/item.entity';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { FindItemsQueryDto } from './dto/find-items-query.dto';
import { Throttle } from '@nestjs/throttler';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import {
  deliveryProofUploadOptions,
  itemImageUploadOptions,
} from '../common/uploads/multer-options';

@Controller('items')
export class ItemsController {
  constructor(
    private readonly itemsService: ItemsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @Throttle({ default: { limit: 12, ttl: 300_000 } })
  @UseInterceptors(FilesInterceptor('images', 5, itemImageUploadOptions))
  async create(
    @Body() createItemDto: CreateItemDto,
    @Request() req,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    let photoGallery = [];

    if (files && files.length > 0) {
      const uploadResults = await Promise.all(
        files.map((file) => this.cloudinaryService.uploadImage(file)),
      );

      photoGallery = uploadResults
        .map((result) => this.cloudinaryService.toPhotoAsset(result))
        .filter((photo): photo is NonNullable<typeof photo> => Boolean(photo));
    } else {
      // Also accept single 'image' fallback or let service handle it via 'images'
      // We just pass empty array if none uploaded
    }

    return this.itemsService.create(
      createItemDto,
      req.user.userId,
      photoGallery,
    );
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  findAll(@Query() query: FindItemsQueryDto, @Request() req?) {
    return this.itemsService.findAll(query, req.user?.userId);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.itemsService.findOne(id, req.user?.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/delivery-status')
  updateDeliveryStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Request() req,
  ) {
    return this.itemsService.updateDeliveryStatus(
      id,
      status as any,
      req.user.userId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/confirm-delivery')
  @Throttle({ default: { limit: 10, ttl: 300_000 } })
  @UseInterceptors(FileInterceptor('image', deliveryProofUploadOptions))
  async confirmDelivery(
    @Param('id') id: string,
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    let proofImageUrl: string | undefined = undefined;

    if (file) {
      const uploadResult = await this.cloudinaryService.uploadImage(file);
      proofImageUrl = uploadResult?.secure_url;
    }

    return this.itemsService.confirmDelivery(
      id,
      req.user.userId,
      proofImageUrl,
    );
  }
}
