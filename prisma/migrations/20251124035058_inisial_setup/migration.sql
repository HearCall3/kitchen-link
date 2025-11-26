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
