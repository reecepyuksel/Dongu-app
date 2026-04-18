import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { ThanksService } from './thanks.service';

@Controller('thanks')
export class ThanksController {
  constructor(private readonly thanksService: ThanksService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  createThanks(
    @Request() req,
    @Body('receiverId') receiverId: string,
    @Body('itemId') itemId: string,
    @Body('textContent') textContent: string,
  ) {
    return this.thanksService.createThanks(
      req.user.userId,
      receiverId,
      itemId,
      textContent,
    );
  }

  @Get('received/:userId')
  getReceivedThanks(@Param('userId') userId: string) {
    return this.thanksService.getReceivedThanks(userId);
  }
}
