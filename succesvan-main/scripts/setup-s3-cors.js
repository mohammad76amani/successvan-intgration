const { S3Client, PutBucketCorsCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");

const env = fs.readFileSync(".env", "utf8").split("\n").reduce((acc, line) => {
  const [key, value] = line.split("=");
  if (key && value) acc[key.trim()] = value.trim();
  return acc;
}, {});

const s3 = new S3Client({
  region: "eu-west-2",
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

const corsConfig = {
  Bucket: env.S3_BUCKET,
  CORSConfiguration: {
    CORSRules: [
      {
        AllowedHeaders: ["*"],
        AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
        AllowedOrigins: ["*"],
        ExposeHeaders: ["ETag"],
      },
    ],
  },
};

async function setupCors() {
  try {
    await s3.send(new PutBucketCorsCommand(corsConfig));
    console.log("✅ CORS configured successfully for bucket:", env.S3_BUCKET);
  } catch (error) {
    console.log("❌ Error:", error.message);
  }
}

setupCors();
