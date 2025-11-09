import { HttpException } from '@nestjs/common';

export class TokenExpiredException extends HttpException {
  constructor() {
    super(
      {
        statusCode: 419,
        error: 'TokenExpired',
        message: 'Access token has expired',
      },
      419, // ✅ no need for HttpStatus.from()
    );
  }
}
