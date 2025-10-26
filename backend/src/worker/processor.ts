import { Worker, Queue } from 'bullmq';
import IORedis from 'ioredis';
const connection = new IORedis(process.env.REDIS_URL || 'redis://redis:6379');
const queue = new Queue('media-processing', { connection });
const worker = new Worker('media-processing', async job => {
  console.log('processing job', job.name, job.data);
  return { ok:true };
}, { connection });
export default worker;
