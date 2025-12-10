-- CreateTable
CREATE TABLE "Users" (
    "user_id" SERIAL NOT NULL,
    "nickname" VARCHAR(50) NOT NULL,
    "introduction" VARCHAR(100),
    "gender_id" INTEGER,
    "age_group_id" INTEGER,
    "occupation_id" INTEGER,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "Stores" (
    "store_id" SERIAL NOT NULL,
    "store_name" VARCHAR(50) NOT NULL,
    "store_url" VARCHAR(100),
    "introduction" VARCHAR(100),

    CONSTRAINT "Stores_pkey" PRIMARY KEY ("store_id")
);

-- CreateTable
CREATE TABLE "Account" (
    "account_id" SERIAL NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "account_type" VARCHAR(10) NOT NULL,
    "user_id" INTEGER,
    "store_id" INTEGER,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("account_id")
);

-- CreateTable
CREATE TABLE "store_opening_information" (
    "store_opening_information_id" SERIAL NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "opening_date" DATE NOT NULL,
    "location_name" VARCHAR(100),
    "store_id" INTEGER NOT NULL,

    CONSTRAINT "store_opening_information_pkey" PRIMARY KEY ("store_opening_information_id")
);

-- CreateTable
CREATE TABLE "post_an_opinion" (
    "post_an_opinion_id" SERIAL NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "comment_text" TEXT NOT NULL,
    "posted_at" TIMESTAMP(3) NOT NULL,
    "account_id" INTEGER NOT NULL,

    CONSTRAINT "post_an_opinion_pkey" PRIMARY KEY ("post_an_opinion_id")
);

-- CreateTable
CREATE TABLE "opinion_tags" (
    "post_an_opinion_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,

    CONSTRAINT "opinion_tags_pkey" PRIMARY KEY ("post_an_opinion_id","tag_id")
);

-- CreateTable
CREATE TABLE "press_like" (
    "post_an_opinion_id" INTEGER NOT NULL,
    "account_id" INTEGER NOT NULL,
    "liked_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "press_like_pkey" PRIMARY KEY ("post_an_opinion_id","account_id")
);

-- CreateTable
CREATE TABLE "question" (
    "question_id" SERIAL NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "question_text" TEXT NOT NULL,
    "option_1_text" VARCHAR(255) NOT NULL,
    "option_2_text" VARCHAR(255) NOT NULL,
    "store_id" INTEGER NOT NULL,

    CONSTRAINT "question_pkey" PRIMARY KEY ("question_id")
);

-- CreateTable
CREATE TABLE "question_answer" (
    "account_id" INTEGER NOT NULL,
    "question_id" INTEGER NOT NULL,
    "selected_option_number" INTEGER NOT NULL,
    "answered_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_answer_pkey" PRIMARY KEY ("account_id","question_id")
);

-- CreateTable
CREATE TABLE "Genders" (
    "gender_id" SERIAL NOT NULL,
    "gender_name" VARCHAR(20) NOT NULL,

    CONSTRAINT "Genders_pkey" PRIMARY KEY ("gender_id")
);

-- CreateTable
CREATE TABLE "Age_Groups" (
    "age_group_id" SERIAL NOT NULL,
    "age_group_name" VARCHAR(20) NOT NULL,

    CONSTRAINT "Age_Groups_pkey" PRIMARY KEY ("age_group_id")
);

-- CreateTable
CREATE TABLE "Occupations" (
    "occupation_id" SERIAL NOT NULL,
    "occupation_name" VARCHAR(50) NOT NULL,

    CONSTRAINT "Occupations_pkey" PRIMARY KEY ("occupation_id")
);

-- CreateTable
CREATE TABLE "Tags" (
    "tag_id" SERIAL NOT NULL,
    "tag_name" VARCHAR(50) NOT NULL,

    CONSTRAINT "Tags_pkey" PRIMARY KEY ("tag_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_nickname_key" ON "Users"("nickname");

-- CreateIndex
CREATE UNIQUE INDEX "Stores_store_name_key" ON "Stores"("store_name");

-- CreateIndex
CREATE UNIQUE INDEX "Account_email_key" ON "Account"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_user_id_key" ON "Account"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Account_store_id_key" ON "Account"("store_id");
