CREATE TABLE IF NOT EXISTS "otp_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"otp" varchar(6),
	"otp_sent_at" timestamp DEFAULT now(),
	"is_verified" boolean DEFAULT false,
	"session_id" varchar(255),
	"chat_id" varchar(255),
	"otp_status" varchar(20) DEFAULT 'pending',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
