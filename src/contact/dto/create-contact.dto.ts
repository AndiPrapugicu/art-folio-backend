import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class CreateContactDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'Numele persoanei care trimite mesajul',
  })
  @IsNotEmpty({ message: 'Numele este obligatoriu' })
  @MinLength(2, { message: 'Numele trebuie să aibă cel puțin 2 caractere' })
  name: string;

  @ApiProperty({
    example: 'john@example.com',
    description: 'Adresa de email a expeditorului',
  })
  @IsEmail({}, { message: 'Adresa de email nu este validă' })
  @IsNotEmpty({ message: 'Email-ul este obligatoriu' })
  email: string;

  @ApiProperty({
    example: 'Acesta este un mesaj de test...',
    description: 'Conținutul mesajului',
  })
  @IsNotEmpty({ message: 'Mesajul este obligatoriu' })
  @MinLength(10, { message: 'Mesajul trebuie să aibă cel puțin 10 caractere' })
  message: string;
}
