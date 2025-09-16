import "../src/config/mongo";
import { migrateBusinessTypeField } from "../src/helpers/businessTypeMigration.helper";

/**
 * Standalone script to migrate businessType field for existing records
 * Run with: npx ts-node scripts/migrate-business-type.ts
 */
async function runMigration() {
  try {
    console.log("🚀 Starting businessType migration...");
    await migrateBusinessTypeField();
    console.log("✅ Migration completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

runMigration();