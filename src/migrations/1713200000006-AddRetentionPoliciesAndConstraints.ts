import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRetentionPoliciesAndConstraints1713200000006 implements MigrationInterface {
  name = 'AddRetentionPoliciesAndConstraints1713200000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Keep newest application per (itemId, applicantId) before adding unique index.
    await queryRunner.query(`
      DELETE FROM giveaway g
      USING (
        SELECT id
        FROM (
          SELECT
            id,
            ROW_NUMBER() OVER (
              PARTITION BY "itemId", "applicantId"
              ORDER BY "appliedAt" DESC, id DESC
            ) AS rn
          FROM giveaway
        ) ranked
        WHERE ranked.rn > 1
      ) dups
      WHERE g.id = dups.id;
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_giveaway_item_applicant_unique
      ON giveaway ("itemId", "applicantId");
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS event_retry_dead_letter (
        id BIGSERIAL PRIMARY KEY,
        target_table TEXT NOT NULL,
        payload JSONB NOT NULL,
        retry_count INT NOT NULL,
        last_error TEXT,
        moved_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_event_retry_dead_letter_moved_at
      ON event_retry_dead_letter (moved_at DESC);
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'timescaledb') THEN
          BEGIN
            PERFORM add_retention_policy('karma_ledger', INTERVAL '180 days', if_not_exists => TRUE);
          EXCEPTION WHEN OTHERS THEN
            NULL;
          END;

          BEGIN
            PERFORM add_retention_policy('notification_event', INTERVAL '90 days', if_not_exists => TRUE);
          EXCEPTION WHEN OTHERS THEN
            NULL;
          END;

          BEGIN
            PERFORM add_retention_policy('message_event', INTERVAL '90 days', if_not_exists => TRUE);
          EXCEPTION WHEN OTHERS THEN
            NULL;
          END;

          BEGIN
            PERFORM add_retention_policy('item_view_event', INTERVAL '60 days', if_not_exists => TRUE);
          EXCEPTION WHEN OTHERS THEN
            NULL;
          END;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'timescaledb') THEN
          BEGIN
            PERFORM remove_retention_policy('item_view_event', if_exists => TRUE);
          EXCEPTION WHEN OTHERS THEN
            NULL;
          END;

          BEGIN
            PERFORM remove_retention_policy('message_event', if_exists => TRUE);
          EXCEPTION WHEN OTHERS THEN
            NULL;
          END;

          BEGIN
            PERFORM remove_retention_policy('notification_event', if_exists => TRUE);
          EXCEPTION WHEN OTHERS THEN
            NULL;
          END;

          BEGIN
            PERFORM remove_retention_policy('karma_ledger', if_exists => TRUE);
          EXCEPTION WHEN OTHERS THEN
            NULL;
          END;
        END IF;
      END $$;
    `);

    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_event_retry_dead_letter_moved_at;`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS event_retry_dead_letter;`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_giveaway_item_applicant_unique;`,
    );
  }
}
