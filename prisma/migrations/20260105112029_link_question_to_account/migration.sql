/*
  1. account_id を一旦「NULL許可」で作成します
*/
ALTER TABLE "question" ADD COLUMN "account_id" TEXT;

/*
  2. Accountテーブルと結合して、store_id が一致する account_id をコピーします
*/
UPDATE "question"
SET "account_id" = (
    SELECT "account_id" 
    FROM "Account" 
    WHERE "Account"."store_id" = "question"."store_id"
);

/*
  3. データが入ったので、account_id を「NULL不可（NOT NULL）」に変更します
*/
ALTER TABLE "question" ALTER COLUMN "account_id" SET NOT NULL;

/*
  4. 古い store_id カラムを削除します
*/
ALTER TABLE "question" DROP COLUMN "store_id";

/*
  5. 外部キー制約などの追加（Prismaが生成した他のSQLがあればここに追加）
*/
-- ※ relationMode = "prisma" の場合は外部キー制約のSQLは不要です