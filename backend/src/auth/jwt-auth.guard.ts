import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Guards routes with the JWT strategy; 401s any request without a valid token. */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
