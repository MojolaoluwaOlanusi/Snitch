import webpush from 'web-push';
import { User } from '../models/User.js';
import { generateGroupAvatar } from './generateGroupAvatar.js';

webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:test@test.com',
    process.env.VAPID_PUBLIC_KEY || '',
    process.env.VAPID_PRIVATE_KEY || ''
);

// ==================== Generic Push Notification ====================

export const sendPushNotification = async (
    userId: string,
    payload: { title: string; body: string; url: string }
) => {
    try {
        const user = await User.findById(userId).select('pushSubscriptions');
        if (!user || !user.pushSubscriptions?.length) return;

        const message = JSON.stringify({
            title: payload.title,
            body: payload.body,
            url: payload.url,
        });

        const subscriptions = user.pushSubscriptions as any[];
        let validSubscriptions: any[] = [];

        for (const subscription of subscriptions) {
            try {
                await webpush.sendNotification(subscription, message);
                validSubscriptions.push(subscription);
            } catch (err: any) {
                if (err.statusCode === 410 || err.statusCode === 404) {
                    console.log(`Removing expired subscription for user ${userId}`);
                } else {
                    validSubscriptions.push(subscription);
                }
            }
        }

        user.pushSubscriptions = validSubscriptions;
        await user.save();
    } catch (error) {
        console.error('Push notification error:', error);
    }
};

// ==================== Message Push Notification ====================

export const sendMessagePushNotification = async (
    recipientId: string,
    message: any,
    conversationId: string,
    senderInfo: {
        username: string;
        displayName: string;
        avatarUrl?: string;
    },
    isGroup?: boolean,
    groupName?: string,
    groupAvatar?: string
) => {
    try {
        const recipient = await User.findById(recipientId).select('pushSubscriptions');
        if (!recipient || !recipient.pushSubscriptions?.length) {
            console.log(`No push subscriptions for user ${recipientId}`);
            return;
        }

        // Generate message preview
        const preview = generateMessagePreview(message);

        // Format notification title
        let title: string;
        if (isGroup && groupName) {
            title = `${senderInfo.displayName || senderInfo.username} in ${groupName}`;
        } else {
            title = senderInfo.displayName || senderInfo.username;
        }

        const groupAvatarUrl = groupAvatar || generateGroupAvatar(groupName || 'Group', '#6366f1');
        const notificationIcon = isGroup ? groupAvatarUrl : (senderInfo.avatarUrl || `${process.env.CLIENT_URL}/avatar.png`);

        // Construct rich notification payload
        const payload = {
            title,
            body: preview,
            icon: notificationIcon,
            badge: `${process.env.CLIENT_URL}/badge-72.png`,
            image: `${process.env.CLIENT_URL}/notification.png`,
            tag: `message-${conversationId}`,
            timestamp: Date.now(),
            requireInteraction: true,
            actions: [
                { action: 'open', title: 'Open Snitch' },
                { action: 'reply', title: 'Reply' },
            ],
            data: {
                type: 'message',
                conversationId: conversationId.toString(),
                senderId: message.senderId.toString(),
                senderUsername: senderInfo.username,
                messageId: message._id.toString(),
                timestamp: message.createdAt.toISOString(),
                isGroup: isGroup || false,
                groupName: groupName || null,
                avatarUrl: notificationIcon,
                url: `${process.env.CLIENT_URL}/chat?conversationId=${conversationId.toString()}`,
            },
        };

        // Send to all subscriptions
        const subscriptions = recipient.pushSubscriptions as any[];
        let validSubscriptions: any[] = [];

        for (const subscription of subscriptions) {
            try {
                await webpush.sendNotification(subscription, JSON.stringify(payload));
                validSubscriptions.push(subscription);
            } catch (err: any) {
                if (err.statusCode === 410 || err.statusCode === 404) {
                    console.log(`Removing expired subscription for user ${recipientId}`);
                } else {
                    validSubscriptions.push(subscription);
                }
            }
        }

        // Update user with only valid subscriptions
        recipient.pushSubscriptions = validSubscriptions;
        await recipient.save();
    } catch (error: any) {
        console.error('Message push notification error:', error.message);
    }
};

// ==================== Helper: Generate Message Preview ====================

function generateMessagePreview(message: any): string {
    // 🔥 Check for a valid call object FIRST
    if (message.call && typeof message.call === 'object' && message.call.type) {
        const callType = message.call.type === 'video' ? 'Video' : 'Audio';
        const status = message.call.status === 'missed' ? 'Missed ' : '';
        return `${status}${callType} call`.trim();
    }

    // Then check text
    if (message.text) {
        return message.text.substring(0, 50) + (message.text.length > 50 ? '...' : '');
    }

    // Then media
    if (message.media && message.media.length > 0) {
        const mediaType = message.media[0].mime?.split('/')[0];
        if (mediaType === 'image') return '📷 Photo';
        if (mediaType === 'video') return '🎥 Video';
        if (mediaType === 'audio') return '🎤 Voice message';
        return '📎 Media';
    }

    // Voice message
    if (message.isVoiceMessage) {
        const duration = message.voiceDuration
            ? Math.round(message.voiceDuration / 1000)
            : 0;
        return `🎤 Voice message (${duration}s)`;
    }

    // Location
    if (message.location) return '📍 Location';

    // Contact
    if (message.contact) return `👤 Contact: ${message.contact.name}`;

    // Poll
    if (message.poll) return `📊 Poll: ${message.poll.question}`;

    // Fallback
    return 'New message';
}

export const sendReengagementPushNotification = async (userId: string, username: string) => {
    try {
        const user = await User.findById(userId).select('pushSubscriptions');
        if (!user || !user.pushSubscriptions?.length) return;

        const payload = {
            title: 'We miss you on Snitch! 🎉',
            body: `Hi ${username}, it's been a while. Check out what's new!`,
            icon: `${process.env.CLIENT_URL}/avatar.png`,
            badge: `${process.env.CLIENT_URL}/badge-72.png`,
            tag: 'reengagement',
            timestamp: Date.now(),
            requireInteraction: true,
            actions: [
                { action: 'open', title: 'Open Snitch' },
            ],
            data: {
                type: 'reengagement',
                url: `${process.env.CLIENT_URL}/`,
            },
        };

        const subscriptions = user.pushSubscriptions as any[];
        let validSubscriptions: any[] = [];

        for (const subscription of subscriptions) {
            try {
                await webpush.sendNotification(subscription, JSON.stringify(payload));
                validSubscriptions.push(subscription);
            } catch (err: any) {
                if (err.statusCode === 410 || err.statusCode === 404) {
                    console.log(`Removing expired subscription for user ${userId}`);
                } else {
                    validSubscriptions.push(subscription);
                }
            }
        }

        user.pushSubscriptions = validSubscriptions;
        await user.save();
    } catch (error: any) {
        console.error('Re-engagement push notification error:', error.message);
    }
};

export default { sendPushNotification, sendMessagePushNotification, sendReengagementPushNotification };