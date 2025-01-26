ALTER TABLE "TurnkeyUser" DROP CONSTRAINT "TurnkeyUser_id_TurnkeySubOrganization_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "TurnkeyUser" ADD CONSTRAINT "TurnkeyUser_sub_org_id_TurnkeySubOrganization_id_fk" FOREIGN KEY ("sub_org_id") REFERENCES "public"."TurnkeySubOrganization"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
