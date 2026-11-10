CREATE TABLE "playlist_moods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"emoji" text DEFAULT '🎧' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid
);
--> statement-breakpoint
ALTER TABLE "playlists" ADD COLUMN "mood_id" uuid;--> statement-breakpoint
ALTER TABLE "playlist_moods" ADD CONSTRAINT "playlist_moods_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playlist_moods" ADD CONSTRAINT "playlist_moods_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "playlist_moods_key_active_idx" ON "playlist_moods" USING btree ("key") WHERE deleted_at is null;--> statement-breakpoint
ALTER TABLE "playlists" ADD CONSTRAINT "playlists_mood_id_playlist_moods_id_fk" FOREIGN KEY ("mood_id") REFERENCES "public"."playlist_moods"("id") ON DELETE set null ON UPDATE no action;