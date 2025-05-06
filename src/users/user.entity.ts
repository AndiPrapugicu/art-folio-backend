import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Artwork } from '../artworks/artwork.entity';
import { Product } from '../shop/product.entity';
import { News } from '../news/news.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ unique: true })
  username: string;

  @Column({ nullable: true })
  bio: string;

  @Column({ nullable: true })
  profileImage: string;

  @Column({ nullable: true })
  website: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  contactMessage: string;

  @OneToMany(() => Artwork, (artwork) => artwork.user)
  artworks: Artwork[];

  @OneToMany(() => Product, (product) => product.user)
  products: Product[];

  @OneToMany(() => News, (news) => news.user)
  news: News[];
}
