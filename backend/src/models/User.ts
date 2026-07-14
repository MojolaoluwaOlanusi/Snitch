import mongoose, { Schema, model, Document } from 'mongoose';

export interface UserDocument extends Document {
    email: string;
    passwordHash: string;
    username: string;
    displayName?: string;
    accountType: 'Work' | 'Personal' | 'Business';
    accountVisibility: 'Private' | 'Public' | 'Friends';
    followers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: [],
        },
    ];
    blockedBy: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: [],
        },
    ];
    blocked: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: [],
        },
    ];
    following: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: [],
        },
    ];
    likedPosts: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post",
            default: [],
        }
    ];
    pushSubscriptions: {
        endpoint: string;
        keys: {
            p256dh: string;
            auth: string
        }
    }[];
    bio: string;
    avatarUrl: string;
    coverImg: string;
    link: string;
    location: string,
    incognito: boolean;
    isBanned: boolean;
    followerCount: number;
    followingCount: number;
    warningsCount: number;
    isAdmin: boolean;
    createdAt: Date;
    verified?: boolean;
    verificationCode?: string;
    verificationCodeValidation?: Date;
    forgotPasswordCode?: string;
    forgotPasswordCodeValidation?: Date;
    adminInvite: {
        codeHash: String,
        createdAt: Date,
        expiresAt: Date,
        issuedBy: Schema.Types.ObjectId,
        targetEmail: String
    };
    chatReportCount: { type: Number, default: 0 };
    chatRestrictedUntil: { type: Date };
    lastSeen: { type: Date };
    gender: { type: String, default: '' },
    socialHandles: [
        {
            platform: { type: String },
            url: { type: String },
        },
    ];
    bookmarkedPosts: mongoose.Types.ObjectId[];
    theme: { type: String, default: 'winter' };
}

const UserSchema = new Schema<UserDocument>({
    email: { type: String, unique: true, index: true },
    passwordHash: String,
    username: { type: String, unique: true, index: true },
    displayName: String,
    accountType: {
        type: String,
        enum: ['Work', 'Personal', 'Business'],
        default: 'Personal',
    },
    accountVisibility: {
        type: String,
        enum: ['Private', 'Public', 'Friends'],
        default: 'Public',
    },
    followers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: [],
        },
    ],
    blockedBy: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: [],
        },
    ],
    blocked: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: [],
        },
    ],
    following: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: [],
        },
    ],
    likedPosts: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post",
            default: [],
        }
    ],
    pushSubscriptions: {
        type: [{
            endpoint: { type: String },
            keys: {
                p256dh: { type: String },
                auth: { type: String },
            },
        }],
        default: [],
    },
    coverImg: String,
    link: String,
    location: String,
    bio: String,
    avatarUrl: String,
    incognito: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false },
    warningsCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    followerCount: { type: Number, default: 0 },
    isAdmin: { type: Boolean, default: false },
    verified: { type: Boolean, default: false },
    verificationCode: { type: String, select: false },
    verificationCodeValidation: { type: Date, select: false },
    forgotPasswordCode: { type: String, select: false },
    forgotPasswordCodeValidation: { type: Date, select: false },
    createdAt: { type: Date, default: Date.now },
    adminInvite: {
        codeHash: String,
        createdAt: Date,
        expiresAt: Date,
        issuedBy: Schema.Types.ObjectId,
        targetEmail: String
    },
    chatReportCount: { type: Number, default: 0 },
    chatRestrictedUntil: { type: Date },
    lastSeen: { type: Date },
    gender: { type: String, default: '' },
    socialHandles: [
        {
            platform: { type: String },
            url: { type: String },
        },
    ],
    bookmarkedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
    theme: { type: String, default: 'winter' },
});

UserSchema.index(
    {
        username: "text",
        displayName: "text",
        bio: "text",
    },
    {
        weights: {
            username: 5,
            displayName: 3,
            bio: 1,
        },
        name: "UserSearchIndex",
    }
);

// @ts-ignore
export const User = model<UserDocument>('User', UserSchema);
