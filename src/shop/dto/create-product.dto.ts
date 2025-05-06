import { IsNotEmpty, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty({
    example: 'Artwork Name',
    description: 'The name of the product',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: 99.99,
    description: 'The price of the product',
  })
  @IsNotEmpty()
  @Transform(({ value }) => {
    const price = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(price)) {
      throw new Error('Price must be a valid number');
    }
    return price;
  })
  @Min(0)
  price: number;

  @ApiProperty({
    example: 'A beautiful artwork description',
    description: 'The description of the product',
  })
  @IsNotEmpty()
  @IsString()
  description: string;
}
