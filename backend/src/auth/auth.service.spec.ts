import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

/**
 * Unit tests for AuthService. UsersService + JwtService are mocked; bcrypt runs
 * for real so the hash/compare round-trip is genuinely exercised.
 */
describe('AuthService', () => {
  let service: AuthService;
  let users: {
    findByEmail: jest.Mock;
    findById: jest.Mock;
    create: jest.Mock;
  };
  let jwt: { sign: jest.Mock };

  beforeEach(async () => {
    users = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    };
    jwt = { sign: jest.fn().mockReturnValue('signed.jwt.token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: users },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('register', () => {
    it('hashes the password, persists the user, and returns a token', async () => {
      users.findByEmail.mockResolvedValue(null);
      users.create.mockImplementation((email: string, passwordHash: string) =>
        Promise.resolve({ id: 'u1', email, passwordHash }),
      );

      const result = await service.register({
        email: 'me@example.com',
        password: 'supersecret',
      });

      expect(result).toEqual({
        token: 'signed.jwt.token',
        user: { id: 'u1', email: 'me@example.com' },
      });

      // password is hashed, not stored in clear
      const [, storedHash] = users.create.mock.calls[0] as [string, string];
      expect(storedHash).not.toBe('supersecret');
      await expect(bcrypt.compare('supersecret', storedHash)).resolves.toBe(
        true,
      );

      // jwt carries the user id as `sub`
      expect(jwt.sign).toHaveBeenCalledWith({
        sub: 'u1',
        email: 'me@example.com',
      });
    });

    it('rejects a duplicate email with 409', async () => {
      users.findByEmail.mockResolvedValue({
        id: 'u1',
        email: 'me@example.com',
      });

      await expect(
        service.register({ email: 'me@example.com', password: 'supersecret' }),
      ).rejects.toThrow(ConflictException);
      expect(users.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('returns a token when the password matches', async () => {
      const passwordHash = await bcrypt.hash('supersecret', 4);
      users.findByEmail.mockResolvedValue({
        id: 'u1',
        email: 'me@example.com',
        passwordHash,
      });

      const result = await service.login({
        email: 'me@example.com',
        password: 'supersecret',
      });

      expect(result.token).toBe('signed.jwt.token');
      expect(result.user).toEqual({ id: 'u1', email: 'me@example.com' });
    });

    it('rejects a wrong password with 401', async () => {
      const passwordHash = await bcrypt.hash('supersecret', 4);
      users.findByEmail.mockResolvedValue({
        id: 'u1',
        email: 'me@example.com',
        passwordHash,
      });

      await expect(
        service.login({ email: 'me@example.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects an unknown email with 401', async () => {
      users.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'ghost@example.com', password: 'whatever12' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
