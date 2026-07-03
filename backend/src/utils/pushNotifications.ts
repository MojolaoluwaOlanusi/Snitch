import webpush from 'web-push';
import { User } from '../models/User.ts';

webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:test@test.com',
    process.env.VAPID_PUBLIC_KEY || '',
    process.env.VAPID_PRIVATE_KEY || ''
);

export const sendPushNotification = async (userId: string, payload: { title: string; body: string; url: string }) => {
    try {
        const user = await User.findById(userId).select('pushSubscriptions');
        if (!user || !user.pushSubscriptions?.length) return;

        const message = JSON.stringify({
            title: payload.title,
            body: payload.body,
            url: payload.url,
        });

        // Cast to any[] here
        const subscriptions = user.pushSubscriptions as any[];

        for (const subscription of subscriptions) {
            try {
                await webpush.sendNotification(subscription, message);
            } catch (err: any) {
                if (err.statusCode === 410 || err.statusCode === 404) {
                    user.pushSubscriptions = subscriptions.filter(
                        (s: any) => s.endpoint !== subscription.endpoint
                    );
                }
            }
        }
        await user.save();
    } catch (error) {
        console.error('Push notification error:', error);
    }
};