import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateBioDto {
  @ApiProperty({
    description: 'The new bio text',
    example: 'Artist based in Romania, specializing in digital art...',
  })
  @IsString()
  @IsNotEmpty()
  bio: string;
}
