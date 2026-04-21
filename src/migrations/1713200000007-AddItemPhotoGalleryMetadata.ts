import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddItemPhotoGalleryMetadata1713200000007 implements MigrationInterface {
  name = 'AddItemPhotoGalleryMetadata1713200000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE item
      ADD COLUMN IF NOT EXISTS "photoGallery" JSONB NOT NULL DEFAULT '[]'::jsonb;
    `);

    await queryRunner.query(`
      UPDATE item
      SET "photoGallery" = COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'url', image_url,
              'width', NULL,
              'height', NULL,
              'photoAspectRatio', NULL
            )
          )
          FROM unnest(COALESCE(images, ARRAY[]::text[])) AS image_url
        ),
        CASE
          WHEN "imageUrl" IS NOT NULL AND "imageUrl" <> '' THEN jsonb_build_array(
            jsonb_build_object(
              'url', "imageUrl",
              'width', NULL,
              'height', NULL,
              'photoAspectRatio', NULL
            )
          )
          ELSE '[]'::jsonb
        END
      )
      WHERE "photoGallery" = '[]'::jsonb;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE item
      DROP COLUMN IF EXISTS "photoGallery";
    `);
  }
}
