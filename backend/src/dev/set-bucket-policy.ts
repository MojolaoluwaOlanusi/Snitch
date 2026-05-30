import { S3Client, PutBucketPolicyCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
    endpoint: 'http://localhost:9000',
    region: 'us-east-1',
    credentials: {
        accessKeyId: 'minio',
        secretAccessKey: 'minio123'
    },
    forcePathStyle: true,
});

const bucketName = 'snitch-dev';

const policy = {
    Version: '2012-10-17',
    Statement: [
        {
            Sid: 'PublicRead',
            Effect: 'Allow',
            Principal: '*',
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${bucketName}/*`],
        },
    ],
};

const command = new PutBucketPolicyCommand({
    Bucket: bucketName,
    Policy: JSON.stringify(policy),
});

s3Client.send(command)
    .then(() => console.log('Bucket policy set to public'))
    .catch((err) => console.error(`Error setting bucket policy: ${err}`));