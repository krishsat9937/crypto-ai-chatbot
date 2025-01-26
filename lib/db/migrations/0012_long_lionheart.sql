ALTER TABLE "TurnkeyUserApikeys" DROP CONSTRAINT "TurnkeyUserApikeys_turnkey_api_key_id_unique";--> statement-breakpoint
ALTER TABLE "TurnkeyUserApikeys" DROP COLUMN IF EXISTS "turnkey_api_key_id";