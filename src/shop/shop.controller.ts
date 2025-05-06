import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../users/jwt-auth.guard';
import { ShopService } from './shop.service';
import { CreateProductDto } from './dto/create-product.dto';
import { diskStorage } from 'multer';
import { extname } from 'path';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

@ApiTags('shop')
@Controller('shop')
@ApiBearerAuth('JWT-auth')
export class ShopController {
  constructor(private readonly shopService: ShopService) {
    // Creăm directorul pentru upload dacă nu există
    const uploadPath = join(__dirname, '..', '..', 'uploads', 'products');
    if (!existsSync(uploadPath)) {
      mkdirSync(uploadPath, { recursive: true });
    }
  }

  @Post('products')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Product created successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Artwork Name' },
        price: { type: 'number', example: 99.99 },
        description: { type: 'string', example: 'Product description' },
        image: {
          type: 'string',
          format: 'binary',
          description: 'Product image file',
        },
      },
      required: ['name', 'price', 'description'],
    },
  })
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/products',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          const filename = `${uniqueSuffix}${ext}`;
          console.log('Saving file:', filename);
          cb(null, filename);
        },
      }),
    }),
  )
  async createProduct(
    @Req() req,
    @Body() createProductDto: CreateProductDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    try {
      console.log('Received file:', file);

      const imageUrl = file ? file.filename : null;
      console.log('Image URL to save:', imageUrl);

      const product = await this.shopService.createProduct(
        req.user.sub,
        createProductDto,
        imageUrl,
      );

      return {
        success: true,
        product: {
          ...product,
          image: imageUrl ? `/uploads/products/${imageUrl}` : null,
        },
      };
    } catch (error) {
      console.error('Error creating product:', error);
      throw new Error('Could not create product: ' + error.message);
    }
  }

  @Get('products/:username')
  @ApiOperation({ summary: 'Get all products for a user' })
  @ApiResponse({
    status: 200,
    description: 'Returns all products for the specified user.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        products: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
              price: { type: 'number' },
              description: { type: 'string' },
              image: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  })
  async getProductsByUser(@Param('username') username: string) {
    try {
      const products = await this.shopService.getProductsByUser(username);
      console.log('Raw products from DB:', products);

      const mappedProducts = products.map((product) => {
        // Eliminăm /uploads/products/ din calea imaginii dacă există deja
        const imagePath = product.image
          ? product.image.startsWith('/uploads/products/')
            ? product.image
            : `/uploads/products/${product.image}`
          : null;
        console.log('Product:', product.name, 'Image path:', imagePath);

        return {
          ...product,
          image: imagePath,
        };
      });

      console.log('Mapped products:', mappedProducts);

      return {
        success: true,
        products: mappedProducts,
      };
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  @Delete('products/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a product' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  async deleteProduct(@Param('id', ParseIntPipe) id: number, @Req() req) {
    await this.shopService.deleteProduct(id, req.user.sub);
    return { success: true, message: 'Product deleted successfully' };
  }
}
