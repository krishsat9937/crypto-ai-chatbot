ALTER TABLE "Document" DROP CONSTRAINT "Document_userId_User_id_fk";
--> statement-breakpoint
ALTER TABLE "Suggestion" DROP CONSTRAINT "Suggestion_userId_User_id_fk";
-- > statement-breakpoint
ALTER TABLE "Chat" ALTER COLUMN "userId" SET DATA TYPE uuid;--> statement-breakpoint
-- ALTER TABLE "User" ALTER COLUMN "id" SET DATA TYPE varchar;--> statement-breakpoint
-- ALTER TABLE "User" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "first_name" varchar;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "last_name" varchar;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "wallet_id" varchar;--> statement-breakpoint
ALTER TABLE "Document" DROP COLUMN IF EXISTS "userId";--> statement-breakpoint
ALTER TABLE "Suggestion" DROP COLUMN IF EXISTS "userId";--> statement-breakpoint
ALTER TABLE "User" DROP COLUMN IF EXISTS "password";