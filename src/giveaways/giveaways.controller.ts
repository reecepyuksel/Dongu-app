import {
  Controller,
  Post,
  Param,
  UseGuards,
  Request,
  Get,
  Body,
  Delete,
} from '@nestjs/common';
import { GiveawaysService } from './giveaways.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('giveaways')
@ApiBearerAuth()
@Controller('giveaways')
export class GiveawaysController {
  constructor(private readonly giveawaysService: GiveawaysService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get(':itemId/check-application')
  checkApplication(@Param('itemId') itemId: string, @Request() req) {
    return this.giveawaysService.checkApplication(itemId, req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':itemId/apply')
  apply(@Param('itemId') itemId: string, @Request() req) {
    return this.giveawaysService.apply(itemId, req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':itemId/applicants')
  getApplicants(@Param('itemId') itemId: string, @Request() req) {
    return this.giveawaysService.getApplicants(itemId, req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':itemId/select-winner')
  selectWinner(
    @Param('itemId') itemId: string,
    @Body() body: { userId?: string; random?: boolean }, // 'random' matches typical json, method uses 'isRandom'
    @Request() req,
  ) {
    return this.giveawaysService.selectWinner(
      itemId,
      req.user.userId,
      body.userId,
      body.random,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':itemId')
  remove(@Param('itemId') itemId: string, @Request() req) {
    return this.giveawaysService.remove(itemId, req.user.userId);
  }
}
