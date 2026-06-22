import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import type { AuthResult, PublicUser } from './auth.service';
import { AuthRequestDto } from './dto/auth-request.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import type { AuthUser } from './jwt.strategy';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** Self-serve signup. Returns a token so the client is logged in immediately. */
  @Post('register')
  register(@Body() dto: AuthRequestDto): Promise<AuthResult> {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK) // login is not a resource creation -> 200, not 201
  login(@Body() dto: AuthRequestDto): Promise<AuthResult> {
    return this.authService.login(dto);
  }

  /** Returns the current user; lets the SPA validate a stored token on boot. */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthUser): PublicUser {
    return { id: user.id, email: user.email };
  }
}
