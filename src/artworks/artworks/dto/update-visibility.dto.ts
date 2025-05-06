import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateVisibilityDto {
  @ApiProperty({
    description: 'Starea de vizibilitate a artwork-ului',
    type: Boolean,
    example: true,
  })
  @IsBoolean()
  isVisible: boolean;
}
