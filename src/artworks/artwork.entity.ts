import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../users/user.entity';

@Entity()
export class Artwork {
  @ApiProperty({ example: 1, description: 'ID-ul unic al artwork-ului' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    example: 'http://example.com/image.jpg',
    description: 'URL-ul imaginii',
  })
  @Column()
  imageUrl: string;

  @ApiProperty({ example: 'Titlu Artwork', description: 'Titlul artwork-ului' })
  @Column()
  title: string;

  @ApiProperty({
    example: 'Descriere artwork',
    description: 'Descrierea artwork-ului',
  })
  @Column({ nullable: true })
  description: string;

  @ApiProperty({
    example: true,
    description: 'Starea de vizibilitate a artwork-ului',
  })
  @Column({
    type: 'boolean',
    default: true,
    nullable: false,
  })
  isVisible: boolean;

  @ApiProperty({ example: '2024-01-01', description: 'Data postării' })
  @Column({ nullable: true })
  datePosted: string;

  @ApiProperty({ example: 'Nume Artist', description: 'Numele artistului' })
  @Column({ nullable: true })
  artist: string;

  @ApiProperty({
    example: 'Illustration',
    description: 'Categoria artwork-ului',
  })
  @Column({ nullable: true })
  category: string;

  @ApiProperty({
    example: 'http://client.com',
    description: 'Link-ul către client',
  })
  @Column({ nullable: true })
  clientLink: string;

  @ApiProperty({ example: 1, description: 'ID-ul utilizatorului' })
  @Column({ nullable: true, type: 'integer' })
  userId: number | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}
