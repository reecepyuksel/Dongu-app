import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProjectionAndRetryTables1713200000003 implements MigrationInterface {
  name = 'CreateProjectionAndRetryTables1713200000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS notification_unread_projection (
        user_id UUID PRIMARY KEY,
        unread_count INT NOT NULL DEFAULT 0,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS leaderboard_snapshot (
        user_id UUID PRIMARY KEY,
        rank INT NOT NULL,
        full_name TEXT NOT NULL,
        avatar_url TEXT,
        karma_point INT NOT NULL DEFAULT 0,
        badges JSONB,
        last_karma_event_at TIMESTAMPTZ,
        snapshot_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_leaderboard_snapshot_rank
      ON leaderboard_snapshot (rank ASC);
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS event_retry_queue (
        id BIGSERIAL PRIMARY KEY,
        target_table TEXT NOT NULL,
        payload JSONB NOT NULL,
        retry_count INT NOT NULL DEFAULT 0,
        next_retry_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        last_error TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_event_retry_queue_due
      ON event_retry_queue (next_retry_at ASC, retry_count ASC);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_event_retry_queue_due;`);
    await queryRunner.query(`DROP TABLE IF EXISTS event_retry_queue;`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_leaderboard_snapshot_rank;`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS leaderboard_snapshot;`);
    await queryRunner.query(
      `DROP TABLE IF EXISTS notification_unread_projection;`,
    );
  }
}
