/*
  Warnings:

  - The primary key for the `Accounts_Table` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `account_id` on the `Accounts_Table` table. All the data in the column will be lost.
  - You are about to drop the column `account_id` on the `Comments_Table` table. All the data in the column will be lost.
  - The primary key for the `Likes_Table` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `account_id` on the `Likes_Table` table. All the data in the column will be lost.
  - You are about to drop the column `account_id` on the `Locations_Table` table. All the data in the column will be lost.
  - Added the required column `email` to the `Accounts_Table` table without a default value. This is not possible if the table is not empty.
  - Added the required column `account_email` to the `Comments_Table` table without a default value. This is not possible if the table is not empty.
  - Added the required column `account_email` to the `Likes_Table` table without a default value. This is not possible if the table is not empty.
  - Added the required column `account_email` to the `Locations_Table` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Accounts_Table" DROP CONSTRAINT "Accounts_Table_age_group_code_fkey";

-- DropForeignKey
ALTER TABLE "Accounts_Table" DROP CONSTRAINT "Accounts_Table_gender_code_fkey";

-- DropForeignKey
ALTER TABLE "Accounts_Table" DROP CONSTRAINT "Accounts_Table_occupation_code_fkey";

-- DropForeignKey
ALTER TABLE "Comments_Table" DROP CONSTRAINT "Comments_Table_account_id_fkey";

-- DropForeignKey
ALTER TABLE "Likes_Table" DROP CONSTRAINT "Likes_Table_account_id_fkey";

-- DropForeignKey
ALTER TABLE "Likes_Table" DROP CONSTRAINT "Likes_Table_comment_id_fkey";

-- DropForeignKey
ALTER TABLE "Locations_Table" DROP CONSTRAINT "Locations_Table_account_id_fkey";

-- AlterTable
ALTER TABLE "Accounts_Table" DROP CONSTRAINT "Accounts_Table_pkey",
DROP COLUMN "account_id",
ADD COLUMN     "email" VARCHAR(255) NOT NULL,
ADD CONSTRAINT "Accounts_Table_pkey" PRIMARY KEY ("email");

-- AlterTable
ALTER TABLE "Comments_Table" DROP COLUMN "account_id",
ADD COLUMN     "account_email" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Likes_Table" DROP CONSTRAINT "Likes_Table_pkey",
DROP COLUMN "account_id",
ADD COLUMN     "account_email" TEXT NOT NULL,
ADD CONSTRAINT "Likes_Table_pkey" PRIMARY KEY ("comment_id", "account_email");

-- AlterTable
ALTER TABLE "Locations_Table" DROP COLUMN "account_id",
ADD COLUMN     "account_email" TEXT NOT NULL;
