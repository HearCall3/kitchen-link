/*
  Warnings:

  - The primary key for the `opinion_tags` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `post_an_opinion` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `press_like` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `question` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `question_answer` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `store_opening_information` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "opinion_tags" DROP CONSTRAINT "opinion_tags_pkey",
ALTER COLUMN "post_an_opinion_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "opinion_tags_pkey" PRIMARY KEY ("post_an_opinion_id", "tag_id");

-- AlterTable
ALTER TABLE "post_an_opinion" DROP CONSTRAINT "post_an_opinion_pkey",
ALTER COLUMN "post_an_opinion_id" DROP DEFAULT,
ALTER COLUMN "post_an_opinion_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "post_an_opinion_pkey" PRIMARY KEY ("post_an_opinion_id");
DROP SEQUENCE "post_an_opinion_post_an_opinion_id_seq";

-- AlterTable
ALTER TABLE "press_like" DROP CONSTRAINT "press_like_pkey",
ALTER COLUMN "post_an_opinion_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "press_like_pkey" PRIMARY KEY ("post_an_opinion_id", "account_id");

-- AlterTable
ALTER TABLE "question" DROP CONSTRAINT "question_pkey",
ALTER COLUMN "question_id" DROP DEFAULT,
ALTER COLUMN "question_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "question_pkey" PRIMARY KEY ("question_id");
DROP SEQUENCE "question_question_id_seq";

-- AlterTable
ALTER TABLE "question_answer" DROP CONSTRAINT "question_answer_pkey",
ALTER COLUMN "question_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "question_answer_pkey" PRIMARY KEY ("account_id", "question_id");

-- AlterTable
ALTER TABLE "store_opening_information" DROP CONSTRAINT "store_opening_information_pkey",
ALTER COLUMN "store_opening_information_id" DROP DEFAULT,
ALTER COLUMN "store_opening_information_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "store_opening_information_pkey" PRIMARY KEY ("store_opening_information_id");
DROP SEQUENCE "store_opening_information_store_opening_information_id_seq";
