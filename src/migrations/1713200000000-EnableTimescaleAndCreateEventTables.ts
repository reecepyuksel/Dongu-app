import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnableTimescaleAndCreateEventTables1713200000000 implements MigrationInterface {
  name = 'EnableTimescaleAndCreateEventTables1713200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'timescaledb') THEN
          CREATE EXTENSION IF NOT EXISTS timescaledb;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS karma_ledger (
        id BIGSERIAL PRIMARY KEY,
        user_id UUID NOT NULL,
        delta INT NOT NULL,
        reason TEXT NOT NULL,
        source_id TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS notification_event (
        id BIGSERIAL PRIMARY KEY,
        user_id UUID NOT NULL,
        notification_id UUID,
        type TEXT NOT NULL,
        is_read BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS message_event (
        id BIGSERIAL PRIMARY KEY,
        message_id UUID,
        sender_id UUID,
        receiver_id UUID,
        item_id UUID,
        event_type TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS item_view_event (
        id BIGSERIAL PRIMARY KEY,
        item_id UUID NOT NULL,
        viewer_id UUID,
        source TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'timescaledb') THEN
          PERFORM create_hypertable('karma_ledger', 'created_at', if_not_exists => TRUE);
          PERFORM create_hypertable('notification_event', 'created_at', if_not_exists => TRUE);
          PERFORM create_hypertable('message_event', 'created_at', if_not_exists => TRUE);
          PERFORM create_hypertable('item_view_event', 'created_at', if_not_exists => TRUE);
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS item_view_event;`);
    await queryRunner.query(`DROP TABLE IF EXISTS message_event;`);
    await queryRunner.query(`DROP TABLE IF EXISTS notification_event;`);
    await queryRunner.query(`DROP TABLE IF EXISTS karma_ledger;`);
  }
}
