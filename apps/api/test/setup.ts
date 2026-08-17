import "../src/load-env";
import "reflect-metadata";

if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  process.env.SESSION_SECRET = "test-session-secret-min-32-chars-long";
}
process.env.SEED_ADMIN_EMAIL ??= "admin@local.test";
process.env.SEED_ADMIN_PASSWORD ??= "dev-admin-password";
process.env.SEED_ADMIN_NAME ??= "Bootstrap Admin";
process.env.SEED_DH_RIVON_EMAIL ??= "dh.rivon@local.test";
process.env.SEED_DH_RIVON_PASSWORD ??= "dev-dh-password";
process.env.SEED_DH_RIVON_NAME ??= "Rivon DH";
process.env.SEED_DH_ROVER_EMAIL ??= "dh.rover@local.test";
process.env.SEED_DH_ROVER_PASSWORD ??= "dev-dh-password";
process.env.SEED_DH_ROVER_NAME ??= "Rover DH";
process.env.SEED_DH_ASSIDUA_EMAIL ??= "dh.assidua@local.test";
process.env.SEED_DH_ASSIDUA_PASSWORD ??= "dev-dh-password";
process.env.SEED_DH_ASSIDUA_NAME ??= "Assidua DH";
process.env.WEB_ORIGIN ??= "http://localhost:4000";
