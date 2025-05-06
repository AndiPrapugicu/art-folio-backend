import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateContactDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email-ul utilizatorului',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    example: '0712345678',
    description: 'Numărul de telefon al utilizatorului',
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    example: 'Hi, you can find me and my art here',
    description: 'Mesajul de contact al utilizatorului',
    required: false,
  })
  @IsString()
  @IsOptional()
  contactMessage?: string;
}
