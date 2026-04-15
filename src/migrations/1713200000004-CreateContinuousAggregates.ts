import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateContinuousAggregates1713200000004 implements MigrationInterface {
  name = 'CreateContinuousAggregates1713200000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'timescaledb') THEN
          EXECUTE '
            CREATE MATERIALIZED VIEW IF NOT EXISTS message_event_hourly
            WITH (timescaledb.continuous) AS
            SELECT
              time_bucket(''1 hour'', created_at) AS bucket,
              event_type,
              COUNT(*)::bigint AS total
            FROM message_event
            GROUP BY bucket, event_type
            WITH NO DATA
          ';

          EXECUTE '
            CREATE MATERIALIZED VIEW IF NOT EXISTS item_view_event_daily
            WITH (timescaledb.continuous) AS
            SELECT
              time_bucket(''1 day'', created_at) AS bucket,
              item_id,
              COUNT(*)::bigint AS total
            FROM item_view_event
            GROUP BY bucket, item_id
            WITH NO DATA
          ';
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP MATERIALIZED VIEW IF EXISTS item_view_event_daily;`,
    );
    await queryRunner.query(
      `DROP MATERIALIZED VIEW IF EXISTS message_event_hourly;`,
    );
  }
}
