import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { join } from 'path';

@Controller()
export class AppController {
  @Get()
  getHello(@Res() res: Response) {
    const filePath = join(process.cwd(), 'static', 'ui', 'index.html');

    return res.sendFile(filePath);
  }
}
