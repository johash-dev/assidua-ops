CREATE TABLE "audit_log" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "audit_log_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_id" text NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"department_id" text,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
-- Hand-written (drizzle-kit does not model triggers): the log is append-only (BR-12).
CREATE FUNCTION "audit_log_immutable"() RETURNS trigger AS $$
BEGIN
	RAISE EXCEPTION 'audit_log is append-only: % is not allowed', TG_OP
		USING ERRCODE = 'restrict_violation';
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER "audit_log_no_update_delete"
	BEFORE UPDATE OR DELETE ON "audit_log"
	FOR EACH ROW EXECUTE FUNCTION "audit_log_immutable"();
--> statement-breakpoint
-- Row triggers do not fire on TRUNCATE, so it needs its own statement trigger.
CREATE TRIGGER "audit_log_no_truncate"
	BEFORE TRUNCATE ON "audit_log"
	FOR EACH STATEMENT EXECUTE FUNCTION "audit_log_immutable"();
