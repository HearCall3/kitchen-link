/*
  Warnings:

  - The primary key for the `Account` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Stores` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `press_like` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `question_answer` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "Account" DROP CONSTRAINT "Account_pkey",
ALTER COLUMN "account_id" DROP DEFAULT,
ALTER COLUMN "account_id" SET DATA TYPE TEXT,
ALTER COLUMN "user_id" SET DATA TYPE TEXT,
ALTER COLUMN "store_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Account_pkey" PRIMARY KEY ("account_id");
DROP SEQUENCE "Account_account_id_seq";

-- AlterTable
ALTER TABLE "Stores" DROP CONSTRAINT "Stores_pkey",
ALTER COLUMN "store_id" DROP DEFAULT,
ALTER COLUMN "store_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Stores_pkey" PRIMARY KEY ("store_id");
DROP SEQUENCE "Stores_store_id_seq";

-- AlterTable
ALTER TABLE "Users" DROP CONSTRAINT "Users_pkey",
ALTER COLUMN "user_id" DROP DEFAULT,
ALTER COLUMN "user_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Users_pkey" PRIMARY KEY ("user_id");
DROP SEQUENCE "Users_user_id_seq";

-- AlterTable
ALTER TABLE "post_an_opinion" ALTER COLUMN "account_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "press_like" DROP CONSTRAINT "press_like_pkey",
ALTER COLUMN "account_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "press_like_pkey" PRIMARY KEY ("post_an_opinion_id", "account_id");

-- AlterTable
ALTER TABLE "question" ALTER COLUMN "store_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "question_answer" DROP CONSTRAINT "question_answer_pkey",
ALTER COLUMN "account_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "question_answer_pkey" PRIMARY KEY ("account_id", "question_id");

-- AlterTable
ALTER TABLE "store_opening_information" ALTER COLUMN "store_id" SET DATA TYPE TEXT;
