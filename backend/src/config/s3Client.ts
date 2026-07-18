import { S3Client } from "@aws-sdk/client-s3";
import https from "https";

// Validate that production uses HTTPS
if (process.env.NODE_ENV === 'production' && process.env.S3_ENDPOINT && !process.env.S3_ENDPOINT.startsWith('https://')) {
    throw new Error('S3_ENDPOINT must use HTTPS in production. Current value: ' + process.env.S3_ENDPOINT);
}

const s3 = new S3Client({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "minio",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "minio123",
    },
    endpoint: process.env.S3_ENDPOINT || "http://localhost:9000",
    forcePathStyle: true, // 👈 required for MinIO
    // Enable TLS validation for production endpoints
    ...(process.env.NODE_ENV === 'production' && {
        tls: true,
    }),
});

export default s3;
