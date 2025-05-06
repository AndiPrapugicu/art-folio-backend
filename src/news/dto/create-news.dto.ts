import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateNewsDto {
  @ApiProperty({ example: 'New Exhibition Opening' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 'Join us for the opening of...' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  excerpt: string;

  @ApiProperty({ example: 'Full content of the news article...' })
  @IsNotEmpty()
  @IsString()
  content: string;
}
