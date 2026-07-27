import { Worker, Queue, Job } from 'bullmq';
import IORedis from 'ioredis';
import { User } from '../models/User.js';
import { sendReengagementEmail } from '../utils/email.js';
import { sendReengagementPushNotification } from '../utils/pushNotifications.js';

// ioredis typings differ between CJS/ESM builds; normalize to a constructable value
const RedisCtor: any = (IORedis as any).default || IORedis;
const connection = new RedisCtor(process.env.REDIS_URL || 'redis://redis:6379', {
    tls: process.env.REDIS_URL?.startsWith('rediss://') ? {
        rejectUnauthorized: true,
    } : undefined,
});

// Media processing queue
const mediaQueue = new Queue('media-processing', { connection });
const mediaWorker = new Worker('media-processing', async (job: Job) => {
  console.log('processing job', job.name, job.data);
  return { ok:true };
}, { connection });

// Re-engagement queue
const reengagementQueue = new Queue('reengagement', { connection });
const reengagementWorker = new Worker('reengagement', async (job: Job) => {
  console.log('Processing re-engagement job', job.name, job.data);
  
  try {
    // Find users who haven't been active in 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    // Find users who haven't been sent re-engagement in the last 30 days
    const inactiveUsers = await User.find({
      lastSeen: { $lt: sevenDaysAgo },
      $or: [
        { lastReengagementSent: { $lt: thirtyDaysAgo } },
        { lastReengagementSent: { $exists: false } }
      ]
    }).select('email username pushSubscriptions');

    console.log(`Found ${inactiveUsers.length} inactive users for re-engagement`);

    for (const user of inactiveUsers) {
      try {
        // Send email
        await sendReengagementEmail(user.email, user.username);
        
        // Send push notification
        await sendReengagementPushNotification(user._id.toString(), user.username);
        
        // Update last re-engagement sent timestamp
        await User.findByIdAndUpdate(user._id, {
          lastReengagementSent: new Date()
        });
        
        console.log(`Sent re-engagement to user: ${user.username}`);
      } catch (error) {
        console.error(`Failed to send re-engagement to user ${user.username}:`, error);
      }
    }

    return { ok: true, processed: inactiveUsers.length };
  } catch (error) {
    console.error('Re-engagement job error:', error);
    throw error;
  }
}, { connection });

// Schedule re-engagement job to run daily at 9 AM UTC
const scheduleReengagementJob = async () => {
  try {
    const job = await reengagementQueue.add(
      'daily-reengagement',
      { timestamp: Date.now() },
      {
        repeat: {
          pattern: '0 9 * * *', // Cron expression for daily at 9 AM UTC
        },
      }
    );
    console.log('Scheduled re-engagement job:', job.id);
  } catch (error) {
    console.error('Failed to schedule re-engagement job:', error);
  }
};

// Schedule the job on startup
scheduleReengagementJob();

export default { mediaWorker, reengagementWorker };
