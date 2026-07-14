const { S3Client, PutBucketPolicyCommand, PutPublicAccessBlockCommand } = require("@aws-sdk/client-s3");
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


async function setup() {
  try {
    await s3.send(new PutPublicAccessBlockCommand({
      Bucket: env.S3_BUCKET,
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: false,
        IgnorePublicAcls: false,
        BlockPublicPolicy: false,
        RestrictPublicBuckets: false,
      },
    }));

    const policy = {
      Version: "2012-10-17",
      Statement: [{
        Sid: "PublicReadGetObject",
        Effect: "Allow",
        Principal: "*",
        Action: "s3:GetObject",
        Resource: `arn:aws:s3:::${env.S3_BUCKET}/*`
      }]
    };

    await s3.send(new PutBucketPolicyCommand({
      Bucket: env.S3_BUCKET,
      Policy: JSON.stringify(policy),
    }));

    console.log("✅ S3 bucket configured for public read access");
  } catch (error) {
    console.log("❌ Error:", error.message);
  }
}

setup();
