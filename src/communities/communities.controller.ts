import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  UploadedFile,
  Param,
  Post,
  Request,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CommunitiesService } from './communities.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { CreateCommunityDto } from './dto/create-community.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { communityImageUploadOptions } from '../common/uploads/multer-options';

@Controller('communities')
export class CommunitiesController {
  constructor(
    private readonly communitiesService: CommunitiesService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('image', communityImageUploadOptions))
  async create(
    @Body() body: CreateCommunityDto,
    @Request() req,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    let imageUrl: string | null = null;

    if (image) {
      const uploadResult = await this.cloudinaryService.uploadImage(image);
      imageUrl = uploadResult.secure_url;
    }

    return this.communitiesService.createCommunity(
      req.user.userId,
      body,
      imageUrl,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  getMyCommunities(@Request() req) {
    return this.communitiesService.listMyCommunities(req.user.userId);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('discover')
  discover(@Request() req) {
    return this.communitiesService.getDiscoverData(req.user?.userId);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.communitiesService.getCommunityDetail(id, req.user?.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/join')
  join(@Param('id') id: string, @Request() req) {
    return this.communitiesService.joinCommunity(id, req.user.userId);
  }
}
