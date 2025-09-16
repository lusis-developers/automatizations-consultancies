import { BusinessTypeEnum } from "../enums/businessType.enum";
import models from "../models";

/**
 * Migration helper to update existing business records without businessType
 * Sets businessType to UNKNOWN for records that don't have this field
 */
export async function migrateBusinessTypeField(): Promise<void> {
  try {
    console.log("Starting businessType migration...");
    
    // Find all businesses that don't have businessType set or have null/undefined values
    const businessesWithoutType = await models.business.find({
      $or: [
        { businessType: { $exists: false } },
        { businessType: null },
        { businessType: undefined },
        { businessType: "" }
      ]
    });

    console.log(`Found ${businessesWithoutType.length} businesses without businessType`);

    if (businessesWithoutType.length === 0) {
      console.log("No businesses need migration");
      return;
    }

    // Update all businesses without businessType to UNKNOWN
    const updateResult = await models.business.updateMany(
      {
        $or: [
          { businessType: { $exists: false } },
          { businessType: null },
          { businessType: undefined },
          { businessType: "" }
        ]
      },
      {
        $set: { businessType: BusinessTypeEnum.UNKNOWN }
      }
    );

    console.log(`Migration completed. Updated ${updateResult.modifiedCount} businesses`);
    
    // Verify the migration
    const remainingWithoutType = await models.business.countDocuments({
      $or: [
        { businessType: { $exists: false } },
        { businessType: null },
        { businessType: undefined },
        { businessType: "" }
      ]
    });

    if (remainingWithoutType === 0) {
      console.log("✅ Migration successful - all businesses now have businessType");
    } else {
      console.warn(`⚠️ Warning: ${remainingWithoutType} businesses still without businessType`);
    }

  } catch (error) {
    console.error("Error during businessType migration:", error);
    throw error;
  }
}

/**
 * Standalone function to run the migration with database connection
 * Can be called directly or used in other scripts
 */
export async function runBusinessTypeMigration(): Promise<void> {
  try {
    // Import and initialize database connection
    await import("../config/mongo");
    
    console.log("🚀 Starting businessType migration...");
    await migrateBusinessTypeField();
    console.log("✅ Migration completed successfully");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

/**
 * Run migration immediately when this file is executed directly
 */
if (require.main === module) {
  runBusinessTypeMigration()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}