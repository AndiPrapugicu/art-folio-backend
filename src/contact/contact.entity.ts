import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class Contact {
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    example: 'John Doe',
    description: 'Numele persoanei care contactează',
  })
  @Column()
  name: string;

  @ApiProperty({ example: 'john@example.com', description: 'Adresa de email' })
  @Column()
  email: string;

  @ApiProperty({ example: 'Hello...', description: 'Mesajul de contact' })
  @Column('text')
  message: string;

  @CreateDateColumn()
  createdAt: Date;
}
