import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { jwtConstants } from './constants';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import { UserModule } from '../user/user.module'; // ⬅️ Tambahkan ini

@Module({
  imports: [
    TypeOrmModule.forFeature([RefreshToken]), // ⬅️ tambahkan ini
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const expirationTime = parseInt(jwtConstants.accessTokenExpiration, 10);
        return {
          secret: configService.get<string>('JWT_SECRET', jwtConstants.secret),
          signOptions: {
            expiresIn: isNaN(expirationTime) ? 900 : expirationTime,
          },
        };
      },
      inject: [ConfigService],
    }),
    UserModule,
  ],
  providers: [AuthService, AuthGuard],
  controllers: [AuthController],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
