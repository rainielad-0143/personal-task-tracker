import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
// Pure-JS bcrypt: the native `bcrypt` package ships a prebuilt .node binary
// that fails to load on Vercel's serverless runtime, crashing the whole
// function at import time (FUNCTION_INVOCATION_FAILED). bcryptjs is a drop-in,
// API-compatible replacement with no native dependency.
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { AuthRequestDto } from './dto/auth-request.dto';
import { JwtPayload } from './jwt.strategy';

const BCRYPT_ROUNDS = 12;

/** Public user view returned to clients — never includes the password hash. */
export interface PublicUser {
  id: string;
  email: string;
}

/** The payload returned by register + login: a token and the user it belongs to. */
export interface AuthResult {
  token: string;
  user: PublicUser;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  /** Registers a new account, or 409s if the email is already taken. */
  async register(dto: AuthRequestDto): Promise<AuthResult> {
    const existing = await this.users.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email is already registered');
    }
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.users.create(dto.email, passwordHash);
    return this.sign({ id: user.id, email: user.email });
  }

  /** Verifies credentials and issues a token, or 401s on any mismatch. */
  async login(dto: AuthRequestDto): Promise<AuthResult> {
    const user = await this.users.findByEmail(dto.email);
    // Compare even when the user is missing would be ideal to avoid timing
    // leaks; here we keep it simple and return a generic 401 either way.
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.sign({ id: user.id, email: user.email });
  }

  /** Signs a JWT for an authenticated user and packages the auth result. */
  private sign(user: PublicUser): AuthResult {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    return { token: this.jwt.sign(payload), user };
  }
}
