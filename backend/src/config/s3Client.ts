import { S3Client } from "@aws-sdk/client-s3";

const s3 = new S3Client({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "minio",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "minio123",
    },
    endpoint: process.env.S3_ENDPOINT || "http://localhost:9000",
    forcePathStyle: true, // 👈 required for MinIO
});

export default s3;
