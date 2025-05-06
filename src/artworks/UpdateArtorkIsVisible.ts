import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateArtworkIsVisible implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Mai întâi actualizăm toate înregistrările NULL la true
    await queryRunner.query(`
            UPDATE artwork 
            SET isVisible = true 
            WHERE isVisible IS NULL
        `);

    // Apoi modificăm coloana pentru a nu permite NULL
    await queryRunner.query(`
            ALTER TABLE artwork 
            MODIFY COLUMN isVisible boolean NOT NULL DEFAULT true
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE artwork 
            MODIFY COLUMN isVisible boolean DEFAULT true
        `);
  }
}
