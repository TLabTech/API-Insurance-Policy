import {
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { RefreshToken } from './entities/refresh-token.entity';
import type { User } from '../user/user.entity';
import { jwtConstants } from './constants';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(
    loginDto: LoginDto,
  ): Promise<{ access_token: string; refresh_token: string; user: User }> {
    const { email, password } = loginDto;

    const user = await this.userService.validateUserPassword(email, password);

    if (!user) {
      throw new UnprocessableEntityException('Invalid credentials');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      branchID: user.branchID,
    };

    const access_token = await this.generateAccessToken(payload);
    const refresh_token = await this.generateRefreshToken(user.id);

    return {
      access_token,
      refresh_token,
      user,
    };
  }

  async refresh(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const { refresh_token } = refreshTokenDto;

    try {
      // Verify refresh token payload
      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        refresh_token,
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        },
      );

      // Find refresh token in database
      const storedToken = await this.refreshTokenRepository.findOne({
        where: { userId: payload.sub },
        order: { createdAt: 'DESC' },
      });

      if (!storedToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Compare provided token with stored token
      const isValid = await bcrypt.compare(refresh_token, storedToken.token);
      if (!isValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Check expiry
      if (new Date() > storedToken.expiresAt) {
        await this.refreshTokenRepository.delete(storedToken.id);
        throw new UnauthorizedException('Refresh token expired');
      }

      // Load user to get email
      const user = await this.userService.findOne(payload.sub);
      if (!user) {
        await this.refreshTokenRepository.delete(storedToken.id);
        throw new UnauthorizedException('Invalid refresh token');
      }

      const newPayload: JwtPayload = {
        sub: user.id,
        email: user.email,
        branchID: user.branchID,
      };

      const access_token = await this.generateAccessToken(newPayload);
      const new_refresh_token = await this.generateRefreshToken(user.id);

      // Delete old refresh token
      await this.refreshTokenRepository.delete(storedToken.id);

      return {
        access_token,
        refresh_token: new_refresh_token,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
  async logout(userId: number): Promise<void> {
    // Delete all refresh tokens for the user
    await this.refreshTokenRepository.delete({ userId });
  }

  async generateAccessToken(payload: JwtPayload): Promise<string> {
    const secret = this.configService.get<string>('JWT_SECRET'); // Note: Changed from JWT_REFRESH_SECRET
    const expiresIn = Number(
      this.configService.get<number>('JWT_ACCESS_EXPIRATION', 3600), // Changed to ACCESS_EXPIRATION
    );

    return this.jwtService.signAsync(payload, {
      secret,
      expiresIn,
    });
  }

  async verifyToken(token: string): Promise<JwtPayload> {
    try {
      return await this.jwtService.verifyAsync(token, {
        secret: jwtConstants.secret,
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private async generateRefreshToken(userId: number): Promise<string> {
    const payload = { sub: userId };
    const secret = this.configService.get<string>('JWT_REFRESH_SECRET');
    const expiresIn = Number(
      this.configService.get<number>('JWT_REFRESH_EXPIRATION', 604800),
    ); // default 604800 seconds (7 days)

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret,
      expiresIn, // number in seconds
    });

    // Hash and store refresh token
    const hashedToken = await bcrypt.hash(refreshToken, 10);

    const expiresAt = this.calculateExpirationDate(expiresIn);

    await this.refreshTokenRepository.save({
      token: hashedToken,
      userId,
      expiresAt,
    });

    return refreshToken;
  }

  private calculateExpirationDate(expirationInSeconds: number): Date {
    const now = new Date();
    // Add seconds to current time
    now.setSeconds(now.getSeconds() + expirationInSeconds);
    return now;
  }

  async validateUser(payload: JwtPayload): Promise<User | null> {
    const user = await this.userService.findByEmail(payload.email);
    if (user && user.id === payload.sub) {
      return user;
    }
    return null;
  }
}
