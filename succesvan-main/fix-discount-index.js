// Run this with: node fix-discount-index.js
const mongoose = require("mongoose");

async function fixIndex() {
  try {
    await mongoose.connect(
      process.env.NEXT_PUBLIC_MONGODB_URI || "your-mongodb-uri",
    );
    const db = mongoose.connection.db;

    // Drop the unique index on usedBy
    await db.collection("discounts").dropIndex("usedBy_1");
    console.log("Successfully dropped usedBy_1 index");

    await mongoose.disconnect();
  } catch (error) {
    console.log("Error:", error.message);
    process.exit(1);
  }
}

fixIndex();
