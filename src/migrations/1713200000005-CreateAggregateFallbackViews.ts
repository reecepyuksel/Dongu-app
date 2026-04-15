import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAggregateFallbackViews1713200000005 implements MigrationInterface {
  name = 'CreateAggregateFallbackViews1713200000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE MATERIALIZED VIEW IF NOT EXISTS message_event_hourly AS
      SELECT
        date_trunc('hour', created_at) AS bucket,
        event_type,
        COUNT(*)::bigint AS total
      FROM message_event
      GROUP BY bucket, event_type
      WITH NO DATA;
    `);

    await queryRunner.query(`
      CREATE MATERIALIZED VIEW IF NOT EXISTS item_view_event_daily AS
      SELECT
        date_trunc('day', created_at) AS bucket,
        item_id,
        COUNT(*)::bigint AS total
      FROM item_view_event
      GROUP BY bucket, item_id
      WITH NO DATA;
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
