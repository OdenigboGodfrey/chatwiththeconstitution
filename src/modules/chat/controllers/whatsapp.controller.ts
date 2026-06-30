import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  Query,
  HttpCode,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { WhatsappService } from './../services/whatsapp.service';
import { ApiTags } from '@nestjs/swagger';

@Controller('webhook/whatsapp')
@ApiTags('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  // WhatsApp Webhook verification from Meta
  @Get()
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    return this.whatsappService.verifyWebhook(mode, token, challenge, res);
  }

  // Incoming messages
  @Post()
  @HttpCode(200)
  async receiveMessage(@Req() req: Request) {
    await this.whatsappService.handleIncomingMessage(req.body);
    return { status: 'ok' };
  }
}
