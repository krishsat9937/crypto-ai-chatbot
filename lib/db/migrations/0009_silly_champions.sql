CREATE TABLE IF NOT EXISTS "TurnkeySubOrganization" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"turnkey_sub_organization_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(1024),
	"wallet_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "TurnkeySubOrganization_turnkey_sub_organization_id_unique" UNIQUE("turnkey_sub_organization_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "TurnkeyUserApikeys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"turnkey_user_id" uuid NOT NULL,
	"turnkey_api_key_id" uuid NOT NULL,
	"public_key" varchar(512) NOT NULL,
	"private_key" varchar(512) NOT NULL,
	"api_key_name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "TurnkeyUserApikeys_turnkey_api_key_id_unique" UNIQUE("turnkey_api_key_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "TurnkeyUser" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"turnkey_root_user_id" uuid NOT NULL,
	"user_name" varchar(255) NOT NULL,
	"user_email" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "TurnkeyUser_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "TurnkeyUser_turnkey_root_user_id_unique" UNIQUE("turnkey_root_user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "TurnkeyWalletAddress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_id" uuid NOT NULL,
	"address" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "TurnkeyWalletAddress_address_unique" UNIQUE("address")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "TurnkeyWallet" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"turnkey_wallet_id" uuid NOT NULL,
	"wallet_name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "TurnkeyWallet_turnkey_wallet_id_unique" UNIQUE("turnkey_wallet_id")
);
--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "turnkey_user_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "TurnkeySubOrganization" ADD CONSTRAINT "TurnkeySubOrganization_wallet_id_TurnkeyWallet_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."TurnkeyWallet"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "TurnkeyUserApikeys" ADD CONSTRAINT "TurnkeyUserApikeys_turnkey_user_id_TurnkeyUser_id_fk" FOREIGN KEY ("turnkey_user_id") REFERENCES "public"."TurnkeyUser"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "TurnkeyUser" ADD CONSTRAINT "TurnkeyUser_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "TurnkeyUser" ADD CONSTRAINT "TurnkeyUser_id_TurnkeySubOrganization_id_fk" FOREIGN KEY ("id") REFERENCES "public"."TurnkeySubOrganization"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "TurnkeyWalletAddress" ADD CONSTRAINT "TurnkeyWalletAddress_wallet_id_TurnkeyWallet_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."TurnkeyWallet"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "User" ADD CONSTRAINT "User_turnkey_user_id_TurnkeyUser_id_fk" FOREIGN KEY ("turnkey_user_id") REFERENCES "public"."TurnkeyUser"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "User" DROP COLUMN IF EXISTS "wallet_id";--> statement-breakpoint
ALTER TABLE "User" ADD CONSTRAINT "User_turnkey_user_id_unique" UNIQUE("turnkey_user_id");