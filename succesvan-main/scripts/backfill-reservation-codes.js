/**
 * One-off backfill: assigns a unique reservationCode (UUID-like, e.g.
 * "SV-7K9F-2QX4") to every reservation that doesn't already have one.
 *
 * Idempotent: reservations that already have a code are skipped, so it's safe
 * to run more than once.
 *
 * Usage:  node scripts/backfill-reservation-codes.js
 */
const fs = require("fs");
const mongoose = require("mongoose");

// Load .env (same lightweight approach as the other scripts in this folder).
const env = fs
  .readFileSync(".env", "utf8")
  .split("\n")
  .reduce((acc, line) => {
    const idx = line.indexOf("=");
    if (idx === -1) return acc;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (key) acc[key] = value;
    return acc;
  }, {});

const MONGODB_URI =
  env.NEXT_PUBLIC_MONGODB_URI || process.env.NEXT_PUBLIC_MONGODB_URI;

// Keep this in sync with model/reservation.ts.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const crypto = require("crypto");

const randomSegment = (length) => {
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return out;
};

const generateReservationCode = () =>
  `SV-${randomSegment(4)}-${randomSegment(4)}`;

async function main() {
  if (!MONGODB_URI) {
    throw new Error("NEXT_PUBLIC_MONGODB_URI is not defined in .env");
  }

  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  // Work directly against the collection to avoid pulling in the TS model.
  const collection = mongoose.connection.collection("reservations");

  // Seed the in-memory set with codes already in use so we never duplicate.
  const used = new Set();
  const existing = await collection
    .find(
      { reservationCode: { $exists: true, $ne: null } },
      { projection: { reservationCode: 1 } }
    )
    .toArray();
  existing.forEach((r) => used.add(r.reservationCode));

  const cursor = collection.find({
    $or: [
      { reservationCode: { $exists: false } },
      { reservationCode: null },
      { reservationCode: "" },
    ],
  });

  let updated = 0;
  while (await cursor.hasNext()) {
    const doc = await cursor.next();

    let code = generateReservationCode();
    while (used.has(code)) code = generateReservationCode();
    used.add(code);

    await collection.updateOne(
      { _id: doc._id },
      { $set: { reservationCode: code } }
    );
    updated++;
    console.log(`  ${doc._id} -> ${code}`);
  }

  console.log(`\nDone. Backfilled ${updated} reservation(s).`);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error("Backfill failed:", error);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
