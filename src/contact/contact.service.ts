import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact } from './contact.entity';
import { CreateContactDto } from './dto/create-contact.dto';
import * as nodemailer from 'nodemailer';

@Injectable()
export class ContactService {
  private transporter: nodemailer.Transporter;

  constructor(
    @InjectRepository(Contact)
    private contactRepository: Repository<Contact>,
  ) {
    // Configurare transporter nodemailer
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true pentru 465, false pentru alte porturi
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async create(createContactDto: CreateContactDto): Promise<Contact> {
    const contact = this.contactRepository.create(createContactDto);

    // Salvare în baza de date
    await this.contactRepository.save(contact);

    // Trimitere email
    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: 'admin@example.com', // Schimbă cu emailul tău
        subject: 'New Contact Form Submission',
        html: `
          <h3>New Contact Message</h3>
          <p><strong>Name:</strong> ${contact.name}</p>
          <p><strong>Email:</strong> ${contact.email}</p>
          <p><strong>Message:</strong> ${contact.message}</p>
        `,
      });
    } catch (error) {
      console.error('Error sending email:', error);
      // Continuăm execuția chiar dacă email-ul nu a fost trimis
    }

    return contact;
  }
}
