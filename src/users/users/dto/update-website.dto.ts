import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUrl, IsOptional } from 'class-validator';

export class UpdateWebsiteDto {
  @ApiProperty({
    description: 'The user website URL',
    example: 'https://github.com/username',
    required: true,
  })
  @IsString()
  @IsUrl({}, { message: 'Please provide a valid URL' })
  website: string;
}
