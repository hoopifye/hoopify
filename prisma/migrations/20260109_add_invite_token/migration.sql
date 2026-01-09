-- AlterTable
ALTER TABLE "Invite" ADD COLUMN "token" TEXT;
ALTER TABLE "Invite" ALTER COLUMN "email" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Invite_token_key" ON "Invite"("token");
