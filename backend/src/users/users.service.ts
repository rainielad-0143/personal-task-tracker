import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/** Thin data-access layer for users; auth logic lives in AuthService. */
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Looks up a user by email. Emails are stored lowercased. */
  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  /** Persists a new user. Caller is responsible for hashing the password. */
  create(email: string, passwordHash: string): Promise<User> {
    return this.prisma.user.create({
      data: { email: email.toLowerCase(), passwordHash },
    });
  }
}
