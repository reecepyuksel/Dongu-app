import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateHighLoadIndexes1713200000001 implements MigrationInterface {
  name = 'CreateHighLoadIndexes1713200000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_notification_user_read_created
      ON notification ("userId", "isRead", "createdAt" DESC);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_message_receiver_read_created
      ON message ("receiverId", "isRead", "isDeleted", "createdAt" DESC);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_message_sender_receiver_trade_created
      ON message ("senderId", "receiverId", "tradeOfferId", "createdAt" DESC);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_message_item_trade_created
      ON message ("itemId", "tradeOfferId", "createdAt" DESC);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_giveaway_item_applied
      ON giveaway ("itemId", "appliedAt" DESC);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_giveaway_applicant_applied
      ON giveaway ("applicantId", "appliedAt" DESC);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_karma_ledger_user_created
      ON karma_ledger (user_id, created_at DESC);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_notification_event_user_created
      ON notification_event (user_id, created_at DESC);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_message_event_receiver_created
      ON message_event (receiver_id, created_at DESC);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_message_event_receiver_created;`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_notification_event_user_created;`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_karma_ledger_user_created;`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_giveaway_applicant_applied;`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS idx_giveaway_item_applied;`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_message_item_trade_created;`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_message_sender_receiver_trade_created;`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_message_receiver_read_created;`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_notification_user_read_created;`,
    );
  }
}
