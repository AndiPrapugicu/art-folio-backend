import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ShopService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async createProduct(
    userId: number,
    createProductDto: CreateProductDto,
    imageUrl?: string,
  ): Promise<Product> {
    console.log('Creating product with image:', imageUrl);

    const product = this.productRepository.create({
      ...createProductDto,
      userId,
      image: imageUrl,
    });

    const savedProduct = await this.productRepository.save(product);
    console.log('Saved product:', savedProduct);
    return savedProduct;
  }

  async getProductsByUser(username: string): Promise<Product[]> {
    const products = await this.productRepository.find({
      where: { user: { username } },
      order: { createdAt: 'DESC' },
    });

    console.log('Retrieved products:', products);
    return products;
  }

  async deleteProduct(productId: number, userId: number): Promise<void> {
    const product = await this.productRepository.findOne({
      where: { id: productId, userId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.productRepository.remove(product);
  }
}
