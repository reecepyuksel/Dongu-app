import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEventIdempotencyColumns1713200000002 implements MigrationInterface {
  name = 'AddEventIdempotencyColumns1713200000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE karma_ledger
      ADD COLUMN IF NOT EXISTS idempotency_key TEXT;
    `);
    await queryRunner.query(`
      ALTER TABLE notification_event
      ADD COLUMN IF NOT EXISTS source_id TEXT;
    `);
    await queryRunner.query(`
      ALTER TABLE notification_event
      ADD COLUMN IF NOT EXISTS idempotency_key TEXT;
    `);
    await queryRunner.query(`
      ALTER TABLE message_event
      ADD COLUMN IF NOT EXISTS source_id TEXT;
    `);
    await queryRunner.query(`
      ALTER TABLE message_event
      ADD COLUMN IF NOT EXISTS idempotency_key TEXT;
    `);
    await queryRunner.query(`
      ALTER TABLE item_view_event
      ADD COLUMN IF NOT EXISTS source_id TEXT;
    `);
    await queryRunner.query(`
      ALTER TABLE item_view_event
      ADD COLUMN IF NOT EXISTS idempotency_key TEXT;
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_karma_ledger_idempotency_key
      ON karma_ledger (idempotency_key)
      WHERE idempotency_key IS NOT NULL;
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_event_idempotency_key
      ON notification_event (idempotency_key)
      WHERE idempotency_key IS NOT NULL;
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_message_event_idempotency_key
      ON message_event (idempotency_key)
      WHERE idempotency_key IS NOT NULL;
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_item_view_event_idempotency_key
      ON item_view_event (idempotency_key)
      WHERE idempotency_key IS NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_item_view_event_idempotency_key;`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_message_event_idempotency_key;`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_notification_event_idempotency_key;`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_karma_ledger_idempotency_key;`,
    );

    await queryRunner.query(`
      ALTER TABLE item_view_event
      DROP COLUMN IF EXISTS idempotency_key;
    `);
    await queryRunner.query(`
      ALTER TABLE item_view_event
      DROP COLUMN IF EXISTS source_id;
    `);
    await queryRunner.query(`
      ALTER TABLE message_event
      DROP COLUMN IF EXISTS idempotency_key;
    `);
    await queryRunner.query(`
      ALTER TABLE message_event
      DROP COLUMN IF EXISTS source_id;
    `);
    await queryRunner.query(`
      ALTER TABLE notification_event
      DROP COLUMN IF EXISTS idempotency_key;
    `);
    await queryRunner.query(`
      ALTER TABLE notification_event
      DROP COLUMN IF EXISTS source_id;
    `);
    await queryRunner.query(`
      ALTER TABLE karma_ledger
      DROP COLUMN IF EXISTS idempotency_key;
    `);
  }
}
