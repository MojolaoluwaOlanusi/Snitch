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
        const notificationIcon = isGroup ? groupAvatarUrl : (senderInfo.avatarUrl || `${process.env.CLIENT_URL}/avatar-placeholder.png`);

        // Construct rich notification payload
        const payload = {
            title,
            body: preview,
            icon: notificationIcon,
            image: notificationIcon,   // 🔥 iOS uses this for the big picture
            badge: `${process.env.CLIENT_URL}/badge-icon.png`,
            tag: `message-${conversationId}`,
            timestamp: Date.now(),
            requireInteraction: true,
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
            actions: [
                { action: 'open', title: 'Open Chat' },
                { action: 'close', title: 'Close' },
            ],
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
    if (message.text) {
        return message.text.substring(0, 50) + (message.text.length > 50 ? '...' : '');
    }

    if (message.media && message.media.length > 0) {
        const mediaType = message.media[0].mime?.split('/')[0];
        if (mediaType === 'image') return '📷 Photo';
        if (mediaType === 'video') return '🎥 Video';
        if (mediaType === 'audio') return '🎤 Voice message';
        return '📎 Media';
    }

    if (message.isVoiceMessage) {
        const duration = message.voiceDuration
            ? Math.round(message.voiceDuration / 1000)
            : 0;
        return `🎤 Voice message (${duration}s)`;
    }

    if (message.location) return '📍 Location';
    if (message.contact) return `👤 Contact: ${message.contact.name}`;
    if (message.poll) return `📊 Poll: ${message.poll.question}`;
    if (message.call) return `📞 ${message.call.type} call`;

    return 'New message';
}
