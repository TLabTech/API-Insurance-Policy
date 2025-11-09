import { Controller, Get, Res, StreamableFile } from '@nestjs/common';
import express from 'express';
import { createReadStream } from 'fs';
import { join } from 'path';

@Controller('file')
export class FileController {
  @Get()
  getFile(@Res({ passthrough: true }) res: express.Response) {
    const file = createReadStream(
      join(
        process.cwd(),
        'uploads',
        '61b1c9ae-c580-4d77-9752-37a9cf325dee.png',
      ),
    );
    res.set({
      'Content-Type': 'image/png',
    });
    return new StreamableFile(file);
  }
}
