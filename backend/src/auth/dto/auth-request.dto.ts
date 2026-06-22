import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

/** Normalises an email to a trimmed, lowercased string for storage + lookup. */
const normalizeEmail = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

/** Shared shape for register + login: an email and a password. */
export class AuthRequestDto {
  @Transform(normalizeEmail)
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(8) // chosen default; surfaced to the user as a 400 on weak passwords
  @MaxLength(72) // bcrypt only hashes the first 72 bytes
  password!: string;
}
