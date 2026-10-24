-- Rollback for 0001_audit_log.sql. Only the integration test runs this.
DROP TRIGGER "audit_log_no_truncate" ON "audit_log";
DROP TRIGGER "audit_log_no_update_delete" ON "audit_log";
DROP FUNCTION "audit_log_immutable"();
DROP TABLE "audit_log";
