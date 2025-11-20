-- CreateTable
CREATE TABLE "Genders_Table" (
    "gender_code" INTEGER NOT NULL,
    "gender_name" VARCHAR(20) NOT NULL,

    CONSTRAINT "Genders_Table_pkey" PRIMARY KEY ("gender_code")
);

-- CreateTable
CREATE TABLE "Age_Table" (
    "age_group_code" INTEGER NOT NULL,
    "age_group_name" VARCHAR(20) NOT NULL,

    CONSTRAINT "Age_Table_pkey" PRIMARY KEY ("age_group_code")
);

-- CreateTable
CREATE TABLE "Occupations_Table" (
    "occupation_code" INTEGER NOT NULL,
    "occupation_name" VARCHAR(50) NOT NULL,

    CONSTRAINT "Occupations_Table_pkey" PRIMARY KEY ("occupation_code")
);

-- CreateTable
CREATE TABLE "Accounts_Table" (
    "account_id" SERIAL NOT NULL,
    "nickname" VARCHAR(50) NOT NULL,
    "account_type" VARCHAR(10) NOT NULL,
    "store_name" VARCHAR(100),
    "introduction" TEXT,
    "gender_code" INTEGER,
    "age_group_code" INTEGER,
    "occupation_code" INTEGER,

    CONSTRAINT "Accounts_Table_pkey" PRIMARY KEY ("account_id")
);

-- CreateTable
CREATE TABLE "Locations_Table" (
    "location_id" SERIAL NOT NULL,
    "account_id" INTEGER NOT NULL,
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "opening_date" DATE NOT NULL,
    "location_name" VARCHAR(100),

    CONSTRAINT "Locations_Table_pkey" PRIMARY KEY ("location_id")
);

-- CreateTable
CREATE TABLE "Comments_Table" (
    "comment_id" SERIAL NOT NULL,
    "account_id" INTEGER NOT NULL,
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "comment_text" TEXT NOT NULL,
    "posted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comments_Table_pkey" PRIMARY KEY ("comment_id")
);

-- CreateTable
CREATE TABLE "Likes_Table" (
    "comment_id" INTEGER NOT NULL,
    "account_id" INTEGER NOT NULL,
    "liked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Likes_Table_pkey" PRIMARY KEY ("comment_id","account_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Accounts_Table_nickname_key" ON "Accounts_Table"("nickname");

-- AddForeignKey
ALTER TABLE "Accounts_Table" ADD CONSTRAINT "Accounts_Table_gender_code_fkey" FOREIGN KEY ("gender_code") REFERENCES "Genders_Table"("gender_code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Accounts_Table" ADD CONSTRAINT "Accounts_Table_age_group_code_fkey" FOREIGN KEY ("age_group_code") REFERENCES "Age_Table"("age_group_code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Accounts_Table" ADD CONSTRAINT "Accounts_Table_occupation_code_fkey" FOREIGN KEY ("occupation_code") REFERENCES "Occupations_Table"("occupation_code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Locations_Table" ADD CONSTRAINT "Locations_Table_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Accounts_Table"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comments_Table" ADD CONSTRAINT "Comments_Table_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Accounts_Table"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Likes_Table" ADD CONSTRAINT "Likes_Table_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "Comments_Table"("comment_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Likes_Table" ADD CONSTRAINT "Likes_Table_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Accounts_Table"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;
