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
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { FindItemsQueryDto } from './dto/find-items-query.dto';
import { Throttle } from '@nestjs/throttler';

@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @Throttle({ default: { limit: 12, ttl: 300_000 } })
  @UseInterceptors(
    FilesInterceptor('images', 5, {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const randomName = uuidv4();
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per file
    }),
  )
  async create(
    @Body() createItemDto: CreateItemDto,
    @Request() req,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    let imageUrls: string[] = [];

    if (files && files.length > 0) {
      const protocol = req.protocol;
      const host = req.get('host');
      imageUrls = files.map(
        (file) => `${protocol}://${host}/uploads/${file.filename}`,
      );
    } else {
      // Also accept single 'image' fallback or let service handle it via 'images'
      // We just pass empty array if none uploaded
    }

    return this.itemsService.create(createItemDto, req.user.userId, imageUrls);
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
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const randomName = uuidv4();
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  async confirmDelivery(
    @Param('id') id: string,
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    let proofImageUrl: string | undefined = undefined;

    if (file) {
      const protocol = req.protocol;
      const host = req.get('host');
      proofImageUrl = `${protocol}://${host}/uploads/${file.filename}`;
    }

    return this.itemsService.confirmDelivery(
      id,
      req.user.userId,
      proofImageUrl,
    );
  }
}
